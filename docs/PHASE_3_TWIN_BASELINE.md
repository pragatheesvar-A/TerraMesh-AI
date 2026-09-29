# PHASE 3 TWIN BASELINE AUDIT
## TerraMesh AI — Digital Twin Current State Inventory

**Audit Date:** 2026-09-25  
**Audit Scope:** Existing 3D Digital Twin before Phase 3 enhancements  
**Objective:** Understand current data sources and identify synchronization needs

---

## EXECUTIVE SUMMARY

The existing Digital Twin uses procedural 3D geometry for visualization but has partial backend synchronization for sensor status. The architecture shows good intent for 2D/3D synchronization but needs completion for full canonical entity consistency.

**Overall Status:** PARTIAL - Some backend synchronization exists, geometry is procedural

---

## DIGITAL TWIN COMPONENTS

### 1. Mine3DScene.jsx

**Location:** `apps/mineguard-core/frontend/src/components/views/Mine3DScene.jsx`  
**Purpose:** Main Three.js 3D WebGL scene renderer  
**Technology:** Three.js (loaded via window.THREE)

**Features:**
- Real 3D cutaway geological strata (procedural)
- Surface terrain with infrastructure (procedural)
- Dynamic 3D subsidence deformation trough (what-if simulation)
- Longwall extraction panels (procedural)
- Tunnel network (procedural)
- Borehole shafts (procedural)
- Live IoT sensor nodes (status from backend, positions procedural)
- Raycasting for 3D mesh interaction
- OrbitControls with auto-rotate, pan, zoom
- Resource disposal and 60 FPS performance

---

## ENTITY INVENTORY

### 1. PANELS

**3D Entity:** Underground Extraction Panels  
**3D Location:** `Mine3DScene.jsx` lines 453-504  
**3D IDs:** `panel17`, `panel18`  
**3D Names:** "Panel 17-B", "Panel 18-A"  
**3D Geometry:** Procedural BoxGeometry with wireframe  
**3D Position:** Hardcoded coordinates (-6, -12.5, 2) and (16, -12.5, -4)  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ⚠️ PARTIAL (2D map has static SVG panels)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
// Panel 17-B (Active Extraction Longwall Void)
const panel17 = new THREE.Mesh(p17Geo, p17Mat);
panel17.position.set(-6, -12.5, 2);
panel17.userData = { id: 'panel17', name: 'Longwall Panel 17-B (-145m)', type: 'panel' };
```

**Recommendation:** Connect to backend `panels` table (if geometry added) or keep as procedural reference geometry with clear labeling.

---

### 2. SENSORS

**3D Entity:** IoT Sensor Nodes  
**3D Location:** `Mine3DScene.jsx` lines 628-722  
**3D IDs:** `S-17B-01`, `BH-04-EXT`, `BH-07-PIEZO`, `HAUL-TILT-01`, `AIR-FLOW-02`, `SURF-GPS-01`  
**3D Names:** Procedural names with type (e.g., "S-17B-01 (Panel 17-B Crown)")  
**3D Geometry:** Procedural OctahedronGeometry with pulsing ring  
**3D Position:** Hardcoded coordinates (e.g., x: -6, y: -11.0, z: 2)  
**3D Status:** ✅ LIVE BACKEND STATUS, PROCEDURAL POSITION  
**Backend Connected:** ✅ YES (status from /api/sensors)  
**2D Connected:** ✅ YES (same /api/sensors)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** STATUS = LIVE BACKEND, POSITION = PROCEDURAL SIMULATION  
**Current Source:** Status from backend sensors prop, positions hardcoded

**Details:**
```javascript
// Lines 644-683: 2D/3D Canonical-Entity Sync
const liveById = {};
(sensors || []).forEach(s => { liveById[s.id] = s; });

const resolveStatus = (marker) => {
  // Find the backend node for this twin marker
  const candidates = (sensors || []).filter(s =>
    String(s.id || '').startsWith('NODE-') ||
    String(s.id || '').includes(marker.id.split('-')[0]));
  let live = liveById[marker.id];
  // ... resolve status from backend
  if (apiStatus.includes('CRITICAL') || apiStatus.includes('DANGER')) return 'DANGER';
  // ...
};

