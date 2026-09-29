"""
FastAPI Route Integration Test (root-level verification script)
Auth note: /api/telemetry/ingest is authenticated — the X-API-Key header is
required (matches the deployment security posture).
"""
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
AUTH = {"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")}

def test_routes():
    print("Testing /api/ml/model-info...")
    r = client.get("/api/ml/model-info", headers=AUTH)
    assert r.status_code == 200, f"Error: {r.text}"
    print(f"Model Info: {r.json()}")

    print("\nTesting /api/ml/predict...")
    r = client.post("/api/ml/predict", headers=AUTH, json={
        "node_id": "NODE-TEST-01",
        "tilt": 4.5,
        "displacement": 12.0,
        "crack_width": 6.5,
        "vibration": "HIGH",
        "battery": 85
    })
    assert r.status_code == 200, f"Error: {r.text}"
    print(f"ML Prediction Response: {r.json()}")

    print("\nTesting /api/telemetry/ingest (authenticated)...")
    r = client.post("/api/telemetry/ingest", headers=AUTH, json={
        "node_id": "NODE-017",
        "tilt": 4.8,
        "displacement": 14.5,
        "crack_width": 8.2,
        "vibration": "CRITICAL",
        "battery": 82
    })
    assert r.status_code == 200, f"Error: {r.text}"
    print(f"Telemetry Ingest Response: {r.json()}")

    print("\nTesting /api/dashboard/overview...")
    r = client.get("/api/dashboard/overview", headers=AUTH)
    assert r.status_code == 200, f"Error: {r.text}"
    print("Overview successfully returned.")

    print("\nALL FASTAPI ML ROUTE TESTS PASSED! [SUCCESS]")

if __name__ == "__main__":
    test_routes()
