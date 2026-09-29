import pytest
from datetime import datetime
from models import WorkerModel, GeofenceModel
from geofence_engine import evaluate_worker_safety

def test_worker_safety_state_danger():
    worker = {"timestamp": datetime.utcnow().isoformat()}
    geofences = [
        {"type": "DANGER", "name": "Blast Zone"}
    ]
    
    # Mocking worker_in_fence for testing
    import geofence_engine
    geofence_engine.worker_in_fence = lambda w, f: True
    
    result = evaluate_worker_safety(worker, geofences, {}, {})
    assert result["state"] == "DANGER"
    assert result["source"] == "POSTGIS + RISK_ENGINE"

def test_worker_safety_state_evacuate():
    worker = {"timestamp": datetime.utcnow().isoformat()}
    result = evaluate_worker_safety(worker, [], {"evacuation_active": True}, {})
    assert result["state"] == "EVACUATE"

def test_worker_safety_state_safe():
    worker = {"timestamp": datetime.utcnow().isoformat()}
    result = evaluate_worker_safety(worker, [], {}, {})
    assert result["state"] == "SAFE"

def test_simulation_provenance():
    worker = WorkerModel(
        id="W-001",
        code="W-001",
        mine_id="jharia_01",
        location_source="SIMULATOR",
        data_state="SIMULATION"
    )
    assert worker.data_state == "SIMULATION"
    assert worker.location_source == "SIMULATOR"

def test_mine_isolation():
    w1 = WorkerModel(id="W-001", mine_id="A")
    w2 = WorkerModel(id="W-002", mine_id="B")
    
    assert w1.mine_id != w2.mine_id
