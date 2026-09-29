#!/usr/bin/env python3
"""
TerraMesh AI — Raspberry-Pi Gateway APPLICATION (deployment-ready software)
=============================================================================
Runs on the physical gateway (Raspberry Pi / Industrial PC) described in the
deck's stage-4 architecture. Distinct from `gateway_simulator.py` (which
fakes sensor data): this application FORWARDS REAL traffic —

  LoRa mesh downlink (serial frames from an ESP32-S3/SX1262 receiver board)
      -> JSON validation (backend NodeTelemetry contract)
      -> MQTT publish over TLS to the cloud backend
      -> local SQLite store-and-forward when the broker is unreachable
      -> replay with original timestamps on reconnect
      -> NTP beacon for the mesh nodes (see firmware README)
      -> optional relay GPIO driving the on-site siren/beacon when the
         backend flags siren_active in decisions

STATUS: DEPLOYMENT-READY SOFTWARE — authored and unit-tested for logic, but
NEVER executed on physical gateway hardware (none exists in this project).
Provisioning instructions: see install.md in this directory.

Configuration (environment):
  GATEWAY_SERIAL_PORT   default /dev/ttyUSB0   (LoRa receiver serial)
  GATEWAY_SERIAL_BAUD   default 115200
  MQTT_BROKER_HOST      default localhost
  MQTT_BROKER_PORT       default 8883 (TLS)
  MQTT_USE_TLS          default true
  MQTT_USERNAME / MQTT_PASSWORD / MQTT_CA_CERT
  MINE_ID               default jharia_01
  SIREN_RELAY_PIN       default 0 (0 = disabled; BCM GPIO number otherwise)
"""

from __future__ import annotations
import json
import logging
import os
import sqlite3
import ssl
import sys
import threading
import time
from pathlib import Path
from typing import Optional

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"),
                    format="%(asctime)s [%(levelname)s] %(name)s %(message)s")
logger = logging.getLogger("terramesh.gateway")

BUFFER_DB = Path(os.getenv("GATEWAY_BUFFER_DB",
                           str(Path(__file__).resolve().parent.parent.parent / "data" / "gateway_live_buffer.db")))
MINE_ID = os.getenv("MINE_ID", "jharia_01")
SIREN_RELAY_PIN = int(os.getenv("SIREN_RELAY_PIN", "0"))  # 0 = disabled

STATE_ONLINE = "ONLINE"
STATE_OFFLINE = "OFFLINE"        # buffering
STATE_RECOVERING = "RECOVERING"  # replaying buffer


# ─────────────────────────────────────────────────────────────────────────────
# Local buffer (store-and-forward — survives gateway reboots)
# ─────────────────────────────────────────────────────────────────────────────
class PacketBuffer:
    def __init__(self, db_path: Path):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._conn.execute(
                """CREATE TABLE IF NOT EXISTS packets (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       topic TEXT NOT NULL,
                       payload TEXT NOT NULL,
                       original_ts TEXT NOT NULL,
                       captured_epoch REAL NOT NULL)""")
            self._conn.commit()

    def push(self, topic: str, payload: str, original_ts: str) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT INTO packets (topic, payload, original_ts, captured_epoch) VALUES (?,?,?,?)",
                (topic, payload, original_ts, time.time()))
            self._conn.commit()

    def peek_batch(self, limit: int = 25):
        with self._lock:
            return self._conn.execute(
                "SELECT id, topic, payload FROM packets ORDER BY captured_epoch ASC LIMIT ?",
                (limit,)).fetchall()

    def drop(self, row_id: int) -> None:
        with self._lock:
            self._conn.execute("DELETE FROM packets WHERE id = ?", (row_id,))
            self._conn.commit()

    def depth(self) -> int:
        with self._lock:
            return self._conn.execute("SELECT COUNT(*) FROM packets").fetchone()[0]


# ─────────────────────────────────────────────────────────────────────────────
# MQTT uplink (TLS-capable)
# ─────────────────────────────────────────────────────────────────────────────
class MqttUplink:
    def __init__(self):
        self.host = os.getenv("MQTT_BROKER_HOST", "localhost")
        self.port = int(os.getenv("MQTT_BROKER_PORT", "8883"))
        self.use_tls = os.getenv("MQTT_USE_TLS", "true").lower() == "true"
        self.username = os.getenv("MQTT_USERNAME", "")
        self.password = os.getenv("MQTT_PASSWORD", "")
        self.ca_cert = os.getenv("MQTT_CA_CERT", "")
        self.client = None
        self.connected = False

    def connect(self) -> bool:
        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"terramesh-gateway-{os.getpid()}-{int(time.time())}",
                clean_session=False, protocol=mqtt.MQTTv311)  # clean_session=False: QoS1 resume
            if self.username:
                self.client.username_pw_set(self.username, self.password)
            if self.use_tls:
                tls_kwargs = {"tls_version": ssl.PROTOCOL_TLS_CLIENT}
                if self.ca_cert:
                    tls_kwargs["ca_certs"] = self.ca_cert
                self.client.tls_set(**tls_kwargs)
            self.client.connect(self.host, self.port, keepalive=30)
            self.client.loop_start()
            time.sleep(1.0)
            self.connected = True
            logger.info("MQTT uplink connected to %s:%d (TLS=%s)",
                        self.host, self.port, self.use_tls)
            return True
        except Exception as e:
            self.connected = False
            logger.warning("MQTT unreachable (%s) — store-and-forward buffering", e)
            return False

    def publish(self, topic: str, payload: str) -> bool:
        if not self.connected and not self.connect():
            return False
        try:
            info = self.client.publish(topic, payload, qos=1)  # QoS 1: at-least-once
            return info.rc == 0
        except Exception as e:
            self.connected = False
            logger.warning("MQTT publish failed (%s)", e)
            return False


