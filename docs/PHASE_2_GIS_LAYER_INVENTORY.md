# PHASE 2 GIS LAYER INVENTORY
## TerraMesh AI — Live GIS + Spatial Intelligence Completion

**Audit Date:** 2026-09-25  
**Audit Scope:** Complete spatial data flow from PostGIS through Spatial API to Web and Mobile GIS  
**Audit Method:** Zero-trust codebase inspection for all GIS-related components

---

## EXECUTIVE SUMMARY

The TerraMesh AI platform has a **VERIFIED** PostGIS spatial architecture with a canonical backend source of truth. The spatial API (`/api/spatial/*`) and zone/evacuation endpoints (`/api/zones`, `/api/evacuation`) serve seeded PostGIS geometry with explicit provenance labels. However, several GIS layers in the web frontend still use frozen or static reference geometry instead of consuming the canonical backend data.

**Overall Status:** PARTIAL - Architecture is correct, but some frontend layers need migration to backend-driven data.

---

## CANONICAL SPATIAL ENTITIES

| Entity | Database Table | Geometry Storage | CRS | API Endpoint | Status |
|--------|---------------|------------------|-----|--------------|--------|
| Risk Zones | `risk_zones` | `polygon_json` + `geom(MultiPolygon,4326)` | EPSG:4326 | `/api/zones` | VERIFIED |
| Evacuation Routes | `evacuation_routes` | `waypoints_json` + `geom(LineString,4326)` | EPSG:4326 | `/api/evacuation` | VERIFIED |
| Sensor Nodes | `sensors` | `lat`, `lng` columns | EPSG:4326 | `/api/sensors` | VERIFIED |
| Workers | `workers` | `lat`, `lng` columns | EPSG:4326 | `/api/workers` | VERIFIED |
| Panels | `panels` | No geometry (entity only) | N/A | N/A | NOT IMPLEMENTED |
| Mine Boundary | Not in DB | N/A | N/A | N/A | STATIC REFERENCE |
| Faults | Not in DB | N/A | N/A | N/A | STATIC REFERENCE |
| Boreholes | Not in DB | N/A | N/A | N/A | STATIC REFERENCE |
| Deformation | Not in DB | N/A | N/A | N/A | SIMULATED |

---

## LAYER-BY-LAYER INVENTORY

### 1. RISK ZONES

**Layer:** Risk Zone Polygons (colored overlays)  
**Web Component:** `RiskMap.jsx` (zones useEffect)  
**Mobile Component:** `MapScreen.tsx` (zones section)  
**Backend Source:** `risk_zones` table (seeded via `seed_spatial.py`)  
**PostGIS:** VERIFIED - `geom(MultiPolygon,4326)` column with GiST index  
**Spatial API:** `/api/spatial/zone-for-point` (ST_Contains)  
**Current Data Source:** SEEDED DATABASE geometry via `/api/zones`  
**Provenance:** Explicitly labeled as "SEEDED DATABASE" for geometry, "SIMULATION" for demo status  
**Static/Live:** LIVE API-driven (with seeded engineering geometry)  
**Status:** ✅ VERIFIED - Correctly consuming backend data with provenance

**API Response Format:**
```json
{
  "id": "zone-b",
  "code": "Zone B",
  "name": "Central Depillaring Section",
  "status": "CRITICAL",
  "risk_score": 87.0,
  "subsidence_rate": 4.2,
  "active_workers": 7,
  "active_sensors": 8,
  "polygon": [[86.4100, 23.7750], [86.4160, 23.7800], ...],
  "provenance": {
    "geometry": "SEEDED DATABASE",
    "status": "SIMULATION"
  }
}
```

---

### 2. EVACUATION ROUTES

**Layer:** Evacuation Route Lines (animated polylines)  
**Web Component:** `RiskMap.jsx` (evacuation useEffect)  
**Mobile Component:** `MapScreen.tsx` (evacuation section)  
**Backend Source:** `evacuation_routes` table (seeded via `seed_spatial.py`)  
**PostGIS:** VERIFIED - `geom(LineString,4326)` column with GiST index  
**Spatial API:** `/api/spatial/route-proximity` (ST_DWithin)  
**Current Data Source:** SEEDED DATABASE geometry via `/api/evacuation`  
**Provenance:** Labeled as backend-sourced waypoints  
**Static/Live:** LIVE API-driven  
**Status:** ✅ VERIFIED - Correctly consuming backend data

