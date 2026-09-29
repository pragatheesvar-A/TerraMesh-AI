# PHASE 3 TWIN COORDINATE SYSTEM DOCUMENTATION
## TerraMesh AI — Digital Twin Coordinate Transformations

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

The TerraMesh AI platform uses a multi-tier coordinate system architecture. The canonical spatial source is PostgreSQL/PostGIS with EPSG:4326 (WGS84). The 3D Digital Twin uses Three.js world coordinates for visualization only. This document describes the coordinate transformation pipeline and explicitly classifies each coordinate system.

---

## COORDINATE SYSTEM HIERARCHY

```
Real World (Survey-Grade)
         ↓
PostgreSQL/PostGIS (EPSG:4326)
         ↓
Spatial API (GeoJSON [lng, lat])
         ↓
Frontend Canonical State (EPSG:4326)
         ↓
Visualization Transformation
         ↓
Three.js World Coordinates (VISUALIZATION ONLY)
```

---

## CANONICAL SOURCE: POSTGIS (EPSG:4326)

### Database CRS

**Coordinate Reference System:** EPSG:4326 (WGS84)  
**Datum:** WGS84  
**Units:** Decimal degrees  
**Coordinate Order:** Longitude (x), Latitude (y)  
**SRID:** 4326

### Geometry Columns

- `sensors.geom` = `geometry(Point, 4326)`
- `workers.geom` = `geometry(Point, 4326)`
- `risk_zones.geom` = `geometry(MultiPolygon, 4326)`
- `evacuation_routes.geom` = `geometry(LineString, 4326)`

### Coordinate Range

- **Latitude:** -90 to +90 degrees
- **Longitude:** -180 to +180 degrees

### Coordinate Order

**GeoJSON Standard:** `[longitude, latitude]`  
**PostGIS ST_MakePoint:** `ST_MakePoint(longitude, latitude)`

**Example:**
```sql
-- Correct coordinate order
ST_SetSRID(ST_MakePoint(86.4245, 23.6543), 4326)
--                   ^^^^^^^  ^^^^^^^
--                   lng      lat
```

---

## SPATIAL API CONTRACT

### API Response Format

**Coordinate System:** EPSG:4326  
**Coordinate Order:** `[longitude, latitude]` (GeoJSON standard)

**Example Sensor Response:**
```json
{
  "id": "NODE-001",
  "lat": 23.6543,
  "lng": 86.4245,
  "depth_m": -145.0,
  "geometry": {
    "type": "Point",
    "coordinates": [86.4245, 23.6543]
  }
}
```

**Example Zone Response:**
```json
{
  "id": "ZONE-001",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [86.4245, 23.6543],
        [86.4255, 23.6543],
        [86.4255, 23.6553],
        [86.4245, 23.6553],
        [86.4245, 23.6543]
      ]
    ]
  }
}
```

---

## FRONTEND CANONICAL STATE

### Storage Format

**Coordinate System:** EPSG:4326  
**Coordinate Order:** Separate `lat` and `lng` fields (degrees)

**Example:**
```javascript
{
  id: "NODE-001",
  lat: 23.6543,  // Latitude (degrees)
  lng: 86.4245,  // Longitude (degrees)
  depth_m: -145.0  // Elevation (meters)
}
```

### Validation

**Latitude Range:** -90 to +90 degrees  
**Longitude Range:** -180 to +180 degrees  
**Elevation Units:** Meters (MSL or relative to surface)

---

## THREE.JS WORLD COORDINATES (VISUALIZATION ONLY)

### Classification

**Purpose:** Visualization only  
**Survey Grade:** NO  
**Operational Use:** NO  
**Classification:** VISUALIZATION ONLY

### Coordinate System

**Origin:** Arbitrary (0, 0, 0) at scene center  
**Units:** Arbitrary Three.js units (not meters)  
**Axis Orientation:** 
- X: East-West (arbitrary scale)
- Y: Up-Down (arbitrary scale, inverted from real-world)
- Z: North-South (arbitrary scale)

