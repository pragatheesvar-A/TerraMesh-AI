# POSTGIS SPATIAL MODEL
## TerraMesh AI — Canonical Spatial Entity Definitions

**Version:** Phase 2  
**Coordinate Reference System:** EPSG:4326 (WGS84 longitude/latitude)  
**Geometry Standard:** GeoJSON (http://geojson.org/)

---

## OVERVIEW

The TerraMesh AI platform uses PostgreSQL with PostGIS as the canonical spatial data store. All geographic data is stored in WGS84 (EPSG:4326) coordinate reference system, matching GeoJSON, Leaflet, and Sentinel-1 InSAR rasters. PostGIS geometry columns are declared as `geometry(SHAPE, 4326)` and indexed with GiST for spatial queries.

**Principle:** Single source of truth for all spatial data. Web and mobile clients consume the same backend APIs.

---

## CANONICAL SPATIAL ENTITIES

### 1. RISK ZONES

**Table:** `risk_zones`  
**Geometry Type:** `MultiPolygon`  
**Geometry Column:** `geom` (PostGIS) + `polygon_json` (JSON fallback)  
**CRS:** EPSG:4326

**Schema:**
```sql
CREATE TABLE risk_zones (
    id VARCHAR PRIMARY KEY,
    mine_id VARCHAR NOT NULL DEFAULT 'jharia_01',
    code VARCHAR NOT NULL,
    name VARCHAR,
    status VARCHAR DEFAULT 'SAFE',
    risk_score FLOAT DEFAULT 0.0,
    subsidence_rate FLOAT DEFAULT 0.0,
    active_workers INTEGER DEFAULT 0,
    active_sensors INTEGER DEFAULT 0,
    polygon_json TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Entity Identity:**
- `id`: Canonical entity identifier (e.g., "zone-a", "zone-b")
- `mine_id`: Mine association (default: "jharia_01")
- `code`: Human-readable zone code (e.g., "Zone A", "Zone B")

**Geometry:**
- `polygon_json`: GeoJSON MultiPolygon ring (fallback for SQLite/dev)
- `geom`: PostGIS MultiPolygon geometry (PostgreSQL only)
- Storage: GeoJSON [lng, lat] coordinate order
- Validation: Ring must be closed (first point equals last point)

**Properties:**
- `status`: Operational status (SAFE, CAUTION, WARNING, CRITICAL)
- `risk_score`: Calculated risk score (0-100)
- `subsidence_rate`: Ground subsidence rate (mm/day)
- `active_workers`: Number of workers currently in zone
- `active_sensors`: Number of active sensors in zone

**Timestamp:**
- `created_at`: Zone creation timestamp
- `updated_at`: Last update timestamp

**Provenance:**
- Geometry: SEEDED DATABASE (from `seed_spatial.py`)
- Status: SEEDED DATABASE or SIMULATION (demo overlay)

**Spatial Index:** GiST index on `geom` column

**Spatial Operations:**
- Point-in-polygon: `ST_Contains(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))`
- Zone-for-point API: `/api/spatial/zone-for-point`

**Example:**
```json
{
  "id": "zone-b",
  "mine_id": "jharia_01",
  "code": "Zone B",
  "name": "Central Depillaring Section",
  "status": "CRITICAL",
  "risk_score": 87.0,
  "subsidence_rate": 4.2,
  "active_workers": 7,
  "active_sensors": 8,
  "polygon": [[86.4100, 23.7750], [86.4160, 23.7800], [86.4210, 23.7760], [86.4150, 23.7710], [86.4100, 23.7750]],
  "provenance": {
    "geometry": "SEEDED DATABASE",
    "status": "SIMULATION"
  }
}
```

---

### 2. EVACUATION ROUTES

**Table:** `evacuation_routes`  
**Geometry Type:** `LineString`  
**Geometry Column:** `geom` (PostGIS) + `waypoints_json` (JSON fallback)  
**CRS:** EPSG:4326

**Schema:**
```sql
CREATE TABLE evacuation_routes (
    id VARCHAR PRIMARY KEY,
    zone_id VARCHAR NOT NULL,
    name VARCHAR,
    status VARCHAR DEFAULT 'SAFE',
    eta_minutes FLOAT,
    waypoints_json TEXT,
    geom GEOMETRY(LineString, 4326),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Entity Identity:**
- `id`: Canonical route identifier (e.g., "route-a", "route-b")
- `zone_id`: Associated zone identifier (foreign key to `risk_zones.id`)

**Geometry:**
- `waypoints_json`: GeoJSON LineString waypoints (fallback for SQLite/dev)
- `geom`: PostGIS LineString geometry (PostgreSQL only)
- Storage: GeoJSON [lng, lat] coordinate order
- Validation: Minimum 2 waypoints required

**Properties:**
- `status`: Route status (SAFE, BLOCKED, CONGESTED)
- `eta_minutes`: Estimated time to assembly point (minutes)
- `name`: Human-readable route name

**Timestamp:**
- `updated_at`: Last update timestamp

**Provenance:**
- Geometry: SEEDED DATABASE (from `seed_spatial.py`)
- Status: SEEDED DATABASE

**Spatial Index:** GiST index on `geom` column

**Spatial Operations:**
- Route proximity: `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326), radius_m)`
- Route-proximity API: `/api/spatial/route-proximity`

**Example:**
```json
{
  "id": "route-a",
  "zone_id": "zone-b",
  "name": "Route A (Central Incline Haulage)",
  "status": "BLOCKED",
  "eta_minutes": null,
  "coordinates": [[23.7762, 86.4148], [23.7750, 86.4125], [23.7735, 86.4100], [23.7710, 86.4060]],
  "block_reason": "Roof shear collapse detected at Pillar 12-B"
}
```

---

### 3. SENSOR NODES

**Table:** `sensors`  
**Geometry Type:** `Point` (via lat/lng columns)  
**Geometry Columns:** `lat`, `lng` (scalar)  
**CRS:** EPSG:4326

**Schema:**
```sql
CREATE TABLE sensors (
    id VARCHAR PRIMARY KEY,
    name VARCHAR,
    zone VARCHAR,
    lat FLOAT,
    lng FLOAT,
    tilt FLOAT DEFAULT 0.0,
    displacement FLOAT DEFAULT 0.0,
    crack_width FLOAT DEFAULT 0.0,
    vibration VARCHAR DEFAULT 'LOW',
    battery INTEGER DEFAULT 100,
    lora_signal INTEGER DEFAULT 95,
    ai_risk_score INTEGER DEFAULT 15,
    status VARCHAR DEFAULT 'SAFE',
    last_update TIMESTAMP DEFAULT NOW()
);
```

**Entity Identity:**
- `id`: Canonical sensor identifier (e.g., "NODE-017")
- `name`: Human-readable sensor name

**Geometry:**
- `lat`: Latitude in decimal degrees (EPSG:4326)
- `lng`: Longitude in decimal degrees (EPSG:4326)
- Range: lat (-90 to 90), lng (-180 to 180)
- Validation: Both columns must be non-null for spatial operations

**Properties:**
- `zone`: Associated zone code (string reference)
- `tilt`: Tilt angle in degrees
- `displacement`: Ground displacement in mm
- `crack_width`: Crack width in mm
- `vibration`: Vibration level (LOW, MEDIUM, HIGH)
- `battery`: Battery percentage (0-100)
- `lora_signal`: LoRa signal strength (0-100)
- `ai_risk_score`: AI-calculated risk score (0-100)
- `status`: Sensor status (SAFE, WARNING, CRITICAL, OFFLINE)

**Timestamp:**
- `last_update`: Last telemetry update timestamp

**Provenance:**
- Coordinates: SEEDED DATABASE (from seed data)
- Status: MEASURED (from telemetry)

**Spatial Index:** B-tree index on `lat` and `lng` columns

**Spatial Operations:**
- Nearest sensors: KNN query on lat/lng with haversine distance
- Nearest-sensors API: `/api/spatial/nearest-sensors`

**Example:**
```json
{
  "id": "NODE-017",
  "name": "Roof Extensometer 17-B",
  "zone": "Zone B",
  "lat": 23.7762,
  "lng": 86.4148,
  "tilt": 4.8,
  "displacement": 12.4,
  "crack_width": 7.2,
  "vibration": "HIGH",
  "battery": 84,
  "lora_signal": 92,
  "ai_risk_score": 87,
  "status": "CRITICAL",
  "last_update": "2026-09-25T10:42:18Z"
}
```

---

### 4. WORKERS

**Table:** `workers`  
**Geometry Type:** `Point` (via lat/lng columns)  
**Geometry Columns:** `lat`, `lng` (scalar)  
**CRS:** EPSG:4326

**Schema:**
```sql
CREATE TABLE workers (
    id VARCHAR PRIMARY KEY,
    code VARCHAR UNIQUE,
    name VARCHAR,
    zone VARCHAR,
    lat FLOAT,
    lng FLOAT,
    status VARCHAR DEFAULT 'SAFE',
    heart_rate INTEGER DEFAULT 75,
    spo2 INTEGER DEFAULT 98,
    depth_m INTEGER DEFAULT 120,
    last_update TIMESTAMP DEFAULT NOW()
);
```

**Entity Identity:**
- `id`: Canonical worker identifier (e.g., "w-23")
- `code`: Worker code (e.g., "W-023")
- `name`: Worker name

**Geometry:**
- `lat`: Latitude in decimal degrees (EPSG:4326)
- `lng`: Longitude in decimal degrees (EPSG:4326)
- Range: lat (-90 to 90), lng (-180 to 180)
- Validation: Both columns can be null (location not always available)

**Properties:**
- `zone`: Associated zone code (string reference)
- `status`: Worker status (SAFE, DANGER, CAUTION)
- `heart_rate`: Heart rate in BPM
- `spo2': Blood oxygen saturation percentage
- `depth_m`: Depth below surface in meters

**Timestamp:**
- `last_update`: Last location update timestamp

**Provenance:**
- Coordinates: SIMULATION (from worker_location.py service)
- Hardware-ready: RFID, RTLS, UWB sources supported

**Spatial Index:** B-tree index on `lat` and `lng` columns

**Spatial Operations:**
- Workers-in-zone: Point-in-polygon via python fallback
- Workers-in-zone API: `/api/spatial/workers-in-zone`

**Worker Location Service:**
```python
# Canonical worker location ingestion
POST /api/workers/location
{
  "worker_id": "w-23",
  "location_source": "SIMULATOR",  # or RFID, RTLS, UWB, OTHER
  "lat": 23.7758,
  "lng": 86.4142,
  "zone_id": "zone-b",
  "panel_id": "panel-17b"
}
```

**Example:**
```json
{
  "id": "w-23",
  "code": "W-023",
  "name": "Amit Sen (Drill Operator)",
  "zone": "Zone B",
  "lat": 23.7758,
  "lng": 86.4142,
  "status": "DANGER",
  "heart_rate": 114,
  "spo2": 94,
  "depth_m": 142,
  "last_update": "2026-09-25T10:42:18Z",
  "provenance": "SIMULATION"
}
```

---

### 5. PANELS

**Table:** `panels`  
**Geometry Type:** NOT IMPLEMENTED (entity only)  
**Geometry Columns:** None  
**CRS:** N/A

**Schema:**
```sql
CREATE TABLE panels (
    id VARCHAR PRIMARY KEY,
    mine_id VARCHAR,
    name VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    workers_present INTEGER DEFAULT 0
);
```

**Entity Identity:**
- `id`: Canonical panel identifier (e.g., "panel-17b")
- `name`: Human-readable panel name

**Geometry:**
- Not implemented (entity identifier only)
- Future: Add `geom` column for spatial containment if needed

**Properties:**
- `status`: Panel status (ACTIVE, INACTIVE, COMPLETED)
- `workers_present`: Number of workers currently in panel

**Provenance:**
- Entity: SEEDED DATABASE

**Spatial Operations:**
- None currently (entity only)
- Future: ST_Contains for panel assignment if geometry added

**Example:**
```json
{
  "id": "panel-17b",
  "mine_id": "jharia_01",
  "name": "Panel 17-B",
  "status": "ACTIVE",
  "workers_present": 12
}
```

---

### 6. TELEMETRY (TIME-SERIES)

**Table:** `telemetry`  
**Geometry Type:** `Point` (via lat/lng columns + optional geom)  
**Geometry Columns:** `geom` (PostGIS optional)  
**CRS:** EPSG:4326

**Schema:**
```sql
CREATE TABLE telemetry (
    mine_id VARCHAR NOT NULL DEFAULT 'jharia_01',
    node_id VARCHAR NOT NULL,
    ts TIMESTAMP NOT NULL DEFAULT NOW(),
    tilt FLOAT,
    vibration FLOAT,
    displacement FLOAT,
    crack_width FLOAT,
    temperature FLOAT,
    humidity FLOAT,
    battery FLOAT,
    signal_strength FLOAT,
    risk_score FLOAT,
    warning_tier VARCHAR,
    provenance VARCHAR NOT NULL DEFAULT 'MEASURED',
    geom GEOMETRY(Point, 4326),
    PRIMARY KEY (node_id, ts)
);
```

**Entity Identity:**
- `node_id`: Sensor node identifier (foreign key to `sensors.id`)
- `ts`: Timestamp (TimescaleDB partitioning column)

**Geometry:**
- `geom`: Optional PostGIS Point geometry (PostgreSQL only)
- Fallback: lat/lng not stored in telemetry (use sensors table)

**Properties:**
- `tilt`: Tilt measurement
- `vibration`: Vibration measurement
- `displacement`: Displacement measurement
- `crack_width`: Crack width measurement
- `temperature`: Temperature measurement
- `humidity`: Humidity measurement
- `battery`: Battery level
- `signal_strength`: Signal strength
- `risk_score`: Calculated risk score
- `warning_tier`: Warning tier classification

**Provenance:**
- `provenance`: Data source (MEASURED, SIMULATED, OPERATOR ACTION)

**Spatial Index:** GiST index on `geom` column (if present)

**TimescaleDB:**
- Hypertable on `ts` column for time-series optimization
- Partitioning by time for efficient queries

**Example:**
```json
{
  "mine_id": "jharia_01",
  "node_id": "NODE-017",
  "ts": "2026-09-25T10:42:18Z",
  "tilt": 4.8,
  "vibration": 2.3,
  "displacement": 12.4,
  "crack_width": 7.2,
  "temperature": 28.5,
  "humidity": 65.2,
  "battery": 84.0,
  "signal_strength": 92.0,
  "risk_score": 87.0,
  "warning_tier": "CRITICAL",
  "provenance": "MEASURED"
}
```

---

## STATIC ENGINEERING REFERENCE LAYERS

The following layers are legitimate static engineering reference data and are NOT stored in the database. They serve as visual context for the GIS map but do not represent operational data.

### 1. MINE BOUNDARY

**Source:** Static constant in `mockData.js`  
**Purpose:** Mine lease boundary visualization  
**Geometry Type:** Polygon  
**CRS:** EPSG:4326  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Status:** Legitimate reference data, should be labeled in UI

**Coordinates:**
```javascript
[23.7820, 86.4020],
[23.7845, 86.4190],
[23.7780, 86.4250],
[23.7660, 86.4220],
[23.7640, 86.4080],
[23.7710, 86.4010]
```

### 2. PIT BENCHES

**Source:** Static constant in `RiskMap.jsx`  
**Purpose:** Mining pit bench contour visualization  
**Geometry Type:** Polygon  
**CRS:** EPSG:4326  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Status:** Legitimate reference data, should be labeled in UI

### 3. GEOLOGICAL FAULTS

**Source:** Static constant in `RiskMap.jsx`  
**Purpose:** Geological fault line visualization  
**Geometry Type:** LineString  
**CRS:** EPSG:4326  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Status:** Legitimate reference data, should be labeled in UI

### 4. UNDERGROUND DRIFTS

**Source:** Static constant in `RiskMap.jsx`  
**Purpose:** Underground tunnel network visualization  
**Geometry Type:** LineString  
**CRS:** EPSG:4326  
**Provenance:** STATIC ENGINEERING REFERENCE  
**Status:** Legitimate reference data, should be labeled in UI

---

## SPATIAL INDEX STRATEGY

### GiST Indexes (PostgreSQL)

**Purpose:** Accelerate spatial queries (ST_Contains, ST_DWithin, KNN)

**Indexes:**
```sql
CREATE INDEX idx_risk_zones_geom ON risk_zones USING GIST (geom);
CREATE INDEX idx_evacuation_routes_geom ON evacuation_routes USING GIST (geom);
CREATE INDEX idx_telemetry_geom ON telemetry USING GIST (geom);
```

**Benefits:**
- Fast point-in-polygon queries
- Fast proximity queries
- KNN (K-Nearest Neighbor) queries

### B-tree Indexes (Standard)

**Purpose:** Accelerate queries on scalar lat/lng columns

**Indexes:**
```sql
CREATE INDEX idx_sensors_lat ON sensors (lat);
CREATE INDEX idx_sensors_lng ON sensors (lng);
CREATE INDEX idx_workers_lat ON workers (lat);
CREATE INDEX idx_workers_lng ON workers (lng);
```

**Benefits:**
- Fast range queries on coordinates
- Support for haversine distance calculations

---

## COORDINATE REFERENCE SYSTEM (CRS)

### Storage CRS
- **System:** EPSG:4326 (WGS84)
- **Format:** Decimal degrees
- **Coordinate Order:** Longitude, Latitude (GeoJSON standard)
- **Range:** lng (-180 to 180), lat (-90 to 90)

### API CRS
- **System:** EPSG:4326 (WGS84)
- **Format:** GeoJSON
- **Coordinate Order:** [lng, lat]
- **Consistency:** Same as storage (no transformation needed)

### Display CRS
- **System:** EPSG:4326 (WGS84)
- **Format:** Leaflet [lat, lng] (swapped from GeoJSON)
- **Transformation:** Frontend handles GeoJSON [lng, lat] → Leaflet [lat, lng]

### Validation
- **Coordinate Range:** lng (-180 to 180), lat (-90 to 90)
- **Coordinate Order:** GeoJSON [lng, lat] validated in API
- **CRS Mixing:** Prohibited (all systems use EPSG:4326)

---

## GEOMETRY VALIDATION

### PostGIS Validation Functions

**ST_IsValid:**
```sql
SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM risk_zones
WHERE geom IS NOT NULL;
```

**ST_MakeValid:**
```sql
-- Correct invalid geometries (use with caution)
UPDATE risk_zones
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);
```

### Python Fallback Validation

**Ring Closure:**
```python
# Ensure polygon ring is closed
if ring[0] != ring[-1]:
    ring = ring + [ring[0]]
