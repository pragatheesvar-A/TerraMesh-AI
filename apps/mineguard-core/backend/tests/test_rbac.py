"""
Phase G — backend-enforced RBAC tests.

Verifies authorization is enforced SERVER-SIDE:
  * VIEWER session tokens are rejected (403) on every sensitive endpoint
  * CONTROL_ROOM_OPERATOR can execute emergency actions but not engineering ones
  * ENGINEER can reconfigure but not trigger emergency broadcasts
  * the service API key (ADMIN) retains full access
Frontend role-hiding is irrelevant — these all run without any frontend.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402
from auth import issue_token  # noqa: E402

client = TestClient(main.app)
SERVICE_KEY = os.getenv("SECRET_KEY", "terramesh_secure_key_2026")
ADMIN = {"X-API-Key": SERVICE_KEY}


def _hdr(role: str):
    return {"X-API-Key": issue_token(f"rbac-{role.lower()}@test", role)}


SENSITIVE = [
    # (method, path, body, roles that MUST be allowed)
    ("POST", "/api/settings/sync", {"auto_archive": True, "retention_days": 30},
     ["ENGINEER", "ADMIN"]),
    ("POST", "/api/ml/retrain", {},
     ["ENGINEER", "ADMIN"]),
    ("GET", "/api/audit?limit=1", None,
     ["SAFETY_OFFICER", "CONTROL_ROOM_OPERATOR", "ENGINEER", "ADMIN"]),
    ("POST", "/api/evacuation/broadcast", {"zone": "Zone B", "message": "rbac test", "target": "all"},
     ["CONTROL_ROOM_OPERATOR", "SAFETY_OFFICER", "ADMIN"]),
]


def test_viewer_forbidden_on_all_sensitive_endpoints():
    for method, path, body, _ in SENSITIVE:
        kw = {"json": body} if body is not None else {}
        r = client.request(method, path, headers=_hdr("VIEWER"), **kw)
        assert r.status_code == 403, f"VIEWER must be 403 on {path}, got {r.status_code}"


def test_operator_can_emergency_but_not_engineering():
    # Allowed: emergency dispatch (explicit role set includes operators AND
    # safety officers — a ladder would have wrongly excluded the latter)
    r = client.post("/api/evacuation/broadcast",
                    headers=_hdr("CONTROL_ROOM_OPERATOR"),
                    json={"zone": "Zone B", "message": "rbac op", "target": "all"})
    assert r.status_code == 200, f"operator emergency failed: {r.status_code} {r.text[:100]}"
    # Forbidden: ML retraining (engineering set = ENGINEER/ADMIN only)
    r2 = client.post("/api/ml/retrain", headers=_hdr("CONTROL_ROOM_OPERATOR"))
    assert r2.status_code == 403


def test_safety_officer_can_evacuate_and_read_audit():
    r = client.post("/api/evacuation/broadcast",
                    headers=_hdr("SAFETY_OFFICER"),
                    json={"zone": "Zone B", "message": "rbac so", "target": "all"})
    assert r.status_code == 200
    r2 = client.get("/api/audit?limit=1", headers=_hdr("SAFETY_OFFICER"))
    assert r2.status_code == 200
    # ...but cannot retrain the model
    r3 = client.post("/api/ml/retrain", headers=_hdr("SAFETY_OFFICER"))
    assert r3.status_code == 403


def test_engineer_can_reconfigure_but_not_emergency_broadcast():
    r = client.post("/api/settings/sync", headers=_hdr("ENGINEER"),
                     json={"auto_archive": False, "retention_days": 30})
    assert r.status_code == 200, f"engineer settings failed: {r.status_code} {r.text[:100]}"
    r2 = client.post("/api/evacuation/broadcast", headers=_hdr("ENGINEER"),
                      json={"zone": "Zone B", "message": "x", "target": "all"})
    assert r2.status_code == 403


def test_service_key_admin_full_access():
    for method, path, body, _ in SENSITIVE:
        kw = {"json": body} if body is not None else {}
        r = client.request(method, path, headers=ADMIN, **kw)
        # NOTE: /api/ml/retrain legitimately returns 500 here — the training
        # corpus is absent in this deployment (honest failure, by design).
        assert r.status_code in (200, 202, 422, 500), \
            f"ADMIN should reach {path}, got {r.status_code} {r.text[:80]}"


def test_unauthenticated_still_401():
    r = client.post("/api/settings/sync", json={"auto_archive": True, "retention_days": 30})
    assert r.status_code == 401


def test_roles_endpoint_lists_hierarchy():
    r = client.get("/api/roles", headers=ADMIN)
    assert r.status_code == 200
    assert "ADMIN" in r.json()["roles"]
