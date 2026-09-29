"""PostGIS spatial columns + TimescaleDB hypertable and policies.

This migration is PostgreSQL-ONLY. It is guarded: every step checks whether
the required extension actually exists in the target database and skips
(no-op) with an INFO log when it does not. This keeps `alembic upgrade head`
runnable on plain PostgreSQL and SQLite while enabling full spatial /
time-series behaviour on the timescale/timescaledb-ha:pg16 image (which ships
both PostGIS and TimescaleDB).

Contents:
  PostGIS (EPSG:4326 / WGS84 — see docs/POSTGIS.md):
    - sensors.geom        geometry(Point, 4326)          + GIST index
    - workers.geom        geometry(Point, 4326)          + GIST index
    - risk_zones.geom     geometry(MultiPolygon, 4326)    + GIST index
    - evacuation_routes.geom geometry(LineString, 4326)  + GIST index
    - triggers keeping geom in sync with lat/lng (sensors, workers)

  TimescaleDB:
    - telemetry → hypertable partitioned on `ts`
    - compression policy (segment_by node_id, order_by ts)
    - retention policy (default 180 days, env-configurable at deploy time)

Revision ID: f3c9d2e7a4b1
Revises: da6b437f9b5b
Create Date: 2026-09-23

"""
import logging
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

logger = logging.getLogger("terramesh.migration")

revision: str = 'f3c9d2e7a4b1'
down_revision: Union[str, Sequence[str], None] = 'da6b437f9b5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_postgres() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def _has_extension(name: str) -> bool:
    """Try to CREATE the extension; return True if it is now available."""
    bind = op.get_bind()
    try:
        bind.execute(sa.text(f'CREATE EXTENSION IF NOT EXISTS "{name}"'))
        row = bind.execute(
            sa.text("SELECT COUNT(*) FROM pg_extension WHERE extname = :n"),
            {"n": name},
        ).scalar()
        return bool(row)
    except Exception as e:
        logger.info("Extension %s unavailable (%s) — spatial/time-series features skipped", name, e)
        return False


