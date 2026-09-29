#!/usr/bin/env python3
"""
TERRAMESH AI — TELEMETRY SIMULATION SCRIPT
Injects controlled SIMULATION-provenance telemetry events via the backend API
or directly over MQTT (depending on configuration).

Modes:
  --mode normal     : normal vibration/tilt readings within safe thresholds
  --mode anomaly    : elevated readings designed to trigger WARNING → CRITICAL
  --mode stale      : sends one packet then stops (tests stale detection)
  --mode disconnect : sends nothing (tests sensor-absent detection)

All injected data carries provenance=SIMULATION. This script must never be
configured to send real emergency notifications to actual mine workers.
"""
import argparse
import json
import os
import random
import sys
import time
import uuid
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_packet(mine_id: str, panel: str, node_id: str,
                mode: str, seq: int) -> dict:
    """Construct a canonical SIMULATION telemetry packet."""
    base = {
        "event_id": str(uuid.uuid4()),
        "schema_version": "1.0",
        "provenance": "SIMULATION",
        "mine_id": mine_id,
        "node_id": node_id,
        "panel_id": panel,
        "firmware_version": "SIMULATOR-1.0",
        "timestamp": now_iso(),
        "sequence": seq,
        "battery_pct": round(random.uniform(72.0, 98.0), 1),
        "rssi_dbm": None,   # No physical radio
        "snr_db": None,
    }

    if mode == "normal":
        base.update({
            "vibration_ms2": round(random.uniform(0.01, 0.08), 4),
            "tilt_deg": round(random.uniform(0.0, 0.5), 3),
            "displacement_mm": round(random.uniform(0.0, 0.3), 3),
        })
    elif mode == "anomaly":
        # Escalate over sequence count
        factor = min(seq / 5.0, 1.0)
        base.update({
            "vibration_ms2": round(0.1 + factor * 4.9, 4),   # 0.1 → 5.0 m/s²
            "tilt_deg": round(0.5 + factor * 7.5, 3),         # 0.5 → 8.0 deg
            "displacement_mm": round(0.3 + factor * 14.7, 3), # 0.3 → 15.0 mm
        })
    elif mode in ("stale", "disconnect"):
        base.update({
            "vibration_ms2": 0.02,
            "tilt_deg": 0.1,
            "displacement_mm": 0.05,
        })

    return base


def inject_via_api(packets: list, base_url: str, api_key: str) -> list:
    """POST packets to the backend ingestion API."""
    try:
        import httpx
    except ImportError:
        print("  httpx not installed — falling back to urllib")
        import urllib.request
        results = []
        for p in packets:
            body = json.dumps(p).encode()
            req = urllib.request.Request(
                f"{base_url}/api/telemetry/ingest",
                data=body,
                headers={"Content-Type": "application/json",
                         "X-API-Key": api_key},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=5) as r:
                    results.append({"status": r.status, "event_id": p["event_id"]})
            except Exception as e:
                results.append({"status": "ERROR", "error": str(e), "event_id": p["event_id"]})
        return results

    results = []
    with httpx.Client(base_url=base_url, timeout=5.0) as client:
        for p in packets:
            try:
                r = client.post("/api/telemetry/ingest",
                                json=p,
                                headers={"X-API-Key": api_key})
                results.append({"status": r.status_code, "event_id": p["event_id"]})
            except Exception as e:
                results.append({"status": "ERROR", "error": str(e), "event_id": p["event_id"]})
    return results


def main():
    parser = argparse.ArgumentParser(description="TerraMesh AI demo telemetry simulator")
    parser.add_argument("--mine", default="jharia_01")
    parser.add_argument("--panel", default="PANEL-A")
    parser.add_argument("--node", default="NODE-017")
    parser.add_argument("--mode", choices=["normal", "anomaly", "stale", "disconnect"],
                        default="normal")
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--interval", type=float, default=0.5,
                        help="Seconds between packets")
    parser.add_argument("--backend", default=os.getenv("BACKEND_URL", "http://localhost:8000"))
    parser.add_argument("--api-key", default=os.getenv("SECRET_KEY", "terramesh_secure_key_2026"))
    parser.add_argument("--dry-run", action="store_true",
                        help="Print packets but do not send")
    args = parser.parse_args()

    if args.mode == "disconnect":
        print(f"[SIMULATE DISCONNECT] Node {args.node} in mine {args.mine} — no packets sent.")
        print("Expected: Backend marks sensor as STALE after timeout window.")
        return

    print(f"TerraMesh AI Demo Telemetry Simulator")
    print(f"  Mine  : {args.mine}")
    print(f"  Panel : {args.panel}")
    print(f"  Node  : {args.node}")
    print(f"  Mode  : {args.mode.upper()}")
    print(f"  Count : {args.count}")
    print(f"  Target: {args.backend}")
    print(f"  DryRun: {args.dry_run}")
    print(f"  ALL DATA PROVENANCE = SIMULATION")
    print()

    packets = []
    for i in range(args.count):
        p = make_packet(args.mine, args.panel, args.node, args.mode, i + 1)
        packets.append(p)
        if args.dry_run:
            print(json.dumps(p, indent=2))
        else:
            result = inject_via_api([p], args.backend, args.api_key)
            status = result[0].get("status", "?")
            ok = status in (200, 201)
            print(f"  {'✓' if ok else '✗'} seq={i+1:3d} event={p['event_id'][:8]} "
                  f"vib={p['vibration_ms2']:.3f} tilt={p['tilt_deg']:.2f} → HTTP {status}")
        if args.mode == "stale":
            # Only send one packet for stale test
            break
        if i < args.count - 1:
            time.sleep(args.interval)

    print()
    print(f"Done. {len(packets)} SIMULATION packet(s) injected.")
    if args.mode == "anomaly":
        print("Expected: Risk engine should transition to WARNING → ELEVATED → CRITICAL")
        print("Expected: UI shows SIMULATED label throughout")


if __name__ == "__main__":
    main()
