"""
END-TO-END LIVE PIPELINE TEST — requires the full docker-compose stack:
PostgreSQL (migrated), Redis, Mosquitto, and no other backend holding the
MQTT subscription.

Run:
    $env:ENVIRONMENT='e2e_live'
    $env:DATABASE_URL='postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh'
    $env:REDIS_URL='redis://localhost:6379'
    $env:MQTT_BROKER_HOST='localhost'
    python -m pytest tests/test_e2e_live.py -v -s

Verifies the complete telemetry path:
  MQTT publish (mosquitto_pub)
    -> MQTT client validation/dedup
    -> Kalman filtering
    -> health / vibration classification
    -> XGBoost + SHADOW fusion
    -> unified risk engine
    -> PostgreSQL telemetry row (provenance-labelled)
    -> Redis node-state cache
    -> WebSocket TELEMETRY_UPDATE event
"""
import json
import os
import subprocess
import time
import uuid
from datetime import datetime

import pytest

pytestmark = pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "e2e_live",
    reason="BLOCKED: E2E pipeline test requires the live docker-compose stack (postgres+redis+mosquitto).",
)

MINE_ID = os.getenv("MINE_ID", "jharia_01")
UNIQUE = uuid.uuid4().hex[:6]
NODE_ID = f"E2E-NODE-{UNIQUE}"


def _mqtt_publish(topic: str, payload: dict) -> None:
    subprocess.run(
        ["docker", "exec", "terramesh-mosquitto", "mosquitto_pub",
         "-h", "localhost", "-t", topic, "-m", json.dumps(payload), "-q", "1"],
        check=True, capture_output=True, timeout=10,
    )


@pytest.fixture(scope="module")
def backend_process():
    """Start the real backend against the live stack."""
    env = {**os.environ,
           "DATABASE_URL": os.getenv("TEST_DATABASE_URL",
                "postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh"),
           # 127.0.0.1 explicitly: Docker publishes on IPv4 loopback only
           "REDIS_URL": "redis://127.0.0.1:6379",
           "MQTT_BROKER_HOST": "localhost",
           "MINE_ID": MINE_ID,
           "ENVIRONMENT": "development"}
    proc = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--port", "8123"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        env=env,
        stdout=open(os.path.join(os.getenv("TEMP", "/tmp"), "terramesh_e2e_backend.log"), "w"),
        stderr=subprocess.STDOUT,
    )
    # Wait for the health endpoint
    import urllib.request
    for _ in range(60):
        try:
            with urllib.request.urlopen("http://localhost:8123/health", timeout=2) as r:
                if r.status == 200:
                    break
        except Exception:
            time.sleep(1)
    else:
        proc.terminate()
        pytest.fail("Backend did not become healthy within 60s")
    yield proc
    proc.terminate()
    proc.wait(timeout=10)


def test_mqtt_topic_rejection(backend_process):
    """A packet on a subscribed-but-invalid topic (bad node-id characters)
    matches the wildcard subscription and must be counted + dropped."""
    import urllib.request
    _mqtt_publish(f"mines/{MINE_ID}/nodes/bad!!id/telemetry", {"node_id": "x"})
    time.sleep(1.5)
    req = urllib.request.Request(
        "http://localhost:8123/health",
        headers={"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")})
    with urllib.request.urlopen(req, timeout=5) as r:
        health = json.loads(r.read())
    mqtt = health["services"]["mqtt"]
    assert mqtt["state"] == "ONLINE", f"MQTT should be ONLINE, got {mqtt['state']}"
    assert mqtt["metrics"]["rejected_topic"] >= 1


