# PHASE 3 TWIN DATA CONTRACT
## TerraMesh AI — Digital Twin Data Specification

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

This document defines the canonical data contract for the TerraMesh AI Digital Twin. The contract ensures that all entities visualized in the 3D Twin have consistent identity, provenance, and state representation across the backend, 2D GIS, and 3D Twin.

---

## CANONICAL ENTITY CONTRACT

### TwinEntity Interface

```typescript
interface TwinEntity {
  // Identity
  id: string;  // Canonical identifier from backend
  entity_type: "panel" | "zone" | "sensor" | "worker" | "route" | "borehole" | "fault" | "tunnel" | "strata" | "surface" | "risk_area";
  name?: string;  // Human-readable name

  // Provenance
  geometry_source: "POSTGIS" | "BACKEND" | "PROCEDURAL_REFERENCE" | "SIMULATION";
  data_state: "MEASURED" | "MODEL" | "SIMULATION" | "ENGINEERING" | "OPERATOR" | "SATELLITE" | "EDGE_HARDWARE" | "EDGE_EMULATOR" | "REFERENCE";

  // State
  status?: string;  // Operational status

  // Spatial (canonical EPSG:4326)
  latitude?: number;  // Latitude in degrees
  longitude?: number;  // Longitude in degrees
  elevation_m?: number;  // Elevation in meters

  // Metadata
  timestamp?: string;  // Last update timestamp (ISO 8601)
  version?: string;  // Data version
  source_label: string;  // Human-readable source description
  confidence?: number | null;  // Confidence score (0-100)
  last_updated?: string | null;  // Last update time (human-readable)
}
```

---

## GEOMETRY SOURCE CLASSIFICATIONS

### POSTGIS

**Definition:** Geometry stored in PostgreSQL/PostGIS with spatial indexing.  
**CRS:** EPSG:4326 (WGS84)  
**Survey Grade:** YES  
**Operational Use:** YES  
**Examples:** 
- Sensor locations
- Worker locations
- Risk zones
- Evacuation routes

**Label:** `POSTGIS • MEASURED` or `POSTGIS • ENGINEERING`

---

### BACKEND

**Definition:** Geometry provided by backend API, may or may not be PostGIS-backed.  
**CRS:** EPSG:4326 (WGS84)  
**Survey Grade:** YES (if from PostGIS)  
**Operational Use:** YES  
**Examples:**
- Sensor telemetry state
- Worker tracking state
- Calculated risk zones

**Label:** `BACKEND • MEASURED` or `BACKEND • SIMULATION`

---

### PROCEDURAL_REFERENCE

**Definition:** Geometry procedurally generated for visualization, represents engineering reference data.  
**CRS:** Three.js world coordinates (arbitrary)  
**Survey Grade:** NO  
**Operational Use:** NO  
**Examples:**
- Geological strata layers
- Fault planes
- Borehole shafts
- Tunnel network
- Surface terrain

**Label:** `PROCEDURAL • ENGINEERING REFERENCE`

---

### SIMULATION

**Definition:** Geometry procedurally generated for what-if simulation scenarios.  
**CRS:** Three.js world coordinates (arbitrary)  
**Survey Grade:** NO  
**Operational Use:** NO  
**Examples:**
- What-If deformation scenarios
- Simulated worker positions
- Simulated sensor failures

**Label:** `SIMULATION • WHAT-IF`

---

## DATA STATE CLASSIFICATIONS

### MEASURED

**Definition:** Data from field measurements, sensors, or hardware.  
**Sources:** IoT sensors, GNSS, InSAR, survey equipment  
**Confidence:** High (if hardware-validated)  
**Examples:**
- Sensor telemetry
- Worker GPS/RFID tracking
- Real InSAR deformation

**Label:** `MEASURED`

---

### MODEL

**Definition:** Data from predictive models or risk calculations.  
**Sources:** Risk engine, AI models, predictive analytics  
**Confidence:** Model-dependent  
**Examples:**
- Predicted risk zones
- Forecasted deformation
- AI-predicted incidents

**Label:** `MODEL`

---

### SIMULATION

**Definition:** Data from what-if scenarios or simulation runs.  
**Sources:** What-If slider, simulation lab, emulators  
**Confidence:** Not applicable (simulation)  
**Examples:**
- What-If deformation scenarios
- Simulated sensor failures
- Hypothetical evacuation routes

**Label:** `SIMULATION`

---

### ENGINEERING

**Definition:** Static engineering reference data from design documents.  
**Sources:** Mine plans, engineering drawings, reference geometry  
**Confidence:** High (design documents)  
**Examples:**
- Geological strata layers
- Fault plane locations
- Borehole locations
- Tunnel network layout

**Label:** `ENGINEERING`

---

### OPERATOR