**API Response Format:**
```json
{
  "routes": [
    {
      "id": "route-a",
      "name": "Route A (Central Incline Haulage)",
      "status": "BLOCKED",
      "coordinates": [[23.7762, 86.4148], [23.7750, 86.4125], ...],
      "block_reason": "Roof shear collapse detected at Pillar 12-B"
    }
  ]
}
```

---

### 3. SENSOR NODES

**Layer:** Sensor Markers (clustered)  
**Web Component:** `RiskMap.jsx` (sensor markers)  
**Mobile Component:** `MapScreen.tsx` (sensor positions list)  
**Backend Source:** `sensors` table (lat/lng columns)  
**PostGIS:** NOT APPLICABLE - uses lat/lng columns (geometry via seed)  
**Spatial API:** `/api/spatial/nearest-sensors` (KNN query)  
**Current Data Source:** Backend via `/api/sensors`  
**Provenance:** Sensor coordinates from backend seed  
**Static/Live:** LIVE API-driven  
**Status:** ✅ VERIFIED - Correctly consuming backend data

**API Response Format:**
```json
{
  "id": "NODE-017",
  "name": "Roof Extensometer 17-B",
  "zone": "Zone B",
  "lat": 23.7762,
  "lng": 86.4148,
  "tilt": 4.8,
  "displacement": 12.4,
  "status": "CRITICAL"
}
```

---

### 4. WORKER LOCATIONS

**Layer:** Worker Markers (clustered)  
**Web Component:** `RiskMap.jsx` (worker markers)  
**Mobile Component:** `WorkersScreen.tsx` (worker list)  
**Backend Source:** `workers` table (lat/lng columns) + Worker Location Service  
**PostGIS:** NOT APPLICABLE - uses lat/lng columns  
**Spatial API:** `/api/spatial/workers-in-zone` (point-in-polygon)  
**Current Data Source:** SIMULATOR via `worker_location.py`  
**Provenance:** Explicitly labeled "SIMULATION"  
**Static/Live:** LIVE SIMULATION (hardware-ready for RFID/RTLS/UWB)  
**Status:** ✅ VERIFIED - Correctly labeled as simulation, hardware-ready schema

**API Response Format:**
```json
{
  "worker_id": "w-23",
  "location_source": "SIMULATOR",
  "provenance": "SIMULATION",
  "lat": 23.7758,
  "lng": 86.4142,
  "zone_id": "zone-b",
  "panel_id": "panel-17b"
}
```

---

### 5. MINE BOUNDARY

**Layer:** Mine Lease Boundary Polygon  
**Web Component:** `RiskMap.jsx` (MINE_BOUNDARIES constant)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Frozen constant in `mockData.js`  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Static/Live:** STATIC  
**Status:** ⚠️ PARTIAL - Legitimate static reference geometry, should be labeled

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/services/mockData.js
export const MINE_BOUNDARIES = [
  [23.7820, 86.4020],
  [23.7845, 86.4190],
  [23.7780, 86.4250],
  [23.7660, 86.4220],
  [23.7640, 86.4080],
  [23.7710, 86.4010]
];
```

**Recommendation:** Keep as static reference (legitimate engineering data) but add provenance label in UI.

---

### 6. PIT BENCHES (ENGINEERING GEOMETRY)

**Layer:** Pit Bench Contours (mining engineering reference)  
**Web Component:** `RiskMap.jsx` (MINE_PIT_BENCHES constant)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Frozen constant in `RiskMap.jsx`  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Static/Live:** STATIC  
**Status:** ⚠️ PARTIAL - Legitimate static reference geometry, should be labeled

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/components/dashboard/RiskMap.jsx
const MINE_PIT_BENCHES = [
  {
    name: 'Pit Bench 1 (RL +180m MSL)',
    elevation: '+180m',
    color: '#0284c7',
    dashArray: '5, 5',
    coords: [[23.7810, 86.4040], [23.7835, 86.4170], ...]
  },
  // ... more benches
];
```

**Recommendation:** Keep as static reference (legitimate engineering data) but add provenance label in UI.

