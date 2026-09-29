"""
TerraMesh AI — Authentication & Authorization primitives.

Provides:
  * PBKDF2-SHA256 password hashing (stdlib hashlib — no external deps)
  * HMAC-SHA256 signed session tokens with expiry (stdlib hmac)
  * Role constants for RBAC scaffolding

Contract with the existing frontend is preserved:
  * POST /api/login still accepts {email, password} and returns {token, ...}
  * The legacy `JWT_TERRAMESH_`-prefixed demo tokens are accepted ONLY when
    ENVIRONMENT != production (demo rigs). Production requires signed tokens.
  * X-API-Key header still works for service clients.

The demo password list (admin/admin123/...) is honoured ONLY when no users
exist in the database AND ENVIRONMENT != production, and every such login is
clearly logged as a DEMO LOGIN. In production the users table is the only
authority.
"""

from __future__ import annotations
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from typing import Optional

logger = logging.getLogger("terramesh.auth")

# Roles (Phase 20 RBAC scaffolding)
ROLES = (
    "ADMIN",
    "CONTROL_ROOM_OPERATOR",
    "SAFETY_OFFICER",
    "ENGINEER",
    "SUPERVISOR",
    "VIEWER",
)

# Authorization ranks — backend-enforced (frontend role-hiding is cosmetic)
ROLE_RANK = {
    "ADMIN": 100,
    "CONTROL_ROOM_OPERATOR": 80,
    "SAFETY_OFFICER": 70,
    "ENGINEER": 60,
    "SUPERVISOR": 40,
    "VIEWER": 10,
    "service-account": 100,   # X-API-Key service calls act as ADMIN
}

TOKEN_PREFIX = "JWT_TERRAMESH_"
TOKEN_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "43200"))  # 12h default
_PBKDF2_ITERATIONS = 240_000


def get_secret() -> bytes:
    """Server secret for token signing. NEVER hardcode a production secret —
    read from env; the dev default keeps local rigs running."""
    return os.getenv("SECRET_KEY", "terramesh_secure_key_2026").encode("utf-8")


# ── Password hashing (PBKDF2-SHA256) ─────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, dk_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"),
                                 bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), dk_hex)
    except (ValueError, AttributeError):
        return False


# ── HMAC-signed session tokens ──────────────────────────────────────────────

def issue_token(user_email: str, role: str = "VIEWER") -> str:
    """Stateless signed token: base64(payload).base64(sig). Payload carries
    email, role, issued-at, expiry. Signed with the server SECRET_KEY."""
    payload = {
        "email": user_email,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
        "nonce": secrets.token_hex(8),
    }
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(get_secret(), body, hashlib.sha256).hexdigest()
    import base64
    return TOKEN_PREFIX + base64.urlsafe_b64encode(body).decode("ascii").rstrip("=") + "." + sig


def verify_token(token: str) -> Optional[dict]:
    """Returns the payload dict for a valid, unexpired, correctly-signed
    token; None otherwise."""
    if not token or not token.startswith(TOKEN_PREFIX):
        return None
    try:
        import base64
        body_b64, sig = token[len(TOKEN_PREFIX):].split(".", 1)
        # tolerate missing padding
        body = base64.urlsafe_b64decode(body_b64 + "=" * (-len(body_b64) % 4))
        expected = hmac.new(get_secret(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        payload = json.loads(body)
        if int(payload.get("exp", 0)) < time.time():
            return None
        return payload
    except Exception:
        return None


def is_legacy_demo_token(token: str) -> bool:
    """Legacy demo tokens are `JWT_TERRAMESH_<hash(email)>` — no signature
    structure. Accepted ONLY outside production."""
    rest = token[len(TOKEN_PREFIX):] if token and token.startswith(TOKEN_PREFIX) else ""
    return "." not in rest and bool(rest)


def authenticate(token_or_key: str, *, allow_legacy_demo: bool) -> Optional[dict]:
    """
    Validate an X-API-Key value (which may be the API key OR a session token).
    Returns {"kind": "api_key"|"session", "email": ..., "role": ...} or None.
    """
    if not token_or_key:
        return None

    # 1. Direct service API key
    api_key = os.getenv("SECRET_KEY", "terramesh_secure_key_2026")
    if hmac.compare_digest(token_or_key, api_key):
        return {"kind": "api_key", "email": "service-account", "role": "ADMIN"}

    # 2. Properly signed session token
    payload = verify_token(token_or_key)
    if payload:
        return {"kind": "session", "email": payload.get("email"), "role": payload.get("role", "VIEWER")}

    # 3. Legacy demo tokens (non-production only)
    if allow_legacy_demo and is_legacy_demo_token(token_or_key):
        return {"kind": "legacy_demo", "email": "demo-operator", "role": "CONTROL_ROOM_OPERATOR"}

    return None


def demo_passwords() -> list:
    """Demo rig passwords — ONLY used when no users exist AND not production."""
    return ["admin", "admin123", "mineguard2026", "terramesh2026", "password"]
