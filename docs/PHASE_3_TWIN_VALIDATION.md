# PHASE 3 TWIN VALIDATION
## TerraMesh AI — Digital Twin Testing and Validation

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

This document defines the validation strategy for the Phase 3 Digital Twin enhancements. It includes test categories, validation rules, acceptance criteria, and regression requirements to ensure the 3D Twin remains synchronized with the canonical backend source while maintaining performance and reliability.

---

## TEST CATEGORIES

### 1. Identity Tests

**Purpose:** Validate canonical ID mapping between backend, GIS, and Twin.

**Tests:**
- Backend ID → Twin ID mapping
- GIS ID → Twin ID mapping
- Duplicate ID rejection
- Missing ID handling
- Array-index identity rejection
- Display-name identity rejection

**Example Test:**
```javascript
test('backend ID maps to twin ID', () => {
  const backendEntity = { id: 'NODE-001', ... };
  const twinEntity = normalizeTwinEntity(backendEntity, 'sensor', 'POSTGIS', 'MEASURED');
  expect(twinEntity.id).toBe('NODE-001');
});
```

---

### 2. Coordinate Tests

**Purpose:** Validate coordinate transformation and GeoJSON handling.

**Tests:**
- Valid latitude range (-90 to +90)
- Valid longitude range (-180 to +180)
- GeoJSON coordinate order [lng, lat]
- EPSG:4326 transformation determinism
- Conversion round-trip accuracy
- Invalid coordinate rejection

**Example Test:**
```javascript
test('latitude must be between -90 and 90', () => {
  const result = validateEpsg4326(91, 0);
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Latitude 91 is out of range (-90 to 90)');
});
```

---

### 3. Provenance Tests

**Purpose:** Validate that every entity has correct provenance classification.

**Tests:**
- Every layer has classification
- Simulated data cannot become measured
- Reference geometry is labeled correctly
- Procedural layers have ENGINEERING label
- Simulation layers have SIMULATION label
- Measured layers have MEASURED label

**Example Test:**
```javascript
test('procedural reference entity has correct provenance', () => {
  const entity = createProceduralReferenceEntity('topsoil', 'Topsoil', 'strata', 'Top layer');
  expect(entity.geometry_source).toBe('PROCEDURAL_REFERENCE');
  expect(entity.data_state).toBe('ENGINEERING');
  expect(entity.source_label).toBe('PROCEDURAL • ENGINEERING REFERENCE');
});
```

---

### 4. Synchronization Tests

**Purpose:** Validate real-time synchronization between backend and Twin.

**Tests:**
- Sensor status update
- Worker location update
- Risk state update
- Route status update
- Stale event rejection
- Duplicate event rejection
- Old timestamp rejection

**Example Test:**
```javascript
test('stale events are rejected', () => {
  const staleEvent = {
    event_id: 'EVT-001',
    entity_id: 'NODE-001',
    timestamp: '2026-09-25T14:00:00Z', // 30 minutes ago
  };
  const isStale = isStaleEvent(staleEvent.timestamp, 60);
  expect(isStale).toBe(true);
});
```

---

### 5. 2D/3D Verification Tests

**Purpose:** Validate consistency between 2D GIS and 3D Twin.

**Tests:**
- Matching ID check
- Coordinate consistency check
- State consistency check
- Provenance consistency check
- Mismatch detection
- Missing entity detection
- Timestamp consistency check

**Example Test:**
```javascript
test('matching IDs produce SYNCED state', () => {
  const check = {
    twin_id: 'NODE-001',
    backend_id: 'NODE-001',
    status_3d: 'DANGER',
    status_2d: 'DANGER',
  };
  const state = determineSyncState(check);
  expect(state).toBe('SYNCED');
});
```

---

### 6. Simulation Isolation Tests

**Purpose:** Validate that simulation cannot modify production state.

**Tests:**
- Simulation does not modify PostgreSQL
- Simulation does not modify Redis
- Simulation does not generate live alerts
- Simulation state resets cleanly
- Simulation cannot trigger FCM/SMS
- Simulation cannot affect evacuation state
- What-If slider does not write to backend

**Example Test:**
```javascript
test('simulation state is isolated from production', () => {
  const simulationState = { deformation: 50, risk: 80 };
  const productionState = { deformation: 30, risk: 62 };
  
  updateSimulationState(simulationState);
  
  expect(productionState.deformation).toBe(30);
  expect(productionState.risk).toBe(62);
});
```

