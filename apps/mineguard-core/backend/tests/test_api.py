"""API smoke tests — honest endpoint contracts (no live infrastructure)."""
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_health_check():
    """/health must answer and honestly reflect configured dependencies."""
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    services = body["services"]
    # Every dependency category must be present and honestly labelled
    assert services["api"]["status"] == "healthy"
    assert services["database"]["status"] in ("healthy", "unavailable")
    assert services["redis"]["status"] in ("connected", "reconnecting", "disabled")
    assert services["mqtt"]["state"] in ("ONLINE", "DEGRADED", "OFFLINE", "RECOVERING")
    assert "model_status" in services["ml_pipeline"]
    assert services["fcm"]["status"] in ("enabled", "disabled", "unavailable")


def test_report_generation_requires_auth():
    r = client.post("/api/reports/generate", json={"report_type": "daily_safety", "data": {}})
    assert r.status_code == 401  # unauthenticated access must be rejected


def test_settings_sync_requires_auth():
    """Settings sync mutates safety thresholds — it must be authenticated."""
    r = client.post("/api/settings/sync", json={"auto_archive": True, "retention_days": 30})
    assert r.status_code == 401


def test_edge_status_reports_real_state_not_fabricated_fleet():
    r = client.get("/api/edge/status", headers={"X-API-Key": "terramesh_secure_key_2026"})
    assert r.status_code == 200
    body = r.json()
    # The fabricated "active_edge_nodes: 4" + fake ONNX list is GONE
    assert "active_edge_nodes" not in body
    assert "models_deployed" not in body
    # Honest labelling instead
    assert body["implementation_status"] == "EDGE INFERENCE SIMULATOR"
    assert body["mqtt_ingest"]["state"] in ("ONLINE", "DEGRADED", "OFFLINE", "RECOVERING")
    assert isinstance(body["inference_pipeline"]["nodes_tracked"], int)
    assert "model_loaded" in body["inference_pipeline"]


def test_readiness_and_liveness():
    assert client.get("/liveness").status_code == 200
    r = client.get("/readiness")
    assert r.status_code in (200, 503)  # depends on database availability


def test_request_id_header():
    r = client.get("/health")
    assert "x-request-id" in {k.lower() for k in r.headers.keys()}


def test_secure_headers_present():
    r = client.get("/health")
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"