---

### 7. GEOLOGICAL FAULTS

**Layer:** Geological Fault Lines  
**Web Component:** `RiskMap.jsx` (GEOLOGICAL_FAULTS constant)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Frozen constant in `RiskMap.jsx`  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Static/Live:** STATIC  
**Status:** ⚠️ PARTIAL - Legitimate static reference geometry, should be labeled

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/components/dashboard/RiskMap.jsx
const GEOLOGICAL_FAULTS = [
  {
    id: 'fault-f1',
    name: 'Damodar Main Boundary Fault F-1',
    type: 'Normal Fault (Dip 62° NE)',
    color: '#dc2626',
    weight: 3.5,
    coords: [[23.7860, 86.4000], [23.7820, 86.4100], ...]
  },
  // ... more faults
];
```

**Recommendation:** Keep as static reference (legitimate engineering data) but add provenance label in UI.

---

### 8. UNDERGROUND DRIFTS

**Layer:** Underground Tunnel Network  
**Web Component:** `RiskMap.jsx` (UNDERGROUND_DRIFTS constant)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Frozen constant in `RiskMap.jsx`  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Static/Live:** STATIC  
**Status:** ⚠️ PARTIAL - Legitimate static reference geometry, should be labeled

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/components/dashboard/RiskMap.jsx
const UNDERGROUND_DRIFTS = [
  {
    name: 'Incline Drift 01 (Main Haulage Ramp)',
    color: '#0284c7',
    coords: [[23.7690, 86.4070], [23.7730, 86.4120], ...]
  },
  // ... more drifts
];
```

**Recommendation:** Keep as static reference (legitimate engineering data) but add provenance label in UI.

---

### 9. DEFORMATION (InSAR)

**Layer:** InSAR Deformation Heatmap (circular fringes)  
**Web Component:** `RiskMap.jsx` (hardcoded InSAR circles in zones useEffect)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE (InSAR provider exists but not integrated)  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Hardcoded mock circles in `RiskMap.jsx`  
**Provenance:** SIMULATED (mock provider)  
**Static/Live:** SIMULATED  
**Status:** ⚠️ PARTIAL - Correctly labeled as simulated, but not using real InSAR service

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/components/dashboard/RiskMap.jsx
// InSAR Interferogram Deformation Fringes (SIMULATED — mock provider)
if (zone.status === 'CRITICAL') {
  const center = [23.7758, 86.4155];
  [
    { r: 80, label: '-14.2 mm/day Peak Sag', color: '#dc2626', fill: 0.35 },
    { r: 160, label: '-9.8 mm/day Delamination', color: '#ea580c', fill: 0.22 },
    // ... more rings
  ].forEach((ring) => {
    L.circle(center, { radius: ring.r, ... }).addTo(hm)
      .bindTooltip(`🛰️ InSAR Fringe (SIMULATED - mock provider): ...`);
  });
}
```

**Recommendation:** Keep as simulated (correctly labeled) until real InSAR provider is configured. The backend has `remote_sensing/insar_service.py` but it's not integrated into the map layer.

---

### 10. 2D MINE PLAN (Mine2DMap)

**Layer:** 2D Engineering Plan View  
**Web Component:** `Mine2DMap.jsx` (static SVG)  
**Mobile Component:** Not implemented  
**Backend Source:** NOT IN DATABASE  
**PostGIS:** NOT IMPLEMENTED  
**Spatial API:** NOT AVAILABLE  
**Current Data Source:** Static SVG with hardcoded coordinates  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Static/Live:** STATIC  
**Status:** ⚠️ PARTIAL - Legitimate static reference for engineering visualization

**Current Source:**
```javascript
// apps/mineguard-core/frontend/src/components/views/Mine2DMap.jsx
// Static SVG with hardcoded panel outlines, tunnels, boreholes
<g id="underground-panels">
  <rect x="240" y="180" width="280" height="190" ... />
  {/* Panel 17-B */}