---

### 7. WebSocket Tests

**Purpose:** Validate WebSocket connection and event handling.

**Tests:**
- Connection establishment
- Reconnection with exponential backoff
- Malformed message rejection
- Duplicate message handling
- Stale message handling
- Event ordering (sequence numbers)
- Authentication validation

**Example Test:**
```javascript
test('malformed events are rejected', () => {
  const malformedEvent = { invalid: 'data' };
  const validation = validateTwinEvent(malformedEvent);
  expect(validation.valid).toBe(false);
  expect(validation.errors.length).toBeGreaterThan(0);
});
```

---

### 8. Performance Regression Tests

**Purpose:** Validate that Phase 3 changes do not regress performance.

**Tests:**
- FPS measurement (target: 60 FPS)
- Memory usage measurement
- Object count measurement
- Draw call measurement
- WebSocket update rate measurement
- Scene update time measurement

**Example Test:**
```javascript
test('3D scene maintains 60 FPS', () => {
  const fps = measureFPS();
  expect(fps).toBeGreaterThanOrEqual(55); // Allow 5 FPS variance
});
```

---

## VALIDATION RULES

### TwinEntity Validation

**Required Fields:**
- `id` (string, non-empty)
- `entity_type` (valid enum value)
- `geometry_source` (valid enum value)
- `data_state` (valid enum value)
- `source_label` (string, non-empty)

**Conditional Fields:**
- `latitude` (required for spatial entities, -90 to +90)
- `longitude` (required for spatial entities, -180 to +180)
- `elevation_m` (optional, meters)

**Validation Function:**
```javascript
function validateTwinEntity(entity) {
  const errors = [];

  if (!entity.id) errors.push('Missing required field: id');
  if (!entity.entity_type) errors.push('Missing required field: entity_type');
  if (!Object.values(ENTITY_TYPE).includes(entity.entity_type)) {
    errors.push(`Invalid entity_type: ${entity.entity_type}`);
  }
  // ... more validation

  return { valid: errors.length === 0, errors };
}
```

---

### Coordinate Validation

**Latitude:** -90 to +90 degrees  
**Longitude:** -180 to +180 degrees  
**Elevation:** -1000 to +1000 meters (typical mine range)

**Validation Function:**
```javascript
function validateEpsg4326(lat, lng) {
  const errors = [];

  if (lat < -90 || lat > 90) {
    errors.push(`Latitude ${lat} is out of range (-90 to 90)`);
  }
  if (lng < -180 || lng > 180) {
    errors.push(`Longitude ${lng} is out of range (-180 to 180)`);
  }

  return { valid: errors.length === 0, errors };
}
```

---

### Event Validation

**Required Fields:**
- `event_id` (string, non-empty)
- `entity_id` (string, non-empty)
- `entity_type` (valid enum value)
- `event_type` (valid enum value)
- `source` (string, non-empty)
- `timestamp` (valid ISO 8601)

**Validation Function:**
```javascript
function validateTwinEvent(event) {
  const errors = [];

  if (!event.event_id) errors.push('Missing event_id');
  if (!event.entity_id) errors.push('Missing entity_id');
  if (!isValidISO8601(event.timestamp)) {
    errors.push('Invalid timestamp format');
  }
  // ... more validation

  return { valid: errors.length === 0, errors };
}
```

---

## ACCEPTANCE CRITERIA

### Identity Acceptance

- [ ] All entities use canonical backend IDs
- [ ] No array-index identities remain
- [ ] No display-name identities remain
- [ ] ID mapping is 1:1 between backend, GIS, and Twin

### Coordinate Acceptance

- [ ] EPSG:4326 contract is documented
- [ ] Three.js coordinate transformation is documented
- [ ] Coordinate validation is implemented
- [ ] GeoJSON coordinate order is correct ([lng, lat])

### Provenance Acceptance

- [ ] Every layer has provenance classification
- [ ] Procedural layers have ENGINEERING label
- [ ] Simulation layers have SIMULATION label
- [ ] Measured layers have MEASURED label
- [ ] Simulation cannot become measured

### Synchronization Acceptance

