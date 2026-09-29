"""
TerraMesh AI — Scenario Corpus Generator (SIMULATION, clearly labelled)
=======================================================================
Generates `backend/data/terramesh_scenarios.parquet` — the demonstration
corpus replayed by `POST /api/scenario/inject` through the FULL pipeline.

EVERY row is synthetic. Scenario playback is provenance-labelled
`SIMULATION` end-to-end (edge buffer, PostgreSQL, WebSocket events) and can
never be confused with live measurement.

Scenarios:
  baseline_normal       — nominal ground behaviour across all nodes
  progressive_subsidence— gradually escalating tilt/crack/displacement
  blast_event           — high-frequency blasting transient (suppression test)
  sensor_fault          — flatline + battery brownout on one node
  cascading_critical    — multi-node corroboration escalation

Run:  python generate_scenarios.py   (from backend/)
"""

from __future__ import annotations
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

OUT_PATH = Path(__file__).resolve().parent / "data" / "terramesh_scenarios.parquet"
NODES = [f"TM-{i:03d}" for i in range(1, 7)]          # 6-node demo mesh
CYCLES = 30                                            # timestamps per scenario
rng = random.Random(2026)


def _base_row(node_id: str, t0: datetime, cycle: int, seq: int) -> dict:
    """Nominal packet for a node at a given cycle."""
    return {
        "scenario": "",  # filled by caller
        "timestamp": (t0 + timedelta(seconds=5 * cycle)).isoformat(),
        "node_id": node_id,
        "node_x": 40.0 + 55.0 * (int(node_id.split("-")[1]) - 1) * 0.7,
        "node_y": 30.0 + 25.0 * ((int(node_id.split("-")[1]) - 1) % 3) * 0.8,
        "tilt_x_deg": round(rng.gauss(0.03, 0.01), 4),
        "tilt_y_deg": round(rng.gauss(0.02, 0.01), 4),
        "tilt_mag_mrad": 0.0,
        "crack_gap_mm": round(rng.uniform(0.05, 0.3), 3),
        "strain_ustrain": round(rng.uniform(2.0, 8.0), 2),
        "vib_rms_g": round(rng.uniform(0.02, 0.06), 3),
        "vib_peak_g": round(rng.uniform(0.04, 0.12), 3),
        "dom_freq_hz": round(rng.uniform(6.0, 11.0), 2),
        "band_energy_0_10": 0.04,
        "band_energy_10_50": 0.015,
        "temp_c": round(rng.uniform(26.0, 30.0), 1),
        "battery_v": round(rng.uniform(3.9, 4.2), 2),
        "rssi_dbm": int(rng.uniform(-95, -70)),
        "snr_db": round(rng.uniform(6.0, 11.0), 1),
        "packet_seq": seq,
        "blast_flag": 0,
        "rain_flag": 0,
    }


def _finalize(rows: list, scenario: str) -> list:
    out = []
    for r in rows:
        r["scenario"] = scenario
        tx = r["tilt_x_deg"] * (math.pi / 180.0) * 1000.0
        ty = r["tilt_y_deg"] * (math.pi / 180.0) * 1000.0
        r["tilt_mag_mrad"] = round(math.sqrt(tx * tx + ty * ty), 3)
        out.append(r)
    return out


def scenario_baseline(t0):
    rows = []
    for cycle in range(CYCLES):
        for n in NODES:
            rows.append(_base_row(n, t0, cycle, cycle))
    return _finalize(rows, "baseline_normal")


def scenario_progressive_subsidence(t0):
    """Nodes 2-3 escalate from nominal to critical over the run."""
    rows = []
    for cycle in range(CYCLES):
        progress = cycle / (CYCLES - 1)
        for n in NODES:
            r = _base_row(n, t0, cycle, cycle)
            if n in ("TM-002", "TM-003"):
                r["tilt_x_deg"] = round(0.03 + progress * 4.2, 4)
                r["crack_gap_mm"] = round(0.2 + progress * 9.0, 3)
                r["strain_ustrain"] = round(5.0 + progress * 140.0, 2)
                r["vib_rms_g"] = round(0.03 + progress * 1.1, 3)
                r["vib_peak_g"] = round(0.06 + progress * 2.4, 3)
                r["dom_freq_hz"] = round(9.0 - progress * 4.0, 2)
            rows.append(r)
    return _finalize(rows, "progressive_subsidence")


def scenario_blast_event(t0):
    """Blasting transient at cycle 12 (suppression must engage)."""
    rows = []
    for cycle in range(CYCLES):
        for n in NODES:
            r = _base_row(n, t0, cycle, cycle)
            if 10 <= cycle <= 14:
                r["vib_rms_g"] = 0.95
                r["vib_peak_g"] = 2.4
                r["dom_freq_hz"] = 38.0
                r["band_energy_0_10"] = 0.02
                r["band_energy_10_50"] = 0.30
                r["blast_flag"] = 1 if cycle == 12 else 0
            rows.append(r)
    return _finalize(rows, "blast_event")


def scenario_sensor_fault(t0):
    """TM-004 flatlines from cycle 8; battery decays to dead."""
    rows = []
    for cycle in range(CYCLES):
        for n in NODES:
            r = _base_row(n, t0, cycle, cycle)
            if n == "TM-004" and cycle >= 8:
                r["tilt_x_deg"] = 0.0
                r["tilt_y_deg"] = 0.0
                r["crack_gap_mm"] = 0.0
                r["strain_ustrain"] = 0.0
                r["vib_rms_g"] = 0.0
                r["vib_peak_g"] = 0.0
                r["battery_v"] = round(max(0.0, 4.0 - 0.2 * (cycle - 8)), 2)
            rows.append(r)
    return _finalize(rows, "sensor_fault")


def scenario_cascading_critical(t0):
    """Correlated multi-node escalation (spatial-consensus path)."""
    rows = []
    for cycle in range(CYCLES):
        progress = cycle / (CYCLES - 1)
        for idx, n in enumerate(NODES):
            r = _base_row(n, t0, cycle, cycle)
            if n in ("TM-001", "TM-002", "TM-004"):  # adjacent trio
                r["tilt_x_deg"] = round(0.03 + progress * 5.2, 4)
                r["crack_gap_mm"] = round(0.2 + progress * 11.0, 3)
                r["vib_rms_g"] = round(0.03 + progress * 1.6, 3)
                r["vib_peak_g"] = round(0.06 + progress * 3.0, 3)
            rows.append(r)
    return _finalize(rows, "cascading_critical")


def main():
    t0 = datetime(2026, 9, 24, 8, 0, 0, tzinfo=timezone.utc).replace(tzinfo=None)
    frames = [
        scenario_baseline(t0),
        scenario_progressive_subsidence(t0),
        scenario_blast_event(t0),
        scenario_sensor_fault(t0),
        scenario_cascading_critical(t0),
    ]
    df = pd.DataFrame([r for f in frames for r in f])
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUT_PATH, index=False)
    print(f"SIMULATION corpus written: {OUT_PATH}")
    print(f"  rows={len(df)}  scenarios={df['scenario'].nunique()}  "
          f"nodes={df['node_id'].nunique()}  cycles_per_scenario={CYCLES}")
    print("  provenance: SIMULATION (playback is always labelled)")


if __name__ == "__main__":
    main()
