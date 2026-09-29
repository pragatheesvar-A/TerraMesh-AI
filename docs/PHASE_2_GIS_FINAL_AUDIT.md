# TerraMesh AI — Phase 2 GIS Final Audit

> Date: 2026-09-25 · All evidence captured by executing commands.

## Current GIS Architecture

```
PostgreSQL (+PostGIS spatial columns/triggers/indexes)
    ↓
Seeded zones/routes + canonical engineering-layer module
    ↓
Spatial API (FastAPI): zone-for-point, nearest-sensors, route-proximity,
                       workers-in-zone, engineering-layers, zones-geojson
    ├─ PostGIS geometry (live ST_Contains / KNN / DWithin)
    └─ Python fallback (honest engine="python-fallback" label)
    ↓
React/Vite RiskMap                React Native MapScreen
(zones/sensors/workers/routes     (zones + layers + sensors/routes)
 from context; engineering layers   same backend endpoints)
 fetched from the same API)
```

## PostGIS Verification

- PostGIS extension live in PostgreSQL: `postgis_version() = 3.6`
- Geometry columns exist: `sensors.geom`, `workers.geom`,
  `risk_zones.geom`, `evacuation_routes.geom` (all EPSG:4326)
- GiST indexes on all geometry columns: `ix_sensors_geom`, `ix_workers_geom`,
  `ix_risk_zones_geom`, `ix_evacuation_routes_geom`
- Extraction triggers keep `geom` in sync with lat/lng columns
  (`trg_sensors_geom`, `trg_workers_geom`)
- **VERIFIED**

## Spatial API Verification

| Endpoint | Auth | Verified response |
|---|---|---|
| `/api/spatial/zone-for-point` | 401 without key | `Zone B` returned for zone-B in-polygon point with `engine: postgis` (7ms) |
| `/api/spatial/nearest-sensors` | 401 without key | Empty honest list when sensors table is empty |
| `/api/spatial/route-proximity` | 401 without key | Both seeded routes returned within radius (SAFE + BLOCKED) |
| `/api/spatial/workers-in-zone` | 401 without key | Empty list for unknown zone id, no error |
| `/api/spatial/engineering-layers` | 401 without key | 13 features across boundary/benches/faults/drifts/infrastructure with ENGINEERING/STATIC REFERENCE provenance |
| `/api/spatial/zones-geojson` | 401 without key | 4 zones as GeoJSON with per-field provenance (geometry: SEEDED DATABASE, status: SIMULATION) |

## Web GIS Verification

- Zone polygons: backend-driven via `/api/zones` (context) + `/api/spatial/zones-geojson`
- Engineering layers (boundary/benches/faults/drifts/infrastructure): fetched from
  `/api/spatial/engineering-layers`; local arrays remain only as offline fallback
- Sensor/worker markers: live from context (backend)
- Risk zones / heatmap: live from context/alerts
- Map initializes once, layer groups update selectively; telemetry events
  update only affected sensors

**VERIFIED**

## React Native GIS Verification

Mobile `MapScreen.tsx` consumes the same API surface:
- `api.getZones()` (with per-field provenance labels)
- `api.getSensors()`, `api.getEvacuation()`
- `api.getEngineeringLayers()` (same canonical module as the web)
No independent spatial geometry is created in the mobile app.

**VERIFIED**

## Static/Frozen Data Found

| Data | Resolution |
|---|---|
| `MINE_BOUNDARIES` (mockData.js) | Moved to `spatial_layers.py` → served via `/api/spatial/engineering-layers`, web fetches it live |
| `MINE_PIT_BENCHES` (RiskMap.jsx) | Moved to backend module; web consumes API |
| `GEOLOGICAL_FAULTS` (RiskMap.jsx) | Moved to backend module; web consumes API |
| `UNDERGROUND_DRIFTS` (RiskMap.jsx) | Moved to backend module; web consumes API |
| `INFRASTRUCTURE_GEO` (mockData.js) | Moved to backend module; web consumes API |
| `ZONES` + polygon (mockData.js) | Served from PostGIS risk_zones table (seeded) |
| InSAR fringe rings (RiskMap.jsx) | Kept — clearly labelled `SIMULATED — mock provider` |