// Expose ledger for verification
window.__TERRAMESH_TWIN_LEDGER = twinEntityLedger;
```

**Status:** ✅ GOOD - Sensor status synchronized with backend, positions are procedural (acceptable for visualization)

**Recommendation:** Keep status synchronization, positions can remain procedural for visualization (not operational). Add clear provenance label for positions.

---

### 3. TUNNELS

**3D Entity:** Underground Tunnel Network  
**3D Location:** `Mine3DScene.jsx` lines 507-581  
**3D IDs:** `haulage`, `airway`  
**3D Names:** "Haulage Incline Drift", "East Airway Ventilation Drift"  
**3D Geometry:** Procedural TubeGeometry along CatmullRomCurve  
**3D Position:** Hardcoded curve coordinates  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ⚠️ PARTIAL (2D map has static drift geometry)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
// Haulage Incline Ramp
const haulageCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(22, 5.0, -8),
  new THREE.Vector3(14, -2.0, -5),
  new THREE.Vector3(5, -7.0, -2),
  new THREE.Vector3(-4, -12.5, 0)
]);
```

**Recommendation:** Keep as procedural reference geometry (legitimate engineering visualization). Add provenance label.

---

### 4. BOREHOLES

**3D Entity:** Borehole Shafts  
**3D Location:** `Mine3DScene.jsx` lines 584-626  
**3D IDs:** `bh04`, `bh07`  
**3D Names:** "BH-04 Extensometer", "BH-07 Piezometer"  
**3D Geometry:** Procedural CylinderGeometry with cone flag  
**3D Position:** Hardcoded coordinates (-12, 0, 4) and (4, 0, -4)  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ⚠️ PARTIAL (2D map has static borehole markers)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
const createBorehole = (name, x, z, id) => {
  const bhGroup = new THREE.Group();
  bhGroup.position.set(x, 0, z);
  // ... create cylinder and flag
  bhGroup.userData = { id: id, name: `${name} Monitoring Borehole`, type: 'borehole' };
  return bhGroup;
};
```

**Recommendation:** Keep as procedural reference geometry (legitimate engineering visualization). Add provenance label.

---

### 5. GEOLOGICAL STRATA

**3D Entity:** Geological Strata Layers  
**3D Location:** `Mine3DScene.jsx` lines 228-291  
**3D IDs:** `topsoil`, `laterite`, `water`, `shale`, `coalXII`, `interburden`, `coalXIV`, `basement`  
**3D Names:** "Topsoil & Alluvium", "Laterite & Weathered Rock", "Aquifer Water Table", etc.  
**3D Geometry:** Procedural BoxGeometry with noise displacement  
**3D Position:** Hardcoded Y positions (3.8, 1.3, -1.2, -7.0, -12.5, -15.5, -18.5, -23.0)  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ❌ NO  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION (ENGINEERING REFERENCE)  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
strataGroup.add(createStrataLayer("Topsoil & Alluvium (0–15m)",          3.8,  2.6, 0x4a7c5f));
strataGroup.add(createStrataLayer("Laterite & Weathered Rock (15–35m)",   1.3,  2.4, 0x8b6914));
const aquifer = createStrataLayer("Aquifer Water Table (35–55m)",         -1.2, 1.5, 0x0ea5e9, 0.55, true, 0x0284c7, 0.3);
// ... more layers
```

**Recommendation:** Keep as procedural engineering reference geometry. Add provenance label: "ENGINEERING REFERENCE (PROCEDURAL)".

---

### 6. FAULTS

**3D Entity:** Geological Fault Plane  
**3D Location:** `Mine3DScene.jsx` lines 281-291  
**3D ID:** `fault`  
**3D Name:** "Geological Fault Zone"  
**3D Geometry:** Procedural PlaneGeometry  
**3D Position:** Hardcoded (-15, -10, -5) with rotations  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ⚠️ PARTIAL (2D map has static fault lines)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION (ENGINEERING REFERENCE)  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
const faultGeo = new THREE.PlaneGeometry(28, 32);
const faultMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.08 });
const faultMesh = new THREE.Mesh(faultGeo, faultMat);
faultMesh.position.set(-15, -10, -5);
faultMesh.rotation.z = Math.PI / 10;
faultMesh.rotation.y = Math.PI / 7;
faultMesh.userData = { id: 'fault', name: 'Geological Fault Zone', type: 'strata' };
```

**Recommendation:** Keep as procedural engineering reference geometry. Add provenance label.

---

### 7. SUBSIDENCE / DEFORMATION

**3D Entity:** Subsidence Deformation Zone  
**3D Location:** `Mine3DScene.jsx` lines 294-347  
**3D ID:** `subsidence`  
**3D Name:** "Subsidence Zone (Active Trough)"  
**3D Geometry:** Procedural PlaneGeometry with vertex coloring  
**3D Position:** Hardcoded center (-5, 5.1, 0)  
**3D Status:** WHAT-IF SIMULATION (slider-controlled)  
**Backend Connected:** ❌ NO (what-if simulation)  
**2D Connected:** ⚠️ PARTIAL (2D map has simulated InSAR circles)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** WHAT-IF SIMULATION  
**Current Source:** What-If slider (DigitalTwinView.jsx) with timeline multiplier

**Details:**
```javascript
// Line 309: sagAmount based on whatIfDeformation slider
const sagAmount = Math.max(0, (1 - dist / 14)) * 3.2 * (whatIfDeformation / 30);
posAttr.setY(i, 5.1 + microNoise - sagAmount);

