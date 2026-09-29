# TerraMesh AI — Comprehensive Repository Audit


> **SUPERSEDED (2026-09-24):** This is the PRE-completion audit snapshot � it records the state found BEFORE the technology-completion pass. For current verified status see docs/FINAL_ZERO_TRUST_AUDIT.md and the FINAL STATUS table in docs/MISSING_TECH_STACK_AUDIT.md.
**Audit Date:** 2026-09-23  
**Project:** TerraMesh AI — Digital Mine Twin / Mine-Subsidence Early-Warning Platform  
**Repository Root:** `d:\COAL MINE`

---

## 1. Repository Structure Overview

```
d:\COAL MINE\
├── apps/
│   └── mineguard-core/
│       ├── backend/             ← FastAPI Python server
│       │   ├── main.py          ← 1073-line monolith API
│       │   ├── simulation.py    ← 554-line simulation engine
│       │   ├── ml_service.py    ← ML inference router
│       │   ├── edge_ingest_loop.py  ← AI pipeline controller
│       │   ├── edge_database.py ← SQLite WAL edge DB
│       │   ├── database.py      ← SQLAlchemy + SQLite
│       │   ├── models.py        ← ORM: 7 tables
│       │   ├── ml/
│       │   │   ├── shadow_engine.py      ← SHADOW multi-sensor fusion
│       │   │   ├── sensor_health.py      ← Sensor fault detection
│       │   │   ├── vibration_filter.py   ← ADXL345 vibration fingerprinter
│       │   │   ├── forecaster.py         ← 24h/48h/72h deformation forecast
│       │   │   ├── explainability.py     ← Bilingual XAI (EN + HI)
│       │   │   └── train_*.py            ← Training scripts
│       └── frontend/
│           └── src/
│               ├── App.jsx              ← 412-line SPA shell, 20 views
│               ├── components/views/    ← 20 full-page views
│               ├── components/dashboard/← 22 dashboard widgets
│               └── services/            ← API service layer
├── data/
└── docs/
```

---

## 2. Technology Stack — Current vs Required

| Layer | CURRENT | REQUIRED | Status |
|---|---|---|---|
| API Framework | FastAPI ≥0.110 | FastAPI ≥0.110 | ✅ |
| ORM | SQLAlchemy ≥2.0 | SQLAlchemy ≥2.0 | ✅ |
| Primary Database | **SQLite WAL** | **PostgreSQL 16 + TimescaleDB** | ❌ MISSING |
| Spatial DB | None | PostGIS 3.x | ❌ MISSING |
| Migrations | Manual ALTER TABLE | **Alembic** | ❌ MISSING |
| Cache / Pub-Sub | None | **Redis 7.x** | ❌ MISSING |
| MQTT Broker | Python loop simulation | **Mosquitto / EMQX** | ❌ MISSING |
| Kalman Filter | None | `backend/analytics/kalman_filter.py` | ❌ MISSING |
| TinyML Edge | None | Quantized model emulator | ❌ MISSING |
| Push Notifications | None | **Firebase Admin SDK (FCM)** | ❌ MISSING |
| InSAR Pipeline | None | Satellite data + PostGIS WMS | ❌ MISSING |
| i18n Frontend | None | react-i18next (EN + HI) | ❌ MISSING |
| PDF Reports | UI stub only | jsPDF / server-side WeasyPrint | ⚠️ PARTIAL |
| Docker / Compose | None | docker-compose.yml | ❌ MISSING |
| ML Risk Model | XGBoost 5-class ✅ | XGBoost 5-class | ✅ |
| SHADOW Engine | Full implementation ✅ | Sheorey/NCB + multi-fusion | ✅ |
| Anomaly Detection | Isolation Forest ✅ | Isolation Forest | ✅ |
| 3D Digital Twin | react-three/fiber ✅ | react-three/fiber | ✅ |
| 2D GIS Map | Leaflet.js ✅ | Leaflet.js | ✅ |

---

## 3. Feature Inventory — Backend

### ✅ Fully Working

