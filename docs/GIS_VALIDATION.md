# GIS VALIDATION
## TerraMesh AI — Spatial Data Quality Assurance

**Version:** Phase 2  
**Purpose:** Document spatial data validation rules and procedures

---

## OVERVIEW

Spatial data validation ensures that geographic information processed by the TerraMesh AI platform is accurate, consistent, and safe for operational use. This document describes validation rules for coordinates, geometries, and spatial queries.

---

## COORDINATE VALIDATION

### Valid Ranges (EPSG:4326)

**Longitude (lng):**
- Valid range: -180 to 180 degrees
- Jharia region: ~86 degrees (east positive)
- Validation: `assert -180 <= lng <= 180`

**Latitude (lat):**
- Valid range: -90 to 90 degrees
- Jharia region: ~23 degrees (north positive)
- Validation: `assert -90 <= lat <= 90`

### Validation Function

```python
def validate_coordinate_range(lng: float, lat: float) -> bool:
    """Validate that coordinates are within valid EPSG:4326 ranges."""
    if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        raise ValueError(f"Coordinates must be numeric")
    
    if not (-180 <= lng <= 180):
        raise ValueError(f"Longitude out of valid range [-180, 180]: {lng}")
    
    if not (-90 <= lat <= 90):
        raise ValueError(f"Latitude out of valid range [-90, 90]: {lat}")
    
    return True
```

### Error Handling

**Invalid Longitude:**
```
ValueError: Longitude out of valid range [-180, 180]: 181.0
```

**Invalid Latitude:**
```
ValueError: Latitude out of valid range [-90, 90]: 91.0
```

**Non-Numeric:**
```
ValueError: Coordinates must be numeric, got lng=<class 'str'>, lat=<class 'float'>
```

---

## GEOMETRY VALIDATION

### Point Geometry

**Validation Rules:**
1. Coordinates must be numeric
2. Coordinates must be within valid ranges
3. Coordinates must be finite (not NaN or infinity)

**Validation Function:**
```python
def validate_point_geometry(lat: float, lng: float) -> dict:
    """Comprehensive validation for point geometry."""
    result = {"valid": True, "errors": []}
    
    try:
        validate_coordinate_range(lng, lat)
    except ValueError as e:
        result["valid"] = False
        result["errors"].append(str(e))
    
    if not math.isfinite(lat) or not math.isfinite(lng):
        result["valid"] = False
        result["errors"].append("Coordinates must be finite numbers")
    
    return result
```

**Test Cases:**
- ✅ Valid: `lat=23.7745, lng=86.4120`
- ❌ Invalid range: `lat=91.0, lng=86.4120`
- ❌ NaN: `lat=float('nan'), lng=86.4120`
- ❌ Infinity: `lat=float('inf'), lng=86.4120`

---

### Polygon Geometry

**Validation Rules:**
1. Minimum 3 points (triangle)
2. Each coordinate must be valid
3. Coordinate order must be GeoJSON [lng, lat]
4. Ring should be closed (first point equals last point)

**Validation Function:**
```python
def validate_polygon_geometry(ring: List[List[float]]) -> dict:
    """Comprehensive validation for polygon geometry."""
    result = {"valid": True, "errors": []}
    
    # Check minimum points
    if not ring or len(ring) < 3:
        result["valid"] = False
        result["errors"].append("Polygon must have at least 3 points")
        return result
    
    # Validate coordinate order
    try:
        validate_geojson_coordinate_order(ring)
    except ValueError as e:
        result["valid"] = False
        result["errors"].append(str(e))
    
    # Validate each coordinate
    for i, coord in enumerate(ring):
        try:
            validate_coordinate_range(coord[0], coord[1])
        except ValueError as e:
            result["valid"] = False
            result["errors"].append(f"Coordinate {i}: {str(e)}")
    
    # Check ring closure (warning, not error)
    if ring[0] != ring[-1]:
        result["warnings"] = result.get("warnings", [])
        result["warnings"].append("Polygon ring is not closed")
    
    return result
```

