# PHASE 3 TWIN VERIFICATION MODE
## TerraMesh AI — 2D GIS ↔ 3D Twin Consistency Verification

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

The 2D GIS ↔ 3D Twin Verification Mode provides operators and developers with a technical verification interface to ensure consistency between the 2D GIS map and the 3D Digital Twin. This mode validates entity identity, coordinates, state, and provenance across both views.

---

## VERIFICATION MODE PURPOSE

### Goals

1. **Validate Identity Consistency** - Ensure same entity IDs are used in 2D and 3D
2. **Validate Coordinate Consistency** - Ensure coordinates transform correctly
3. **Validate State Consistency** - Ensure risk/status states match
4. **Validate Provenance Consistency** - Ensure data sources are correctly labeled
5. **Detect Mismatches** - Identify entities that are missing or inconsistent

### Use Cases

- **Operator Validation:** Verify Twin is correctly synchronized with backend
- **Developer Debugging:** Identify synchronization issues during development
- **Quality Assurance:** Validate 2D/3D consistency before deployment
- **Audit Trail:** Document synchronization state for compliance

---

## VERIFICATION MODE ACCESS

### Activation Methods

**Method 1: Settings Panel**
- Navigate to Settings → Twin Verification
- Toggle "Enable Verification Mode"

**Method 2: Developer Console**
```javascript
window.__TERRAMESH_TWIN_VERIFY()
```

**Method 3: URL Parameter**
```javascript
?verification=true
```

### UI Indicators

**Verification Mode Active:**
- Badge: `VERIFICATION MODE`
- Color: Cyan
- Position: Top-right corner of Twin view

---

## VERIFICATION CHECKS

### Identity Verification

**Check:** Backend ID ↔ GIS ID ↔ Twin ID  
**Validation:** All three IDs must match exactly  
**Result:** PASS / FAIL

**Example:**
```
Backend ID: NODE-001
GIS ID: NODE-001
Twin ID: NODE-001
Result: PASS
```

**Failure Case:**
```
Backend ID: NODE-001
GIS ID: NODE-001
Twin ID: S-17B-01 (heuristic match)
Result: FAIL (ID mismatch)
```

---

### Coordinate Verification

**Check:** GIS coordinate ↔ Twin projected coordinate  
**Validation:** Transformed coordinates must match within tolerance  
**Tolerance:** 5% of visualization scale (documented)  
**Result:** PASS / FAIL

**Example:**
```
GIS: lat=23.6543, lng=86.4245
Twin: x=-6.0, y=-11.0, z=2.0 (procedural)
Result: N/A (procedural layout, not measured)
```

**Example (with transformation):**
```
GIS: lat=23.6543, lng=86.4245
Twin (transformed): x=-6.12, y=-11.05, z=2.01
Tolerance: 0.1 Three.js units
Result: PASS (within tolerance)
```

---

### State Verification

**Check:** GIS status ↔ Twin status  
**Validation:** Status values must match  
**Result:** PASS / FAIL

**Example:**
```
GIS Status: DANGER
Twin Status: DANGER
Result: PASS
```

**Failure Case:**
```
GIS Status: DANGER
Twin Status: WARNING
Result: FAIL (state mismatch)
```

---

### Provenance Verification

**Check:** GIS source ↔ Twin source  
**Validation:** Source classifications must match  
**Result:** PASS / FAIL

**Example:**
```
GIS Source: POSTGIS • MEASURED
Twin Source: POSTGIS • MEASURED
Result: PASS
```

**Failure Case:**
```
GIS Source: POSTGIS • MEASURED
Twin Source: PROCEDURAL • SIMULATION
Result: FAIL (provenance mismatch)
```

---

### Timestamp Verification

**Check:** GIS timestamp ↔ Twin timestamp  
**Validation:** Timestamps must be within 5 seconds  
**Result:** PASS / FAIL / STALE

**Example:**
```
GIS Timestamp: 2026-09-25T14:30:00Z
Twin Timestamp: 2026-09-25T14:30:02Z
Result: PASS (within 5 seconds)
```