- **48 sensor simulation nodes** (Jharia coalfield, lat/lng grid)
- **126 virtual workers** with biometric data (HR, SpO2, depth)
- **5-class XGBoost risk classifier** (NORMAL/WATCH/CAUTION/DANGER/CRITICAL) — `model.joblib`
- **Isolation Forest** unsupervised anomaly detection
- **SHADOW Decision Engine** — 6-input multi-sensor fusion with:
  - XGBoost probability weighting
  - Isolation Forest anomaly score
  - Sheorey/NCB physics residual (ENGINEERING CALCULATION)
  - Sensor health state machine (HEALTHY/STUCK/DRIFT/BROWNOUT)
  - ADXL345 vibration fingerprinter + blasting siren suppression
  - Spatial neighbor consensus (≥2 mesh nodes required for EVACUATE)
- **ShortHorizonForecaster** — Holt's exponential smoothing + Knothe physics, 24/48/72h predictions with conformal prediction intervals
- **BilingualExplainabilityEngine** — SHAP-rank feature explanations in English + Hindi
- **1-Click Scenario Injector** for SIH judge demonstration
- **WebSocket real-time broadcast** (`/ws/dashboard`)
- **Broadcast management** — groups, recipients, channels, history, delivery tracking
- **Edge ingestion pipeline** — `IngestPipeline` class in `edge_ingest_loop.py`
- **Archive service** — `archive_service.py`

### ⚠️ Partial / Stub

- **SMS / Email notifications** — Channel model exists in DB, no actual sending integration
- **API authentication** — Hardcoded key + trivial JWT prefix check
- **Report generation** — ReportModal UI present, no actual PDF output

---

## 4. Feature Inventory — Frontend

### ✅ Fully Working Views (20 total)

| View | Key Features |
|---|---|
| Dashboard | KPI cards, Leaflet risk map, AI risk panel, evacuation, trend chart, 3D preview |
| Sensor Network | All 48 nodes, zone filter, sensor detail drawer |
| Digital Twin (3D) | Mine3DScene.jsx (41KB) — react-three/fiber |
| AI Prediction Engine | XGBoost predictions, confidence, forecast charts |
| Worker Safety | 126 workers, zone tracking, biometrics |
| Dynamic Evacuation | Route planning, zone status |
| Broadcast Management | 41KB view — full broadcast CRUD |
| 2D Mine Map | Leaflet map with sensor overlays |
| Alert Center | Active alerts, acknowledge |
| Reports | Report generation stub |
| Analytics | Trend analytics, charts |
| Risk Analysis | Zone risk breakdown |
| System Health | Service status, API health |
| Simulation Lab | Scenario injection UI |
| Field Devices | Hardware device inventory |
| Environmental | Gas/temperature monitoring |
| Incident History | Historical incident log |
| Settings | 115KB — comprehensive config UI |

---

## 5. Production Gaps — Critical

### 5.1 Database (BLOCKING — Priority 1)

```
Current:  SQLite WAL (mineguard.db + terramesh_edge.db)
Required: PostgreSQL 16 + TimescaleDB 2.x + PostGIS 3.x

Impact:
  - 48 sensors × 1Hz = 172,800 telemetry rows/day → SQLite contention
  - No hypertable compression (TimescaleDB can compress 90%+)
  - No spatial queries (PostGIS needed for InSAR + zone geometry)
  - No concurrent writes (SQLite writer lock under WebSocket load)
```

### 5.2 Migrations (BLOCKING — Priority 1)

```
Current:  main.py line 30-36: try: ALTER TABLE... except: pass
Required: Alembic with env.py, alembic.ini, migrations/ directory

Risk:  Schema changes are irreversible, untested, and unapplied in production
```

### 5.3 Kalman Filter (Priority 2)

```
Current:  Raw sensor values passed directly to XGBoost
Required: backend/analytics/kalman_filter.py
          - Discrete Kalman filter for tilt, displacement, crack_width
          - Q (process noise) and R (measurement noise) tuned for MEMS sensors
          - State estimate passed to downstream SHADOW engine
          - Frontend: raw vs filtered chart overlay
```

### 5.4 MQTT Real Ingestion (Priority 2)

```
Current:  Python asyncio timer loop generating synthetic packets
Required: Mosquitto broker + paho-mqtt client in backend
          Topic: mines/{mine_id}/nodes/{node_id}/telemetry
          QoS 1, TLS 1.2, Last-Will for node disconnection
```

### 5.5 Redis (Priority 2)

