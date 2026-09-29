# MINEGUARD AI — AI-Powered Mine Subsidence Monitoring & Safety Command Center
**Smart India Hackathon (SIH26025) &bull; Underground Coal Mine Safety Intelligence**

---

## 📌 Executive Summary
**MINEGUARD AI** is an industrial-grade, mission-critical command center dashboard and predictive geotechnical intelligence system designed for underground coal mines (such as Jharia Coalfield, Raniganj Coalfield). It bridges real-time Internet of Things (IoT) telemetry, explainable artificial intelligence (XAI), GIS spatial mapping, dynamic worker evacuation routing, and 3D digital mine twin simulations to provide early warning of mine subsidence and crown pillar collapse before catastrophic failure occurs.

---

## 🎯 Key System Capabilities

### 1. Modern Industrial Dark Control-Room UI
- **Aesthetic**: Deep charcoal palette (`#07090e`), gold/amber warning accents (`#f59e0b`), neon indicators, subtle glassmorphism, radar beacons, and high contrast typography.
- **DGMS Compliance**: Adheres to Directorate General of Mines Safety (DGMS) Coal Mines Regulations 2017 (Regulation 112) safety guidelines.

### 2. Top 5 Real-Time KPI Cards
- **Active Sensor Nodes**: 48 total (47 Online, 1 Offline)
- **Monitored Workers**: 126 personnel (119 Safe, 7 At Risk)
- **Safe Zones**: 38 Stable Zones
- **Warning Zones**: 7 Elevated Creep Zones (+2 from previous hour)
- **Critical Zones**: 3 Immediate Attention Required (Zone B depillaring section highlighted)

### 3. Interactive GIS Mine Risk Map
- Real-time Leaflet GIS mapping with dark industrial and satellite layers.
- Geo-fenced colliery lease boundaries, mining zones (A, B, C, D) color-coded by risk level (Green, Yellow, Orange, Red).
- Live pulse markers for 48 sensor nodes with instant click inspection.
- Worker positioning with biometric heart rate and depth tracking.
- Dynamic evacuation corridor rendering:
  - **Route A**: Marked as **BLOCKED** with physical roof collapse hazard marker.
  - **Route B**: Animated directional green dashed corridor leading to Surface Assembly Area 3.
- Subsidence contour isolines and surface infrastructure (NH-32 Expressway, 33kV Substation, Agricultural Farmlands).

### 4. Interactive Sensor Node Telemetry Flyout
- Inspects **NODE-017** with exact real-time geotechnical telemetry:
  - **Tilt**: 4.8°
  - **Displacement**: 12.4 mm (+3.4 mm/hr velocity)
  - **Crack Width**: 7.2 mm
  - **Vibration**: HIGH (Micro-seismic acoustic emission)
  - **Battery**: 84%
  - **LoRa Signal**: 92% (RSSI -64 dBm)
  - **AI Risk Score**: 87% (CRITICAL)

### 5. Explainable AI (XAI) Risk Intelligence
- Composite Risk Score: **87% (CRITICAL)**
- Trend: **↑ 18% in last 30 minutes**
- Prediction: *"Deformation is increasing in Zone B. Imminent crown pillar shearing predicted within 28 minutes."*
- **Explainable Factors**:
  - Tilt Change: **32%**
  - Displacement Rate: **27%**
  - Crack Widening: **18%**
  - Vibration: **10%**
  - Historical Trend: **13%**
- **AI Confidence Gauge**: **91%**

### 6. Dynamic Evacuation & Rerouting Protocol
- Flowchart visualization:
  `Worker → Danger Zone (Zone B) → [X Route A BLOCKED] → AI Rerouting → Route B (East Drift) → Safe Zone (Surface Assembly #3)`
- Immediate emergency broadcast and audible siren trigger.

### 7. 3D Digital Mine Twin & What-If Simulation
- Isometric cross-section visualization representing:
  `Ground Surface → Subsidence Trough Zone → Coal Seam Panels → Tunnel Network`
- **What-If Simulation Slider**: Interactively test deformation escalation from +0% to +50% (e.g. +20% deformation simulates risk increase from 62% → 84%).

### 8. Interactive Automated DEMO MODE
- A dedicated **DEMO MODE** toggle in the top header simulates the full lifecycle:
  1. **Baseline**: All zones GREEN, nominal telemetry.
  2. **Phase 1**: Sensor NODE-017 detects increasing tilt (+1.8°).
  3. **Phase 2**: Extensometer displacement increases to 6.2mm.
  4. **Phase 3**: Crack gauge widens to 5.4mm, vibration spikes.
  5. **Phase 4**: AI Anomaly triggered, Zone B turns RED, 7 workers flagged in DANGER.
  6. **Phase 5**: Route A is blocked, AI auto-reroutes to Route B, critical alert broadcasted.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (custom industrial control-room tokens, glassmorphism, glowing beacons)
- **GIS Map**: Leaflet.js with CartoDB Dark Matter & Esri Satellite layers
- **Charts**: Recharts (multi-series line & area graphs with 1H, 6H, 24H, 7D, 30D selectors)
- **Icons**: Lucide React
- **Audio**: Web Audio API synthesized industrial siren (880Hz / 440Hz alert chirps)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Communication**: REST API + WebSocket (`/ws/live-monitoring`)
- **Database Architecture**: SQLAlchemy with PostgreSQL & SQLite dual-mode
- **Schemas**: Pydantic v2 data models

---

## 🚀 Quickstart Guide

### 1. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Running the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Interactive Swagger API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🏆 Smart India Hackathon (SIH26025) Team
- **Project**: MINEGUARD AI
- **Domain**: Smart Mine Safety & Disaster Management
- **Motto**: *"Detect danger early. Predict what happens next. Protect workers. Protect communities."*
