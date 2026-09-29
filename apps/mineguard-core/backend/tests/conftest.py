import pytest
import sys
import os
from pathlib import Path

# Add backend directory to sys.path for testing
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# ── Seeded-database auto-detection (BEFORE any test imports main) ────────────
# When the seeded PostGIS risk_zones table is reachable (compose stack +
# backend/seed_spatial.py), point DATABASE_URL at it so GIS/spatial tests
# exercise the real seeded geometry path. Tests remain green on SQLite when
# it is not reachable — polygon-dependent tests skip honestly instead.
def _detect_seeded_db():
    candidates = [
        os.getenv("TEST_DATABASE_URL", ""),
        "postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh",
    ]
    for url in candidates:
        if not url.startswith("postgresql"):
            continue
        try:
            from sqlalchemy import create_engine, text
            eng = create_engine(url, connect_args={"connect_timeout": 3})
            with eng.connect() as conn:
                n = conn.execute(text(
                    "SELECT COUNT(*) FROM risk_zones WHERE polygon_json IS NOT NULL"
                )).scalar()
            if n:
                return url
        except Exception:
            continue
    return None

_SEEDED = _detect_seeded_db()
if _SEEDED:
    os.environ["DATABASE_URL"] = _SEEDED

@pytest.fixture
def mock_telemetry():
    return {
        "node_id": "NODE_TEST_01",
        "timestamp": "2024-10-24T12:00:00Z",
        "tilt": 2.5,
        "displacement": 4.0,
        "crack_width": 1.2,
        "vib_peak_g": 0.5
    }