**Stale Case:**
```
GIS Timestamp: 2026-09-25T14:30:00Z
Twin Timestamp: 2026-09-25T14:25:00Z
Result: STALE (5 minutes old)
```

---

## SYNCHRONIZATION STATES

### SYNCED

**Definition:** All checks pass  
**Icon:** ✓  
**Color:** Green/emerald  
**Label:** `SYNCED`

**Requirements:**
- ID match: YES
- Coordinate match: YES (or N/A for procedural)
- State match: YES
- Provenance match: YES
- Timestamp match: YES (or N/A for static)

---

### STALE

**Definition:** Checks pass but data is old  
**Icon:** ⏰  
**Color:** Amber/yellow  
**Label:** `STALE`

**Requirements:**
- ID match: YES
- State match: YES
- Provenance match: YES
- Timestamp match: NO (older than 5 seconds)

---

### MISSING_IN_TWIN

**Definition:** Entity exists in GIS but not in Twin  
**Icon:** ❌  
**Color:** Red/rose  
**Label:** `MISSING IN TWIN`

**Requirements:**
- GIS entity: EXISTS
- Twin entity: MISSING

---

### MISSING_IN_GIS

**Definition:** Entity exists in Twin but not in GIS  
**Icon:** ❌  
**Color:** Red/rose  
**Label:** `MISSING IN GIS`

**Requirements:**
- GIS entity: MISSING
- Twin entity: EXISTS

---

### MISMATCH

**Definition:** Checks fail (ID, state, or provenance mismatch)  
**Icon:** ⚠️  
**Color:** Orange  
**Label:** `MISMATCH`

**Requirements:**
- ID match: NO
- OR State match: NO
- OR Provenance match: NO

---

### UNKNOWN

**Definition:** Cannot determine synchronization state  
**Icon:** ❓  
**Color:** Gray/slate  
**Label:** `UNKNOWN`

**Requirements:**
- Insufficient data to determine state

---

## VERIFICATION UI COMPONENTS

### Verification Panel

**Layout:**
```
┌─────────────────────────────────────────────┐
│ VERIFICATION MODE                          │
├─────────────────────────────────────────────┤
│                                            │
│ Entity: Sensor NODE-001                    │
│ ─────────────────────────────────────────── │
│ ID Match:          ✓ PASS                  │
│ Coordinate Match:  N/A (procedural)       │
│ State Match:       ✓ PASS                  │
│ Provenance Match:  ✓ PASS                  │
│ Timestamp Match:   ✓ PASS                  │
│ ─────────────────────────────────────────── │
│ Overall State:     SYNCED                  │
│                                            │
└─────────────────────────────────────────────┘
```

### Entity List

**Table Format:**
```
┌──────────┬─────────────┬──────────┬──────────────┬────────────────┐
│ Entity   │ GIS ID      │ Twin ID  │ State        │ Provenance     │
├──────────┼─────────────┼──────────┼──────────────┼────────────────┤
│ Sensor   │ NODE-001    │ NODE-001 │ SYNCED       │ POSTGIS•MEASURED│
│ Sensor   │ NODE-002    │ NODE-002 │ STALE        │ POSTGIS•MEASURED│
│ Sensor   │ NODE-003    │ S-17B-01 │ MISMATCH     │ HEURISTIC      │
│ Sensor   │ NODE-004    │ —        │ MISSING TWIN │ POSTGIS•MEASURED│
│ Worker   │ WORKER-001  │ —        │ MISSING TWIN │ BACKEND•SIM    │
└──────────┴─────────────┴──────────┴──────────────┴────────────────┘
```

### Summary Statistics

**Counts:**
```
Total Entities: 50
Synced: 45 (90%)
Stale: 3 (6%)
Missing in Twin: 1 (2%)
Missing in GIS: 1 (2%)
Mismatch: 0 (0%)
```

---

## VERIFICATION MODE INTERACTION

### Cross-View Highlighting

**GIS → Twin:**
1. Select entity in 2D GIS
2. Twin highlights corresponding entity
3. Verification panel shows sync state