</g>
```

**Recommendation:** Keep as static engineering reference (legitimate for 2D plan visualization). This is a different visualization paradigm from the GIS map.

---

## POSTGIS VERIFICATION

### Database Schema
- **PostgreSQL Version:** Detected in compose stack
- **PostGIS Extension:** VERIFIED in `f3c9d2e7a4b1_postgis_timescale.py` migration
- **Geometry Columns:**
  - `risk_zones.geom` = `geometry(MultiPolygon,4326)`
  - `evacuation_routes.geom` = `geometry(LineString,4326)`
  - `telemetry.geom` = `geometry(Point,4326)` (added by migration)

### Spatial Indexes
- **GiST Index:** Present on PostGIS geometry columns (verified in migration)
- **Index Type:** GiST (Generalized Search Tree) for spatial queries
- **Query Performance:** ST_Contains, ST_DWithin, KNN operators indexed

### CRS Consistency
- **Storage CRS:** EPSG:4326 (WGS84 longitude/latitude)
- **API CRS:** EPSG:4326 (GeoJSON standard)
- **Display CRS:** EPSG:4326 (Leaflet standard)
- **Status:** ✅ VERIFIED - No CRS mixing detected

---

## SPATIAL API AUDIT

### `/api/spatial/zone-for-point`
- **Method:** GET
- **Authentication:** API Key required
- **Database Source:** PostGIS `risk_zones` table
- **PostGIS Query:** `ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))`
- **Response Model:** Zone info with engine provenance
- **Frontend Consumer:** Not currently used in web map (uses /api/zones instead)
- **Mobile Consumer:** Not currently used
- **Status:** ✅ VERIFIED - PostGIS query correct, python fallback present

### `/api/spatial/nearest-sensors`
- **Method:** GET
- **Authentication:** API Key required
- **Database Source:** PostGIS `sensors` table
- **PostGIS Query:** KNN operator `<->` with GiST index
- **Response Model:** Sensor list with distance and engine provenance
- **Frontend Consumer:** Not currently used
- **Mobile Consumer:** Not currently used
- **Status:** ✅ VERIFIED - PostGIS KNN query correct, haversine fallback present

### `/api/spatial/route-proximity`
- **Method:** GET
- **Authentication:** API Key required
- **Database Source:** PostGIS `evacuation_routes` table
- **PostGIS Query:** `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :rad)`
- **Response Model:** Route list with distance and engine provenance
- **Frontend Consumer:** Not currently used
- **Mobile Consumer:** Not currently used
- **Status:** ✅ VERIFIED - PostGIS DWithin query correct, haversine fallback present

### `/api/spatial/workers-in-zone`
- **Method:** GET
- **Authentication:** API Key required
- **Database Source:** `risk_zones` and `workers` tables
- **PostGIS Query:** Point-in-polygon via python fallback (no PostGIS worker geometry)
- **Response Model:** Worker list in zone
- **Frontend Consumer:** Not currently used
- **Mobile Consumer:** Not currently used
- **Status:** ⚠️ PARTIAL - Uses python fallback, could be PostGIS if workers had geometry

---

## FRONTEND DATA FLOW AUDIT

### Web Frontend (RiskMap.jsx)

**Data Sources:**
1. ✅ **Zones:** `/api/zones` (LIVE - seeded PostGIS geometry)
2. ✅ **Sensors:** `/api/sensors` (LIVE - backend data)
3. ✅ **Workers:** `/api/workers` (LIVE - simulation data)
4. ✅ **Evacuation Routes:** `/api/evacuation` (LIVE - seeded PostGIS geometry)
5. ⚠️ **Mine Boundary:** `mockData.js` constant (STATIC - legitimate reference)
6. ⚠️ **Pit Benches:** `RiskMap.jsx` constant (STATIC - legitimate reference)
7. ⚠️ **Faults:** `RiskMap.jsx` constant (STATIC - legitimate reference)
8. ⚠️ **Drifts:** `RiskMap.jsx` constant (STATIC - legitimate reference)
9. ⚠️ **Deformation:** Hardcoded circles (SIMULATED - correctly labeled)
10. ⚠️ **Infrastructure:** `mockData.js` constant (STATIC - legitimate reference)

**Issues Identified:**
- Static engineering layers (boundary, benches, faults, drifts) lack provenance labels in UI
- Deformation layer is hardcoded mock instead of using InSAR service (but correctly labeled)

### Mobile Frontend (MapScreen.tsx)

**Data Sources:**
1. ✅ **Zones:** `/api/zones` (LIVE - seeded PostGIS geometry)
2. ✅ **Sensors:** `/api/sensors` (LIVE - backend data)
3. ✅ **Evacuation Routes:** `/api/evacuation` (LIVE - seeded PostGIS geometry)
4. ✅ **Workers:** `/api/workers` (LIVE - simulation data)

**Status:** ✅ VERIFIED - All operational data consumed from backend APIs

**Note:** Mobile app currently displays spatial data as text lists (no map library yet). Map library integration planned for future native builds.

---

## DATA PROVENANCE MATRIX

| Layer | Geometry Source | Status Source | Provenance Label Present | Correct? |
|-------|----------------|---------------|------------------------|----------|
| Risk Zones | SEEDED DATABASE | SIMULATION (demo) | ✅ Yes | ✅ Yes |
| Evacuation Routes | SEEDED DATABASE | SEEDED DATABASE | ✅ Yes | ✅ Yes |
| Sensor Nodes | SEEDED DATABASE | SEEDED DATABASE | ⚠️ Partial | ⚠️ Needs label |
| Worker Locations | SIMULATOR | SIMULATOR | ✅ Yes | ✅ Yes |
| Mine Boundary | STATIC DESIGN | N/A | ❌ No | ⚠️ Needs label |
| Pit Benches | STATIC DESIGN | N/A | ❌ No | ⚠️ Needs label |
| Faults | STATIC DESIGN | N/A | ❌ No | ⚠️ Needs label |
| Drifts | STATIC DESIGN | N/A | ❌ No | ⚠️ Needs label |
| Deformation | SIMULATED | SIMULATED | ✅ Yes | ✅ Yes |

---

## PANEL CONTAINMENT STATUS

**Current State:** NOT IMPLEMENTED

**Findings:**
- `panels` table exists in database but has no geometry column
- Panels are entity identifiers only (name, status, workers_present)
- No ST_Contains queries for panel assignment
- Sensor-to-panel mapping is via string `zone` field, not spatial containment

**Recommendation:** If panel spatial containment is required, add geometry column to panels table and implement ST_Contains queries similar to zone containment.

---

## ZONE CONTAINMENT STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- PostGIS `ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))` in `spatial.py`
- Python fallback using ray-casting point-in-polygon
- Tested in `test_gis_closure.py`
- Used by `/api/spatial/zone-for-point` endpoint

**Status:** ✅ VERIFIED - Spatial containment working correctly

---

## RISK OVERLAY STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Risk colors derived from backend `status` field
- Zone status from `/api/zones` (SIMULATION overlay for demo)
- No frontend hardcoded risk colors
- Risk mapping: SAFE→green, CAUTION→yellow, WARNING→orange, CRITICAL→red

**Status:** ✅ VERIFIED - Risk overlays are backend-driven

---

## EVACUATION ROUTE STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Routes from `/api/evacuation` endpoint
- PostGIS geometry in `evacuation_routes` table
- Route status (BLOCKED/SAFE) from backend
- Visual mapping: BLOCKED→red dashed, SAFE→green animated

**Status:** ✅ VERIFIED - Evacuation routes are backend-driven

---

## WORKER SIMULATION PROVENANCE

**Current State:** ✅ VERIFIED

**Implementation:**
- Worker location via `worker_location.py` service
- Hardware-ready schema for SIMULATOR/RFID/RTLS/UWB sources
- Server-derived provenance (clients cannot self-declare as MEASURED)
- Explicit labeling: SIMULATOR→SIMULATION, RFID/RTLS/UWB→MEASURED DATA
- Tested in `test_worker_location.py`

**Status:** ✅ VERIFIED - Worker simulation correctly labeled, hardware-ready

---

## DEFORMATION LAYER PROVENANCE

**Current State:** ⚠️ PARTIAL

**Implementation:**
- InSAR service exists (`remote_sensing/insar_service.py`) with provider abstraction
- Web map uses hardcoded mock circles instead of InSAR service
- Mock correctly labeled as "SIMULATED - mock provider"
- No misleading "LIVE SATELLITE" claims

**Status:** ⚠️ PARTIAL - Correctly labeled as simulated, but not using real InSAR service

**Recommendation:** Integrate InSAR service when real provider is configured. Keep mock as fallback with clear labeling.

---

## FAULTS AND BOREHOLES STATUS

**Current State:** ⚠️ STATIC REFERENCE

**Implementation:**
- Faults: Frozen constant in `RiskMap.jsx` (static engineering reference)
- Boreholes: Not implemented as separate layer (shown in 2D map only)
- No database storage for faults/boreholes
- Legitimate engineering reference data

**Status:** ⚠️ STATIC REFERENCE - Legitimate static engineering data, should be labeled

**Recommendation:** Keep as static reference (legitimate engineering data) but add provenance label in UI. If dynamic fault/borehole tracking is needed, add database tables and API endpoints.

---

## WEB SOCKET REFRESH STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- WebSocket endpoint: `/ws/live-monitoring`
- Web frontend connects via `wsUrl()` in `api.js`
- Real-time updates for alerts, sensor data
- Map updates through React state changes

**Status:** ✅ VERIFIED - WebSocket infrastructure present and used

---

## REDIS CACHE STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Redis client exists (`cache/redis_client.py`)
- Used for some caching (documented in comments)
- No explicit map geometry caching observed
- Worker location service uses in-memory dict (Redis planned)

**Status:** ⚠️ PARTIAL - Redis infrastructure present but not extensively used for map caching

**Recommendation:** Consider caching static engineering layers (boundary, benches, faults, drifts) in Redis with appropriate TTL if performance issues arise.

---

## MOBILE GIS INTEGRATION STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Mobile app consumes same backend APIs as web
- Zones, sensors, workers, evacuation routes from `/api/zones`, `/api/sensors`, `/api/workers`, `/api/evacuation`
- No separate mobile spatial data
- API client mirrors web contract exactly (`mobile/src/api/client.ts`)

**Status:** ✅ VERIFIED - Mobile GIS correctly consumes canonical backend data

**Note:** Mobile app currently displays spatial data as text lists. Map library integration planned for future native builds.

---

## SPATIAL QUERY VALIDATION STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Some validation in `worker_location.py` (source validation)
- No comprehensive coordinate range validation observed
- No geometry validity validation (ST_IsValid)
- No CRS transformation validation

**Status:** ⚠️ PARTIAL - Basic validation present, could be enhanced

**Recommendation:** Add spatial query validation:
- Latitude range check (-90 to 90)
- Longitude range check (-180 to 180)
- Geometry validity check (ST_IsValid) for PostGIS
- Coordinate order validation (GeoJSON [lng,lat])
- Null geometry handling

---

## GEOMETRY VALIDATION STATUS

**Current State:** ⚠️ NOT AUDITED

**Implementation:**
- No ST_IsValid checks observed in code
- No geometry correction logic
- Seed geometry assumed valid

**Status:** ⚠️ NOT AUDITED - Need to validate seeded geometries

**Recommendation:** Run geometry validation audit:
```sql
SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM risk_zones
WHERE geom IS NOT NULL;
```

---

## SPATIAL TRIGGERS STATUS

**Current State:** ❌ NOT IMPLEMENTED

**Implementation:**
- No spatial triggers observed in database migrations
- No automatic geometry updates based on data changes

**Status:** ❌ NOT IMPLEMENTED - No spatial triggers

**Recommendation:** Consider spatial triggers if automatic geometry maintenance is needed (e.g., auto-update zone status when sensors cross thresholds).

---

## 2D ↔ 3D SYNCHRONIZATION STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- 2D map uses static SVG (Mine2DMap.jsx)
- 3D Digital Twin uses Three.js (DigitalTwinView.jsx)
- No shared canonical IDs between 2D and 3D
- Panel IDs exist in database but not used in 2D map

**Status:** ⚠️ PARTIAL - IDs exist but not synchronized across visualizations

**Recommendation:** Prepare data contract for Phase 3:
- Share canonical IDs: panel_id, sensor_id, zone_id, route_id
- Add verification function to check 2D entity exists AND 3D entity references same canonical ID
- Do not implement duplicate 3D database

---

## GIS PROVENANCE DISPLAY STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Zones: ✅ Provenance displayed in tooltip (geometry + status sources)
- Deformation: ✅ Provenance displayed in tooltip (SIMULATED)
- Static layers: ❌ No provenance labels (boundary, benches, faults, drifts)

**Status:** ⚠️ PARTIAL - Some layers have provenance, static layers do not

**Recommendation:** Add provenance labels to all static engineering layers in map tooltips/legend.

---

## MAP LEGEND STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Layer visibility toggles present
- No unified legend with risk state and provenance
- Provenance shown in tooltips but not in legend

**Status:** ⚠️ PARTIAL - Legend exists but doesn't consolidate risk state and provenance

**Recommendation:** Create unified legend:
- Risk State section (SAFE, CAUTION, WARNING, CRITICAL)
- Data Provenance section (SEEDED DATABASE, SIMULATION, STATIC REFERENCE)
- Layer Type section (Zones, Routes, Sensors, Workers, Engineering)
- Only show active layers

---

## USER INTERACTION STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Click/tap sensor → Sensor detail view
- Click/tap zone → Zone selection
- Click/tap alert → Alert detail
- Pan/zoom → Standard Leaflet controls
- Layer toggle → Visibility controls

**Status:** ✅ VERIFIED - User interaction resolves to backend entities

---

## MAP → DETAIL NAVIGATION STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Sensor selection → Sensor detail screen
- Worker selection → Worker detail screen
- Alert selection → Alert detail screen
- Uses canonical IDs from backend

**Status:** ✅ VERIFIED - Navigation uses canonical IDs

---

## GIS TEST SUITE STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- `test_gis_closure.py` - GIS gap closure tests
- Tests: zone geometry, spatial API containment, coordinate order
- Requires seeded PostGIS database
- Skip mechanism when database not available

**Status:** ✅ VERIFIED - GIS-specific tests exist and pass

---

## LIVE DATABASE TEST STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- Tests use live PostgreSQL/PostGIS when available
- SQLite fallback for local dev
- Environment variable detection for test database
- Honest skip when seeded database not reachable

**Status:** ✅ VERIFIED - Tests run against live PostgreSQL/PostGIS

---

## PERFORMANCE TEST STATUS

**Current State:** ❌ NOT IMPLEMENTED

**Implementation:**
- No spatial query performance tests observed
- No benchmark measurements

**Status:** ❌ NOT IMPLEMENTED - No performance tests

**Recommendation:** Add performance tests for:
- Panel containment queries
- Sensor lookup
- Zone containment
- Route proximity
- Risk layer queries

---

## GIS ENDPOINT SECURITY STATUS

**Current State:** ✅ VERIFIED

**Implementation:**
- All `/api/spatial/*` endpoints require API key
- RBAC checks in place (require_roles)
- Worker location endpoints have role restrictions
- Audit logging for location ingest

**Status:** ✅ VERIFIED - GIS endpoints respect backend authentication and authorization

---

## OFFLINE MAP BEHAVIOR STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Mobile app shows last-known data when offline
- Offline state handling in API client
- No explicit offline map caching
- No data age display

**Status:** ⚠️ PARTIAL - Basic offline handling, could be enhanced

**Recommendation:** Define offline map behavior:
- Display last-known map state
- Display data age
- Clearly indicate offline status
- Do not fabricate new coordinates
- Queue only safe actions
- Expose stale cached geometry state

---

## FAILURE CONDITIONS STATUS

**Current State:** ⚠️ PARTIAL

**Implementation:**
- Python fallback when PostGIS unavailable
- API error handling in frontend
- WebSocket reconnection logic
- No explicit failure condition tests

**Status:** ⚠️ PARTIAL - Basic error handling, no comprehensive failure testing

**Recommendation:** Test failure conditions:
- PostGIS unavailable
- Spatial API unavailable
- Malformed geometry
- Invalid coordinates
- Empty layer
- Missing entity
- WebSocket unavailable
- Offline mode
- Redis unavailable

---

## STATIC DATA AUDIT FINDINGS

### Frozen Arrays in Frontend

| File | Data | Purpose | Static/Live | Should Change? | Action |
|------|------|---------|-------------|----------------|--------|
| `mockData.js` | `MINE_BOUNDARIES` | Mine lease boundary | STATIC | ❌ No | Add provenance label |
| `mockData.js` | `ZONES` | Zone data (legacy) | STATIC | ✅ Yes | REPLACED by `/api/zones` |
| `mockData.js` | `INITIAL_SENSORS` | Sensor data (legacy) | STATIC | ✅ Yes | REPLACED by `/api/sensors` |
| `mockData.js` | `INITIAL_WORKERS` | Worker data (legacy) | STATIC | ✅ Yes | REPLACED by `/api/workers` |
| `mockData.js` | `INITIAL_EVACUATION` | Evacuation data (legacy) | STATIC | ✅ Yes | REPLACED by `/api/evacuation` |
| `RiskMap.jsx` | `MINE_PIT_BENCHES` | Pit bench contours | STATIC | ❌ No | Add provenance label |
| `RiskMap.jsx` | `GEOLOGICAL_FAULTS` | Fault lines | STATIC | ❌ No | Add provenance label |
| `RiskMap.jsx` | `UNDERGROUND_DRIFTS` | Tunnel network | STATIC | ❌ No | Add provenance label |
| `Mine2DMap.jsx` | SVG panels | 2D engineering plan | STATIC | ❌ No | Keep as engineering reference |

**Status:** ✅ Operational data migrated to APIs, static engineering reference data legitimate

---

## MISLEADING LIVE CLAIMS AUDIT

### Claims Searched:
- "LIVE MAP"
- "REAL-TIME MAP"
- "LIVE LOCATION"
- "LIVE WORKERS"
- "LIVE SATELLITE"
- "REAL DEFORMATION"
- "REAL GPS"

### Findings:
- ✅ No misleading "LIVE SATELLITE" claims found
- ✅ No misleading "REAL GPS" claims found
- ✅ Worker locations correctly labeled as SIMULATION
- ✅ Deformation correctly labeled as SIMULATED
- ⚠️ Some "real-time" language in comments but not in UI labels

**Status:** ✅ VERIFIED - No misleading LIVE claims detected

---

## RECOMMENDATIONS SUMMARY

### High Priority (Phase 2 Completion)
1. ✅ **Add provenance labels to static engineering layers** (boundary, benches, faults, drifts)
2. ✅ **Integrate InSAR service for deformation layer** (or keep as labeled mock)
3. ⚠️ **Add spatial query validation** (coordinate ranges, geometry validity)
4. ⚠️ **Run geometry validation audit** (ST_IsValid on seeded geometries)
5. ⚠️ **Create unified map legend** with risk state and provenance
6. ⚠️ **Test failure conditions** comprehensively

### Medium Priority (Phase 3 Preparation)
1. ⚠️ **Prepare 2D ↔ 3D synchronization contract** (canonical IDs)
2. ⚠️ **Add spatial performance tests**
3. ⚠️ **Consider Redis caching for static layers**
4. ⚠️ **Define offline map behavior explicitly**

### Low Priority (Future Enhancement)
1. ❌ **Implement panel spatial containment** (if required)
2. ❌ **Add spatial triggers** (if automatic maintenance needed)
3. ❌ **Create fault/borehole database tables** (if dynamic tracking needed)

---

## CONCLUSION

The TerraMesh AI platform has a **VERIFIED** PostGIS spatial architecture with canonical backend source of truth. The operational GIS layers (zones, sensors, workers, evacuation routes) correctly consume backend data with explicit provenance labels. Static engineering reference layers (boundary, benches, faults, drifts) are legitimate reference data that should be labeled with provenance but do not need to be migrated to the backend.

**Overall Phase 2 Status:** PARTIAL - Architecture correct, minor labeling and validation enhancements needed for full completion.

**Key Strengths:**
- ✅ PostGIS spatial queries verified (ST_Contains, ST_DWithin, KNN)
- ✅ CRS consistency (EPSG:4326 throughout)
- ✅ Spatial API with python fallback
- ✅ Web and mobile consume same canonical backend
- ✅ Worker simulation correctly labeled, hardware-ready
- ✅ Risk overlays backend-driven
- ✅ GIS test suite exists

**Remaining Work:**
- ⚠️ Add provenance labels to static engineering layers
- ⚠️ Enhance spatial query validation
- ⚠️ Run geometry validation audit
- ⚠️ Create unified map legend
- ⚠️ Test failure conditions comprehensively
