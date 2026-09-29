"""
TerraMesh AI — Module 5.1: Edge Gateway SQLite Database (WAL-Mode)
==================================================================
High-throughput, zero-dependency local database for edge gateway operation.
Uses Write-Ahead Logging (WAL) mode for concurrent read/write during high-frequency
LoRa telemetry streaming and live dashboard updates.
"""

from __future__ import annotations
import json
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(os.getenv(
    "EDGE_DB_PATH",
    str(Path(__file__).resolve().parent.parent / "data" / "terramesh_edge.db"),
))
DB_PATH.parent.mkdir(exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging (WAL) for high concurrency
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def init_database() -> None:
    """Creates database schema if not already initialized."""
    conn = get_db_connection()
    with conn:
        # 1. Registered Nodes Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS nodes (
            node_id TEXT PRIMARY KEY,
            pos_x REAL NOT NULL,
            pos_y REAL NOT NULL,
            lat REAL,
            lon REAL,
            panel_id TEXT,
            last_seen REAL,
            health_state TEXT DEFAULT 'HEALTHY',
            warning_tier TEXT DEFAULT 'NORMAL',
            battery_v REAL DEFAULT 4.2
        );
        """)

        # 2. Raw Sensor Telemetry Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp_h REAL NOT NULL,
            tilt_x_deg REAL,
            tilt_y_deg REAL,
            tilt_mag_mrad REAL,
            crack_mm REAL,
            strain_ustrain REAL,
            vib_rms_g REAL,
            vib_peak_g REAL,
            dom_freq_hz REAL,
            temp_c REAL,
            batt_v REAL,
            rssi_dbm REAL,
            blast_flag INTEGER DEFAULT 0,
            rain_flag INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (node_id) REFERENCES nodes (node_id)
        );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_telem_node_time ON telemetry (node_id, timestamp_h);")

        # 3. SHADOW Decisions Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp_h REAL NOT NULL,
            warning_tier TEXT NOT NULL,
            composite_risk_score REAL NOT NULL,
            siren_active INTEGER DEFAULT 0,
            siren_suppressed INTEGER DEFAULT 0,
            spatial_consensus_count INTEGER DEFAULT 0,
            corroborating_neighbors TEXT,
            primary_driver TEXT,
            hours_to_critical REAL,
            explanation_card_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (node_id) REFERENCES nodes (node_id)
        );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_decisions_node_time ON decisions (node_id, timestamp_h);")

        # 4. System Alerts & Siren Events Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            node_id TEXT,
            warning_tier TEXT NOT NULL,
            message_en TEXT NOT NULL,
            message_hi TEXT NOT NULL,
            siren_triggered INTEGER DEFAULT 0,
            acknowledged INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
    conn.close()


def store_telemetry(payload: Dict[str, Any]) -> None:
    """Stores incoming raw node packet and updates node registry."""
    conn = get_db_connection()
    with conn:
        node_id = str(payload.get("node_id", "NODE_01"))
        pos_x = float(payload.get("node_x", 0.0))
        pos_y = float(payload.get("node_y", 0.0))
        t_h = float(payload.get("timestamp_h", 0.0))
        batt = float(payload.get("batt_v", payload.get("battery_v", 4.1)))

        # Update node registry
        conn.execute("""
        INSERT INTO nodes (node_id, pos_x, pos_y, last_seen, battery_v)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(node_id) DO UPDATE SET
            last_seen=excluded.last_seen,
            battery_v=excluded.battery_v;
        """, (node_id, pos_x, pos_y, t_h, batt))

        # Insert telemetry
        conn.execute("""
        INSERT INTO telemetry (
            node_id, timestamp_h, tilt_x_deg, tilt_y_deg, tilt_mag_mrad,
            crack_mm, strain_ustrain, vib_rms_g, vib_peak_g, dom_freq_hz,
            temp_c, batt_v, rssi_dbm, blast_flag, rain_flag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            node_id, t_h,
            payload.get("tilt_x_deg"), payload.get("tilt_y_deg"), payload.get("tilt_mag_mrad"),
            payload.get("crack_mm", payload.get("crack_gap_mm")), payload.get("strain_ustrain"),
            payload.get("vib_rms_g"), payload.get("vib_peak_g"), payload.get("dom_freq_hz"),
            payload.get("temp_c"), batt, payload.get("rssi_dbm"),
            payload.get("blast_flag", 0), payload.get("rain_flag", 0),
        ))
    conn.close()


def store_decision(decision: Any, card_json: str) -> None:
    """Stores SHADOW decision and updates node's current warning tier."""
    conn = get_db_connection()
    with conn:
        conn.execute("""
        INSERT INTO decisions (
            node_id, timestamp_h, warning_tier, composite_risk_score,
            siren_active, siren_suppressed, spatial_consensus_count,
            corroborating_neighbors, primary_driver, hours_to_critical,
            explanation_card_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            decision.node_id, decision.timestamp_h, decision.warning_tier,
            decision.composite_risk_score, int(decision.siren_active),
            int(decision.siren_suppressed), decision.spatial_consensus_count,
            json.dumps(decision.corroborating_neighbors), decision.primary_driver,
            decision.hours_to_critical, card_json
        ))

        conn.execute("""
        UPDATE nodes SET warning_tier = ?, health_state = ? WHERE node_id = ?;
        """, (decision.warning_tier, decision.health_state, decision.node_id))
    conn.close()


def get_latest_node_states() -> List[Dict[str, Any]]:
    """Fetches all registered nodes with their current status and coordinates."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM nodes ORDER BY node_id;").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_node_history(node_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetches recent time-series telemetry for a specific node."""
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT * FROM telemetry WHERE node_id = ? ORDER BY timestamp_h DESC LIMIT ?;
    """, (node_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]


# Initialize schema upon module load
init_database()
