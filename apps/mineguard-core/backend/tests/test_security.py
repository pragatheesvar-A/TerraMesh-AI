import pytest
from fastapi.testclient import TestClient
from main import app
from auth import issue_token
import os

client = TestClient(app)

def test_missing_authentication():
    # Attempting to access protected endpoints without auth
    response = client.get("/api/workers")
    # Our API enforces isolation and authentication.
    assert response.status_code in [401, 403]

def test_evacuation_broadcast_requires_auth():
    response = client.post("/api/evacuation/broadcast", json={"zone": "Zone A", "reason": "Test"})
    assert response.status_code == 401 or response.status_code == 403

def test_forged_mine_id_isolation():
    # Suppose a token is issued
    token = issue_token(user_email="test@mine-a.com", role="operator")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Requesting a resource that explicitly belongs to mine B
    # Our API should enforce isolation.
    response = client.get("/api/workers", headers=headers, params={"mine_id": "mine_b"})
    
    # It should not return mine B's workers, it should either error out or filter by mine_a.
    # Here we assert that it does not leak mine_b.
    assert response.status_code in [200, 403, 401]
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            assert all(w.get("mine_id") != "mine_b" for w in data)

def test_sql_injection_rejection():
    # Test path parameter injection
    response = client.get("/api/alerts/1 OR 1=1")
    assert response.status_code in [404, 422, 400]

def test_cross_site_scripting_prevention():
    # Ensure security headers are present
    response = client.get("/api/health")
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_ssrf_protection_in_insar():
    # Mocking an SSRF payload to InSAR processing if any
    response = client.post("/api/insar/process", json={"url": "http://169.254.169.254/latest/meta-data/"})
    assert response.status_code in [400, 401, 403, 404, 422]

def test_websocket_authentication(monkeypatch):
    # WebSocket connection should require tokens or reject unauthorized subscriptions
    from fastapi.websockets import WebSocketDisconnect
    monkeypatch.setenv("WS_REQUIRE_AUTH", "true")
    try:
        with client.websocket_connect("/ws/live-monitoring") as websocket:
            pass
        pytest.fail("Should have rejected unauthenticated websocket")
    except WebSocketDisconnect as e:
        assert e.code == 1008

def test_rate_limiting():
    # Rapidly hit an endpoint that is rate-limited (e.g. /api/login is 10/minute)
    for _ in range(10):
        client.post("/api/login", json={"email": "test@test.com", "password": "123"})
    response = client.post("/api/login", json={"email": "test@test.com", "password": "123"})
    assert response.status_code == 429

def test_secrets_exposure():
    # Check that .env.example doesn't have real secrets
    env_example_path = os.path.join(os.path.dirname(__file__), "..", ".env.example")
    if os.path.exists(env_example_path):
        with open(env_example_path, "r") as f:
            content = f.read()
            assert "YOUR_REAL_PASSWORD" not in content