**Twin → GIS:**
1. Select entity in 3D Twin
2. GIS highlights corresponding entity
3. Verification panel shows sync state

**Missing Entity:**
1. Select entity in one view
2. Other view shows "MISSING" indicator
3. Verification panel shows MISSING state

---

## VERIFICATION API

### Window API

**Get Verification Snapshot:**
```javascript
const snapshot = window.__TERRAMESH_TWIN_VERIFY();
```

**Response:**
```javascript
{
  checked_at: "2026-09-25T14:30:00Z",
  panels: [],
  nodes: [
    {
      twin_id: "NODE-001",
      backend_id: "NODE-001",
      status_3d: "DANGER",
      source: "LIVE BACKEND (/api/sensors)",
      id_match: true,
      state_match: true,
      provenance_match: true,
      timestamp_match: true,
      overall_state: "SYNCED"
    }
  ],
  ok: true,
  provenance: {
    geometry: "SIMULATED (procedural 3D)",
    sensor_identity: "LIVE BACKEND (/api/sensors)",
    risk_state: "LIVE BACKEND (/api/sensors status)"
  }
}
```

### Ledger API

**Access Entity Ledger:**
```javascript
const ledger = window.__TERRAMESH_TWIN_LEDGER;
```

**Response:**
```javascript
[
  {
    twin_id: "NODE-001",
    backend_id: "NODE-001",
    status_3d: "DANGER",
    source: "LIVE BACKEND (/api/sensors)"
  }
]
```

---

## AUTOMATED VERIFICATION TESTS

### Test Suite

**Identity Tests:**
- Test backend ID → Twin ID mapping
- Test GIS ID → Twin ID mapping
- Test duplicate ID rejection
- Test missing ID handling

**Coordinate Tests:**
- Test valid latitude/longitude
- Test GeoJSON coordinate order
- Test EPSG:4326 transformation
- Test conversion determinism

**State Tests:**
- Test sensor status synchronization
- Test worker status synchronization
- Test risk state synchronization
- Test route status synchronization

**Provenance Tests:**
- Test every layer has classification
- Test simulated data cannot become measured
- Test reference geometry is labeled correctly

---

## VERIFICATION MODE LIMITATIONS

### Known Limitations

1. **Procedural Coordinates:** Procedural entities have N/A coordinate match (by design)
2. **Static Layers:** Static engineering layers have N/A timestamp match (by design)
3. **Backend Offline:** Verification cannot run if backend is offline
4. **WebSocket Disconnected:** Real-time verification requires WebSocket connection

### Tolerance Limits

**Coordinate Tolerance:** 5% of visualization scale  
**Timestamp Tolerance:** 5 seconds for live data  
**State Tolerance:** Exact match required (no tolerance)

---

## VERIFICATION MODE SECURITY

### Access Control

**Role Requirements:**
- **Operator:** Can view verification mode
- **Developer:** Can view and debug verification mode
- **Admin:** Can access verification logs and history

### Audit Trail

**Logged Events:**
- Verification mode activation
- Verification checks performed
- Mismatches detected
- Corrections made

---

## VERIFICATION MODE DOCUMENTATION

### User Documentation

**Operator Guide:**
- How to enable verification mode
- How to interpret verification results
- How to report synchronization issues

**Developer Guide:**
- Verification API reference
- How to add verification checks
- How to debug synchronization issues

---

## IMPLEMENTATION STATUS

### Current Implementation (Phase 3)

**Implemented:**
- ✅ Verification logic exists (window.__TERRAMESH_TWIN_VERIFY)
- ✅ Entity ledger exists (window.__TERRAMESH_TWIN_LEDGER)
- ✅ Basic sync state calculation

**Remaining Work:**
- ⚠️ UI exposure (not yet visible to operators)
- ⚠️ Cross-view highlighting (not yet implemented)
- ⚠️ Automated test suite (not yet implemented)
- ⚠️ Coordinate transformation verification (not yet implemented)

---

**Document Status:** Phase 3 Verification Mode Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
