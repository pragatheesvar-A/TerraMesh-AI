# PHASE 3 TWIN WEBSOCKET INTEGRATION
## TerraMesh AI — Real-Time Digital Twin Updates

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

The Digital Twin uses WebSocket integration to receive real-time updates from the backend. This document describes the WebSocket architecture, event contract, validation rules, and update behavior for the 3D Twin.

---

## WEBSOCKET ARCHITECTURE

### Data Flow

```
MQTT
    ↓
Backend Processing
    ↓
Database/Risk Pipeline
    ↓
WebSocket Event
    ↓
Frontend Event Router
    ↓
Twin State Store
    ↓
Specific Entity Update
    ↓
3D Scene Update
```

### Connection Management

**WebSocket URL:** `/ws/live-monitoring`  
**Protocol:** WebSocket (ws:// or wss://)  
**Authentication:** API key via header (same as REST API)  
**Auto-Reconnect:** Yes (exponential backoff, capped at 30s)

---

## WEBSOCKET EVENT CONTRACT

### TwinRealtimeEvent Interface

```typescript
interface TwinRealtimeEvent {
  event_id: string;        // Unique event identifier
  entity_id: string;       // Canonical entity ID
  entity_type: string;     // Entity type (sensor, worker, zone, etc.)
  event_type: string;      // Event type (status_update, telemetry_update, etc.)
  source: string;          // Event source (websocket, mqtt, etc.)
  timestamp: string;       // Event timestamp (ISO 8601)
  sequence?: number;       // Event sequence number
  payload: unknown;        // Event payload
}
```

### Event Types

**status_update:** Entity status changed  
**telemetry_update:** New telemetry value received  
**risk_update:** Risk state changed  
**location_update:** Entity location changed  
**alert:** Alert triggered or cleared  
**worker_update:** Worker state changed  
**route_update:** Route status changed

---

## EVENT VALIDATION

### Required Fields

Every event must have:
- `event_id` (string, non-empty)
- `entity_id` (string, non-empty)
- `entity_type` (valid enum value)
- `event_type` (valid enum value)
- `source` (string, non-empty)
- `timestamp` (valid ISO 8601)
- `payload` (object or null)

### Validation Rules

**Event ID:** Must be unique (UUID format preferred)  
**Entity ID:** Must match canonical backend ID  
**Entity Type:** Must be valid entity type  
**Timestamp:** Must be ISO 8601 format  
**Sequence:** Must be monotonically increasing (if present)

### Validation Functions

```javascript
function validateTwinEvent(event) {
  const errors = [];

  if (!event.event_id) errors.push('Missing event_id');
  if (!event.entity_id) errors.push('Missing entity_id');
  if (!event.entity_type) errors.push('Missing entity_type');
  if (!event.event_type) errors.push('Missing event_type');
  if (!event.source) errors.push('Missing source');
  if (!event.timestamp) errors.push('Missing timestamp');
  if (!isValidISO8601(event.timestamp)) errors.push('Invalid timestamp format');

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## EVENT HANDLING BEHAVIOR

### Stale Event Rejection

**Rule:** Events older than 60 seconds are rejected  
**Comparison:** Event timestamp vs current time  
**Action:** Log warning, discard event

**Example:**
```javascript
if (isStaleEvent(event.timestamp, 60)) {
  console.warn(`Stale event rejected: ${event.event_id}`);
  return;
}
```

### Duplicate Event Handling

**Rule:** Duplicate events (same event_id) are ignored  
**Tracking:** Maintain recent event_id cache  
**Action:** Log debug, discard duplicate

**Example:**
```javascript
if (recentEventIds.has(event.event_id)) {
  console.debug(`Duplicate event ignored: ${event.event_id}`);
  return;
}
recentEventIds.add(event.event_id);
```

### Sequence/Timestamp Handling

**Rule:** Events with older timestamps than current state are rejected  
**Comparison:** Event timestamp vs entity.last_updated  
**Action:** Log warning, discard event

**Example:**
```javascript
const currentEntity = getEntity(event.entity_id);
if (currentEntity && new Date(event.timestamp) <= new Date(currentEntity.timestamp)) {
  console.warn(`Older event rejected: ${event.event_id}`);
  return;
}
```

---

## ENTITY UPDATE BEHAVIOR

### Sensor Updates

**Event Type:** `telemetry_update` or `status_update`  
**Update Fields:**
- status
- last_update
- telemetry values (displacement, tilt, vibration, etc.)
- risk state

**3D Scene Update:**
- Update sensor marker color based on status
- Update sensor marker pulsing animation
- Update tooltip data
- Do NOT recreate sensor mesh

**Example:**
```javascript
function updateSensorMesh(entity, event) {
  const mesh = getSensorMesh(entity.id);
  if (mesh) {
    mesh.material.color.setHex(getStatusColor(event.payload.status));
    mesh.userData.status = event.payload.status;
    mesh.userData.last_updated = event.timestamp;
  }
}
```

### Worker Updates

**Event Type:** `location_update` or `status_update`  
**Update Fields:**
- latitude
- longitude
- zone
- safety state
- last_update

**3D Scene Update:**
- Update worker marker position
- Update worker marker color based on safety state
- Update tooltip data
- Do NOT recreate worker mesh

**Example:**
```javascript
function updateWorkerMesh(entity, event) {
  const mesh = getWorkerMesh(entity.id);
  if (mesh) {
    const threeJsCoords = epsg4326ToThreeJs(
      event.payload.latitude,
      event.payload.longitude,
      event.payload.elevation
    );
    mesh.position.set(threeJsCoords.x, threeJsCoords.y, threeJsCoords.z);
    mesh.material.color.setHex(getSafetyStateColor(event.payload.safety_state));
  }
}
```

### Risk Updates

**Event Type:** `risk_update`  
**Update Fields:**
- risk level
- risk score
- risk zone geometry (if changed)

**3D Scene Update:**
- Update zone color based on risk level
- Update zone opacity based on risk score
- Update tooltip data
- Do NOT recreate zone mesh unless geometry changed

**Example:**
```javascript
function updateRiskZoneMesh(entity, event) {
  const mesh = getRiskZoneMesh(entity.id);
  if (mesh) {
    mesh.material.color.setHex(getRiskColor(event.payload.risk_level));
    mesh.material.opacity = getRiskOpacity(event.payload.risk_score);
  }
}
```

### Route Updates

**Event Type:** `route_update`  
**Update Fields:**
- route status (blocked/open)
- route geometry (if changed)

**3D Scene Update:**
- Update route color based on status
- Update route visibility (blocked routes may be hidden)
- Update tooltip data
- Do NOT recreate route mesh unless geometry changed

**Example:**
```javascript
function updateRouteMesh(entity, event) {
  const mesh = getRouteMesh(entity.id);
  if (mesh) {
    mesh.material.color.setHex(
      event.payload.status === 'blocked' ? 0xef4444 : 0x10b981
    );
    mesh.visible = event.payload.status !== 'blocked';
  }
}
```

---

## WEBSOCKET CONNECTION MANAGEMENT

### Connection States

**CONNECTED:** WebSocket is connected and receiving events  
**DISCONNECTED:** WebSocket is disconnected  
**RECONNECTING:** WebSocket is attempting to reconnect  
**FAILED:** WebSocket connection failed

### Reconnection Logic

**Exponential Backoff:**
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5+: 30 seconds (capped)

**Implementation:**
```javascript
let wsReconnectAttempts = 0;
let wsReconnectTimer = null;

const connectWebSocket = () => {
  ws = new WebSocket(wsUrl());

  ws.onopen = () => {
    wsReconnectAttempts = 0;
    console.log("[WS] Connected to AI Backend WebSocket");
  };

  ws.onclose = () => {
    const delay = Math.min(30000, Math.pow(2, wsReconnectAttempts) * 1000);
    wsReconnectAttempts++;
    wsReconnectTimer = setTimeout(connectWebSocket, delay);
  };
};
```

### Authentication

**Method:** API key in WebSocket URL or header  
**Source:** localStorage (mineguard_auth_token or terramesh_api_key)  
**Validation:** Backend validates API key on connection

---

## DEGRADATION HANDLING

### Backend Offline

**Detection:** WebSocket connection fails  
**Behavior:**
- Display "BACKEND OFFLINE" indicator
- Show last-known data with stale label
- Attempt reconnection with exponential backoff

### WebSocket Disconnected

**Detection:** WebSocket connection lost  
**Behavior:**
- Display "WEBSOCKET DISCONNECTED" indicator
- Show last-known data with stale label
- Attempt reconnection with exponential backoff

### Malformed Event

**Detection:** Event validation fails  
**Behavior:**
- Log warning with validation errors
- Discard malformed event
- Do not crash Twin scene

### Stale Event

**Detection:** Event timestamp older than 60 seconds  
**Behavior:**
- Log warning
- Discard stale event
- Do not update entity state

---

## PERFORMANCE CONSIDERATIONS

### Update Rate Limiting

**Maximum Update Rate:** 10 updates per second per entity  
**Implementation:** Debounce rapid updates for same entity

**Example:**
```javascript
const updateDebounce = new Map();

function debouncedUpdate(entityId, updateFn) {
  if (updateDebounce.has(entityId)) {
    clearTimeout(updateDebounce.get(entityId));
  }
  updateDebounce.set(entityId, setTimeout(() => {
    updateFn();
    updateDebounce.delete(entityId);
  }, 100));
}
```

### Scene Update Optimization

**Selective Updates:** Update only affected entities  
**No Full Scene Reload:** Never reload entire 3D scene on telemetry update  
**Mesh Reuse:** Reuse existing meshes, update properties only

---

## WEBSOCKET API

### Connect

```javascript
const ws = new WebSocket(wsUrl());
```

### Send (if needed)

```javascript
ws.send(JSON.stringify({
  type: 'SUBSCRIBE',
  entity_id: 'NODE-001',
  entity_type: 'sensor'
}));
```

### Receive

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  handleTwinEvent(msg);
};
```

---

## IMPLEMENTATION STATUS

### Current Implementation (Phase 3)

**Implemented:**
- ✅ WebSocket connection exists in MineDataContext
- ✅ Exponential backoff reconnection
- ✅ Event buffer and flush mechanism
- ✅ Sensor update handling via state

**Remaining Work:**
- ⚠️ Direct Twin WebSocket subscription (not yet implemented)
- ⚠️ Twin-specific event validation (not yet implemented)
- ⚠️ Entity-specific update functions (not yet implemented)
- ⚠️ Stale event rejection (not yet implemented)
- ⚠️ Duplicate event handling (not yet implemented)

---

## LIMITATIONS

### Known Limitations

1. **No Direct Twin Subscription:** Twin does not have direct WebSocket subscription (uses MineDataContext)
2. **No Entity-Specific Validation:** Generic event validation only
3. **No Sequence Tracking:** Event sequence numbers not tracked
4. **No Update Rate Limiting:** No per-entity update rate limiting

### Future Enhancements

1. **Direct Twin Subscription:** Add direct WebSocket subscription to Twin component
2. **Entity-Specific Validation:** Add validation per entity type
3. **Sequence Tracking:** Track event sequence numbers for ordering
4. **Update Rate Limiting:** Add per-entity update rate limiting

---

**Document Status:** Phase 3 WebSocket Integration Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