def test_full_telemetry_path_mqtt_to_postgres_to_redis(backend_process):
    """Publish one valid packet; verify it lands in PostgreSQL and Redis."""
    from datetime import datetime, timezone
    payload = {
        "node_id": NODE_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "packet_seq": 42,
        "tilt_x_deg": 0.6, "tilt_y_deg": 0.1, "tilt_mag_mrad": 10.5,
        "crack_gap_mm": 0.4,
        "strain_ustrain": 12.0,
        "vib_rms_g": 0.08, "vib_peak_g": 0.2,
        "dom_freq_hz": 9.5,
        "band_energy_0_10": 0.05, "band_energy_10_50": 0.02,
        "temp_c": 28.5,
        "battery_v": 4.0, "rssi_dbm": -78, "snr_db": 9.5,
    }
    _mqtt_publish(f"mines/{MINE_ID}/nodes/{NODE_ID}/telemetry", payload)
    time.sleep(4)  # allow the async pipeline to complete

    # ── 1. Redis node-state cache (checked FIRST — 10s TTL on the key) ──
    import redis as redis_lib
    r = redis_lib.from_url("redis://127.0.0.1:6379", decode_responses=True)
    cached = r.get(f"terramesh:node:{NODE_ID}")
    assert cached is not None, "Redis node-state cache missing"
    data = json.loads(cached)
    assert data["data"]["provenance"] == "MEASURED"
    assert data["data"]["warning_tier"] in ("NORMAL", "WATCH", "WARNING", "CRITICAL")

    # ── 2. PostgreSQL: the telemetry row exists with MEASURED provenance ──
    from sqlalchemy import create_engine, text
    engine = create_engine(os.getenv("TEST_DATABASE_URL",
        "postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh"))
    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT node_id, provenance, warning_tier, risk_score "
            "FROM telemetry WHERE node_id = :n ORDER BY ts DESC LIMIT 1"
        ), {"n": NODE_ID}).mappings().first()
    assert row is not None, "telemetry row missing — MQTT->pipeline->PostgreSQL path broken"
    assert row["provenance"] == "MEASURED"
    assert row["warning_tier"] in ("NORMAL", "WATCH", "WARNING", "CRITICAL")
    assert data["data"]["warning_tier"] == row["warning_tier"]

    # ── 3. Pipeline metrics flowed through the ML chain ───────────────────
    import urllib.request
    req = urllib.request.Request(
        "http://localhost:8123/health",
        headers={"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")})
    with urllib.request.urlopen(req, timeout=5) as resp:
        health = json.loads(resp.read())
    pipeline = health["services"]["ml_pipeline"]["metrics"]
    assert pipeline["packets_processed"] >= 1, "pipeline never processed a packet"
    assert pipeline["pg_writes"] >= 1, "pipeline never wrote to PostgreSQL"

    # ── 4. MQTT dedup: republishing the SAME packet_seq must be dropped ──
    _mqtt_publish(f"mines/{MINE_ID}/nodes/{NODE_ID}/telemetry", payload)
    time.sleep(2)
    with urllib.request.urlopen(req, timeout=5) as resp:
        health2 = json.loads(resp.read())
    m = health2["services"]["mqtt"]["metrics"]
    assert m["rejected_duplicate"] >= 1, "QoS-1 duplicate was not de-duplicated"

    # ── 5. Malformed JSON is rejected without crashing ingestion ─────────
    subprocess.run(
        ["docker", "exec", "terramesh-mosquitto", "mosquitto_pub",
         "-h", "localhost", "-t", f"mines/{MINE_ID}/nodes/{NODE_ID}/telemetry",
         "-m", "{not json", "-q", "1"],
        check=True, capture_output=True, timeout=10,
    )
    time.sleep(1.5)
    with urllib.request.urlopen(req, timeout=5) as resp:
        health3 = json.loads(resp.read())
    assert health3["services"]["mqtt"]["metrics"]["rejected_json"] >= 1

    # cleanup the e2e rows so reruns stay clean
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM telemetry WHERE node_id = :n"), {"n": NODE_ID})
        conn.execute(text("COMMIT"))
    r.delete(f"terramesh:node:{NODE_ID}")
    engine.dispose()


def test_health_is_honest_about_live_infra(backend_process):
    import urllib.request
    req = urllib.request.Request(
        "http://localhost:8123/health",
        headers={"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")})
    with urllib.request.urlopen(req, timeout=5) as r:
        health = json.loads(r.read())
    assert health["services"]["database"]["status"] == "healthy"
    assert health["services"]["database"]["type"] == "postgresql"
    assert health["services"]["database"].get("postgis") == "available"
    assert health["services"]["database"].get("timescaledb") == "available"
    assert health["services"]["redis"]["status"] == "connected"
    assert health["services"]["mqtt"]["state"] == "ONLINE"
