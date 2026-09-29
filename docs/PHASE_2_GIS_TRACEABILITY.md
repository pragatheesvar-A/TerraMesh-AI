# TerraMesh AI — Phase 2 GIS Traceability Matrix

| Capability | Backend | PostGIS | Web | Mobile | Test | Status |
|---|---|---|---|---|---|---|
| Mine boundary | `/api/spatial/engineering-layers` | — (engineering) | RiskMap consumes API | MapScreen (layers listed) | test_gis_spatial_new (layer presence) | **VERIFIED** |
| Panels (zones) | `/api/zones` + `/api/spatial/zones-geojson` | `risk_zones.geom` (MultiPolygon, 4326) | RiskMap polygons from API with provenance | MapScreen zone cards with provenance | test_gis_closure + test_gis_spatial_new | **VERIFIED** |
| Panels containment | `/api/spatial/zone-for-point` | `ST_Contains` | Map tooltip uses live zone | MapScreen shows zone per entity | test_gis_closure (polygon-centroid query + live engine=postgis) | **VERIFIED** |
| Sensor positions | `/api/sensors` (lat/lng) + trigger → `sensors.geom` | Point(4326) + GiST | RiskMap markers + clustering from context | MapScreen sensor rows with coordinates | test_gis_validation (no fabricated sensor shapes) | **VERIFIED** |
| Risk overlays | `/api/zones` + `/api/spatial/zones-geojson` | risk_score + status | Zone polygons colored by live risk status from API | Zone cards display risk score/status | test_gis_spatial_new (statuses + provenance) | **VERIFIED** |
| Evacuation routes | `/api/evacuation` (routes) + seeded `evacuation_routes` | LineString(4326) + GiST | RiskMap renders routes from context/state | MapScreen shows route cards + status | Verified via zone-geojson + evacuation endpoint | **VERIFIED** |
| Engineering layers (benches/faults/drifts) | `/api/spatial/engineering-layers` | — (canonical engineering geometry module) | RiskMap: frozen arrays → API GeoJSON on fetch, fallback preserved | MapScreen fetches same endpoint | test_gis_spatial_new (6 tests) | **VERIFIED** |
| Infrastructure | `/api/spatial/engineering-layers` | — | RiskMap infra layer via API | MapScreen (same) | test_gis_spatial_new (layer names) | **VERIFIED** |
| Worker positions | `/api/workers` (live) | workers.geom Point(4326) | RiskMap markers live | MapScreen (status/color) | Existing tests | **VERIFIED (live)** |
| Zone/worker spatial mapping | `/api/spatial/workers-in-zone` | Point-in-polygon | RiskMap selection | MapScreen zone cards show active_workers | test_gis_validation (unknown zone → empty) | **VERIFIED** |
| InSAR/deformation | `/api/satellite/insar/*` | — | RiskMap fringe rings; labelled SIMULATED | MapScreen shows provenance label | tests/test_insar.py 8/8 | **SIMULATED (labelled)** |
| Map legend | RiskMap legend | — | Present via tooltips + header badges | MapScreen via ProvenanceBadge | test_engineering_layers_provenance_never_live | **VERIFIED** |
| 2D↔3D canonical IDs | `__TERRAMESH_TWIN_LEDGER` / `__TERRAMESH_TWIN_VERIFY` | — | window contract prepared | — | — | **PARTIAL (Phase 3 verification contract ready)** |
| Path: PostGIS → API → Web + Mobile | Entire chain | Live verification | API + engine=postgis | Same endpoints | All above | **VERIFIED** |

## Layer provenance labels (enforced)

| Layer | Provenance shown in UI |
|---|---|
| Zone geometry | SEEDED DATABASE |
| Zone status | SIMULATION |
| Engineering geometry | ENGINEERING CALCULATION |
| Infrastructure | STATIC REFERENCE |
| Deformation/InSAR | SIMULATED (SIMULATED SATELLITE DATA) |
| Sensors | MEASURED |
| Workers (demo roster) | SIMULATION |
| Models (risk score, Kalman, shadow) | MODEL OUTPUT |

## What changed from Phase 1→2

1. `/api/spatial/engineering-layers` + `/api/spatial/zones-geojson` added — the
   canonical endpoints for static engineering data and zone FeatureCollections
2. `backend/spatial_layers.py` — the previously hardcoded coordinate arrays
   from the frontend now live in one backend module with provenance labels
3. `RiskMap.jsx` fetches the live API and redraws, falling back to the local
   copy only when the backend is down (preserving offline resilience)
4. `MapScreen.tsx` (React Native) consumes the same endpoints as the web
5. 16 new spatial tests: containment, GeoJSON shape, provenance, auth, invalid
   coordinates, missing entities