**Test Cases:**
- ✅ Valid: `[[86.4100, 23.7750], [86.4160, 23.7800], [86.4210, 23.7760], [86.4100, 23.7750]]`
- ❌ Too few points: `[[86.4100, 23.7750], [86.4160, 23.7800]]`
- ❌ Swapped order: `[[23.7750, 86.4100], [23.7800, 86.4160], ...]`
- ⚠️ Unclosed ring: `[[86.4100, 23.7750], [86.4160, 23.7800], [86.4210, 23.7760]]`

---

### GeoJSON Coordinate Order

**Validation Rules:**
1. Coordinates must be [lng, lat] order (GeoJSON standard)
2. For Jharia: lng ~86, lat ~23
3. Swapped order (lat ~86, lng ~23) is invalid

**Validation Function:**
```python
def validate_geojson_coordinate_order(coords: List[List[float]]) -> bool:
    """Validate that coordinates follow GeoJSON [lng, lat] order."""
    if not coords or len(coords) < 1:
        return False
    
    for i, coord in enumerate(coords):
        if len(coord) != 2:
            raise ValueError(f"Coordinate {i} must have exactly 2 values")
        
        lng, lat = coord[0], coord[1]
        
        # Check if values are in reasonable ranges for Jharia
        if 18 <= lng <= 30 and 80 <= lat <= 95:
            raise ValueError(
                f"Coordinate {i} appears to have swapped order: "
                f"expected [lng, lat] where lng~86, lat~23, got [{lng}, {lat}]"
            )
    
    return True
```

**Test Cases:**
- ✅ Valid: `[[86.4100, 23.7750], [86.4160, 23.7800], ...]`
- ❌ Swapped: `[[23.7750, 86.4100], [23.7800, 86.4160], ...]`
- ❌ Wrong length: `[[86.4100, 23.7750, 0.0], ...]`

---

## SPATIAL QUERY VALIDATION

### Zone-for-Point Query

**Validation:**
1. Coordinates must be valid
2. Mine ID must be valid string

**Implementation:**
```python
def zone_containing_point(lng: float, lat: float, mine_id: str = "jharia_01") -> Optional[dict]:
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    # Proceed with spatial query...
```

**Error Cases:**
- Invalid coordinates → ValueError
- No zone contains point → Returns None (not an error)

---

### Nearest-Sensors Query

**Validation:**
1. Coordinates must be valid
2. Limit must be between 1 and 100

**Implementation:**
```python
def nearest_sensors(lng: float, lat: float, limit: int = 5, mine_id: str = "jharia_01") -> List[dict]:
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    if not isinstance(limit, int) or limit < 1 or limit > 100:
        raise ValueError(f"Limit must be between 1 and 100, got {limit}")
    
    # Proceed with spatial query...
```

**Error Cases:**
- Invalid coordinates → ValueError
- Invalid limit → ValueError
- No sensors found → Returns empty list (not an error)

---

### Route-Proximity Query

**Validation:**
1. Coordinates must be valid
2. Radius must be between 0 and 10000 meters

**Implementation:**
```python
def route_proximity(lng: float, lat: float, radius_m: float = 50.0) -> List[dict]:
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    if not isinstance(radius_m, (int, float)) or radius_m < 0 or radius_m > 10000:
        raise ValueError(f"Radius must be between 0 and 10000 meters, got {radius_m}")
    
    # Proceed with spatial query...
```

**Error Cases:**
- Invalid coordinates → ValueError
- Invalid radius → ValueError
- No routes found → Returns empty list (not an error)

---

## POSTGIS GEOMETRY VALIDATION

### ST_IsValid

**Purpose:** Check if PostGIS geometry is valid according to OGC standards

**SQL:**
```sql
SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM risk_zones
WHERE geom IS NOT NULL;
```

**Expected Output:**
```
id | is_valid | reason
----+----------+--------
zone-a | t | 
zone-b | t | 
zone-c | t | 
```

**Invalid Geometry Example:**
```
id | is_valid | reason
----+----------+--------
zone-x | f | Self-intersection
```