### Procedural Layout

The 3D scene uses a **procedural layout** for visualization purposes. This is **not** a survey-grade coordinate system.

**Example Procedural Coordinates:**
```javascript
// Panel 17-B (procedural position)
panel17.position.set(-6, -12.5, 2);
//                   ^^^^^^^^^^^^^^^^^^^^
//                   Arbitrary Three.js units
```

**NOT equivalent to:**
```javascript
// Real-world survey coordinates
latitude: 23.6543
longitude: 86.4245
elevation: -145.0
```

---

## COORDINATE TRANSFORMATION PIPELINE

### Current Implementation (Phase 3)

**Status:** DETERMINISTIC TRANSFORMATION NOT YET IMPLEMENTED

**Planned Transformation:**
1. **Source:** EPSG:4326 (PostGIS)
2. **Intermediate:** Visualization-local coordinates (relative to mine center)
3. **Target:** Three.js world coordinates

**Transformation Steps:**

```javascript
// Step 1: Define mine center reference point
const MINE_CENTER = {
  lat: 23.6543,  // Jharia Basin reference
  lng: 86.4245,
  elevation: 0.0
};

// Step 2: Convert EPSG:4326 to local meters (simplified)
function latLngToMeters(lat, lng, centerLat, centerLng) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLng = (lng - centerLng) * Math.PI / 180;
  
  const latRad = centerLat * Math.PI / 180;
  
  const x = R * dLng * Math.cos(latRad);
  const y = R * dLat;
  
  return { x, y };
}

// Step 3: Apply visualization scaling
const VISUALIZATION_SCALE = 0.01; // 1 meter = 0.01 Three.js units

function metersToThreeJs(x, y, z) {
  return {
    x: x * VISUALIZATION_SCALE,
    y: z * VISUALIZATION_SCALE,  // Invert Z for Three.js Y
    z: -y * VISUALIZATION_SCALE // Invert Y for Three.js Z
  };
}

// Step 4: Full transformation
function epsg4326ToThreeJs(lat, lng, elevation) {
  const localMeters = latLngToMeters(lat, lng, MINE_CENTER.lat, MINE_CENTER.lng);
  const threeJsCoords = metersToThreeJs(localMeters.x, localMeters.y, elevation);
  return threeJsCoords;
}
```

### Current Implementation (Procedural)

**Status:** PROCEDURAL LAYOUT (not based on real coordinates)

**Implementation:**
```javascript
// Mine3DScene.jsx - procedural positions
const sensorPositions = [
  { id: 'S-17B-01', x: -6, y: -11.0, z: 2 },  // Arbitrary Three.js units
  { id: 'BH-04-EXT', x: -12, y: -7.0, z: 4 },
  // ...
];
```

**Provenance:** `PROCEDURAL • SIMULATION`  
**Classification:** VISUALIZATION ONLY  
**Survey Grade:** NO

---

## COORDINATE TRANSFORMATION LIMITATIONS

### Precision Limitations

**EPSG:4326:** ~1 meter precision at mine scale  
**Local Meters:** ~0.1 meter precision  
**Three.js Units:** Arbitrary (not survey-grade)

### Transformation Errors

**Current:** N/A (procedural layout)  
**Planned:** Estimated error < 5% at visualization scale

### Vertical Exaggeration

**Current:** Not documented  
**Planned:** Document explicitly if used

**Example:**
```javascript
const VERTICAL_EXAGGERATION = 2.0; // Visualization only
const threeJsY = elevation * VISUALIZATION_SCALE * VERTICAL_EXAGGERATION;
```

---

## COORDINATE SYSTEM SUMMARY TABLE

| System | CRS | Units | Coordinate Order | Survey Grade | Classification |
|--------|-----|-------|------------------|--------------|----------------|
| PostGIS | EPSG:4326 | Degrees | [lng, lat] | YES | CANONICAL SOURCE |
| Spatial API | EPSG:4326 | Degrees | [lng, lat] | YES | CANONICAL |
| Frontend State | EPSG:4326 | Degrees | lat, lng fields | YES | CANONICAL |
| Local Meters | Cartesian | Meters | x, y, z | NO | INTERMEDIATE |
| Three.js World | Arbitrary | Arbitrary units | x, y, z | NO | VISUALIZATION ONLY |

