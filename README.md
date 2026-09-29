<div align="center">

<img src="https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange?style=for-the-badge&logo=india&logoColor=white" />
<img src="https://img.shields.io/badge/Problem%20Statement-SIH26025-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Team-Calyxion-purple?style=for-the-badge" />

# ⛏️ TerraMesh AI
### Mine Subsidence Early Warning & Safety Command Center

*Continuous, AI-powered ground-movement monitoring for underground coal mines — built for Smart India Hackathon 2026*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TimescaleDB-336791?style=flat-square&logo=postgresql)](https://www.timescale.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?style=flat-square&logo=eclipsemosquitto)](https://mosquitto.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML%20Engine-brightgreen?style=flat-square)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 🔴 The Problem

Underground coal mines across India face a critical, under-monitored hazard: **mine subsidence** — progressive ground sinking caused by voids left by past mining. Roof falls remain one of the leading causes of fatalities in belowground coal mines (DGMS evidence). Existing methods — periodic manual surveys, satellite InSAR — are either too slow, too coarse, or too expensive to cover every active panel in real time.

**TerraMesh AI bridges that gap** with continuous, panel-wise IoT sensing + Edge AI + cloud analytics, giving mine safety officers an early warning they can actually act on.

---

## 🌐 How It Works — The 8-Stage Pipeline

```
MINE SITE          EDGE            WIRELESS      GATEWAY       CLOUD            AI              DIGITAL       ALERTS &
SENSORS       →  PROCESSING  →    MESH     →    (Pi)    →   BACKEND    →   ANALYTICS   →    TWIN/GIS  →   ACTIONS
Tilt/IMU           TinyML          LoRa/          MQTT         FastAPI          SHADOW           3D model      Dashboard
MEMS Vib.          Kalman          Zigbee         Broker       TimescaleDB      Residuals        Live zones    SMS / App
Displacement       FFT             Multi-hop      Protocol     Redis Cache      Isolation        GIS map       Siren
Crack sensor       Health mon.     Self-heal      Convert      PostGIS          Forest                         Control room
```

### Stage Details

| # | Stage | Technology | What it does |
|---|-------|-----------|--------------|
| 1 | **Mine Site Sensor Nodes** | ESP32-S3, Solar + LiFePO4 | Measures tilt, vibration (MEMS), displacement/strain, crack width at each panel |
| 2 | **Edge Processing** | TinyML, Kalman Filter, FFT | On-node signal calibration, noise filtering, vibration classification, local storage & queue |
| 3 | **Wireless Mesh** | LoRa / Zigbee multi-hop | Self-healing mesh relays data to gateway; store-and-forward for offline resilience |
| 4 | **Gateway** | Raspberry Pi, MQTT | Protocol conversion, local DB cache, 4G/Wi-Fi/Ethernet backhaul to cloud |
| 5 | **Cloud Backend** | FastAPI, TimescaleDB, Redis, PostGIS | Data ingestion, time-series storage, real-time cache, geospatial DB |
| 6 | **AI Analytics Engine** | XGBoost, Isolation Forest, SHADOW | Anomaly detection, risk severity scoring, physics-residual explainability, adaptive multi-sensor fusion |
| 7 | **Digital Twin & GIS** | Three.js, Leaflet, React | 3D mine model + live sensor state, deformation risk zones, panel-wise trend analysis |
| 8 | **Alerts & User Interface** | React (Vite), React Native | Web command center, mobile app, email/SMS alerts, local siren escalation |

---

## ✨ Innovation & Uniqueness

| Feature | Description |
|---------|-------------|
| 🧠 **SHADOW Residual Monitoring** | Expected deformation (physics model) vs observed → residual flags abnormal behaviour others miss |
| 🔄 **Self-Healing Sensor Fusion** | Sensor health check → faulty sensor isolation → validation → automatic reintegration |
| 📳 **Vibration Fingerprinting** | ML separates genuine ground-movement patterns from machinery, blasting, and traffic vibration |
| 🔗 **Adaptive Multi-Sensor Fusion** | Tilt + displacement + vibration + crack → consolidated subsidence-risk evidence score |
| 🏗️ **3D Digital Twin Architecture** | Mine geometry + live sensor state + risk zones + contributing factors in one interactive view |
| 📡 **Offline-First Mesh** | Local buffering continues during connectivity loss; sync resumes automatically when online |

---

## ⚖️ Competitive Comparison

| Feature | **TerraMesh AI** | Manual Survey | Satellite InSAR | Cabled Sensors |
|---------|:---:|:---:|:---:|:---:|
| Continuous local monitoring | ✅ | ✗ | ✗ | ✅ |
| Surface ground-truth sensing | ✅ | ✅ | ✗ | ✅ |
| Localized / panel-wise monitoring | ✅ | ✗ | ✅ | ✗ |
| Physics-residual explainable anomaly | ✅ | ✗ | ✗ | ✗ |
| Wireless deployment | ✅ | N/A | ✅ | ✗ |
| AI anomaly / risk analysis | ✅ | ✗ | ◑ | ◑ |
| Vibration monitoring | ✅ | Partial | ✗ | ◑ |
| Multi-sensor fusion | ✅ | Partial | ✗ | ◑ |
| Automated alerts | ✅ | ✗ | ◑ | ◑ |
| Offline-first operation | ✅ | ✅ | ✗ | ◑ |
| 3D digital-twin visualization | 🟡 Planned | ✗ | ✗ | ◑ |
| Multilingual field alerts | ✅ | ✗ | ✗ | ✗ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TerraMesh AI — System Architecture                 │
├──────────────┬────────────────────────┬────────────────────────────────────-┤
│  EDGE LAYER  │     BACKEND (Cloud)    │          FRONTEND                   │
│              │                        │                                      │
│ ESP32-S3     │  FastAPI (Python 3.13) │  React 19 + Vite 8                  │
│  ↓ LoRa      │  ↕ REST + WebSocket    │  Tailwind CSS 3 (glassmorphism)     │
│ Raspberry Pi │  PostgreSQL/Timescale  │  Three.js r148 (3D Digital Twin)    │
│  ↓ MQTT      │  Redis 7 (cache)       │  Leaflet (GIS map)                  │
│ Mosquitto    │  Mosquitto (broker)    │  Recharts (analytics)               │
│              │  XGBoost + Iso. Forest │  i18n (multilingual alerts)         │
│              │  PostGIS               │  React Native (mobile — planned)    │
└──────────────┴────────────────────────┴─────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (running)
- Python 3.11+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/pragatheesvar-A/TerraMesh-AI.git
cd TerraMesh-AI
```

### 2. Start infrastructure (PostgreSQL · Redis · MQTT)
```bash
docker compose up -d postgres redis mosquitto
```

### 3. Start the Backend
```bash
cd apps/mineguard-core/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start the Frontend *(new terminal)*
```bash
cd apps/mineguard-core/frontend
npm install
npm run dev
```

### 5. Open the dashboard
Navigate to **http://localhost:5174** and log in with:
- Email: `admin@terramesh.gov.in`
- Password: `admin`

---

## 📁 Project Structure

```
TerraMesh-AI/
├── apps/
│   └── mineguard-core/
│       ├── backend/                  # FastAPI Python backend
│       │   ├── main.py               # App entry point
│       │   ├── routers/              # API route handlers
│       │   ├── analytics/            # Kalman filter, ML models
│       │   ├── cache/                # Redis client
│       │   ├── alembic/              # DB migrations
│       │   └── data/                 # Synthetic scenario data
│       └── frontend/                 # React 19 + Vite frontend
│           ├── src/
│           │   ├── components/
│           │   │   ├── dashboard/    # KPI cards, AI risk panel, charts
│           │   │   ├── views/        # Login, sensors, workers, map...
│           │   │   └── common/       # Header, sidebar, modals
│           │   ├── context/          # MineDataContext, AuthContext
│           │   └── services/         # API client, initialConfig
│           └── index.html
├── docker-compose.yml
└── README.md
```

---

## 🧠 AI / ML Stack

| Model | Purpose | Performance |
|-------|---------|-------------|
| **XGBoost v4.2** | Risk severity scoring from multi-sensor features | 96.4% test accuracy, weighted-F1 = 0.97 |
| **Isolation Forest** | Anomaly detection on live sensor streams | ROC-AUC = 0.99 |
| **Kalman Filter** | On-device signal smoothing at edge nodes | — |
| **SHADOW Residual** | Physics-informed anomaly amplification | — |
| **TinyML (planned)** | On-ESP32 vibration classification | — |

> **Note:** All metrics are from synthetic-data prototype benchmarks. Field validation is planned before real-world deployment.

---

## 🚨 Alert Escalation Levels

| Level | Trigger | Channels |
|-------|---------|----------|
| 🟡 **Level 1 — Caution** | Risk score 25–50% | Dashboard notification |
| 🟠 **Level 2 — Warning** | Risk score 50–75% | SMS + Mobile App + Email |
| 🔴 **Level 3 — Critical** | Risk score > 75% | SMS + App + Email + Local Siren + Control Room escalation |

---

## 💰 Prototype Cost Estimate (Per Node)

| Component | Cost |
|-----------|------|
| ESP32-S3 | ₹700 |
| MEMS Vibration | ₹150 |
| Tilt/IMU | ₹300 |
| Displacement/Strain | ₹300 |
| Crack Sensing | ₹150 |
| LoRa Module | ₹800 |
| Solar + LiFePO4 | ₹1,200 |
| Enclosure + Wiring + PCB | ₹500 |
| **Total BOM / node** | **~₹4,100** *(range ₹4,000–₹5,000)* |

---

## 🌍 Impact

### Social
- Earlier identification of abnormal ground movement improves **worker safety**
- Protects nearby **communities, roads, and farmland** from undetected subsidence
- Transparent, sensor-backed risk data for **traceable safety review**

### Technological
- Continuous IoT monitoring + wireless mesh + Edge AI — all integrated
- Multi-sensor fusion improves confidence and resilience
- Physics + AI + 3D visualization enables explainable risk decisions

### Economic
- Solar-powered wireless nodes reduce dependence on expensive trenching and cabling
- Earlier detection helps reduce unplanned operational downtime
- Panel-wise deployment supports **scalable expansion** across CIL subsidiaries

### Environmental
- Deformation records support **post-mining land-risk management**
- Protects farmland, forests, and surface water from undetected subsidence

---

## 📋 Communication Protocols

| Link | Protocol |
|------|----------|
| Sensor → MCU | I²C / SPI / UART / ADC |
| Node → Gateway | LoRa / Zigbee mesh |
| Gateway → Cloud | MQTT over TLS (4G / Wi-Fi) |
| Backend → Frontend | REST API / WebSocket |

---

## 🔬 Research & References

- **Chatterjee et al. (2015)** — Land Subsidence in Jharia Coalfield using DInSAR, GPS & Precision Levelling — *Journal of Earth System Science*
- **Ghosh et al. (2024)** — Surface Deformation Monitoring of Raniganj Coalfield using InSAR & DGPS — *Geomatics, Natural Hazards and Risk*
- **Cacciuttolo et al. (2024)** — IoT LoRa WAN Wireless Sensor Network for Underground Mine Monitoring — *Sensors*
- **NRSC / ISRO – BCCL – CMPDI (2025)** — Satellite-based Surface Coal Fire & Land Subsidence Mapping in Jharia Coalfield

### Regulatory Bodies
- [DGMS](https://dgms.gov.in/) — Directorate General of Mines Safety, India
- [CIMFR](https://cimfr.res.in/) — Mining research & safety technologies
- [Ministry of Coal / CIL](https://www.coal.nic.in/) — Mining-sector deployment context

---

## ✅ Current Build Status

| Component | Status |
|-----------|--------|
| FastAPI backend | ✅ Live |
| PostgreSQL / TimescaleDB | ✅ Live |
| Redis cache | ✅ Live |
| MQTT broker (Mosquitto) | ✅ Live |
| React dashboard | ✅ Live |
| AI risk engine (XGBoost + Isolation Forest) | ✅ Live (synthetic data) |
| Real-time anomaly detection | ✅ Live |
| Short-term deformation-trend prediction | ✅ Live |
| Physical LoRa mesh + gateway hardware | 🟡 Planned |
| Full 3D digital twin | 🟡 Planned |
| Field validation | 🟡 Planned (next deployment stage) |

> Sensor mesh & edge hardware are **simulated** in this build — physical field trial is the next step.

---

## 🤝 Team Calyxion

Built for **Smart India Hackathon 2026** — Problem Statement **SIH26025**

*TerraMesh AI bridges periodic field surveys and satellite-scale deformation monitoring through continuous, low-cost surface sensing with an Edge-AI risk analysis layer.*

---

<div align="center">

**Coal Mines Regulations 2017 · Real-time IoT Telemetry · AI Subsidence Prediction**

*Made with ❤️ for safer mines across India*

</div>