### ST_MakeValid

**Purpose:** Correct invalid geometries (use with caution)

**SQL:**
```sql
-- View invalid geometries before correction
SELECT id, ST_AsText(geom) as invalid_geom
FROM risk_zones
WHERE NOT ST_IsValid(geom);

-- Correct invalid geometries
UPDATE risk_zones
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);

-- Verify correction
SELECT id, ST_IsValid(geom) as is_valid
FROM risk_zones
WHERE geom IS NOT NULL;
```

**Caution:** ST_MakeValid may alter geometry in unexpected ways. Review changes before applying to production.

---

## GEOMETRY VALIDATION AUDIT

### Audit Procedure

**Step 1:** Check all PostGIS geometry columns
```sql
-- Risk zones
SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM risk_zones
WHERE geom IS NOT NULL;

-- Evacuation routes
SELECT id, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM evacuation_routes
WHERE geom IS NOT NULL;

-- Telemetry
SELECT node_id, ts, ST_IsValid(geom) as is_valid, ST_IsValidReason(geom) as reason
FROM telemetry
WHERE geom IS NOT NULL;
```

**Step 2:** Validate seeded geometries
```python
# Python validation of seeded polygons
from backend.seed_spatial import ZONES

for zone in ZONES:
    ring = zone["polygon"]
    result = validate_polygon_geometry(ring)
    if not result["valid"]:
        print(f"Invalid zone {zone['id']}: {result['errors']}")
```

**Step 3:** Validate API responses
```python
# Validate zone API response
zones = client.get("/api/zones").json()
for zone in zones:
    if zone.get("polygon"):
        result = validate_polygon_geometry(zone["polygon"])
        if not result["valid"]:
            print(f"Invalid API zone {zone['id']}: {result['errors']}")
```

---

## VALIDATION TEST COVERAGE

### Test File: `test_spatial_validation.py`

**Test Cases:**
1. ✅ `test_validate_coordinate_range_valid` - Valid coordinates pass
2. ✅ `test_validate_coordinate_range_invalid_longitude` - Invalid longitude rejected
3. ✅ `test_validate_coordinate_range_invalid_latitude` - Invalid latitude rejected
4. ✅ `test_validate_coordinate_range_non_numeric` - Non-numeric rejected
5. ✅ `test_validate_geojson_coordinate_order_valid` - Valid order passes
6. ✅ `test_validate_geojson_coordinate_order_swapped` - Swapped order rejected
7. ✅ `test_validate_geojson_coordinate_order_empty` - Empty handled
8. ✅ `test_validate_geojson_coordinate_order_invalid_length` - Wrong length rejected
9. ✅ `test_validate_point_geometry_valid` - Valid point passes
10. ✅ `test_validate_point_geometry_invalid_range` - Invalid range rejected
11. ✅ `test_validate_point_geometry_nan` - NaN rejected
12. ✅ `test_validate_point_geometry_infinity` - Infinity rejected
13. ✅ `test_validate_polygon_geometry_valid` - Valid polygon passes
14. ✅ `test_validate_polygon_geometry_too_few_points` - Too few points rejected
15. ✅ `test_validate_polygon_geometry_empty` - Empty rejected
16. ✅ `test_validate_polygon_geometry_swapped_order` - Swapped order rejected
17. ✅ `test_validate_polygon_geometry_unclosed_ring` - Unclosed ring warns
18. ✅ `test_validate_polygon_geometry_invalid_coordinate` - Invalid coordinate rejected
19. ✅ `test_zone_containing_point_invalid_coordinates` - Invalid coords rejected
20. ✅ `test_nearest_sensors_invalid_coordinates` - Invalid coords rejected
21. ✅ `test_nearest_sensors_invalid_limit` - Invalid limit rejected
22. ✅ `test_route_proximity_invalid_coordinates` - Invalid coords rejected
23. ✅ `test_route_proximity_invalid_radius` - Invalid radius rejected

