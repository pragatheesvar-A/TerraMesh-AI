# PostGIS — Spatial Architecture

## Status

* **Code & migration:** COMPLETE (migration `f3c9d2e7a4b1`, seed hydration in `infra/postgres/post_migrations.sql`, query helpers in `backend/spatial.py`)
* **Runtime verification:** `BLOCKED — ENVIRONMENT NOT AVAILABLE` (no PostGIS-enabled PostgreSQL instance was reachable on this machine during this work session). `docker compose up postgres` + `alembic upgrade head` activates it.

## Coordinate Reference System

**WGS 84 (EPSG:4326), longitude/latitude decimal degrees** — used everywhere:

* JSON columns (`polygon_json`, `waypoints_json`) are GeoJSON-ordered `[lng, lat]`
* PostGIS geometry columns are declared `geometry(<SHAPE>, 4326)`
* Frontend map (Leaflet), InSAR rasters, and worker GPS share this CRS

Never store projected/ metres-based coordinates (UTM etc.) in these columns.

## Geometry columns (added by migration f3c9d2e7a4b1, PostgreSQL only)

| Table | Column | Type | Maintained by |
|---|---|---|---|
| `sensors` | `geom` | `geometry(Point, 4326)` | trigger `trg_sensors_geom` syncs from `lat`/`lng` on INSERT/UPDATE |
| `workers` | `geom` | `geometry(Point, 4326)` | trigger `trg_workers_geom` syncs from `lat`/`lng` |
| `risk_zones` | `geom` | `geometry(MultiPolygon, 4326)` | `hydrate_zone_geometry()` from `polygon_json` (idempotent) |
| `evacuation_routes` | `geom` | `geometry(LineString, 4326)` | `hydrate_route_geometry()` from `waypoints_json` |

All geometry columns have GiST indexes (`ix_*_geom`).

## Spatial operations supported

Implemented in `backend/spatial.py` — each operation uses PostGIS
(`ST_Contains`, KNN `<->` ordering, `ST_DWithin`) when available and falls
back to pure-Python ray-casting / haversine over the JSON columns otherwise
(result includes `engine: postgis | python-fallback` so provenance of the
computation is explicit):

1. **Point-in-polygon** — which risk zone contains a worker position
   (`zone_containing_point`)
2. **Workers in zone** — all workers inside a zone polygon (`workers_in_zone`)
3. **Nearest sensors (KNN)** — k closest nodes to any point (`nearest_sensors`)
4. **Evacuation route proximity** — reachable escape corridors within a radius
   (`route_proximity`)
5. **Risk-zone containment / spatial queries** — direct SQL catalogue in
   `infra/postgres/post_migrations.sql`

## Degradation behaviour

* PostgreSQL without PostGIS → geometry columns skipped at migration; the
  Python fallback path keeps all features functional (slower at scale).
* SQLite (dev) → Python fallback only.
* `/health` reports `postgis: available | unavailable` honestly.