// Lines 934-968: Dynamic update on slider change
useEffect(() => {
  const sagAmount = Math.max(0, (1 - dist / 14)) * 3.2 * (whatIfDeformation / 30);
  // ... update vertex positions and colors
}, [whatIfDeformation]);
```

**Status:** ✅ CORRECT - What-If simulation correctly labeled as simulation

**Recommendation:** Keep as what-if simulation (correctly labeled). Could optionally connect to real InSAR service when available.

---

### 8. SURFACE INFRASTRUCTURE

**3D Entity:** Surface Terrain and Infrastructure  
**3D Location:** `Mine3DScene.jsx` lines 129-226  
**3D ID:** `terrain`  
**3D Name:** "Mine Site Surface Terrain"  
**3D Geometry:** Procedural PlaneGeometry with noise displacement  
**3D Position:** Hardcoded coordinates  
**3D Status:** Procedural visualization  
**Backend Connected:** ❌ NO  
**2D Connected:** ⚠️ PARTIAL (2D map has static mine boundary)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL SIMULATION (ENGINEERING REFERENCE)  
**Current Source:** Hardcoded in Mine3DScene.jsx

**Details:**
```javascript
const terrainGeo = new THREE.PlaneGeometry(120, 80, 100, 100);
// ... noise displacement
const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
terrainMesh.userData = { id: 'terrain', name: 'Mine Site Surface Terrain', type: 'terrain' };
```

**Recommendation:** Keep as procedural engineering reference geometry. Add provenance label.

---

### 9. EVACUATION ROUTES

**3D Entity:** Evacuation Route Path  
**3D Location:** `Mine3DScene.jsx` lines 557-572  
**3D ID:** `EvacuationRoutePath`  
**3D Name:** N/A (route visualization)  
**3D Geometry:** Procedural TubeGeometry (reuses airway curve)  
**3D Position:** Reuses airway curve coordinates  
**3D Status:** Conditional visibility (isEvacuationActive)  
**Backend Connected:** ⚠️ PARTIAL (backend has evacuation_routes table)  
**2D Connected:** ✅ YES (/api/evacuation)  
**3D Connected:** N/A (this is the 3D component)  
**Provenance:** PROCEDURAL GEOMETRY, BACKEND STATUS  
**Current Source:** Geometry procedural, status from backend

**Details:**
```javascript
// Dynamic Evacuation Route (Route B Bypass through Airway Drift)
const evacGeo = new THREE.TubeGeometry(airwayCurve, 40, 1.45, 8, false);
const evacMesh = new THREE.Mesh(evacGeo, evacMat);
evacMesh.visible = !!isEvacuationActive;
```

**Status:** ⚠️ PARTIAL - Geometry is procedural (reuses tunnel), should connect to backend route geometry

**Recommendation:** Connect evacuation route geometry to backend `/api/evacuation` endpoint when route geometry is available in database.

---

### 10. WORKERS

**3D Entity:** Worker Positions  
**3D Location:** Not implemented in 3D scene  
**3D IDs:** N/A  
**3D Names:** N/A  
**3D Geometry:** N/A  
**3D Position:** N/A  
**3D Status:** NOT IMPLEMENTED in 3D  
**Backend Connected:** N/A  
**2D Connected:** ✅ YES (/api/workers - SIMULATION)  
**3D Connected:** N/A  
**Provenance:** N/A  
**Current Source:** N/A

**Status:** ❌ NOT IMPLEMENTED in 3D scene

**Recommendation:** Add worker visualization if needed for 3D twin. Use backend /api/workers with SIMULATION provenance label.

---

## DATA FLOW ANALYSIS

### DigitalTwinView.jsx

**Location:** `apps/mineguard-core/frontend/src/components/views/DigitalTwinView.jsx`  
**Purpose:** Wrapper component for 3D scene with controls and data integration

**Data Sources:**
- `sensors` from MineDataContext (backend /api/sensors) ✅
- `workers` from MineDataContext (backend /api/workers) ✅
- `kpis` from MineDataContext (backend /api/dashboard/overview) ✅
- `evacuation` from MineDataContext (backend /api/evacuation) ✅
- `aiRisk` from MineDataContext (backend /api/risk) ✅

**What-If Simulation:**
- `whatIfDeformation` state (default 30%) ✅
- Timeline mode affects deformation calculations ✅
- Simulated risk calculation ✅
- Status: WHAT-IF SIMULATION (correctly labeled)

**2D/3D Verification Mode:**
- Lines 312-341: Verification UI logic ✅
- Exposes `window.__TERRAMESH_TWIN_VERIFY()` ✅
- Checks panel/node/risk consistency ✅
- Status: PARTIAL - Logic exists, needs UI exposure

**Hotspot Data:**
- Lines 98-307: Hardcoded hotspot telemetry data ⚠️
- Provenance: STATIC DESIGN DATA ⚠️
- Status: STATIC - Should connect to backend where possible

---

## CANONICAL ID MAPPING

### Current Implementation

**2D GIS → 3D Twin Sensor Sync:**
```javascript
// Mine3DScene.jsx lines 644-683
const sensorPositions = [
  { id: 'S-17B-01', ... },
  { id: 'BH-04-EXT', ... },
  // ...
];

