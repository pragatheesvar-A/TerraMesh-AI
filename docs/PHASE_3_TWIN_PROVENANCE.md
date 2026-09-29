# PHASE 3 TWIN PROVENANCE MODEL
## TerraMesh AI — Data Source Transparency

**Document Version:** 1.0  
**Last Updated:** 2026-09-25  
**Status:** DOCUMENTED

---

## EXECUTIVE SUMMARY

This document defines the provenance model for the TerraMesh AI Digital Twin. Every entity visualized in the 3D Twin must have explicit provenance classification to ensure data source transparency and prevent mixing of measured, simulated, and reference data.

---

## PROVENANCE PRINCIPLES

### Zero-Trust Rules

1. **Never fabricate live telemetry** - All live data must come from actual backend sources.
2. **Never represent procedural geometry as measured** - Procedural 3D layout must be explicitly labeled.
3. **Never represent simulation deformation as measured** - What-If scenarios must be clearly labeled.
4. **Never represent mock InSAR as real satellite data** - InSAR must be labeled as simulated if not connected.
5. **Never silently mix data sources** - Every layer must expose its source classification.
6. **Never invent backend IDs** - Canonical backend IDs must be used where available.
7. **Never create a second spatial database** - PostGIS is the single source of truth.
8. **Never silently fall back to procedural data** - Degraded states must be visible.

---

## PROVENANCE MATRIX

### Geometry Source × Data State

| Geometry Source | Data State | Label | Survey Grade | Operational Use |
|----------------|------------|-------|--------------|----------------|
| POSTGIS | MEASURED | POSTGIS • MEASURED | YES | YES |
| POSTGIS | ENGINEERING | POSTGIS • ENGINEERING | YES | YES |
| BACKEND | MEASURED | BACKEND • MEASURED | YES | YES |
| BACKEND | SIMULATION | BACKEND • SIMULATION | NO | NO |
| PROCEDURAL_REFERENCE | ENGINEERING | PROCEDURAL • ENGINEERING REFERENCE | NO | NO |
| PROCEDURAL_REFERENCE | SIMULATION | PROCEDURAL • SIMULATION | NO | NO |
| SIMULATION | SIMULATION | SIMULATION • WHAT-IF | NO | NO |

---

## ENTITY PROVENANCE CLASSIFICATIONS

### SENSORS

**Live Measured:**
- Source: POSTGIS / BACKEND
- Data State: MEASURED
- Label: `POSTGIS • MEASURED` or `BACKEND • MEASURED`
- Icon: 📡
- Survey Grade: YES
- Operational Use: YES

**Simulated:**
- Source: BACKEND (simulator)
- Data State: SIMULATION
- Label: `BACKEND • SIMULATION`
- Icon: 🎭
- Survey Grade: NO
- Operational Use: NO

**Stale:**
- Source: POSTGIS / BACKEND
- Data State: MEASURED
- Label: `STALE • MEASURED`
- Icon: ⏰
- Survey Grade: YES (but outdated)
- Operational Use: NO (outdated)

**Offline:**
- Source: POSTGIS / BACKEND
- Data State: MEASURED
- Label: `OFFLINE • LAST KNOWN`
- Icon: ❌
- Survey Grade: YES (last known)
- Operational Use: NO (offline)

---

### WORKERS

**Live GPS/RFID:**
- Source: POSTGIS / BACKEND
- Data State: MEASURED
- Label: `BACKEND • MEASURED`
- Icon: 👤
- Survey Grade: YES
- Operational Use: YES

**Simulated Tracking:**
- Source: BACKEND (simulator)
- Data State: SIMULATION
- Label: `SIMULATED • PERSONNEL TRACKING`
- Icon: 🎭
- Survey Grade: NO
- Operational Use: NO

**Missing:**
- Source: BACKEND
- Data State: MEASURED
- Label: `MISSING • LAST KNOWN`
- Icon: ❓
- Survey Grade: YES (last known)
- Operational Use: NO

---

### EVACUATION ROUTES

**PostGIS Geometry:**
- Source: POSTGIS
- Data State: MEASURED
- Label: `POSTGIS • MEASURED`
- Icon: 🛣️
- Survey Grade: YES
- Operational Use: YES

**Procedural Reference:**
- Source: PROCEDURAL_REFERENCE
- Data State: ENGINEERING
- Label: `PROCEDURAL • ENGINEERING REFERENCE`
- Icon: 🏗️
- Survey Grade: NO
- Operational Use: NO

---

### GEOLOGICAL STRATA

**Engineering Reference:**
- Source: PROCEDURAL_REFERENCE
- Data State: ENGINEERING
- Label: `PROCEDURAL • ENGINEERING REFERENCE`
- Icon: 🏗️
- Survey Grade: NO
- Operational Use: NO

**Surveyed Strata:**
- Source: POSTGIS (if available)
- Data State: MEASURED
- Label: `POSTGIS • MEASURED`
- Icon: 📡
- Survey Grade: YES
- Operational Use: YES

