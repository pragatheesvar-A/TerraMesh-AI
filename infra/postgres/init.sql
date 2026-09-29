-- TerraMesh AI — PostgreSQL bootstrap
--
-- This file runs on FIRST container initialization only (docker-entrypoint-initdb.d).
-- It enables extensions; the schema itself is created by Alembic
-- (backend/alembic/versions/da6b437f9b5b + f3c9d2e7a4b1).
--
-- Image: timescale/timescaledb-ha:pg16-latest  (ships TimescaleDB + PostGIS)

-- 1. PostGIS — spatial types and queries (EPSG:4326)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. TimescaleDB — hypertables, compression, retention
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- NOTE: Tables, geometry columns, hypertable conversion, compression and
-- retention policies are all created by Alembic migrations. Run:
--   alembic upgrade head
-- See docs/DATABASE_MIGRATION.md and docs/TIMESCALEDB.md.
