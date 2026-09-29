# TerraMesh AI — GIS Architecture

> **STATUS: VERIFIED** — spatial endpoints consume the seeded PostGIS
> zone/routes tables and the canonical engineering layers module; no frozen
> operational overlays are left in the frontend.

## Stack

```
                    PostgreSQL
                        │
                     PostGIS
                        │
              Canonical Spatial Data
                        │
                 Spatial API (FastAPI)
                 /                 \
                /                   \
         Web GIS (React)     React Native GIS
          RiskMap             MapScreen
```

## Canonical entities

| Entity | Storage | Geometry | Provenance |
|---|---|---|---|
| Mine boundary | spatial_layers.py (backend) | Polygon | ENGINEERING CALCULATION |
| Pit benches | spatial_layers.py | Polygon | ENGINEERING CALCULATION |
| Geological faults | spatial_layers.py | LineString | ENGINEERING CALCULATION |
| Underground drifts | spatial_layers.py | LineString | ENGINEERING CALCULATION |
| Infrastructure | spatial_layers.py | Point/LineString | STATIC REFERENCE |
| Risk zones | risk_zones table (PostGIS) | MultiPolygon(4326) | SEEDED DATABASE + status SIMULATION |
| Evacuation routes | evacuation_routes table (PostGIS) | LineString(4326) | ENGINEERING CALCULATION |
| Sensors | sensors table (lat/lng → geom via trigger) | Point(4326) | MEASURED |
| Workers | workers table (lat/lng → geom via trigger) | Point(4326) | MEASURED (SIMULATOR for demo roster) |

All spatial coordinates are **EPSG:4326 (WGS 84)**.

## Spatial API

| Endpoint | PostGIS | Purpose |
|---|---|---|
| `GET /api/spatial/zone-for-point` | `ST_Contains(zone.geom, point)` | Zone containment (web map, mobile, triage) |
| `GET /api/spatial/nearest-sensors` | `ST_Distance` + `<->` | Nearest sensor lookup |
| `GET /api/spatial/route-proximity` | `ST_DWithin()` | Reachable evacuation routes within radius |
| `GET /api/spatial/workers-in-zone` | Point-in-polygon | Workers anchored to a risk zone |
| `GET /api/spatial/engineering-layers` | — (canonical JSON module) | Boundary, benches, faults, drifts, infrastructure |
| `GET /api/spatial/zones-geojson` | — (seeded PostGIS rows → GeoJSON) | Zone FeatureCollection for the map |

When PostgreSQL/PostGIS is unavailable (SQLite dev), the same endpoints fall
back to pure-Python geometry (provenance reported honestly as
`engine: python-fallback`).

## 2D ↔ 3D entity link (prepared for Phase 3)

`window.__TERRAMESH_TWIN_LEDGER` (set by `Mine3DScene.jsx`) exposes the twin's
marker-to-backend bindings; `window.__TERRAMESH_TWIN_VERIFY()` returns a
verification report:
```js
{ panels: [], nodes: [{ twin_id, backend_id, status_3d, source, id_match }], ok } 
```
This is the shared canonical-identity contract for the 2D ↔ 3D sync.

## Live update path

WebSocket `TELEMETRY_UPDATE` messages from the pipeline update the sensor
stores in both clients. Risk zones re-render via context refresh when
`/api/zones` is re-fetched; the map never reloads whole overlapping layers
on every telemetry tick — only the sensor markers that changed are updated.

## Offline / degraded behaviour

- If the spatial API is unreachable the web map falls back to the built-in
  engineering geometry only (clearly labelled STATIC REFERENCE / ENGINEERING)
  and zones show the last-known context data.
- The mobile app preserves cached zone/sensor data and shows the honest
  offline state.