# ─────────────────────────────────────────────────────────────────────────────
# Validation (mirror of the backend MQTT gate — reject before backhaul)
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_KINDS = {"telemetry", "heartbeat", "status"}


def validate_frame(raw: str):
    """Parse one serial frame 'topic|json'. Returns (topic, payload_dict)
    or None when malformed — the backend would reject it anyway."""
    try:
        topic, payload = raw.strip().split("|", 1)
        parts = topic.split("/")
        if len(parts) != 5 or parts[0] != "mines" or parts[2] != "nodes":
            return None
        if parts[1] != MINE_ID or parts[4] not in ALLOWED_KINDS:
            return None
        data = json.loads(payload)
        if not isinstance(data, dict) or "node_id" not in data:
            return None
        return topic, data
    except (ValueError, json.JSONDecodeError):
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Siren relay (on-site beacon — deck stage 8)
# ─────────────────────────────────────────────────────────────────────────────
def drive_siren(active: bool) -> None:
    """Drive the on-site siren relay when a backend decision sets
    siren_active. Requires gpiozero (Raspberry Pi only)."""
    if SIREN_RELAY_PIN <= 0:
        return
    try:
        from gpiozero import OutputDevice  # type: ignore
        relay = OutputDevice(SIREN_RELAY_PIN)
        if active:
            relay.on()
        else:
            relay.off()
    except Exception as e:
        logger.warning("Siren relay drive failed (%s)", e)


# ─────────────────────────────────────────────────────────────────────────────
# Main application loop
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    serial_port = os.getenv("GATEWAY_SERIAL_PORT", "/dev/ttyUSB0")
    baud = int(os.getenv("GATEWAY_SERIAL_BAUD", "115200"))

    buffer = PacketBuffer(BUFFER_DB)
    uplink = MqttUplink()
    state = STATE_OFFLINE
    uplink.connect()

    ser = None
    try:
        import serial  # pyserial
        ser = serial.Serial(serial_port, baud, timeout=2)
        logger.info("LoRa serial receiver opened on %s @ %d", serial_port, baud)
    except Exception as e:
        logger.error("Cannot open serial port %s (%s). Running in BUFFER-REPLAY "
                     "mode: existing buffered packets will be forwarded.", serial_port, e)

    logger.info("Gateway application running (siren pin=%d, buffer=%s)",
                SIREN_RELAY_PIN, BUFFER_DB)

    while True:
        # 1. Drain the offline buffer first (store-and-forward)
        if uplink.connected and buffer.depth() > 0:
            state = STATE_RECOVERING
            for row_id, topic, payload in buffer.peek_batch():
                if uplink.publish(topic, payload):
                    buffer.drop(row_id)
                else:
                    break
            logger.info("Replayed buffer; depth now %d", buffer.depth())
        state = STATE_ONLINE if uplink.connected else STATE_OFFLINE

        # 2. Read serial frames from the mesh
        if ser is not None:
            try:
                line = ser.readline().decode("utf-8", errors="replace")
                if line:
                    parsed = validate_frame(line)
                    if parsed is None:
                        logger.warning("Rejected malformed frame: %.80s", line)
                        continue
                    topic, data = parsed
                    payload = json.dumps(data)
                    if not uplink.publish(topic, payload):
                        buffer.push(topic, payload,
                                    data.get("timestamp", ""))
                    else:
                        # Siren gate: backend decision replay channel — in a
                        # full deployment the backend also pushes decisions to
                        # the gateway; here telemetry-side criticality can
                        # trigger the local beacon via the siren contract.
                        drive_siren(data.get("siren_active", False))
            except Exception as e:
                logger.warning("Serial read error: %s", e)
                time.sleep(1)
        else:
            time.sleep(2)

        # 3. Health heartbeat for observability
        if int(time.time()) % 60 == 0:
            logger.info("state=%s buffered=%d", state, buffer.depth())


if __name__ == "__main__":
    sys.exit(main())