---

### FAULTS

**Engineering Reference:**
- Source: PROCEDURAL_REFERENCE
- Data State: ENGINEERING
- Label: `PROCEDURAL • ENGINEERING REFERENCE`
- Icon: 🏗️
- Survey Grade: NO
- Operational Use: NO

**Surveyed Faults:**
- Source: POSTGIS (if available)
- Data State: MEASURED
- Label: `POSTGIS • MEASURED`
- Icon: 📡
- Survey Grade: YES
- Operational Use: YES

---

### BOREHOLES

**Engineering Reference:**
- Source: PROCEDURAL_REFERENCE
- Data State: ENGINEERING
- Label: `PROCEDURAL • ENGINEERING REFERENCE`
- Icon: 🏗️
- Survey Grade: NO
- Operational Use: NO

**Surveyed Boreholes:**
- Source: POSTGIS (if available)
- Data State: MEASURED
- Label: `POSTGIS • MEASURED`
- Icon: 📡
- Survey Grade: YES
- Operational Use: YES

---

### DEFORMATION / SUBSIDENCE

**What-If Simulation:**
- Source: SIMULATION
- Data State: SIMULATION
- Label: `SIMULATION • WHAT-IF`
- Icon: 🎭
- Survey Grade: NO
- Operational Use: NO

**Measured InSAR:**
- Source: BACKEND (InSAR provider)
- Data State: SATELLITE
- Label: `SATELLITE • MEASURED`
- Icon: 🛰️
- Survey Grade: YES
- Operational Use: YES

**Model Output:**
- Source: BACKEND (risk model)
- Data State: MODEL
- Label: `MODEL • PREDICTED`
- Icon: 🧠
- Survey Grade: NO
- Operational Use: NO

**Not Connected:**
- Source: SIMULATION
- Data State: SIMULATION
- Label: `InSAR • SIMULATED / NOT CONNECTED`
- Icon: ❌
- Survey Grade: NO
- Operational Use: NO

---

### SURFACE TERRAIN

**Engineering Reference:**
- Source: PROCEDURAL_REFERENCE
- Data State: ENGINEERING
- Label: `PROCEDURAL • ENGINEERING REFERENCE`
- Icon: 🏗️
- Survey Grade: NO
- Operational Use: NO

**Surveyed Terrain:**
- Source: POSTGIS (if available)
- Data State: MEASURED
- Label: `POSTGIS • MEASURED`
- Icon: 📡
- Survey Grade: YES
- Operational Use: YES

---

## PROVENANCE UI COMPONENTS

### Badges

**Badge Styles:**
```javascript
const PROVENANCE_BADGES = {
  'POSTGIS • MEASURED': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  'BACKEND • MEASURED': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  'BACKEND • SIMULATION': { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/60' },
  'PROCEDURAL • ENGINEERING REFERENCE': { bg: 'bg-slate-950/40', text: 'text-slate-400', border: 'border-slate-800/60' },
  'SIMULATION • WHAT-IF': { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/60' },
  'SATELLITE • MEASURED': { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/60' },
  'MODEL • PREDICTED': { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/60' },
};
```

### Tooltips

**Selected Entity Tooltip:**
```
Entity: Sensor NODE-001
ID: NODE-001
Source: POSTGIS • MEASURED
Classification: MEASURED
Timestamp: 2026-09-25T14:30:00Z
Operational Status: ONLINE
```

**Procedural Entity Tooltip:**
```
Entity: Geological Strata Layer
ID: topsoil
Source: PROCEDURAL • ENGINEERING REFERENCE
Classification: ENGINEERING
Operational Status: STATIC
```

**Simulation Entity Tooltip:**
```
Entity: What-If Deformation
ID: what-if-subsidence
Source: SIMULATION • WHAT-IF
Classification: SIMULATION
Operational Status: SIMULATION MODE
```

---

## PROVENANCE LABELING REQUIREMENTS

### Required Labels

Every entity in the 3D Twin must display:
1. **Source Label** - Human-readable source description
2. **Classification** - Data state (MEASURED, SIMULATION, ENGINEERING, etc.)
3. **Operational Status** - LIVE, STATIC, SIMULATION, etc.

### Optional Labels

Where applicable:
1. **Timestamp** - Last update time
2. **Confidence** - Confidence score
3. **Survey Grade** - YES/NO indicator
4. **Source Icon** - Visual indicator (📡, 🎭, 🏗️, etc.)

---

## SIMULATION ISOLATION

### Live Mode

**Definition:** Normal operational mode displaying live backend data.  
**Indicators:**
- Mode: `LIVE`
- Badge: `LIVE MODE`
- Color: Green/emerald
- Behavior: Displays measured data only

### What-If Mode