**Definition:** Data manually entered or modified by operators.  
**Sources:** Operator input, manual overrides  
**Confidence:** Operator-dependent  
**Examples:**
- Manual zone assignments
- Operator annotations
- Manual risk overrides

**Label:** `OPERATOR`

---

### SATELLITE

**Definition:** Data from satellite remote sensing.  
**Sources:** Sentinel-1, NISAR, other satellite providers  
**Confidence:** Provider-dependent  
**Examples:**
- InSAR deformation measurements
- Satellite imagery
- Remote sensing data

**Label:** `SATELLITE`

---

### EDGE_HARDWARE

**Definition:** Data from edge hardware devices (not backend).  
**Sources:** Local sensors, edge gateways, mobile devices  
**Confidence:** Hardware-dependent  
**Examples:**
- Local sensor readings
- Mobile device telemetry
- Edge gateway data

**Label:** `EDGE_HARDWARE`

---

### EDGE_EMULATOR

**Definition:** Data from edge emulators or simulators.  
**Sources:** Emulators, test harnesses, dev environments  
**Confidence:** Not applicable (emulation)  
**Examples:**
- Emulated sensor data
- Test harness output
- Development environment data

**Label:** `EDGE_EMULATOR`

---

### REFERENCE

**Definition:** Static reference data for visualization or comparison.  
**Sources:** Reference documents, historical data, benchmarks  
**Confidence:** Reference-dependent  
**Examples:**
- Historical baselines
- Reference benchmarks
- Visualization reference data

**Label:** `REFERENCE`

---

## ENTITY TYPE CLASSIFICATIONS

### PANEL

**Definition:** Underground extraction panel or longwall face.  
**Source:** Engineering reference (procedural) or PostGIS (if geometry added)  
**ID:** Canonical panel ID from backend (if available)  
**Provenance:** `ENGINEERING` (procedural) or `MEASURED` (PostGIS)

---

### ZONE

**Definition:** Operational zone (danger, warning, safe, evacuation).  
**Source:** PostGIS  
**ID:** Canonical zone ID from backend  
**Provenance:** `MEASURED` or `MODEL`

---

### SENSOR

**Definition:** IoT sensor node.  
**Source:** PostGIS  
**ID:** Canonical sensor ID from backend  
**Provenance:** `MEASURED` (live telemetry) or `SIMULATION` (simulated data)

---

### WORKER

**Definition:** Mine worker or personnel.  
**Source:** PostGIS  
**ID:** Canonical worker ID from backend  
**Provenance:** `MEASURED` (GPS/RFID) or `SIMULATION` (simulated tracking)

---

### ROUTE

**Definition:** Evacuation route or path.  
**Source:** PostGIS (if geometry available) or procedural reference  
**ID:** Canonical route ID from backend  
**Provenance:** `MEASURED` (PostGIS) or `ENGINEERING` (procedural)

---

### BOREHOLE

**Definition:** Monitoring borehole or extensometer.  
**Source:** Engineering reference (procedural) or PostGIS (if geometry added)  
**ID:** Canonical borehole ID from backend (if available)  
**Provenance:** `ENGINEERING` (procedural) or `MEASURED` (PostGIS)

---

### FAULT

**Definition:** Geological fault plane.  
**Source:** Engineering reference (procedural) or PostGIS (if geometry added)  
**ID:** Canonical fault ID from backend (if available)  
**Provenance:** `ENGINEERING` (procedural) or `MEASURED` (PostGIS)

---

### TUNNEL

**Definition:** Underground tunnel or drift.  
**Source:** Engineering reference (procedural) or PostGIS (if geometry added)  
**ID:** Canonical tunnel ID from backend (if available)  
**Provenance:** `ENGINEERING` (procedural) or `MEASURED` (PostGIS)

---

### STRATA

**Definition:** Geological strata layer.  
**Source:** Engineering reference (procedural)  
**ID:** Canonical strata ID from backend (if available)  
**Provenance:** `ENGINEERING`

---

### SURFACE

**Definition:** Surface terrain or infrastructure.  
**Source:** Engineering reference (procedural) or PostGIS (if geometry added)  
**ID:** Canonical surface ID from backend (if available)  
**Provenance:** `ENGINEERING` (procedural) or `MEASURED` (PostGIS)

---

### RISK_AREA

**Definition:** Calculated risk area or zone.  
**Source:** Backend risk engine  
**ID:** Canonical risk area ID from backend  
**Provenance:** `MODEL`

---

## CANONICAL ID MAPPING

### Mapping Rules

1. **Backend ID is Canonical:** The backend entity ID is the single source of truth.
2. **No Array Index Identity:** Never use array indexes as primary identifiers.
3. **No Display Name Identity:** Never use display names as primary identifiers.
4. **Consistent Across Views:** Same ID must be used in 2D GIS and 3D Twin.

