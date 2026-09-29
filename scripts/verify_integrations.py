#!/usr/bin/env python3
"""
TerraMesh AI — External Integration Verifier
==============================================
Reports the TRUE state of every external integration: CONFIGURED (and
connectivity-checked where possible) or BLOCKED (with the exact env vars
missing). Never fabricates a working state.

Run from the backend directory:
    python ../../scripts/verify_integrations.py
"""
from __future__ import annotations
import os
import socket
import sys

# Allow running from repo root or backend dir
for candidate in (
    os.path.join(os.path.dirname(__file__), "..", "apps", "mineguard-core", "backend"),
    os.path.join(os.path.dirname(__file__), "..", ".."),
):
    if os.path.isdir(os.path.abspath(candidate)):
        sys.path.insert(0, os.path.abspath(candidate))
        break

RESULTS = []


def report(name: str, configured: bool, detail: str, env_vars: list = None) -> None:
    RESULTS.append({
        "integration": name,
        "state": "CONFIGURED" if configured else "BLOCKED",
        "detail": detail,
        "missing_env": env_vars or [],
    })


def tcp_probe(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def main() -> int:
    # 1. PostgreSQL / TimescaleDB / PostGIS
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgresql"):
        from urllib.parse import urlparse
        u = urlparse(db_url)
        reachable = tcp_probe(u.hostname or "localhost", u.port or 5432)
        report("PostgreSQL (DATABASE_URL)", reachable,
              f"{u.hostname}:{u.port or 5432} reachable={reachable}" if reachable
              else "unreachable — start the compose stack",
              [] if db_url else ["DATABASE_URL"])
    elif db_url.startswith("sqlite"):
        report("PostgreSQL", False,
              "SQLite dev fallback in use — production requires PostgreSQL",
              ["DATABASE_URL=postgresql://..."])
    else:
        report("PostgreSQL", False, "no DATABASE_URL configured", ["DATABASE_URL"])

    # 2. Redis
    redis_url = os.getenv("REDIS_URL", "")
    if redis_url:
        from urllib.parse import urlparse
        u = urlparse(redis_url)
        reachable = tcp_probe(u.hostname or "127.0.0.1", u.port or 6379)
        report("Redis", reachable,
              f"{redis_url} reachable={reachable}" if reachable
              else "configured but unreachable",
              [] if reachable else [])
    else:
        report("Redis", False, "REDIS_URL empty — in-memory fallback active",
              ["REDIS_URL=redis://127.0.0.1:6379"])

    # 3. MQTT broker
    mqtt_host = os.getenv("MQTT_BROKER_HOST", "localhost")
    mqtt_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    reachable = tcp_probe(mqtt_host, mqtt_port)
    report("MQTT broker", reachable,
          f"{mqtt_host}:{mqtt_port} reachable={reachable}")
    tls = os.getenv("MQTT_USE_TLS", "false").lower() == "true"
    if not tls:
        print("    note: MQTT_USE_TLS=false — production should enable TLS + auth")

    # 4. FCM
    fcm_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    if not fcm_path:
        report("FCM push", False,
              "no FIREBASE_CREDENTIALS_PATH — push delivery disabled (never fabricated)",
              ["FIREBASE_CREDENTIALS_PATH"])
    elif not os.path.isfile(fcm_path):
        report("FCM push", False,
              f"credentials file not found at {fcm_path}",
              [])
    else:
        report("FCM push", True, f"credentials file present ({fcm_path})")

    # 5. SMS gateway
    if os.getenv("SMS_GATEWAY_URL") and os.getenv("SMS_GATEWAY_USER"):
        report("SMS gateway (SMSGate)", True, os.getenv("SMS_GATEWAY_URL"))
    elif os.getenv("FAST2SMS_API_KEY"):
        report("SMS gateway (Fast2SMS)", True, "FAST2SMS_API_KEY set")
    else:
        report("SMS gateway", False,
              "no gateway configured — dispatches labelled SIMULATED DISPATCH",
              ["SMS_GATEWAY_URL", "SMS_GATEWAY_USER", "SMS_GATEWAY_PASS",
               "or FAST2SMS_API_KEY"])

    # 6. Email (SMTP)
    if os.getenv("SMTP_HOST"):
        reachable = tcp_probe(os.getenv("SMTP_HOST"),
                              int(os.getenv("SMTP_PORT", "587")), timeout=4)
        report("Email (SMTP)", reachable,
              f"{os.getenv('SMTP_HOST')}:{os.getenv('SMTP_PORT', '587')} reachable={reachable}")
        if not os.getenv("ALERT_EMAIL_TO"):
            print("    note: ALERT_EMAIL_TO empty — no recipients even with SMTP")
    else:
        report("Email (SMTP)", False, "no SMTP_HOST",
              ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD",
               "SMTP_FROM", "ALERT_EMAIL_TO"])

    # 7. InSAR
    provider = os.getenv("INSAR_PROVIDER", "mock")
    if provider == "mock":
        report("InSAR provider", False,
              "INSAR_PROVIDER=mock (SIMULATED SATELLITE DATA) — set 'sentinel' + credentials for live",
              ["INSAR_PROVIDER=sentinel", "COP_USER", "COP_PASSWORD",
               "+ a SNAP/ISCE processing stack (see docs/INTEGRATIONS.md §4)"])
    elif provider in ("sentinel", "nisar"):
        if os.getenv("COP_USER") and os.getenv("COP_PASSWORD"):
            report(f"InSAR provider ({provider})", True,
                   "credentials present — processing stack still required (docs/INTEGRATIONS.md §4)")
        else:
            report(f"InSAR provider ({provider})", False,
                   "provider selected but credentials missing",
                   ["COP_USER", "COP_PASSWORD"])
    else:
        report("InSAR provider", False, f"unknown provider {provider!r}",
              ["INSAR_PROVIDER=mock|sentinel|nisar"])

    # 8. Production secret guard
    sk = os.getenv("SECRET_KEY", "")
    if sk == "terramesh_secure_key_2026" or not sk:
        report("SECRET_KEY strength", False,
               "dev default / unset — production refuses to start with it",
               ["SECRET_KEY=<openssl rand -hex 32>"])
    else:
        report("SECRET_KEY strength", True, "custom secret configured")

    # ── Output ─────────────────────────────────────────────────────────────
    print("\nTERRAMESH AI — INTEGRATION STATUS (honest)")
    print("=" * 60)
    blocked = 0
    for r in RESULTS:
        icon = "[CONFIGURED]" if r["state"] == "CONFIGURED" else "[BLOCKED]   "
        print(f"{icon} {r['integration']}: {r['detail']}")
        if r["missing_env"]:
            print(f"             missing: {', '.join(r['missing_env'])}")
        if r["state"] == "BLOCKED":
            blocked += 1
    print("=" * 60)
    print(f"{len(RESULTS) - blocked} configured, {blocked} blocked")
    print("Blocked integrations are code-complete; see docs/INTEGRATIONS.md")
    print("for the exact provisioning steps.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
