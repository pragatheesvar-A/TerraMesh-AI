"""
TerraMesh AI — MQTT Ingestion Client
=====================================
Subscribes to sensor telemetry from Heltec ESP32-S3 LoRa edge nodes via an
MQTT broker (Mosquitto or EMQX) and routes validated packets into the
telemetry pipeline.

Topic contract (STRICT — arbitrary topics are rejected):
  mines/{mine_id}/nodes/{node_id}/telemetry  — sensor readings (validated
      against edge_schemas.NodeTelemetry, deduplicated, timestamp-checked)
  mines/{mine_id}/nodes/{node_id}/heartbeat  — keepalive / battery / RSSI
  mines/{mine_id}/nodes/{node_id}/status     — node registration / health
  mines/{mine_id}/gateway/status             — gateway Last-Will (consumed)

QoS: 1 (at-least-once) on all subscriptions -> duplicates are possible by
design, so the client de-duplicates on (node_id, packet_seq) before handing
packets to the pipeline.

Ingestion guardrails (implemented in order):
  1. Topic allowlist + mine_id match
  2. JSON parse
  3. Pydantic schema validation (edge_schemas.NodeTelemetry) for telemetry
  4. Packet de-duplication via packet_seq
  5. Timestamp sanity: reject > 5 min future skew, flag > 10 min stale

Connection states (surfaced via `state` property and /health):
  ONLINE | DEGRADED | OFFLINE | RECOVERING

Honesty notes:
  * There is NO hidden "simulation loop" behind this client. If the broker is
    unreachable, no telemetry flows until it returns. The client reconnects
    automatically with backoff and reports OFFLINE/RECOVERING.
  * The Last-Will of THIS backend marks the gateway status topic; we also
    subscribe to that topic so operator dashboards see broker-side loss.

Configuration (via .env):
  MQTT_BROKER_HOST=localhost
  MQTT_BROKER_PORT=1883
  MQTT_USE_TLS=false
  MQTT_USERNAME=
  MQTT_PASSWORD=
  MQTT_CA_CERT=            (path to CA bundle for TLS verification)
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
import re
import threading
import time
from collections import OrderedDict
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("terramesh.mqtt")

try:
    import paho.mqtt.client as mqtt_client
    HAS_MQTT = True
except ImportError:
    HAS_MQTT = False
    logger.warning("paho-mqtt not installed — MQTT ingestion unavailable")

MINE_ID = os.getenv("MINE_ID", "jharia_01")
BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
USE_TLS = os.getenv("MQTT_USE_TLS", "false").lower() == "true"
USERNAME = os.getenv("MQTT_USERNAME", "")
PASSWORD = os.getenv("MQTT_PASSWORD", "")
CA_CERT = os.getenv("MQTT_CA_CERT", "")

# Timestamp sanity limits
MAX_FUTURE_SKEW_S = 300      # reject packets timestamped > 5 min in the future
STALE_AFTER_S = 600           # flag packets older than 10 minutes as stale
DEDUP_WINDOW = 512            # remembered (node_id, packet_seq) pairs

_NODE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")


class MQTTIngestClient:
    """MQTT ingestion client bridging edge nodes to the telemetry pipeline."""

    # Strict topic templates (wildcards only where noted)
    TELEMETRY_TOPIC = f"mines/{MINE_ID}/nodes/+/telemetry"
    HEARTBEAT_TOPIC = f"mines/{MINE_ID}/nodes/+/heartbeat"
    STATUS_TOPIC = f"mines/{MINE_ID}/nodes/+/status"
    GATEWAY_STATUS_TOPIC = f"mines/{MINE_ID}/gateway/status"

    STATE_ONLINE = "ONLINE"
    STATE_DEGRADED = "DEGRADED"      # connected, but rejecting bad packets
    STATE_OFFLINE = "OFFLINE"        # never connected / lost broker
    STATE_RECOVERING = "RECOVERING"  # reconnect attempts in progress

    def __init__(self, packet_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
                 heartbeat_callback: Optional[Callable[[Dict[str, Any]], Any]] = None):
        self._callback = packet_callback
        self._heartbeat_callback = heartbeat_callback
        self._client: Optional[Any] = None
        self._connected = False
        self._ever_connected = False
        self._thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._state = self.STATE_OFFLINE
        self._last_connected_at: Optional[float] = None
        self._last_disconnect_at: Optional[float] = None
        self._disconnect_count = 0
        self._gateway_lwt: Dict[str, Any] = {"status": "UNKNOWN"}

        # De-duplication LRU: (node_id, packet_seq) -> epoch of receipt
        self._dedup_cache: "OrderedDict[tuple, float]" = OrderedDict()

        # Ingestion metrics (exposed via stats() for /health + observability)
        self._metrics = {
            "received": 0,
            "accepted": 0,
            "rejected_topic": 0,
            "rejected_json": 0,
            "rejected_schema": 0,
            "rejected_duplicate": 0,
            "rejected_future_ts": 0,
            "flagged_stale": 0,
            "heartbeats": 0,
            "status_messages": 0,
        }

    # ── Connection lifecycle ─────────────────────────────────────────────────

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            self._connected = True
            self._ever_connected = True
            self._state = self.STATE_ONLINE
            self._last_connected_at = time.time()
            logger.info("MQTT connected to %s:%d (mine_id=%s)", BROKER_HOST, BROKER_PORT, MINE_ID)
            client.subscribe(self.TELEMETRY_TOPIC, qos=1)
            client.subscribe(self.HEARTBEAT_TOPIC, qos=1)
            client.subscribe(self.STATUS_TOPIC, qos=1)
            client.subscribe(self.GATEWAY_STATUS_TOPIC, qos=1)
            logger.info("  Subscribed: %s | %s | %s | %s",
                        self.TELEMETRY_TOPIC, self.HEARTBEAT_TOPIC,
                        self.STATUS_TOPIC, self.GATEWAY_STATUS_TOPIC)
        else:
            self._connected = False
            self._state = self.STATE_RECOVERING
            logger.error("MQTT connection refused: rc=%s", reason_code)

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):
        self._connected = False
        self._state = self.STATE_RECOVERING
        self._last_disconnect_at = time.time()
        if reason_code != 0:
            self._disconnect_count += 1
            self._state = self.STATE_OFFLINE if not self._ever_connected else self.STATE_RECOVERING
            logger.warning(
                "Unexpected MQTT disconnect (rc=%s, total=%d). Auto-reconnect with backoff in progress; "
                "telemetry will not flow until the broker is reachable again.",
                reason_code, self._disconnect_count,
            )

    # ── Validation & de-duplication ──────────────────────────────────────────

    def _parse_topic(self, topic: str) -> Optional[Dict[str, str]]:
        """Strict topic allowlist. Returns {'kind', 'node_id'} or None if rejected."""
        parts = topic.split("/")
        # mines/{mine_id}/nodes/{node_id}/{kind}
        if len(parts) == 5 and parts[0] == "mines" and parts[2] == "nodes":
            if parts[1] != MINE_ID:
                return None
            node_id, kind = parts[3], parts[4]
            if kind not in ("telemetry", "heartbeat", "status"):
                return None
            if not _NODE_ID_RE.match(node_id):
                return None
            return {"kind": kind, "node_id": node_id}
        # mines/{mine_id}/gateway/status
        if len(parts) == 4 and parts[0] == "mines" and parts[2] == "gateway" and parts[3] == "status":
            if parts[1] != MINE_ID:
                return None
            return {"kind": "gateway_status", "node_id": ""}
        return None

    def _is_duplicate(self, node_id: str, packet_seq) -> bool:
        """QoS 1 is at-least-once: drop packets whose (node_id, seq) we saw recently."""
        if packet_seq is None:
            return False
        key = (node_id, str(packet_seq))
        now = time.time()
        if key in self._dedup_cache:
            self._dedup_cache[key] = now          # refresh LRU position
            self._dedup_cache.move_to_end(key)
            return True
        self._dedup_cache[key] = now
        self._dedup_cache.move_to_end(key)
        while len(self._dedup_cache) > DEDUP_WINDOW:
            self._dedup_cache.popitem(last=False)  # evict oldest
        return False

    def _check_timestamp(self, payload: Dict[str, Any]) -> Optional[str]:
        """
        Returns None when the packet's timestamp is acceptable (attach nothing),
        'STALE' when older than STALE_AFTER_S, or raises ValueError when the
        timestamp is unreasonably far in the future. Accepts epoch seconds,
        epoch-hours (`timestamp_h`) and ISO-8601 strings.
        """
        ts = payload.get("timestamp") or payload.get("timestamp_h")
        if ts is None:
            return None
        try:
            if "timestamp_h" in payload and "timestamp" not in payload:
                pkt_epoch = float(ts) * 3600.0
            elif isinstance(ts, str):
                # ISO-8601 (the NodeTelemetry schema contract uses datetime)
                from datetime import datetime as _dt
                pkt_epoch = _dt.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
            else:
                pkt_epoch = float(ts)
        except (TypeError, ValueError):
            return None
        skew = time.time() - pkt_epoch
        if skew < -MAX_FUTURE_SKEW_S:
            raise ValueError(f"timestamp is {-skew:.0f}s in the future (beyond {MAX_FUTURE_SKEW_S}s tolerance)")
        if skew > STALE_AFTER_S:
            return "STALE"
        return None

    # ── Message handling ─────────────────────────────────────────────────────

    def _on_message(self, client, userdata, msg):
        self._metrics["received"] += 1
        try:
            parsed_topic = self._parse_topic(msg.topic)
            if parsed_topic is None:
                self._metrics["rejected_topic"] += 1
                logger.warning("MQTT packet REJECTED (topic not on allowlist): %s", msg.topic)
                return

            kind = parsed_topic["kind"]
            node_id = parsed_topic["node_id"]

            try:
                payload = json.loads(msg.payload.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                self._metrics["rejected_json"] += 1
                logger.warning("MQTT packet REJECTED (invalid JSON) on %s: %s", msg.topic, e)
                return

            if not isinstance(payload, dict):
                self._metrics["rejected_json"] += 1
                logger.warning("MQTT packet REJECTED (non-object JSON) on %s", msg.topic)
                return

            payload["node_id"] = payload.get("node_id", node_id)
            payload["_mqtt_topic"] = msg.topic
            payload["_mqtt_qos"] = msg.qos

            if kind == "gateway_status":
                self._gateway_lwt = {
                    "status": str(payload.get("status", "UNKNOWN")),
                    "source": payload.get("source", "broker"),
                    "observed_at": time.time(),
                }
                logger.warning("Gateway status message: %s", self._gateway_lwt)
                return

            if kind == "heartbeat":
                self._metrics["heartbeats"] += 1
                self._dispatch(payload, self._heartbeat_callback)
                return

            if kind == "status":
                self._metrics["status_messages"] += 1
                self._dispatch(payload, self._heartbeat_callback)
                return

            # ── telemetry: full validation gate ─────────────────────────────
            # Schema validation against the shared Pydantic contract
            try:
                from edge_schemas import NodeTelemetry
                NodeTelemetry(**{k: v for k, v in payload.items() if not k.startswith("_")})
            except ImportError:
                logger.warning("edge_schemas unavailable — schema validation skipped")
            except Exception as e:
                self._metrics["rejected_schema"] += 1
                if self._connected:
                    self._state = self.STATE_DEGRADED
                logger.warning("MQTT packet REJECTED (schema violation) from %s: %s", msg.topic, e)
                return

            # De-duplication
            if self._is_duplicate(node_id, payload.get("packet_seq")):
                self._metrics["rejected_duplicate"] += 1
                logger.debug("MQTT duplicate packet dropped from %s (seq=%s)", node_id, payload.get("packet_seq"))
                return

            # Timestamp sanity
            try:
                staleness = self._check_timestamp(payload)
                if staleness == "STALE":
                    self._metrics["flagged_stale"] += 1
                    payload["_ts_validity"] = "STALE"
                    logger.info("MQTT STALE packet accepted with flag from %s (older than %ds)",
                                node_id, STALE_AFTER_S)
            except ValueError as e:
                self._metrics["rejected_future_ts"] += 1
                logger.warning("MQTT packet REJECTED (%s) from %s", e, node_id)
                return

            self._metrics["accepted"] += 1
            if self._state == self.STATE_DEGRADED:
                # A valid packet proves the client is healthy again
                self._state = self.STATE_ONLINE
            self._dispatch(payload, self._callback)

        except Exception as e:
            logger.error("MQTT message handler error: %s", e)

    def _dispatch(self, payload: Dict[str, Any], callback: Optional[Callable]) -> None:
        """Hand a packet to its callback — on the asyncio loop when available,
        falling back to direct invocation (sync path)."""
        if callback is None:
            return
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._async_process(payload, callback), self._loop)
        else:
            callback(payload)

    async def _async_process(self, payload: Dict[str, Any], callback: Callable):
        try:
            result = callback(payload)
            if asyncio.iscoroutine(result):
                await result
        except Exception as e:
            logger.error("Pipeline processing error for %s: %s", payload.get("node_id"), e)

    # ── Public API ───────────────────────────────────────────────────────────

    async def start(self, event_loop: Optional[asyncio.AbstractEventLoop] = None) -> bool:
        """
        Start the client in a background thread.
        Returns True if the broker connection was established within the
        confirmation window, False otherwise (state -> OFFLINE/RECOVERING).
        """
        if not HAS_MQTT:
            logger.warning("paho-mqtt not available — MQTT ingestion disabled")
            return False
        if not BROKER_HOST:
            logger.info("MQTT_BROKER_HOST not set — MQTT ingestion disabled")
            self._state = self.STATE_OFFLINE
            return False

        self._loop = event_loop or asyncio.get_event_loop()

        if not hasattr(mqtt_client, "CallbackAPIVersion"):
            logger.error("paho-mqtt >= 2.0 is required for MQTT ingestion (requirements.txt pins paho-mqtt>=2.0.0)")
            self._state = self.STATE_OFFLINE
            return False

        self._client = mqtt_client.Client(
            callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2,
            client_id=f"terramesh-backend-{os.getpid()}",
            clean_session=True,
            protocol=mqtt_client.MQTTv311,
        )

        # Last-Will: mark the gateway status topic if THIS backend dies
        self._client.will_set(
            topic=self.GATEWAY_STATUS_TOPIC,
            payload=json.dumps({"status": "OFFLINE", "source": "terramesh-backend"}),
            qos=1,
            retain=True,
        )

        if USERNAME:
            self._client.username_pw_set(USERNAME, PASSWORD)

        if USE_TLS:
            import ssl
            tls_kwargs = {"tls_version": ssl.PROTOCOL_TLSv1_2}
            if CA_CERT:
                tls_kwargs["ca_certs"] = CA_CERT
            self._client.tls_set(**tls_kwargs)

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        try:
            self._client.reconnect_delay_set(min_delay=1, max_delay=30)
            self._client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
            self._thread = threading.Thread(
                target=self._client.loop_forever,
                name="mqtt-ingest",
                daemon=True,
            )
            self._thread.start()
            # Confirmation window: wait up to 4s for the on_connect callback
            for _ in range(40):
                if self._connected:
                    break
                await asyncio.sleep(0.1)
            if self._connected:
                logger.info("MQTT ingestion client started")
                return True
            self._state = self.STATE_RECOVERING
            logger.warning(
                "MQTT broker not reachable at %s:%d — ingestion OFFLINE until broker returns. "
                "(No simulated telemetry is injected; the pipeline receives nothing in the meantime.)",
                BROKER_HOST, BROKER_PORT,
            )
            return False
        except Exception as e:
            self._state = self.STATE_OFFLINE
            logger.warning("MQTT start failed (%s) — ingestion OFFLINE until broker returns.", e)
            return False

    async def stop(self):
        if self._client:
            try:
                self._client.disconnect()
            except Exception:
                pass
        self._connected = False
        self._state = self.STATE_OFFLINE
        logger.info("MQTT client disconnected")

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def state(self) -> str:
        return self._state

    @property
    def gateway_lwt(self) -> Dict[str, Any]:
        return dict(self._gateway_lwt)

    def stats(self) -> Dict[str, Any]:
        """Ingestion metrics for observability."""
        return {
            "state": self._state,
            "connected": self._connected,
            "broker": f"{BROKER_HOST}:{BROKER_PORT}",
            "mine_id": MINE_ID,
            "disconnect_count": self._disconnect_count,
            "last_connected_at": self._last_connected_at,
            "gateway_lwt": self._gateway_lwt,
            "metrics": dict(self._metrics),
        }


# Module-level singleton
mqtt_ingest = MQTTIngestClient()