```
Current:  In-memory Python dicts for node cache
Required: Redis 7.x
          - dashboard:overview  TTL 2s
          - node:{id}:latest    TTL 10s
          - Pub-Sub channel: terramesh.dashboard.events → WebSocket broadcast
```

### 5.6 FCM Push (Priority 3)

```
Current:  SMS/Email channel models in DB, no actual delivery
Required: firebase-admin SDK
          backend/notifications/fcm_service.py
          - FCM registration token management
          - Alert severity → push priority mapping
          - Batch send to zone-specific workers
```

### 5.7 Data Provenance (Priority 2)

```
Current:  No labels — all data looks identical in UI
Required: DataBadge component per system principles:
          - MEASURED DATA (sensor readings)
          - MODEL OUTPUT (XGBoost, Isolation Forest, Forecaster)
          - ENGINEERING CALCULATION (Sheorey/NCB physics)
          - SATELLITE OBSERVATION (future InSAR)
          - SIMULATION (synthetic packets, demo scenario)
          - OPERATOR ACTION (manual alert, evacuation trigger)
```

---

## 6. Hard-Coded Mocks — Full List

| File | Line(s) | Mock | Required Action |
|---|---|---|---|
| `simulation.py` | 12-18 | `risk_score=87`, Zone B critical, 7 workers | Label UI as SIMULATION |
| `simulation.py` | 67-80 | NODE-017 critical values hardcoded | Label as DEMO |
| `main.py` | 54 | `API_KEY = "terramesh_secure_key_2026"` | Move to `.env` |
| `main.py` | 47 | `allow_origins=["*"]` | Restrict to known origins |
| `main.py` | 57-60 | JWT prefix trivial check | Implement real JWT |
| `edge_database.py` | all | SQLite local edge DB | Migrate to PostgreSQL |
| `forecaster.py` | Holt smoothing | Labeled as forecast — no uncertainty calibration shown | Add conformal interval display |

---

## 7. Security Issues

| Severity | Location | Issue | Fix |
|---|---|---|---|
| 🔴 HIGH | `main.py:54` | API key hardcoded in source | `.env` + `python-dotenv` |
| 🔴 HIGH | `main.py:57-60` | Trivial JWT prefix check | Real JWT with `python-jose` |
| 🟡 MEDIUM | `main.py:47` | Open CORS `*` | Restrict to frontend origin |
| 🟡 MEDIUM | All routes | No rate limiting | `slowapi` middleware |
| 🟡 MEDIUM | `database.py` | SQLite has no auth | PostgreSQL credentials via env |

---

## 8. Completion Roadmap (Phased)

| Phase | Name | Priority | Effort |
|---|---|---|---|
| 0 | Repository Audit | ✅ Done | — |
| 1 | PostgreSQL + Alembic Migration | CRITICAL | 2 days |
| 2 | Kalman Filter Module | HIGH | 1 day |
| 3 | Redis Integration | HIGH | 1 day |
| 4 | MQTT Architecture | HIGH | 1 day |
| 5 | FCM Push Notifications | MEDIUM | 1 day |
| 6 | Data Provenance Labels | HIGH | 0.5 day |
| 7 | i18n (EN + HI) | MEDIUM | 1 day |
| 8 | PDF Report Generation | MEDIUM | 1 day |
| 9 | InSAR Satellite Data | LOW | 2 days |
| 10 | TinyML Edge Emulation | LOW | 1 day |
| 11 | Docker + DevOps | HIGH | 1 day |

---

## 9. Overall Assessment

| Category | Score | Notes |
|---|---|---|
| Core API | 8/10 | Functional monolith |
| ML/AI Pipeline | 9/10 | Sophisticated, production-quality |
| Database | 4/10 | SQLite → PostgreSQL migration required |
| Real-time (WS/MQTT) | 5/10 | WebSocket works; MQTT/Redis absent |
| Security | 3/10 | Hardcoded keys, open CORS |
| Frontend UI | 9/10 | 20 views, rich components |
| Data Provenance | 2/10 | No labeling present |
| Notifications | 2/10 | No real FCM/SMS |
| DevOps | 1/10 | No Docker/CI |
| i18n | 2/10 | Backend bilingual only |
| **OVERALL** | **5/10** | **Strong MVP — needs production hardening** |

---

*Generated by Antigravity AI — 2026-09-23*