def upgrade() -> None:
    if not _is_postgres():
        logger.info("Non-PostgreSQL target — PostGIS/TimescaleDB steps skipped (SQLite has no extension support).")
        return

    bind = op.get_bind()

    def guarded(stmt: str, label: str) -> None:
        """Execute a statement inside a SAVEPOINT so a failure cannot poison
        the surrounding migration transaction."""
        try:
            with bind.begin_nested():
                bind.execute(sa.text(stmt))
        except Exception as e:
            logger.warning("%s skipped: %s", label, e)

    # ─── PostGIS ────────────────────────────────────────────────────────────
    if _has_extension("postgis"):
        guarded("ALTER TABLE sensors ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)",
                "sensors.geom column")
        guarded(
            "UPDATE sensors SET geom = ST_SetSRID(ST_MakePoint(COALESCE(lng, 0), COALESCE(lat, 0)), 4326) "
            "WHERE geom IS NULL AND lat IS NOT NULL AND lng IS NOT NULL",
            "sensors.geom backfill")
        guarded("CREATE INDEX IF NOT EXISTS ix_sensors_geom ON sensors USING GIST (geom)",
                "sensors.geom index")

        guarded("ALTER TABLE workers ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)",
                "workers.geom column")
        guarded(
            "UPDATE workers SET geom = ST_SetSRID(ST_MakePoint(COALESCE(lng, 0), COALESCE(lat, 0)), 4326) "
            "WHERE geom IS NULL AND lat IS NOT NULL AND lng IS NOT NULL",
            "workers.geom backfill")
        guarded("CREATE INDEX IF NOT EXISTS ix_workers_geom ON workers USING GIST (geom)",
                "workers.geom index")

        # Risk zones: multipolygon column; geometry is hydrated from
        # polygon_json (GeoJSON) at seed time via
        # infra/postgres/post_migrations.sql (hydrate_zone_geometry)
        guarded("ALTER TABLE risk_zones ADD COLUMN IF NOT EXISTS geom geometry(MultiPolygon, 4326)",
                "risk_zones.geom column")
        guarded("CREATE INDEX IF NOT EXISTS ix_risk_zones_geom ON risk_zones USING GIST (geom)",
                "risk_zones.geom index")

        # Evacuation routes: linestring from waypoints_json at seed time
        guarded("ALTER TABLE evacuation_routes ADD COLUMN IF NOT EXISTS geom geometry(LineString, 4326)",
                "evacuation_routes.geom column")
        guarded("CREATE INDEX IF NOT EXISTS ix_evacuation_routes_geom ON evacuation_routes USING GIST (geom)",
                "evacuation_routes.geom index")

        # Keep point geometries in sync with lat/lng columns
        guarded("""
            CREATE OR REPLACE FUNCTION terramesh_sync_point_geom() RETURNS trigger AS $$
            BEGIN
                NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """, "terramesh_sync_point_geom()")
        guarded("DROP TRIGGER IF EXISTS trg_sensors_geom ON sensors", "sensors trigger drop")
        guarded("""
            CREATE TRIGGER trg_sensors_geom BEFORE INSERT OR UPDATE OF lat, lng
            ON sensors FOR EACH ROW EXECUTE FUNCTION terramesh_sync_point_geom()
        """, "sensors geom trigger")
        guarded("DROP TRIGGER IF EXISTS trg_workers_geom ON workers", "workers trigger drop")
        guarded("""
            CREATE TRIGGER trg_workers_geom BEFORE INSERT OR UPDATE OF lat, lng
            ON workers FOR EACH ROW EXECUTE FUNCTION terramesh_sync_point_geom()
        """, "workers geom trigger")
        logger.info("PostGIS geometry columns installed (EPSG:4326).")
    else:
        logger.info("PostGIS not available — geometry columns skipped. Spatial queries will be unavailable.")

    # ─── TimescaleDB ────────────────────────────────────────────────────────
    if _has_extension("timescaledb"):
        guarded(
            "SELECT create_hypertable('telemetry'::regclass, 'ts', if_not_exists => TRUE, migrate_data => TRUE)",
            "telemetry hypertable conversion")
        logger.info("telemetry converted to TimescaleDB hypertable on 'ts'")

        # Compression policy — compress chunks older than 7 days
        guarded(
            "ALTER TABLE telemetry SET (timescaledb.compress, "
            "timescaledb.compress_segmentby = 'node_id', timescaledb.compress_orderby = 'ts')",
            "telemetry compression setting")
        guarded(
            "SELECT add_compression_policy('telemetry'::regclass, INTERVAL '7 days', TRUE)",
            "telemetry compression policy")
        guarded(
            "SELECT add_retention_policy('telemetry'::regclass, INTERVAL '180 days', TRUE)",
            "telemetry retention policy")
    else:
        logger.info("TimescaleDB not available — telemetry remains a plain table.")


def downgrade() -> None:
    if not _is_postgres():
        return
    bind = op.get_bind()
    # TimescaleDB: revert policies + hypertable
    try:
        bind.execute(sa.text("SELECT remove_retention_policy('telemetry', if_exists => TRUE)"))
    except Exception:
        pass
    try:
        bind.execute(sa.text("SELECT remove_compression_policy('telemetry', if_exists => TRUE)"))
    except Exception:
        pass
    # PostGIS: drop geometry columns, indexes, triggers, helper function
    for tbl in ("sensors", "workers"):
        try:
            bind.execute(sa.text(f"DROP TRIGGER IF EXISTS trg_{tbl}_geom ON {tbl}"))
        except Exception:
            pass
    try:
        bind.execute(sa.text("DROP FUNCTION IF EXISTS terramesh_sync_point_geom()"))
    except Exception:
        pass
    for tbl, col in (
        ("sensors", "geom"), ("workers", "geom"),
        ("risk_zones", "geom"), ("evacuation_routes", "geom"),
    ):
        try:
            bind.execute(sa.text(f"ALTER TABLE {tbl} DROP COLUMN IF EXISTS {col}"))
        except Exception:
            pass
