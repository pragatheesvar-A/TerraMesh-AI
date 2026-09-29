# GIS 2D ↔ 3D SYNCHRONIZATION CONTRACT
## TerraMesh AI — Digital Twin Data Contract for Phase 3

**Version:** Phase 2 (Preparation for Phase 3)  
**Purpose:** Define canonical entity IDs shared between 2D map and 3D Digital Twin

---

## OVERVIEW

The TerraMesh AI platform includes both a 2D GIS map (RiskMap.jsx, Mine2DMap.jsx) and a 3D Digital Twin (DigitalTwinView.jsx, Mine3DScene.jsx). To ensure consistency across visualizations, both systems must share canonical entity identifiers from the backend database.

**Principle:** Single source of truth, multiple visualization paradigms.

---

## SHARED CANONICAL IDs

### Entity ID Requirements

All spatial entities must have a single canonical ID that is:
1. **Unique** - No duplicates across systems
2. **Persistent** - ID does not change over time
3. **Authoritative** - ID is managed by the backend database
4. **Typed** - ID format indicates entity type

### Canonical ID Format

**Pattern:** `{entity_type}-{unique_identifier}`

**Examples:**
- Zone: `zone-a`, `zone-b`, `zone-c`
- Sensor: `NODE-017`, `NODE-048`
- Worker: `w-23`, `w-41`
- Route: `route-a`, `route-b`
- Panel: `panel-17b`, `panel-18a`

---

## ENTITY MAPPING

### 1. Risk Zones

**Database Table:** `risk_zones`  
**Canonical ID Field:** `id`  
**ID Format:** `zone-{letter}` (e.g., `zone-a`, `zone-b`)  
**2D Map Usage:** Zone polygon overlay, zone selection  
**3D Digital Twin Usage:** Zone volume visualization, zone highlighting  
**Synchronization:** Both systems consume `/api/zones` endpoint

**Shared Fields:**
```json
{
  "id": "zone-b",
  "code": "Zone B",
  "name": "Central Depillaring Section",
  "status": "CRITICAL",
  "risk_score": 87.0,
  "polygon": [[86.4100, 23.7750], ...]
}
```

**Verification Function:**
```python
def verify_zone_sync(zone_id: str) -> bool:
    """Verify zone exists in both 2D and 3D systems."""
    # Check 2D map data
    zone_2d = get_zone_from_2d_map(zone_id)
    # Check 3D twin data
    zone_3d = get_zone_from_3d_twin(zone_id)
    # Verify same canonical ID
    return zone_2d and zone_3d and zone_2d.id == zone_3d.id
```

---

### 2. Sensor Nodes

**Database Table:** `sensors`  
**Canonical ID Field:** `id`  
**ID Format:** `NODE-{number}` (e.g., `NODE-017`, `NODE-048`)  
**2D Map Usage:** Sensor markers, sensor selection, sensor clusters  
**3D Digital Twin Usage:** Sensor 3D models, sensor highlighting, sensor visualization  
**Synchronization:** Both systems consume `/api/sensors` endpoint

**Shared Fields:**
```json
{
  "id": "NODE-017",
  "name": "Roof Extensometer 17-B",
  "zone": "Zone B",
  "lat": 23.7762,
  "lng": 86.4148,
  "status": "CRITICAL"
}
```

**Verification Function:**
```python
def verify_sensor_sync(sensor_id: str) -> bool:
    """Verify sensor exists in both 2D and 3D systems."""
    sensor_2d = get_sensor_from_2d_map(sensor_id)
    sensor_3d = get_sensor_from_3d_twin(sensor_id)
    return sensor_2d and sensor_3d and sensor_2d.id == sensor_3d.id
```

---

### 3. Workers

**Database Table:** `workers`  
**Canonical ID Field:** `id`  
**ID Format:** `w-{number}` (e.g., `w-23`, `w-41`)  
**2D Map Usage:** Worker markers, worker selection, worker tracking  
**3D Digital Twin Usage:** Worker 3D avatars, worker positioning, worker visualization  
**Synchronization:** Both systems consume `/api/workers` endpoint

**Shared Fields:**
```json
{
  "id": "w-23",
  "code": "W-023",
  "name": "Amit Sen (Drill Operator)",
  "zone": "Zone B",
  "lat": 23.7758,
  "lng": 86.4142,
  "status": "DANGER"
}
```

**Verification Function:**
```python
def verify_worker_sync(worker_id: str) -> bool:
    """Verify worker exists in both 2D and 3D systems."""
    worker_2d = get_worker_from_2d_map(worker_id)
    worker_3d = get_worker_from_3d_twin(worker_id)
    return worker_2d and worker_3d and worker_2d.id == worker_3d.id
```

---

### 4. Evacuation Routes

**Database Table:** `evacuation_routes`  
**Canonical ID Field:** `id`  
**ID Format:** `route-{letter}` (e.g., `route-a`, `route-b`)  
**2D Map Usage:** Route polylines, route selection, route status display  
**3D Digital Twin Usage:** Route 3D tubes, route visualization, route highlighting  
**Synchronization:** Both systems consume `/api/evacuation` endpoint