**Definition:** Simulation mode for what-if scenarios.  
**Indicators:**
- Mode: `WHAT-IF`
- Badge: `SIMULATION MODE`
- Color: Amber/yellow
- Behavior: Displays simulation data only

### Isolation Rules

1. **Simulation cannot modify production state** - What-If data never writes to PostgreSQL/PostGIS
2. **Simulation cannot generate live alerts** - What-If scenarios do not trigger FCM/SMS
3. **Simulation cannot affect evacuation state** - What-If does not change real evacuation status
4. **Simulation state is independent** - What-If state is separate from live state
5. **Simulation is clearly labeled** - Every simulation entity has explicit labeling

---

## DEGRADATION STATE VISIBILITY

### Backend Degradation

**Label:** `BACKEND OFFLINE`  
**Indicator:** ❌  
**Behavior:** Display last-known data with offline label

### WebSocket Degradation

**Label:** `WEBSOCKET DISCONNECTED`  
**Indicator:** ⚠️  
**Behavior:** Display last-known data with stale label

### Sensor Degradation

**Label:** `SENSORS STALE`  
**Indicator:** ⏰  
**Behavior:** Display last-known sensor data with stale label

### Data Age Labels

**Fresh (< 1 min):** `FRESH • MEASURED`  
**Stale (1-10 min):** `STALE • MEASURED`  
**Old (10-60 min):** `OLD • MEASURED`  
**Expired (> 60 min):** `EXPIRED • MEASURED`

---

## PROVENANCE VALIDATION

### Validation Rules

1. **Every entity must have a source** - No entity without provenance classification
2. **Simulation cannot become measured** - What-If data cannot be relabeled as measured
3. **Reference geometry is labeled correctly** - Procedural layers must have ENGINEERING label
4. **InSAR is not falsely represented** - InSAR must be labeled as SIMULATED if not connected
5. **Live claims are evidence-backed** - "LIVE" label only if data is actually live

### Validation Checks

**Check 1:** All entities have `geometry_source` and `data_state`  
**Check 2:** Simulation entities have `SIMULATION` data state  
**Check 3:** Procedural entities have `PROCEDURAL_REFERENCE` geometry source  
**Check 4:** Measured entities have timestamp within freshness window  
**Check 5:** Live claims match actual data age

---

## PROVENANCE IN UI LAYOUT

### Legend Section

**Provenance Categories:**
- LIVE MEASURED
- SIMULATION
- ENGINEERING REFERENCE
- MODEL
- SATELLITE

**Data State Categories:**
- MEASURED
- SIMULATION
- ENGINEERING
- MODEL
- SATELLITE

### Status Bar

**Connection State:**
```
Backend: ONLINE
WebSocket: CONNECTED
Sensors: LIVE
Workers: STALE
Routes: LIVE
InSAR: NOT CONNECTED
```

### Selected Entity Panel

**Provenance Section:**
```
┌─────────────────────────────────┐
│ Entity: Sensor NODE-001        │
│ ID: NODE-001                   │
│ ─────────────────────────────── │
│ Source: POSTGIS • MEASURED     │
│ Classification: MEASURED       │
│ Timestamp: 2026-09-25T14:30:00Z│
│ Survey Grade: YES              │
│ Operational: YES               │
└─────────────────────────────────┘
```

---

## PROVENANCE IN API RESPONSES

### TwinEntity Response

```json
{
  "id": "NODE-001",
  "entity_type": "sensor",
  "name": "Sensor NODE-001",
  "geometry_source": "POSTGIS",
  "data_state": "MEASURED",
  "status": "ONLINE",
  "latitude": 23.6543,
  "longitude": 86.4245,
  "elevation_m": -145.0,
  "timestamp": "2026-09-25T14:30:00Z",
  "version": "1.0",
  "source_label": "POSTGIS • MEASURED",
  "confidence": 95,
  "last_updated": "2026-09-25T14:30:00Z"
}
```

### Procedural Entity Response

```json
{
  "id": "topsoil",
  "entity_type": "strata",
  "name": "Topsoil & Alluvium",
  "geometry_source": "PROCEDURAL_REFERENCE",
  "data_state": "ENGINEERING",
  "status": "STATIC",
  "latitude": null,
  "longitude": null,
  "elevation_m": null,
  "timestamp": null,
  "version": "1.0",
  "source_label": "PROCEDURAL • ENGINEERING REFERENCE",
  "confidence": null,
  "last_updated": null
}
```

---

## PROVENANCE IN DOCUMENTATION

### Data Flow Diagrams

All data flow diagrams must include provenance labels:
```
PostGIS (MEASURED)
    ↓
Spatial API (MEASURED)
    ↓
Frontend State (MEASURED)
    ↓
3D Twin (MEASURED)
```

### Architecture Diagrams

All architecture diagrams must distinguish:
- Measured data (green)
- Simulation data (purple)
- Engineering reference (gray)
- Model data (blue)

---

**Document Status:** Phase 3 Provenance Model Documented  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