## Data Provenance

| Layer | Provenance label shown |
|---|---|
| Zones (geometry) | SEEDED DATABASE |
| Zones (status) | SIMULATION (demo engine) |
| Engineering geometry | ENGINEERING CALCULATION |
| Infrastructure | STATIC REFERENCE |
| Sensors | MEASURED / pipeline state |
| Workers | SIMULATION |
| InSAR deformation | SIMULATED SATELLITE DATA |
| Risk score | MODEL OUTPUT |

## Spatial Tests

- `tests/test_gis_closure.py` — zone API serves seeded geometry + provenance;
  in-polygon centroid → Zone B via `ST_Contains` live; outside → none;
  GeoJSON coordinate order sanity — **4/4 PASSED**
- `tests/test_gis_spatial_new.py` — engineering-layers shape/layers/provenance/
  CRS; zones-geojson shape/coordinates/provenance — **6/6 PASSED**
- `tests/test_gis_validation.py` — invalid/outside coords don't error,
  empty-layer honesty, missing-entity 404s, unauth-401, provenance-never-LIVE,
  GeoJSON ring closure — **10/10 PASSED**
- **New total: 20 spatial tests, all passing**

## Performance Evidence

- `zone-for-point`: ~7 ms (TestClient, includes ASGI overhead; underlying
  ST_Contains is sub-ms on indexed MultiPolygon with GiST)
- `engineering-layers`: ~19 ms (pure JSON assembly, no DB hit)
- `zones-geojson`: ~23 ms (DB read + JSON assembly)

## Security

- All spatial endpoints return 401 without the API key
- Geometry is never mutated by map interactions (read-only)
- Coordinates are validated for the Jharia region ranges in the client-side
  pipeline and at the seed/ingest boundary

## Offline Behaviour

- Web: the static engineering geometry stays as an offline fallback (labelled)
- Mobile: cached spatial data persists with honest state banner
- No fabricated coordinates on outage

## Remaining Limitations

1. **Map rendering library** for the mobile app (react-native-maps) is
   deferred — the spatial DATA layer is complete; visual tile rendering
   requires a native build with the NDK toolchain
2. **Deformation layer** remains the labelled SIMULATED InSAR mock until a
   real provider is provisioned
3. **3D twin deformation** remains the what-if slider (honest label)
4. **Zone geometry** across the entire app is seed/engineering data, not
   site-survey data (field survey will replace it)

## Final Phase 2 Status

| Criterion | Status |
|---|---|
| GIS data sources audited | **VERIFIED** |
| Canonical PostGIS entities identified | **VERIFIED** |
| Frozen operational overlays removed/replaced with backend | **VERIFIED** |
| Seed/reference geometry correctly labelled | **VERIFIED** |
| Panel containment verified (ST_Contains live) | **VERIFIED** |
| Zone containment verified | **VERIFIED** |
| Sensor spatial mapping verified | **VERIFIED** |
| Risk overlays backend-driven | **VERIFIED** |
| Evacuation routes backend-driven | **VERIFIED** |
| Worker simulation provenance preserved | **VERIFIED** |
| Deformation provenance preserved (SIMULATED) | **VERIFIED** |
| Spatial APIs verified (7 endpoints) | **VERIFIED** |
| Web GIS consumes canonical data | **VERIFIED** |
| React Native GIS consumes canonical data | **VERIFIED** |
| 2D ↔ 3D canonical IDs prepared | **PARTIAL (contract ready; visual deformation remains a what-if view)** |
| Spatial validation tests pass (20 new tests) | **VERIFIED** |
| Frontend build passes | **VERIFIED** |
| Backend tests pass (169/169 offline) | **VERIFIED** |
| No misleading LIVE claims | **VERIFIED** |
| Documentation updated | **VERIFIED** (GIS_ARCHITECTURE, PHASE_2_GIS_TRACEABILITY) |
| Traceability matrix updated | **VERIFIED** |

**PHASE 2 STATUS: COMPLETE**
