# Database Migration Guide

## Chain

| Revision | Contents |
|---|---|
| `da6b437f9b5b` | Full initial schema (17 tables) — PostgreSQL-safe, runs on SQLite too |
| `f3c9d2e7a4b1` | PostGIS geometry columns + triggers (guarded) and TimescaleDB hypertable + compression + retention policies (guarded) |

The migrations are **idempotent and guarded**: on plain PostgreSQL or SQLite
the PostGIS/TimescaleDB steps skip with INFO logs; on the
`timescale/timescaledb-ha:pg16` image everything installs.

## Commands

```powershell
# From apps/mineguard-core/backend with DATABASE_URL pointing at PostgreSQL
$env:DATABASE_URL='postgresql://terramesh:<password>@localhost:5432/terramesh'
alembic upgrade head          # apply
alembic downgrade base        # full teardown (verified working)
alembic upgrade head          # re-apply from scratch (verified working)
```

Post-migration spatial hydration (after seeding `risk_zones` / `evacuation_routes`
with `polygon_json` / `waypoints_json`):

```sql
SELECT hydrate_zone_geometry();   -- polygon_json -> geom (MultiPolygon,4326)
SELECT hydrate_route_geometry(); -- waypoints_json -> geom (LineString,4326)
-- functions defined in infra/postgres/post_migrations.sql
```

## Verification performed (2026-09-24, this machine)

- Fresh `upgrade head` on the timescale-ha pg16 container: 17 tables created
- `telemetry` confirmed as hypertable; compression policy job (compress after
  7 days) + retention policy job (drop after 180 days) present
- `sensors/workers/risk_zones/evacuation_routes` gained geometry columns with
  GiST indexes; `ST_Contains` query executed successfully
- Full `downgrade base` → `upgrade head` cycle clean

## Notes

- Local dev may still start against SQLite (`create_all`); production refuses
  SQLite and requires PostgreSQL (`database.py`).
- `create_all` remains in `main.py` as a dev convenience — production schema
  authority is Alembic.
