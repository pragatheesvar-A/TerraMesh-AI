"""
Phase 2 — Geometry Validation Audit

Audits the database for invalid geometries using PostGIS ST_IsValid.
This test requires a live PostgreSQL/PostGIS database with seeded data.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine, text


# These tests verify the SEEDED PostGIS geometry path. Point the app at the
# seeded database when it is reachable (compose stack + seed_spatial.py);
# otherwise skip the geometry-dependent tests honestly.
_SEED_CANDIDATES = [
    "postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh",
    os.getenv("TEST_DATABASE_URL", ""),
]


def _seeded_db_available(url: str) -> bool:
    if not url.startswith("postgresql"):
        return False
    try:
        eng = create_engine(url, connect_args={"connect_timeout": 3})
        with eng.connect() as conn:
            # Check if PostGIS extension is available
            row = conn.execute(
                text("SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis'")
            ).scalar()
            if not row:
                return False
            # Check if geometry columns exist
            row = conn.execute(
                text("SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'geom'")
            ).scalar()
            return bool(row)
    except Exception:
        return False


_SEEDED_URL = next((u for u in _SEED_CANDIDATES if _seeded_db_available(u)), None)

if _SEEDED_URL and not os.getenv("DATABASE_URL", "").startswith("postgresql://terramesh"):
    os.environ["DATABASE_URL"] = _SEEDED_URL

requires_seeded_db = pytest.mark.skipif(
    _SEEDED_URL is None,
    reason="BLOCKED: seeded PostGIS database not reachable — start the compose stack and run backend/seed_spatial.py",
)


@requires_seeded_db
def test_risk_zones_geometry_valid():
    """Verify all risk zones have valid geometries."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
                FROM risk_zones
                WHERE geom IS NOT NULL
            """)
        ).fetchall()
    
    invalid_zones = [r for r in rows if not r.is_valid]
    
    if invalid_zones:
        pytest.fail(f"Invalid risk zone geometries found: {[(r.id, r.reason) for r in invalid_zones]}")


@requires_seeded_db
def test_evacuation_routes_geometry_valid():
    """Verify all evacuation routes have valid geometries."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
                FROM evacuation_routes
                WHERE geom IS NOT NULL
            """)
        ).fetchall()
    
    invalid_routes = [r for r in rows if not r.is_valid]
    
    if invalid_routes:
        pytest.fail(f"Invalid evacuation route geometries found: {[(r.id, r.reason) for r in invalid_routes]}")


@requires_seeded_db
def test_sensors_geometry_valid():
    """Verify all sensor point geometries are valid."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
                FROM sensors
                WHERE geom IS NOT NULL
            """)
        ).fetchall()
    
    invalid_sensors = [r for r in rows if not r.is_valid]
    
    if invalid_sensors:
        pytest.fail(f"Invalid sensor geometries found: {[(r.id, r.reason) for r in invalid_sensors]}")


@requires_seeded_db
def test_workers_geometry_valid():
    """Verify all worker point geometries are valid."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
                FROM workers
                WHERE geom IS NOT NULL
            """)
        ).fetchall()
    
    invalid_workers = [r for r in rows if not r.is_valid]
    
    if invalid_workers:
        pytest.fail(f"Invalid worker geometries found: {[(r.id, r.reason) for r in invalid_workers]}")


@requires_seeded_db
def test_geometry_coordinates_in_valid_range():
    """Verify geometry coordinates are within EPSG:4326 ranges."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        # Check risk zones
        rows = conn.execute(
            text("""
                SELECT id, ST_XMin(geom) as min_lng, ST_XMax(geom) as max_lng,
                       ST_YMin(geom) as min_lat, ST_YMax(geom) as max_lat
                FROM risk_zones
                WHERE geom IS NOT NULL
            """)
        ).fetchall()
    
    for r in rows:
        if not (-180 <= r.min_lng <= 180):
            pytest.fail(f"Zone {r.id} has invalid min longitude: {r.min_lng}")
        if not (-180 <= r.max_lng <= 180):
            pytest.fail(f"Zone {r.id} has invalid max longitude: {r.max_lng}")
        if not (-90 <= r.min_lat <= 90):
            pytest.fail(f"Zone {r.id} has invalid min latitude: {r.min_lat}")
        if not (-90 <= r.max_lat <= 90):
            pytest.fail(f"Zone {r.id} has invalid max latitude: {r.max_lat}")


@requires_seeded_db
def test_polygon_rings_are_closed():
    """Verify zone polygon rings are closed (first point equals last point)."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT id, polygon_json
                FROM risk_zones
                WHERE polygon_json IS NOT NULL
            """)
        ).fetchall()
    
    import json
    for r in rows:
        try:
            ring = json.loads(r.polygon_json)
            if ring and len(ring) >= 3:
                if ring[0] != ring[-1]:
                    pytest.fail(f"Zone {r.id} has unclosed polygon ring")
        except Exception as e:
            pytest.fail(f"Zone {r.id} has invalid polygon_json: {e}")


@requires_seeded_db
def test_gist_indexes_exist():
    """Verify GiST indexes exist on geometry columns."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT indexname, tablename
                FROM pg_indexes
                WHERE indexname LIKE '%_geom'
                ORDER BY tablename, indexname
            """)
        ).fetchall()
    
    expected_indexes = {
        "ix_risk_zones_geom": "risk_zones",
        "ix_evacuation_routes_geom": "evacuation_routes",
        "ix_sensors_geom": "sensors",
        "ix_workers_geom": "workers",
    }
    
    for index_name, table_name in expected_indexes.items():
        found = any(r.indexname == index_name and r.tablename == table_name for r in rows)
        if not found:
            pytest.fail(f"Expected GiST index {index_name} on table {table_name} not found")


@requires_seeded_db
def test_geometry_sync_triggers_exist():
    """Verify geometry sync triggers exist on sensors and workers tables."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT trigger_name, event_object_table
                FROM information_schema.triggers
                WHERE trigger_name LIKE '%geom%'
                ORDER BY event_object_table
            """)
        ).fetchall()
    
    expected_triggers = {
        "trg_sensors_geom": "sensors",
        "trg_workers_geom": "workers",
    }
    
    for trigger_name, table_name in expected_triggers.items():
        found = any(r.trigger_name == trigger_name and r.event_object_table == table_name for r in rows)
        if not found:
            pytest.fail(f"Expected trigger {trigger_name} on table {table_name} not found")


@requires_seeded_db
def test_geometry_sync_function_exists():
    """Verify the geometry sync function exists."""
    eng = create_engine(_SEEDED_URL)
    with eng.connect() as conn:
        row = conn.execute(
            text("""
                SELECT routine_name
                FROM information_schema.routines
                WHERE routine_name = 'terramesh_sync_point_geom'
            """)
        ).fetchone()
    
    if row is None:
        pytest.fail("Geometry sync function terramesh_sync_point_geom not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