### Mapping Examples

**Sensor:**
```
Backend ID: NODE-001
GIS ID: NODE-001
Twin ID: NODE-001
```

**Worker:**
```
Backend ID: WORKER-001
GIS ID: WORKER-001
Twin ID: WORKER-001
```

**Zone:**
```
Backend ID: ZONE-001
GIS ID: ZONE-001
Twin ID: ZONE-001
```

**Route:**
```
Backend ID: ROUTE-001
GIS ID: ROUTE-001
Twin ID: ROUTE-001
```

---

## SPATIAL DATA CONTRACT

### Coordinate System

**Canonical:** EPSG:4326 (WGS84)  
**Coordinate Order:** `[longitude, latitude]` (GeoJSON standard)  
**Units:** Decimal degrees  
**Elevation:** Meters (MSL or relative to surface)

### Geometry Formats

**Point:**
```json
{
  "type": "Point",
  "coordinates": [86.4245, 23.6543]
}
```

**Polygon:**
```json
{
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
```

**LineString:**
```json
{
  "type": "LineString",
  "coordinates": [
    [86.4245, 23.6543],
    [86.4255, 23.6543],
    [86.4255, 23.6553]
  ]
}
```

---

## TEMPORAL DATA CONTRACT

### Timestamp Format

**Standard:** ISO 8601  
**Example:** `2026-09-25T14:30:00Z`  
**Timezone:** UTC (preferred) or local with offset

### Last Updated Fields

**API Response:** `last_update` (ISO 8601)  
**Twin Entity:** `timestamp` (ISO 8601)  
**UI Display:** `last_updated` (human-readable)

---

## CONFIDENCE SCORES

### Scale

**Range:** 0 to 100  
**Interpretation:**
- 90-100: High confidence (validated)
- 70-89: Medium confidence (likely accurate)
- 50-69: Low confidence (uncertain)
- 0-49: Very low confidence (unverified)

### Usage

**Measured Data:** Confidence based on hardware validation  
**Model Data:** Confidence based on model accuracy  
**Reference Data:** Confidence based on source reliability

---

## VALIDATION RULES

### Required Fields

All TwinEntity objects must have:
- `id` (string, non-empty)
- `entity_type` (valid enum value)
- `geometry_source` (valid enum value)
- `data_state` (valid enum value)
- `source_label` (string, non-empty)

### Optional Fields

Conditional fields based on entity type:
- `latitude` (required for spatial entities)
- `longitude` (required for spatial entities)
- `elevation_m` (optional)
- `status` (optional)
- `timestamp` (optional)
- `confidence` (optional)

### Validation Ranges

**Latitude:** -90 to +90 degrees  
**Longitude:** -180 to +180 degrees  
**Elevation:** -1000 to +1000 meters (typical mine range)  
**Confidence:** 0 to 100

---

## EVENT CONTRACT

### TwinRealtimeEvent Interface

```typescript
interface TwinRealtimeEvent {
  event_id: string;  // Unique event identifier
  entity_id: string;  // Canonical entity ID
  entity_type: string;  // Entity type
  event_type: string;  // Event type (status_update, telemetry_update, etc.)
  source: string;  // Event source (websocket, mqtt, etc.)
  timestamp: string;  // Event timestamp (ISO 8601)
  sequence?: number;  // Event sequence number
  payload: unknown;  // Event payload
}
```

### Event Types

**Status Update:** Entity status changed  
**Telemetry Update:** New telemetry value received  
**Risk Update:** Risk state changed  
**Location Update:** Entity location changed  
**Alert:** Alert triggered or cleared

---

## DEGRADATION STATES

### Connection States

**Backend:** ONLINE, OFFLINE, DEGRADED  
**WebSocket:** CONNECTED, DISCONNECTED, RECONNECTING  
**Sensors:** LIVE, STALE, OFFLINE, UNKNOWN  
**Workers:** LIVE, STALE, MISSING, UNKNOWN  
**Routes:** LIVE, STALE, BLOCKED, UNKNOWN

### Data States

**FRESH:** Data less than 1 minute old  
**STALE:** Data 1-10 minutes old  
**OLD:** Data 10-60 minutes old  
**EXPIRED:** Data more than 60 minutes old

---

## IMPLEMENTATION NOTES

### TwinEntity Normalization

Use `normalizeTwinEntity()` from `twinEntityContract.js` to normalize backend entities into TwinEntity objects.

### Procedural Reference Entities

Use `createProceduralReferenceEntity()` for engineering reference layers.

### Simulation Entities

Use `createSimulationEntity()` for what-if scenarios.

### Validation

Use `validateTwinEntity()` to validate TwinEntity objects before use.

---

**Document Status:** Phase 3 Data Contract Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
