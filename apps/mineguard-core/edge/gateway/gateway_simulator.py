"""
TerraMesh AI — Edge Gateway SIMULATOR (Offline-First Store-and-Forward)
=========================================================================
Demonstrates the deck's gateway capability in clearly-labelled simulation:

  Gateway (SIMULATOR)
    -> publishes telemetry to the backend MQTT topic contract
    -> when the broker is UNREACHABLE: buffers packets to a local SQLite WAL
       database with their ORIGINAL timestamps (offline-first)
    -> on reconnect: replays the buffer (store-and-forward), marking each
       replayed packet so downstream provenance stays honest
    -> states: ONLINE | OFFLINE (buffering) | RECOVERING (replaying)

HONESTY: this is a software simulation of gateway behaviour — no physical
Raspberry Pi / industrial PC gateway exists. All generated packets carry
provenance 'SIMULATED EDGE GATEWAY'. Replayed packets additionally carry
`_replayed_from_buffer: true` so the platform can distinguish live from
replayed traffic.

Usage (standalone demo):
    python -m edge.gateway.gateway_simulator --broker localhost --duration 60
"""

from __future__ import annotations
import argparse
import json
import logging
import random
import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("terramesh.edge.gateway")

BUFFER_DB = Path(__file__).resolve().parent.parent.parent / "data" / "gateway_buffer.db"
MINE_ID_DEFAULT = "jharia_01"

STATE_ONLINE = "ONLINE"
STATE_OFFLINE = "OFFLINE"        # broker unreachable — buffering locally
STATE_RECOVERING = "RECOVERING"  # back online — replaying buffered packets


def _init_buffer(db_path: Path):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """CREATE TABLE IF NOT EXISTS buffered_packets (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               node_id TEXT NOT NULL,
               topic TEXT NOT NULL,
               payload_json TEXT NOT NULL,
               original_ts REAL NOT NULL,
               buffered_at REAL NOT NULL
           )"""
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_buf_ts ON buffered_packets (original_ts)")
    conn.commit()
    conn.close()