```

**Coordinate Range:**
```python
# Validate coordinate ranges
if not (-180 <= lng <= 180):
    raise ValueError(f"Longitude out of range: {lng}")
if not (-90 <= lat <= 90):
    raise ValueError(f"Latitude out of range: {lat}")
```

---

## SPATIAL API CONTRACTS

### Zone-for-Point
```
GET /api/spatial/zone-for-point?lat=23.7762&lng=86.4148&mine_id=jharia_01
```

**Response:**
```json
{
  "lat": 23.7762,
  "lng": 86.4148,
  "mine_id": "jharia_01",
  "zone": {
    "id": "zone-b",
    "code": "Zone B",
    "name": "Central Depillaring Section",
    "status": "CRITICAL",
    "risk_score": 87.0,
    "engine": "postgis"
  },
  "note": "zone geometry from the seeded risk_zones table"
}
```

### Nearest-Sensors
```
GET /api/spatial/nearest-sensors?lat=23.7762&lng=86.4148&limit=5
```

**Response:**
```json
{
  "lat": 23.7762,
  "lng": 86.4148,
  "sensors": [
    {
      "id": "NODE-017",
      "name": "Roof Extensometer 17-B",
      "zone": "Zone B",
      "distance_m": 45.2,
      "engine": "postgis"
    }
  ]
}
```

### Route-Proximity
```
GET /api/spatial/route-proximity?lat=23.7762&lng=86.4148&radius_m=50.0
```

**Response:**
```json
{
  "lat": 23.7762,
  "lng": 86.4148,
  "radius_m": 50.0,
  "routes": [
    {
      "id": "route-a",
      "zone_id": "zone-b",
      "name": "Route A (Central Incline Haulage)",
      "status": "BLOCKED",
      "distance_m": 32.5,
      "engine": "postgis"
    }
  ]
}
```

### Workers-in-Zone
```
GET /api/spatial/workers-in-zone?zone_id=zone-b
```

**Response:**
```json
{
  "zone_id": "zone-b",
  "workers": [
    {
      "id": "w-23",
      "code": "W-023",
      "name": "Amit Sen (Drill Operator)",
      "status": "DANGER"
    }
  ]
}
```

---

## DATA PROVENANCE MODEL

### Provenance Types

| Provenance | Description | Source |
|------------|-------------|--------|
| SEEDED DATABASE | Engineering geometry from seed_spatial.py | Database seed |
| MEASURED DATA | Real sensor/worker measurements | Hardware (RFID/RTLS/UWB) |
| SIMULATION | Simulated/demo data | Worker location service |
| STATIC DESIGN DATA | Static design constants | Frontend constants |
| STATIC ENGINEERING REFERENCE | Static reference geometry | Frontend constants |
| UNLABELED | Unknown source | Other/uncategorized |

### Provenance Fields

**Geometry Provenance:**
- Source of spatial geometry (seeded, measured, static)

**Status Provenance:**
- Source of operational status (database, simulation, measured)

**Timestamp Provenance:**
- When the data was last updated

---

## SPATIAL CONTAINMENT RULES

### Zone Containment

**Query:** Point-in-polygon  
**Operation:** `ST_Contains(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))`  
**Fallback:** Ray-casting point-in-polygon over polygon_json  
**Use Cases:** 
- Sensor zone assignment
- Worker zone assignment
- Alert zone filtering

### Panel Containment

**Status:** NOT IMPLEMENTED  
**Future:** Add geometry column to panels table  
**Operation:** `ST_Contains(panels.geom, sensor_geom)`  
**Use Cases:**
- Sensor panel assignment
- Worker panel assignment

### Route Proximity

**Query:** Distance-to-route  
**Operation:** `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326), radius_m)`  
**Fallback:** Minimum haversine distance to waypoints  
**Use Cases:**
- Evacuation route selection
- Route availability checking

---

## MOBILE INTEGRATION

### API Contract Alignment

Mobile app consumes the same backend APIs as web:

| Web Endpoint | Mobile Endpoint | Data Source |
|--------------|-----------------|-------------|
| `/api/zones` | `/api/zones` | risk_zones table |
| `/api/sensors` | `/api/sensors` | sensors table |
| `/api/workers` | `/api/workers` | workers table |
| `/api/evacuation` | `/api/evacuation` | evacuation_routes table |
| `/api/spatial/*` | Not used (future) | spatial.py functions |

### Mobile Map Performance

**Current:** Text list display (no map library yet)  
**Future:** react-native-maps integration  
**Optimizations:**
- Marker clustering
- Viewport-based rendering
- Selective layers
- Lazy loading
- Controlled updates

---

## OFFLINE BEHAVIOR

### Data Caching

**Current:** Last-known data displayed when offline  
**Future:** Explicit offline map caching strategy

**Behavior:**
- Display last-known map state
- Display data age
- Clearly indicate offline status
- Do not fabricate new coordinates
- Queue only safe actions
- Expose stale cached geometry state

---

## SECURITY CONSIDERATIONS

### GIS Endpoint Security

**Authentication:** API key required for all `/api/spatial/*` endpoints  
**Authorization:** RBAC checks (require_roles)  
**Audit Logging:** Location ingest logged to audit_logs table

### Worker Location Privacy

**Provenance:** Server-derived (clients cannot self-declare as MEASURED)  
**Validation:** location_source must be one of (SIMULATOR, RFID, RTLS, UWB, OTHER)  
**TTL:** Location fixes expire after 15 minutes (stale flag)

---

## FUTURE ENHANCEMENTS

### Potential Spatial Entities

1. **Faults** - Database table for dynamic fault tracking
2. **Boreholes** - Database table for borehole locations
3. **Assembly Points** - Database table for evacuation assembly points
4. **Infrastructure** - Database table for surface infrastructure

### Potential Spatial Operations

1. **Panel Containment** - ST_Contains for panel assignment
2. **Buffer Queries** - ST_Buffer for proximity zones
3. **Intersection Queries** - ST_Intersects for overlapping areas
4. **Spatial Joins** - ST_DWithin for multi-entity proximity

---

## REFERENCES

- **PostGIS Documentation:** https://postgis.net/documentation/
- **GeoJSON Specification:** http://geojson.org/
- **EPSG:4326:** https://epsg.io/4326
- **Leaflet CRS:** https://leafletjs.com/reference.html#map-crs
- **TimescaleDB:** https://docs.timescale.com/

---

**Document Status:** Phase 2 Complete  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