**Shared Fields:**
```json
{
  "id": "route-a",
  "zone_id": "zone-b",
  "name": "Route A (Central Incline Haulage)",
  "status": "BLOCKED",
  "coordinates": [[23.7762, 86.4148], ...]
}
```

**Verification Function:**
```python
def verify_route_sync(route_id: str) -> bool:
    """Verify route exists in both 2D and 3D systems."""
    route_2d = get_route_from_2d_map(route_id)
    route_3d = get_route_from_3d_twin(route_id)
    return route_2d and route_3d and route_2d.id == route_3d.id
```

---

### 5. Panels

**Database Table:** `panels`  
**Canonical ID Field:** `id`  
**ID Format:** `panel-{number}{letter}` (e.g., `panel-17b`, `panel-18a`)  
**2D Map Usage:** Panel 2D outlines (Mine2DMap.jsx)  
**3D Digital Twin Usage:** Panel 3D volumes, panel visualization  
**Synchronization:** Currently not synchronized (2D uses static SVG, 3D uses backend data)

**Current State:** PARTIAL - Panels exist in database but 2D map uses static SVG

**Shared Fields:**
```json
{
  "id": "panel-17b",
  "mine_id": "jharia_01",
  "name": "Panel 17-B",
  "status": "ACTIVE",
  "workers_present": 12
}
```

**Future Enhancement:** Add geometry column to panels table and sync with 2D map

**Verification Function:**
```python
def verify_panel_sync(panel_id: str) -> bool:
    """Verify panel exists in both 2D and 3D systems."""
    panel_2d = get_panel_from_2d_map(panel_id)
    panel_3d = get_panel_from_3d_twin(panel_id)
    return panel_2d and panel_3d and panel_2d.id == panel_3d.id
```

---

### 6. Faults

**Database Table:** NOT IMPLEMENTED  
**Canonical ID Field:** N/A  
**ID Format:** N/A  
**2D Map Usage:** Static fault lines (RiskMap.jsx)  
**3D Digital Twin Usage:** Not implemented  
**Synchronization:** NOT APPLICABLE (static reference data)

**Current State:** STATIC REFERENCE - Faults are legitimate engineering reference data stored as frontend constants

**Future Enhancement:** If dynamic fault tracking is needed, add database table and sync with both visualizations

---

### 7. Boreholes

**Database Table:** NOT IMPLEMENTED  
**Canonical ID Field:** N/A  
**ID Format:** N/A  
**2D Map Usage:** Shown in 2D engineering plan (Mine2DMap.jsx)  
**3D Digital Twin Usage:** Not implemented  
**Synchronization:** NOT APPLICABLE (static reference data)

**Current State:** STATIC REFERENCE - Boreholes are legitimate engineering reference data

**Future Enhancement:** If dynamic borehole tracking is needed, add database table and sync with both visualizations

---

## SYNCHRONIZATION ARCHITECTURE

### Data Flow

```
PostgreSQL Database
    ↓
Canonical Spatial Data (single source of truth)
    ↓
Spatial API (/api/zones, /api/sensors, /api/workers, /api/evacuation)
    ↓
    ├─→ Web 2D GIS (RiskMap.jsx, Mine2DMap.jsx)
    └─→ Web 3D Digital Twin (DigitalTwinView.jsx, Mine3DScene.jsx)
```

### ID Consistency

**Rule:** All systems must use the same canonical ID from the database

**Implementation:**
- 2D map: Use `zone.id`, `sensor.id`, `worker.id` from API responses
- 3D twin: Use `zone.id`, `sensor.id`, `worker.id` from API responses
- No ID transformation or mapping between systems

**Example:**
```javascript
// 2D Map - Zone selection
const handleZoneClick = (zone) => {
  setSelectedZone(zone.id);  // Use canonical ID from API
  navigateToZoneDetail(zone.id);  // Pass canonical ID
};

// 3D Twin - Zone selection
const handleZoneClick = (zone) => {
  setSelectedZone(zone.id);  // Use same canonical ID from API
  focusZoneIn3D(zone.id);  // Pass same canonical ID
};
```

---

## VERIFICATION TESTS

### Entity Existence Test

**Purpose:** Verify that 2D entity exists AND 3D entity references same canonical ID

**Test Implementation:**
```python
def test_2d_3d_entity_sync():
    """Verify shared canonical IDs between 2D and 3D systems."""
    
    # Get all zones from API
    zones = client.get("/api/zones").json()
    
    for zone in zones:
        zone_id = zone["id"]
        
        # Verify zone exists in 2D map data
        zone_2d = get_zone_from_2d_map(zone_id)
        assert zone_2d is not None, f"Zone {zone_id} not found in 2D map"
        
        # Verify zone exists in 3D twin data
        zone_3d = get_zone_from_3d_twin(zone_id)
        assert zone_3d is not None, f"Zone {zone_id} not found in 3D twin"
        
        # Verify same canonical ID
        assert zone_2d.id == zone_3d.id, f"Zone ID mismatch: 2D={zone_2d.id}, 3D={zone_3d.id}"
```

### Cross-System Navigation Test