class GatewaySimulator:
    """SIMULATOR — offline-first store-and-forward edge gateway."""

    def __init__(self, broker_host: str, broker_port: int = 1883,
                 mine_id: str = MINE_ID_DEFAULT, node_count: int = 4,
                 publish_interval_s: float = 3.0, buffer_db: Path = BUFFER_DB):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.mine_id = mine_id
        self.node_ids = [f"GW-SIM-{i:02d}" for i in range(1, node_count + 1)]
        self.publish_interval_s = publish_interval_s
        self.buffer_db = buffer_db
        self.state = STATE_OFFLINE
        self._seq = 0
        self._running = False
        self._client = None
        self._stats = {"published": 0, "buffered": 0, "replayed": 0}
        _init_buffer(buffer_db)

    # ── MQTT connection ────────────────────────────────────────────────────
    def _connect(self) -> bool:
        try:
            import paho.mqtt.client as mqtt
            self._client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"terramesh-gateway-sim-{int(time.time())}",
                clean_session=True, protocol=mqtt.MQTTv311)
            self._client.connect(self.broker_host, self.broker_port, keepalive=30)
            self._client.loop_start()
            time.sleep(1.0)
            self.state = STATE_ONLINE
            logger.info("Gateway SIMULATOR connected to broker %s:%d", self.broker_host, self.broker_port)
            return True
        except Exception as e:
            self.state = STATE_OFFLINE
            self._client = None
            logger.warning("Broker unreachable (%s) — buffering locally (offline-first)", e)
            return False

    # ── Local buffer (offline-first) ─────────────────────────────────────────
    def _buffer(self, node_id: str, topic: str, payload: dict) -> None:
        conn = sqlite3.connect(str(self.buffer_db))
        try:
            conn.execute(
                "INSERT INTO buffered_packets (node_id, topic, payload_json, original_ts, buffered_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (node_id, topic, json.dumps(payload), payload["timestamp_epoch"], time.time()),
            )
            conn.commit()
            self._stats["buffered"] += 1
        finally:
            conn.close()

    def _replay_buffer(self) -> int:
        """Store-and-forward: replay buffered packets with original timestamps."""
        conn = sqlite3.connect(str(self.buffer_db))
        replayed = 0
        try:
            rows = conn.execute(
                "SELECT id, node_id, topic, payload_json, original_ts "
                "FROM buffered_packets ORDER BY original_ts ASC LIMIT 500"
            ).fetchall()
            for row_id, node_id, topic, payload_json, original_ts in rows:
                try:
                    payload = json.loads(payload_json)
                    payload["_replayed_from_buffer"] = True
                    payload["_original_capture_epoch"] = original_ts
                    payload["note"] = "store-and-forward replay (offline capture)"
                    self._client.publish(topic, json.dumps(payload), qos=1)
                    conn.execute("DELETE FROM buffered_packets WHERE id = ?", (row_id,))
                    conn.commit()
                    replayed += 1
                except Exception as e:
                    logger.warning("Replay failed for buffered row %s: %s", row_id, e)
                    break
        finally:
            conn.close()
        return replayed

    def buffered_count(self) -> int:
        conn = sqlite3.connect(str(self.buffer_db))
        try:
            return conn.execute("SELECT COUNT(*) FROM buffered_packets").fetchone()[0]
        finally:
            conn.close()

    # ── Packet generation (SIMULATED telemetry) ──────────────────────────────
    def _make_packet(self, node_id: str) -> dict:
        self._seq += 1
        return {
            "node_id": node_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "timestamp_epoch": time.time(),
            "packet_seq": self._seq,
            "tilt_x_deg": round(random.gauss(0.05, 0.02), 4),
            "tilt_y_deg": round(random.gauss(0.03, 0.02), 4),
            "tilt_mag_mrad": round(abs(random.gauss(1.2, 0.5)), 3),
            "crack_gap_mm": round(random.uniform(0.05, 0.4), 3),
            "strain_ustrain": round(random.uniform(2.0, 9.0), 2),
            "vib_rms_g": round(random.uniform(0.02, 0.08), 3),
            "vib_peak_g": round(random.uniform(0.04, 0.15), 3),
            "dom_freq_hz": round(random.uniform(6.0, 12.0), 2),
            "band_energy_0_10": 0.04,
            "band_energy_10_50": 0.015,
            "temp_c": round(random.uniform(26.0, 30.0), 1),
            "battery_v": round(random.uniform(3.9, 4.2), 2),
            "rssi_dbm": int(random.uniform(-95, -70)),
            "snr_db": round(random.uniform(6.0, 11.0), 1),
            "provenance": "SIMULATED EDGE GATEWAY",
        }

    # ── Main loop ────────────────────────────────────────────────────────────
    def run(self, duration_s: float = 60.0, simulate_outage: bool = True,
            outage_after_s: float = 15.0, outage_duration_s: float = 12.0) -> dict:
        """Run for `duration_s`. Optionally simulate a broker outage to
        demonstrate offline buffering + store-and-forward replay."""
        self._running = True
        connected = self._connect()
        started = time.time()
        outage_started = None

        while self._running and (time.time() - started) < duration_s:
            elapsed = time.time() - started

            # Optional simulated outage window
            if simulate_outage and outage_started is None and elapsed >= outage_after_s:
                logger.warning("SIMULATED broker outage begins — switching to local buffering")
                outage_started = time.time()
                try:
                    if self._client:
                        self._client.disconnect()
                except Exception:
                    pass
                self._client = None
                self.state = STATE_OFFLINE
            if outage_started is not None and self._client is None and \
               (time.time() - outage_started) >= outage_duration_s:
                logger.info("Broker back online — RECOVERING: replaying buffered packets")
                self.state = STATE_RECOVERING
                if self._connect():
                    replayed = self._replay_buffer()
                    self._stats["replayed"] += replayed
                    logger.info("Store-and-forward replay complete: %d packets", replayed)
                    outage_started = None  # outage resolved

            node_id = random.choice(self.node_ids)
            packet = self._make_packet(node_id)
            topic = f"mines/{self.mine_id}/nodes/{node_id}/telemetry"

            if self._client is not None and self.state in (STATE_ONLINE, STATE_RECOVERING):
                self._client.publish(topic, json.dumps(packet), qos=1)
                self._stats["published"] += 1
            else:
                self._buffer(node_id, topic, packet)

            time.sleep(self.publish_interval_s)

        if self._client:
            try:
                self._client.loop_stop()
                self._client.disconnect()
            except Exception:
                pass
        self._running = False
        result = {**self._stats,
                  "buffered_remaining": self.buffered_count(),
                  "state": self.state,
                  "provenance": "SIMULATED EDGE GATEWAY"}
        logger.info("Gateway SIMULATOR finished: %s", result)
        return result


def main():
    ap = argparse.ArgumentParser(description="TerraMesh edge-gateway SIMULATOR (store-and-forward)")
    ap.add_argument("--broker", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--duration", type=float, default=60.0)
    ap.add_argument("--no-outage", action="store_true", help="skip the simulated outage window")
    args = ap.parse_args()

    gw = GatewaySimulator(args.broker, args.port)
    gw.run(duration_s=args.duration, simulate_outage=not args.no_outage)


if __name__ == "__main__":
    main()