---

## PROVENANCE LABELING

### Coordinate Source Labels

**PostGIS (EPSG:4326):**
- Label: `POSTGIS • MEASURED`
- Survey Grade: YES
- Operational Use: YES

**Backend (EPSG:4326):**
- Label: `BACKEND • MEASURED`
- Survey Grade: YES
- Operational Use: YES

**Procedural Three.js:**
- Label: `PROCEDURAL • SIMULATION`
- Survey Grade: NO
- Operational Use: NO

**Simulation/What-If:**
- Label: `SIMULATION • WHAT-IF`
- Survey Grade: NO
- Operational Use: NO

---

## CONVERSION UTILITY FUNCTIONS

### Utility File Location

`frontend/src/services/coordinateTransform.js` (to be created)

### Planned Functions

```javascript
/**
 * Convert EPSG:4326 to Three.js world coordinates.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} elevation - Elevation in meters
 * @returns {Object} Three.js coordinates {x, y, z}
 */
export function epsg4326ToThreeJs(lat, lng, elevation) {
  // Implementation planned
}

/**
 * Convert Three.js world coordinates to EPSG:4326.
 * 
 * @param {number} x - Three.js X coordinate
 * @param {number} y - Three.js Y coordinate
 * @param {number} z - Three.js Z coordinate
 * @returns {Object} EPSG:4326 coordinates {lat, lng, elevation}
 */
export function threeJsToEpsg4326(x, y, z) {
  // Implementation planned
}

/**
 * Validate EPSG:4326 coordinates.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {Object} Validation result {valid, errors}
 */
export function validateEpsg4326(lat, lng) {
  // Implementation planned
}
```

---

## DESIGN DECISIONS

### Why EPSG:4326 as Canonical Source?

1. **Standard:** WGS84 is the global standard for GPS and mapping
2. **Compatibility:** Works with all mapping libraries (Leaflet, Google Maps, etc.)
3. **PostGIS:** Native support in PostgreSQL/PostGIS
4. **Mobile:** Compatible with React Native geolocation APIs

### Why Procedural 3D Layout?

1. **Visualization:** 3D scene is for visualization, not survey-grade operations
2. **Performance:** Procedural layout is faster and simpler for demo/visualization
3. **Hardware:** Real mine surveys require field validation (not available in Phase 3)
4. **Explicit Labeling:** Procedural layout is explicitly labeled as simulation

### Why Not Real Survey Coordinates in 3D?

1. **Field Validation Required:** Real survey coordinates require field verification
2. **Hardware Integration:** Requires integration with mine survey equipment
3. **Phase 3 Scope:** Phase 3 focuses on synchronization, not new hardware integrations
4. **Provenance:** Procedural layout is honestly labeled as such

---

## REMAINING WORK

### Phase 3

- [ ] Implement deterministic coordinate transformation utility
- [ ] Apply transformation to backend-connected entities (sensors, workers, routes)
- [ ] Keep procedural layout for engineering reference layers (strata, faults, etc.)
- [ ] Add provenance labels to all layers
- [ ] Document vertical exaggeration if used

### Future Phases

- [ ] Field validation of mine survey coordinates
- [ ] Integration with mine survey equipment
- [ ] Real InSAR coordinate transformation
- [ ] Survey-grade 3D visualization (if required)

---

## REFERENCES

- **PostGIS Documentation:** https://postgis.net/documentation/
- **EPSG:4326:** https://epsg.io/4326
- **GeoJSON Specification:** https://geojson.org/
- **Three.js Coordinate System:** https://threejs.org/docs/#manual/en/introduction/Coordinate-systems

---

**Document Status:** Phase 3 Coordinate System Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