**Run Tests:**
```bash
cd apps/mineguard-core/backend
pytest tests/test_spatial_validation.py -v
```

---

## CRS VALIDATION

### Coordinate Reference System Consistency

**Rule:** All spatial data must use EPSG:4326 (WGS84)

**Storage CRS:** EPSG:4326  
**API CRS:** EPSG:4326  
**Display CRS:** EPSG:4326 (Leaflet)

**Validation:**
- No CRS mixing in database
- No CRS transformation in API (all EPSG:4326)
- Frontend handles GeoJSON [lng, lat] → Leaflet [lat, lng] conversion

**Conversion:**
```javascript
// GeoJSON [lng, lat] → Leaflet [lat, lng]
const leafletCoords = zone.polygon.map(p => [p[1], p[0]]);
```

---

## DATA INTEGRITY VALIDATION

### Null Geometry Handling

**Rule:** Null geometry must be handled gracefully

**Implementation:**
```python
# Zone query with null geometry check
rows = db.query(models.ZoneModel).all()
for z in rows:
    if not z.polygon_json:
        continue  # Skip zones without geometry
    polygon = json.loads(z.polygon_json)
```

**API Response:**
```json
{
  "id": "zone-a",
  "polygon": null,  // No geometry available
  "provenance": {
    "geometry": "STATIC DESIGN DATA"
  }
}
```

### Malformed GeoJSON Handling

**Rule:** Malformed GeoJSON must be rejected cleanly

**Implementation:**
```python
try:
    polygon = json.loads(z.polygon_json)
except Exception:
    polygon = None  # Graceful fallback
```

---

## VALIDATION BEST PRACTICES

### 1. Validate Early

**Rule:** Validate data at the earliest point in the pipeline

**Implementation:**
- API input validation
- Database insert validation
- Frontend display validation

### 2. Fail Gracefully

**Rule:** Invalid data should not crash the system

**Implementation:**
- Return error messages, not exceptions
- Provide fallback data when possible
- Log validation failures

### 3. Document Validation Rules

**Rule:** All validation rules must be documented

**Implementation:**
- This document
- Code comments
- API documentation

### 4. Test Validation

**Rule:** All validation rules must have tests

**Implementation:**
- Unit tests for validation functions
- Integration tests for API validation
- Validation test coverage reporting

---

## VALIDATION MONITORING

### Validation Metrics

**Recommended:** Track validation metrics:

- Invalid coordinate rate (per hour)
- Invalid geometry rate (per hour)
- Validation error types (distribution)
- Validation failure rate (by endpoint)

### Validation Alerts

**Recommended:** Alert on validation issues:

- High invalid coordinate rate
- Repeated validation failures
- Invalid geometry in critical layers

---

## VALIDATION FUTURE ENHANCEMENTS

### Enhanced Geometry Validation

**Recommended:** Add advanced geometry validation:

- Self-intersection detection
- Minimum area threshold
- Maximum complexity threshold
- Topology validation

### Schema Validation

**Recommended:** Add JSON Schema validation for GeoJSON:

```python
from jsonschema import validate, ValidationError

GEOJSON_SCHEMA = {
    "type": "Polygon",
    "coordinates": {
        "type": "array",
        "items": {
            "type": "array",
            "items": {"type": "number"},
            "minItems": 2,
            "maxItems": 2
        }
    }
}

def validate_geojson_schema(geojson):
    try:
        validate(instance=geojson, schema=GEOJSON_SCHEMA)
        return True
    except ValidationError as e:
        raise ValueError(f"Invalid GeoJSON schema: {e}")
```

### Real-time Validation

**Recommended:** Add real-time validation dashboard:

- Live validation status
- Validation error stream
- Validation rate trends

---

## REFERENCES

- **GeoJSON Specification:** http://geojson.org/
- **PostGIS Validation:** https://postgis.net/docs/ST_IsValid.html
- **EPSG:4326:** https://epsg.io/4326
- **OGC Simple Features:** https://www.ogc.org/standards/sfa

---

**Document Status:** Phase 2 Complete  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