**Purpose:** Verify navigation uses canonical IDs consistently

**Test Implementation:**
```python
def test_navigation_uses_canonical_ids():
    """Verify navigation between 2D and 3D uses canonical IDs."""
    
    # Select zone in 2D map
    zone_id = "zone-b"
    select_zone_in_2d(zone_id)
    
    # Navigate to 3D view
    navigate_to_3d_view()
    
    # Verify 3D view has same zone selected
    selected_zone_3d = get_selected_zone_in_3d()
    assert selected_zone_3d.id == zone_id, f"Zone ID mismatch after navigation"
```

---

## CURRENT IMPLEMENTATION STATUS

### 2D Map (RiskMap.jsx)

**Data Sources:**
- ✅ Zones: `/api/zones` (canonical IDs: `zone-a`, `zone-b`, etc.)
- ✅ Sensors: `/api/sensors` (canonical IDs: `NODE-017`, etc.)
- ✅ Workers: `/api/workers` (canonical IDs: `w-23`, etc.)
- ✅ Evacuation Routes: `/api/evacuation` (canonical IDs: `route-a`, etc.)
- ⚠️ Panels: Static SVG (not synchronized)
- ⚠️ Faults: Static constants (not synchronized)
- ⚠️ Boreholes: Static SVG (not synchronized)

**Status:** PARTIAL - Operational entities synchronized, static reference data not

### 3D Digital Twin (DigitalTwinView.jsx, Mine3DScene.jsx)

**Data Sources:**
- ✅ Zones: Backend data (canonical IDs synchronized)
- ✅ Sensors: Backend data (canonical IDs synchronized)
- ✅ Workers: Backend data (canonical IDs synchronized)
- ⚠️ Panels: Backend data (not synchronized with 2D map)
- ❌ Evacuation Routes: Not implemented in 3D
- ❌ Faults: Not implemented in 3D
- ❌ Boreholes: Not implemented in 3D

**Status:** PARTIAL - Some entities synchronized, others not implemented

---

## PHASE 3 PREPARATION

### Required Synchronization

For Phase 3 (full Digital Twin integration), the following synchronization is required:

1. **Panels:** Add geometry to panels table, sync with 2D map
2. **Evacuation Routes:** Implement in 3D Digital Twin
3. **Faults:** Decide if dynamic tracking needed (add to database if yes)
4. **Boreholes:** Decide if dynamic tracking needed (add to database if yes)

### Implementation Priority

**High Priority:**
1. Add geometry column to panels table
2. Sync panel data between 2D map and 3D twin
3. Implement evacuation routes in 3D twin

**Medium Priority:**
4. Add fault database table (if dynamic tracking needed)
5. Add borehole database table (if dynamic tracking needed)

**Low Priority:**
6. Sync static reference data (context only, not operational)

---

## DO NOT IMPLEMENT

### Duplicate 3D Database

**Rule:** Do not create a separate 3D database

**Reason:** 
- Single source of truth principle
- PostGIS already handles 3D geometry (if needed)
- Duplicate databases create synchronization complexity
- Risk of data inconsistency

**Alternative:** Use PostGIS 3D geometry types if needed:
- `geometry(PointZ, 4326)` - Points with elevation
- `geometry(PolygonZ, 4326)` - Polygons with elevation
- `geometry(Solid, 4326)` - 3D solids

### Duplicate IDs

**Rule:** Do not create separate ID systems for 2D and 3D

**Reason:**
- Violates single source of truth principle
- Creates synchronization complexity
- Risk of ID conflicts

**Alternative:** Use same canonical IDs from database

---

## SYNCHRONIZATION BEST PRACTICES

### 1. Always Use Canonical IDs

**Rule:** All systems must use database IDs

**Implementation:**
- Never generate frontend-only IDs
- Never transform or map IDs between systems
- Always pass canonical ID through navigation

### 2. Verify Synchronization

**Rule:** Add tests to verify ID consistency

**Implementation:**
- Cross-system navigation tests
- Entity existence tests
- ID consistency tests

### 3. Document ID Format

**Rule:** Document canonical ID format for each entity type

**Implementation:**
- This document
- API documentation
- Code comments

### 4. Handle Missing Entities

**Rule:** Gracefully handle entities that exist in one system but not the other

**Implementation:**
- Check entity existence before navigation
- Show appropriate error message
- Fallback to list view if detail not available

---

## SYNCHRONIZATION MONITORING

### Metrics

**Recommended:** Track synchronization metrics:

- Entity count mismatch between 2D and 3D
- Missing entities in 2D map
- Missing entities in 3D twin
- ID format violations

### Alerts

**Recommended:** Alert on synchronization issues:

- High entity count mismatch
- Missing critical entities (e.g., zone-b)
- ID format violations

---

## REFERENCES

- **PostGIS 3D Geometry:** https://postgis.net/docs/PostGIS_Special_Functions.html
- **Digital Twin Best Practices:** https://www.digitaltwinconsortium.org/
- **3D Visualization Standards:** OGC 3D Portrayal Service

---

**Document Status:** Phase 2 Complete (Preparation for Phase 3)  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
