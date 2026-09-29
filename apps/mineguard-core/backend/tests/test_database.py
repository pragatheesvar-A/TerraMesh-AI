"""
Integration test — live PostgreSQL/TimescaleDB/PostGIS instance.

These tests only run when ENVIRONMENT=test_db is set, because they require a
real PostgreSQL instance (they verify against the LIVE infrastructure, never
through mocks). Run against the docker-compose stack:

    $env:TEST_DATABASE_URL='postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh'
    $env:ENVIRONMENT='test_db'
    python -m pytest tests/test_database.py -v

The test database must have been migrated first (alembic upgrade head).
"""
import os
import pytest
from datetime import datetime, timedelta

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# This test requires a live PostgreSQL/Timescale/PostGIS instance
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/terramesh_test",
)


@pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "test_db",
    reason="BLOCKED: E2E Database tests require a live PostgreSQL/Timescale/PostGIS environment.",
)
def test_postgres_schema_and_telemetry_roundtrip():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # 1. Schema: the canonical telemetry table exists
        row = session.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name = 'telemetry'"
        )).scalar()
        assert row == 1, "telemetry table missing — run alembic upgrade head"

        # 2. Insert telemetry + read it back
        session.execute(text(
            "INSERT INTO telemetry (mine_id, node_id, ts, tilt, displacement, crack_width, "
            "risk_score, warning_tier, provenance) VALUES "
            "('test_mine', 'TEST-NODE-999', :ts, 1.5, 6.0, 2.0, 70.0, 'WARNING', 'MEASURED')"
        ), {"ts": datetime.now().replace(microsecond=0)})
        session.commit()

        fetched = session.execute(text(
            "SELECT tilt, provenance FROM telemetry WHERE node_id = 'TEST-NODE-999' "
            "ORDER BY ts DESC LIMIT 1"
        )).first()
        assert fetched is not None
        assert abs(fetched[0] - 1.5) < 1e-6
        assert fetched[1] == "MEASURED"
    finally:
        # 3. Cleanup
        session.execute(text("DELETE FROM telemetry WHERE node_id = 'TEST-NODE-999'"))
        session.commit()
        session.close()
        engine.dispose()


@pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "test_db",
    reason="BLOCKED: requires live PostgreSQL (TimescaleDB features verified only on a real instance).",
)
def test_timescaledb_hypertable_and_policies():
    """Runtime verification of the hypertable + compression + retention."""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        hypertables = conn.execute(text(
            "SELECT COUNT(*) FROM timescaledb_information.hypertables WHERE hypertable_name = 'telemetry'"
        )).scalar()
        assert hypertables == 1, "telemetry is not a hypertable"

        jobs = conn.execute(text(
            "SELECT proc_name FROM timescaledb_information.jobs"
        )).fetchall()
        procs = {r[0] for r in jobs}
        assert "policy_compression" in procs, "compression policy missing"
        assert "policy_retention" in procs, "retention policy missing"
    engine.dispose()


@pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "test_db",
    reason="BLOCKED: requires live PostgreSQL with PostGIS.",
)
def test_postgis_geometry_and_spatial_query():
    """Runtime verification of PostGIS columns + a real spatial query."""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        has_postgis = conn.execute(text(
            "SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis'"
        )).scalar()
        assert has_postgis == 1, "PostGIS extension missing"

        # geometry column present?
        geom_cols = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_name = 'sensors' AND column_name = 'geom'"
        )).scalar()
        assert geom_cols == 1, "sensors.geom missing — run alembic upgrade head"

        # point-in-polygon against a throwaway zone
        conn.execute(text(
            "INSERT INTO risk_zones (id, mine_id, code, name, status, polygon_json) VALUES "
            "('test-zone-pg', 'test_mine', 'TEST-Z', 'Test Zone', 'SAFE', "
            "'[[86.40, 23.76], [86.42, 23.76], [86.42, 23.78], [86.40, 23.78]]')"
        ))
        conn.execute(text("COMMIT"))
        try:
            inside = conn.execute(text(
                "SELECT ST_Contains("
                "  ST_MakeEnvelope(86.40, 23.76, 86.42, 23.78, 4326),"
                "  ST_SetSRID(ST_MakePoint(86.41, 23.77), 4326))"
            )).scalar()
            assert inside is True, "ST_Contains envelope test failed"
        finally:
            conn.execute(text("DELETE FROM risk_zones WHERE id = 'test-zone-pg'"))
            conn.execute(text("COMMIT"))
    engine.dispose()