// Resolves backend status by ID prefix match
const resolveStatus = (marker) => {
  const candidates = (sensors || []).filter(s =>
    String(s.id || '').startsWith('NODE-') ||
    String(s.id || '').includes(marker.id.split('-')[0]));
  // ... resolve status
};

// Exposes ledger for verification
window.__TERRAMESH_TWIN_LEDGER = twinEntityLedger;
```

**Status:** ⚠️ PARTIAL - Sensor status synchronized, but ID mapping is heuristic (prefix match), not canonical

**Recommendation:** Use canonical sensor IDs from backend directly if possible, or improve ID mapping logic.

---

## PROVENANCE LABELING

### Current State

**Explicitly Labeled:**
- Sensor status: "LIVE BACKEND (/api/sensors)" ✅
- Deformation: "WHAT-IF SIMULATION" ✅
- Subsidence: Controlled by slider (what-if) ✅

**Not Labeled:**
- Panel geometry: No provenance label ❌
- Tunnel geometry: No provenance label ❌
- Borehole geometry: No provenance label ❌
- Strata layers: No provenance label ❌
- Fault plane: No provenance label ❌
- Surface terrain: No provenance label ❌

**Recommendation:** Add provenance labels to all procedural engineering reference layers in tooltips and legend.

---

## SIMULATION ISOLATION

### Current State

**What-If Simulation:**
- Controlled by slider (whatIfDeformation) ✅
- Timeline mode affects calculations ✅
- Does not modify backend data ✅
- Status: ISOLATED (correct)

**Worker Simulation:**
- Workers are simulated in backend (worker_location.py) ✅
- Provenance: "SIMULATION" ✅
- Status: ISOLATED (correct)

**Deformation Simulation:**
- What-If deformation is isolated to visualization ✅
- Does not affect backend risk calculations ✅
- Status: ISOLATED (correct)

**Recommendation:** Maintain simulation isolation. Add explicit "SIMULATION MODE" indicator when on.

---

## COORDINATE SYSTEM

### Current State

**3D Scene Coordinates:**
- Three.js world coordinates (arbitrary units)
- Not tied to EPSG:4326
- Not tied to real mine coordinates
- Status: VISUALIZATION ONLY (arbitrary)

**Documented:**
- None found in code
- Status: NOT DOCUMENTED

**Recommendation:** Document coordinate system as "Three.js world coordinates (visualization only, not real mine coordinates)".

---

## SCALE AND UNITS

### Current State

**Units:**
- Depth: Meters (m) - documented in strata layer names
- Deformation: Millimeters (mm) - displayed in UI
- Coordinates: Arbitrary Three.js units
- Status: PARTIAL

**Vertical Exaggeration:**
- Not explicitly documented
- Status: NOT DOCUMENTED

**Recommendation:** Document units and any visualization scaling.

---

## WEB SOCKET INTEGRATION

### Current State

**WebSocket:**
- Used in MineDataContext for live updates ✅
- Not directly used in Mine3DScene.jsx ❌
- Status: PARTIAL

**Real-Time Updates:**
- Sensor status updates via MineDataContext ✅
- 3D scene does not have direct WebSocket subscription ❌
- Status: PARTIAL

**Recommendation:** Consider adding direct WebSocket updates to 3D scene for real-time entity state changes.

---

## PERFORMANCE

### Current State

**Optimizations:**
- Resource disposal on unmount ✅
- Geometry/material cleanup ✅
- 60 FPS target ✅
- Selective layer visibility ✅
- Status: GOOD

**Memory Management:**
- Cleanup in useEffect return ✅
- Scene traversal cleanup ✅
- Status: GOOD

**Recommendation:** Maintain current performance practices.

---

## MOBILE RELATIONSHIP

### Current State

**Mobile:**
- React Native app consumes backend APIs ✅
- No 3D rendering in mobile app ❌
- Status: ACCEPTABLE (mobile = 2D operational view, web = 3D twin)

**Recommendation:** Current approach is acceptable. Full 3D on mobile not required unless explicitly specified.

---

## SUMMARY TABLE

| Entity | Current Source | Live? | Backend Connected? | 2D Connected? | 3D Connected? | Provenance |
|--------|---------------|-------|-------------------|----------------|----------------|-----------|
| Panels | PROCEDURAL | ❌ | ❌ | ⚠️ STATIC SVG | N/A | PROCEDURAL SIMULATION |
| Sensors | STATUS=BACKEND, POSITION=PROCEDURAL | ✅ STATUS | ✅ STATUS | ✅ | N/A | STATUS=LIVE, POSITION=SIMULATION |
| Tunnels | PROCEDURAL | ❌ | ❌ | ⚠️ STATIC | N/A | PROCEDURAL SIMULATION |
| Boreholes | PROCEDURAL | ❌ | ❌ | ⚠️ STATIC | N/A | PROCEDURAL SIMULATION |
| Strata | PROCEDURAL | ❌ | ❌ | ❌ | N/A | ENGINEERING REFERENCE |
| Faults | PROCEDURAL | ❌ | ❌ | ⚠️ STATIC | N/A | ENGINEERING REFERENCE |
| Subsidence | WHAT-IF SLIDER | ❌ | ❌ | ⚠️ MOCK | N/A | WHAT-IF SIMULATION |
| Surface | PROCEDURAL | ❌ | ❌ | ⚠️ STATIC | N/A | ENGINEERING REFERENCE |
| Evacuation | PROCEDURAL GEOMETRY, BACKEND STATUS | ⚠️ STATUS | ⚠️ STATUS | ✅ | N/A | STATUS=LIVE, GEOMETRY=PROCEDURAL |
| Workers | NOT IN 3D | N/A | N/A | ✅ SIMULATION | N/A | N/A |

---

## KEY FINDINGS

### ✅ Strengths

1. **Sensor Status Synchronization** - Sensor status correctly synchronized with backend /api/sensors
2. **2D/3D Verification Mode** - Verification logic exists (window.__TERRAMESH_TWIN_LEDGER)
3. **Simulation Isolation** - What-If simulation correctly isolated from live data
4. **Performance** - Good resource cleanup and 60 FPS target
5. **Provenance** - Simulation correctly labeled as simulation

### ⚠️ Areas for Improvement

1. **Sensor Positions** - Positions are procedural, should be labeled as such
2. **Panel Geometry** - No backend connection, should remain procedural with labeling
3. **Evacuation Routes** - Geometry is procedural, should connect to backend when available
4. **Provenance Labels** - Many procedural layers lack provenance labels in UI
5. **Coordinate System** - Not documented
6. **Units** - Partially documented
7. **Worker Visualization** - Not implemented in 3D scene
8. **WebSocket Integration** - 3D scene not directly subscribed to WebSocket

### ❌ Gaps

1. **Panel Backend Connection** - No panel geometry in database (design choice)
2. **Fault/Borehole Backend** - No database tables (design choice)
3. **Real Deformation Data** - What-If simulation only (no real InSAR integration)

---

## RECOMMENDATIONS

### High Priority (Phase 3)

1. **Add Provenance Labels** - Add provenance labels to all procedural layers in tooltips and legend
2. **Improve ID Mapping** - Use canonical sensor IDs directly if possible
3. **Document Coordinate System** - Document Three.js coordinate system as visualization-only
4. **Expose Verification UI** - Make the 2D/3D verification mode visible to operators

### Medium Priority (Phase 3)

5. **Connect Evacuation Routes** - Connect route geometry to backend when available
6. **Add Worker Visualization** - Add worker markers to 3D scene using backend data
7. **Enhance WebSocket Integration** - Consider direct WebSocket updates to 3D scene

### Low Priority (Future)

8. **Panel Geometry** - Add geometry to panels table if spatial containment needed
9. **Fault/Borehole Tables** - Add database tables if dynamic tracking needed
10. **Real InSAR Integration** - Connect to real InSAR service when available

---

**Document Status:** Phase 3 Baseline Audit Complete  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
