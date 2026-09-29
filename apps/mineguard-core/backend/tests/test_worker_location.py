"""
Phase E — Worker-location architecture tests (canonical schema, source
validation, server-derived provenance, hardware-ready consumption path).
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402

client = TestClient(main.app)
AUTH = {"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")}


def _fix(**over):
    base = {
        "worker_id": "W-TEST-01",
        "timestamp": "2026-09-24T10:00:00Z",
        "x": 120.5, "y": 80.2, "z": -140.0,
        "panel_id": "P-17B", "zone_id": "zone-b",
        "location_source": "SIMULATOR",
        "accuracy_m": 2.5, "battery": 78, "signal": -80,
        "status": "SAFE",
    }
    base.update(over)
    return base


def test_simulator_fix_is_labelled_simulation():
    r = client.post("/api/workers/location", headers=AUTH, json=_fix())
    assert r.status_code == 200
    stored = r.json()["fix"]
    assert stored["provenance"] == "SIMULATION"
    assert stored["location_source"] == "SIMULATOR"


def test_rfid_fix_is_labelled_measured():
    r = client.post("/api/workers/location", headers=AUTH,
                     json=_fix(worker_id="W-TEST-02", location_source="RFID"))
    assert r.status_code == 200
    assert r.json()["fix"]["provenance"] == "MEASURED DATA"


def test_other_source_is_unlabelled_not_measured():
    r = client.post("/api/workers/location", headers=AUTH,
                     json=_fix(worker_id="W-TEST-03", location_source="OTHER"))
    assert r.status_code == 200
    assert r.json()["fix"]["provenance"] == "UNLABELED"


def test_invalid_source_rejected():
    r = client.post("/api/workers/location", headers=AUTH,
                     json=_fix(worker_id="W-TEST-04", location_source="GPS_MAGIC"))
    assert r.status_code == 422


def test_client_cannot_self_declare_provenance():
    """provenance is derived server-side — a client attempt to mark a
    simulator feed as MEASURED must be overridden."""
    payload = _fix(worker_id="W-TEST-05", provenance="MEASURED DATA")
    r = client.post("/api/workers/location", headers=AUTH, json=payload)
    assert r.status_code == 200
    assert r.json()["fix"]["provenance"] == "SIMULATION"


def test_latest_fix_roundtrip_and_stale_flag():
    client.post("/api/workers/location", headers=AUTH,
                json=_fix(worker_id="W-TEST-06"))
    r = client.get("/api/workers/W-TEST-06/location", headers=AUTH)
    assert r.status_code == 200
    fix = r.json()
    assert fix["zone_id"] == "zone-b"
    assert "stale" in fix


def test_unknown_worker_404():
    r = client.get("/api/workers/NO-SUCH/location", headers=AUTH)
    assert r.status_code == 404


def test_source_census_and_all_latest():
    r = client.get("/api/workers/locations", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert "sources" in body and "fixes" in body
    assert body["sources"].get("SIMULATOR", 0) >= 1


def test_evacuation_declares_personnel_provenance():
    r = client.get("/api/evacuation", headers=AUTH)
    assert r.status_code == 200
    ev = r.json()
    assert ev.get("personnel_location_source") == "SIMULATOR"
    assert ev.get("personnel_provenance") == "SIMULATION"