- [ ] Sensor status updates reach Twin
- [ ] Worker location updates reach Twin
- [ ] Risk state updates reach Twin
- [ ] Route status updates reach Twin
- [ ] Stale events are rejected
- [ ] Duplicate events are rejected

### 2D/3D Verification Acceptance

- [ ] 2D → 3D verification is visible
- [ ] 3D → 2D verification is visible
- [ ] Mismatches are explicitly detected
- [ ] Missing entities are detected
- [ ] Sync state is correctly calculated

### Simulation Isolation Acceptance

- [ ] Live and simulation states are isolated
- [ ] Simulation cannot modify production state
- [ ] Simulation cannot generate live alerts
- [ ] What-If slider does not write to backend

### Performance Acceptance

- [ ] 60 FPS target maintained
- [ ] Memory usage is acceptable
- [ ] No memory leaks detected
- [ ] Scene updates are selective (not full reload)

---

## REGRESSION REQUIREMENTS

### Phase 1 Regression

- [ ] React Native app builds successfully
- [ ] React Native tests pass (if affected)
- [ ] Mobile API integration remains functional

### Phase 2 Regression

- [ ] PostGIS architecture unchanged
- [ ] Spatial APIs unchanged
- [ ] Backend tests pass (110 passed, 19 skipped)
- [ ] Frontend build passes
- [ ] 2D GIS remains functional

### Existing Functionality

- [ ] Authentication unchanged
- [ ] RBAC unchanged
- [ ] Sensors unchanged
- [ ] Workers unchanged
- [ ] Evacuation unchanged
- [ ] Risk engine unchanged
- [ ] Redis unchanged
- [ ] MQTT unchanged
- [ ] Reporting unchanged
- [ ] i18n unchanged
- [ ] PWA unchanged

---

## TEST EXECUTION

### Backend Tests

**Command:**
```bash
cd apps/mineguard-core/backend
pytest -q
```

**Expected Result:**
```
110 passed, 19 skipped, 21 warnings
```

### Frontend Build

**Command:**
```bash
cd apps/mineguard-core/frontend
npm run build
```

**Expected Result:**
```
✓ built in X.XXs
```

### Phase 3 Tests

**Command:**
```bash
cd apps/mineguard-core/frontend
npm test -- twinEntityContract
npm test -- coordinateTransform
npm test -- twinValidation
```

**Expected Result:**
```
PASS  All Phase 3 tests
```

---

## PERFORMANCE MEASUREMENT

### FPS Measurement

**Method:** Use Three.js stats or custom FPS counter  
**Target:** 60 FPS (allow 5 FPS variance)  
**Measurement:** Measure over 60 seconds

### Memory Measurement

**Method:** Use browser DevTools Memory profiler  
**Target:** No memory leaks over 10 minutes  
**Measurement:** Measure memory growth over time

### Object Count

**Method:** Count Three.js scene objects  
**Target:** No unbounded object growth  
**Measurement:** Count before and after updates

### Draw Calls

**Method:** Use Three.js renderer info  
**Target:** Minimal draw calls  
**Measurement:** Count draw calls per frame

---

## FAILURE HANDLING

### Test Failure

**Action:**
1. Log failure details
2. Identify root cause
3. Fix issue
4. Re-run test
5. Verify fix

### Regression Failure

**Action:**
1. Identify broken functionality
2. Roll back changes if necessary
3. Fix regression
4. Re-run all tests
5. Verify no new regressions

### Performance Failure

**Action:**
1. Identify performance bottleneck
2. Optimize implementation
3. Re-measure performance
4. Verify target met

---

## DOCUMENTATION VALIDATION

### Documentation Completeness

- [ ] PHASE_3_TWIN_COORDINATE_SYSTEM.md is complete
- [ ] PHASE_3_TWIN_DATA_CONTRACT.md is complete
- [ ] PHASE_3_TWIN_PROVENANCE.md is complete
- [ ] PHASE_3_TWIN_WEBSOCKET.md is complete
- [ ] PHASE_3_TWIN_VERIFICATION.md is complete
- [ ] PHASE_3_TWIN_VALIDATION.md is complete
- [ ] PHASE_3_TWIN_FINAL_AUDIT.md is complete

### Documentation Accuracy

- [ ] Documentation reflects actual implementation
- [ ] No intended functionality documented as completed
- [ ] All examples are accurate
- [ ] All code snippets are tested

---

**Document Status:** Phase 3 Validation Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
