# TerraMesh AI — Final Build Specification & Agent Handoff

**Problem Statement ID:** 26025
**Title:** Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India
**Organization:** Ministry of Coal · **Department:** Coal India Limited
**Category:** Hardware · **Theme:** Smart Automation
**Team:** Calyxion · **Product Name:** TerraMesh AI
**Document purpose:** Single-source conclusion + build brief. Any AI agent reading this file should be able to implement the full system without re-reading the original problem statement.

---

## 1. Conclusion in One Paragraph

TerraMesh AI is an offline-first, low-cost surface subsidence early-warning platform for Indian underground coal mines. It replaces periodic manual surveys with a permanently deployed **wireless self-healing mesh of ESP32-based sensor nodes** installed on the surface above active mine panels. Each node continuously measures tilt, relative displacement, vibration signature and crack initiation. A local edge gateway runs AI models that (a) detect anomalous deformation without labelled data, (b) fingerprint vibration to separate blasting/machinery/rainfall noise from genuine ground movement, (c) forecast displacement 24–72 hours ahead using a spatio-temporal graph model, and (d) drive a calibrated Knothe-based digital twin that estimates subsidence severity and progression. Output is a GIS risk map, tiered alerts over SMS/app/email, and dashboards for operators, planners and DGMS regulators — all functioning without internet, syncing to cloud when connectivity returns.

**The differentiator to defend in every pitch:** *the mesh itself is the sensor.* Individual nodes are cheap and noisy; the inter-node distance graph, link-quality changes and correlated tilt across the mesh are what make micro-subsidence detectable at ₹2,000/node instead of ₹20 lakh/InSAR-cycle.

---

## 2. System Architecture (5 Layers)

```
L1  SENSING      ESP32 node × N  →  tilt, vibration, strain, crack, GNSS(opt), env
L2  MESH         LoRa 865–867 MHz (India ISM) self-healing mesh + ESP-NOW fallback
L3  EDGE         Raspberry Pi 4 gateway: MQTT broker, TimescaleDB, ONNX/TFLite inference
L4  INTELLIGENCE Anomaly AE → Vibration CNN → ST-GNN forecast → Severity XGB → Digital Twin
L5  PRESENTATION FastAPI + Next.js dashboard, MapLibre GIS, SMS/FCM/email alerts, cloud sync
```

Design rules that are non-negotiable:
1. **Offline-first.** Every decision (detect → classify → alert) must complete on the gateway with zero internet.
2. **Degrade, never die.** Node loss must not break the mesh; the graph model must run on partial node sets.
3. **Explainable alerts.** Every alert carries: which nodes, what magnitude, which model fired, confidence, and the physical reason.
4. **Student-buildable.** No component that a college team cannot buy in India or solder by hand.

---

## 3. Hardware — Sensor Node BOM (per node)

| Component | Part | Purpose | ₹ (approx) |
|---|---|---|---|
| MCU + radio | ESP32-WROOM-32 | compute, ESP-NOW, deep sleep | 350 |
| LoRa radio | SX1278 / RA-02 (433) or SX1262 (865 MHz India) | mesh backhaul, 2–5 km LOS | 250 |
| Tilt / IMU | MPU6050 (baseline) → ADXL355 (accurate tier) | inclination in milliradians, vibration | 120 / 1400 |
| Vibration | SW-420 + piezo/geophone element | event trigger + waveform | 90 |
| Displacement | String potentiometer or linear soft-strain (conductive rubber) | inter-peg extension | 300 |
| Crack detection | Conductive-trace crack strip / strain gauge + HX711 | binary + progressive crack | 200 |
| Positioning (opt) | NEO-6M (coarse) / low-cost RTK for anchor nodes only | absolute drift check | 400 |
| Environment | DHT22 + soil moisture + optional rain gauge | rainfall-confounder rejection | 150 |
| Power | 6 V 2 W solar + TP4056 + 18650 + supercap buffer | perpetual, energy-harvesting | 450 |
| Enclosure | IP65 box + ground anchor peg | field survival | 250 |
| **Total** | | | **≈ ₹2,000–2,600** |

**Gateway:** Raspberry Pi 4 (4 GB) + LoRa concentrator HAT + 4G dongle + 12 V/20 Ah battery + 50 W solar ≈ ₹12,000.
**Pilot panel cost:** 20 nodes + 1 gateway ≈ ₹62,000 vs ₹8–15 lakh for a Total Station survey programme per year. Lead with this number.

### Node duty cycle (energy budget)
- Deep sleep default; wake every 60 s → 200 ms IMU burst → compute features on-device → transmit only features (not raw waveform).
- Raw 200 Hz vibration waveform is uploaded **only** when the on-node trigger fires (RMS > adaptive threshold).
- Target: < 8 mA average → months of autonomy even with 3 cloudy days.

---

## 4. Mesh Layer Specification

- **Topology:** multi-hop mesh, every node relays. Use LoRa with a Meshtastic-style routing table, or `painlessMesh`/ESP-NOW for dense short-range clusters. Hybrid is acceptable: ESP-NOW intra-cluster, LoRa cluster-head → gateway.
- **Self-healing:** each node keeps 3 candidate parents ranked by RSSI/SNR + hop count; re-election every 15 min or on 3 missed ACKs.
- **Time sync:** gateway beacon every 10 min; nodes maintain ±50 ms — enough to correlate a vibration event across the panel and triangulate its origin.
- **Payload:** ≤ 40 bytes, CBOR-packed. `node_id, seq, tilt_x, tilt_y, rms, peak_f, strain, crack_flag, batt, rssi_parent, temp`.
- **Store-and-forward:** node buffers 24 h of readings in flash; replays on reconnect. Gateway buffers 30 days.
- **Ranging trick (key innovation):** RSSI/SNR drift between fixed node pairs, smoothed over days, acts as a coarse inter-node distance proxy. Combined with tilt, it flags horizontal strain **without GPS on every node**. Anchor nodes with GNSS calibrate the drift baseline against temperature/humidity.

---

## 5. The Dataset Problem — and the Exact Solution

**Reality check:** there is no public, node-level, labelled Indian mine-subsidence sensor dataset. Any agent that "searches for the dataset" will waste days. The dataset must be **manufactured in three layers** and this is defensible in front of judges because it mirrors how SHM and geotechnical ML research actually works.

### Layer A — Physics-based synthetic generator (primary training data)
Write `synth/subsidence_sim.py`. This is the single most important deliverable for the AI side.

Ground truth model — **Knothe influence function** for a longwall panel:

```
S(x)      = S_max · exp(−π · x² / r²)                # trough profile
r         = H / tan(β)                                # radius of influence
S_max     = a · m                                     # a = subsidence factor (0.6–0.9 for caving)
S(t)      = S_final · (1 − e^(−c·t))                  # time-dependent development
tilt(x)   = dS/dx        strain(x) = d²S/dx² · H      # what the sensors actually feel
```

Parameter ranges to sweep (Indian coalfield realistic):
| Parameter | Symbol | Range |
|---|---|---|
| Seam depth | H | 60–300 m |
| Extracted thickness | m | 1.5–6 m |
| Angle of draw | β | 25°–35° |
| Subsidence factor | a | 0.5–0.9 (caving) / 0.05–0.2 (stowing) |
| Time factor | c | 0.3–2.0 /month |
| Face advance rate | — | 1–6 m/day |

Generator must emit, per node, a time series with:
- clean physical signal → **plus** realistic corruption: MEMS bias drift, thermal tilt cycling (diurnal ±0.3 mrad), rainfall-driven soil swell, blasting spikes, haul-truck vibration, packet loss, node death, battery brownout.
- Labels: `normal | precursor | active_subsidence | critical`, plus regression target `subsidence_mm` and `time_to_critical_hours`.
- Scenario library: normal panel advance · sudden pothole/chimney collapse over old bord-and-pillar goaf · monsoon-triggered acceleration · sensor fault (must be classified as fault, not subsidence) · blasting false alarm.

Target volume: **≥ 200 panels × 20 nodes × 90 days @ 1-min = ~500 M rows**, subsample to 10–20 M for training.

### Layer B — Real-world anchors (validation + pretraining)
| Source | What it gives | Access |
|---|---|---|
| **Sentinel-1 SAR (Copernicus / ASF Vertex)** | Free InSAR displacement time series over Jharia, Raniganj, Singrauli, Korba. Build a PS-InSAR/SBAS stack for real subsidence trough shapes and rates | Free, open |
| **CMPDI / DGMS subsidence reports** | Published subsidence magnitudes, damage classes, incident case studies for calibration + severity thresholds | Public reports |
| **NASA/USGS + ISC seismic catalogues** | Regional background vibration, mining-induced seismicity | Free |
| **SHM benchmarks (Los Alamos, Z24 bridge, structural accel datasets)** | Pretraining the vibration 1D-CNN on real accelerometer anomaly patterns | Open |
| **IMD rainfall grids** | Monsoon confounder modelling | Open |
| **Blast vibration datasets (PPV studies)** | Blasting signature class for the fingerprint model | Literature / open |

Use InSAR-derived real troughs to **calibrate the synthetic generator's parameter distribution**, then state in the pitch: *"synthetic data physics-calibrated against Sentinel-1 observations of Jharia."* That sentence alone answers the "where's your data?" question.

### Layer C — Lab rig (proof of realism, wins the demo)
Build a **trapdoor sandbox rig**: 1 m × 1 m tray of sand, a lowerable plate underneath simulating goaf collapse, 6–9 real ESP32 nodes on the surface.
- Lower the plate in controlled steps → real tilt/strain/crack data with **known ground truth**.
- Gives ~10–50 k rows of genuine labelled data — enough for fine-tuning and, crucially, for a live demo where the judge lowers the plate and watches the alert fire.
- Also produces the vibration classes: tap = blast, drill = machinery, water pour = rainfall, plate drop = subsidence.

### Canonical schema (use this everywhere)
```
timestamp, panel_id, node_id, lat, lon, seam_depth_m, extracted_thickness_m,
tilt_x_mrad, tilt_y_mrad, tilt_mag_mrad, tilt_rate_mrad_per_day,
accel_rms_g, accel_peak_g, dom_freq_hz, spectral_centroid, band_energy_0_10, band_energy_10_50,
strain_ustrain, delta_strain_rate, crack_state (0/1/2), crack_width_mm,
rssi_to_parent, snr, link_dist_proxy_m, delta_link_dist_m,
batt_v, temp_c, humidity, soil_moisture, rainfall_mm_24h,
label_state, subsidence_mm, time_to_critical_h, event_source
```

---

## 6. AI/ML Stack — Five Models, Each With a Job

### M1 · Unsupervised Anomaly Detection (always-on, edge)
- **Model:** LSTM-Autoencoder (or 1D Conv-AE) on a 60-step multivariate window per node + Isolation Forest as a cheap fallback.
- **Trained on:** normal-state data only. Score = reconstruction error, thresholded at a rolling 99.5th percentile per node (each node learns its own baseline — this handles varied terrain).
- **Runs on:** gateway via ONNX Runtime; a quantised int8 variant runs on-node via TFLite Micro for offline node autonomy.
- **Output:** `anomaly_score ∈ [0,1]` per node per minute.

### M2 · Vibration Fingerprinting (false-alarm killer)
- **Model:** 1D-CNN over FFT/log-mel spectrogram of the 200 Hz burst → classes: `blasting | machinery | vehicle | rainfall/wind | roof_fall | genuine_ground_movement | sensor_fault`.
- **Why it matters:** the #1 reason monitoring systems get switched off is nuisance alarms. Show the confusion matrix in the pitch.
- **Bonus:** blast events are cross-referenced with the mine's blasting schedule → automatic suppression.

### M3 · Spatio-Temporal Forecasting (the prediction requirement)
- **Model:** Graph Neural Network (GCN/GraphSAGE) over the mesh graph — nodes = sensors, edges = mesh links weighted by inverse distance — stacked with GRU/Temporal-CNN. i.e. **ST-GNN**.
- **Input:** last 72 h of all node features + panel metadata (depth, face position, advance rate) + rainfall.
- **Output:** per-node predicted `subsidence_mm` at +24 h / +48 h / +72 h, with prediction intervals (MC-dropout or quantile heads).
- **Why GNN:** subsidence is spatially correlated by construction; a per-node model throws away the mesh's entire advantage.

### M4 · Severity & Risk Tiering
- **Model:** XGBoost/LightGBM on engineered features → risk class.
- **Thresholds grounded in damage classification (tilt & horizontal strain based):**

| Tier | Trigger (indicative, tune per site) | Meaning | Action |
|---|---|---|---|
| 🟢 Green | tilt rate < 0.5 mrad/day, strain < 0.5 mm/m | Stable | Log only |
| 🟡 Yellow | 0.5–2 mrad/day, strain 0.5–1.5 mm/m | Precursor movement | Notify mine engineer |
| 🟠 Orange | 2–5 mrad/day, or crack initiation, or forecast crosses threshold in 48 h | Active subsidence | SMS + app push, survey team dispatch |
| 🔴 Red | > 5 mrad/day, or crack width growth, or multi-node correlated acceleration | Imminent failure | Siren + SMS to all, evacuation protocol, DGMS notification |

Escalation requires **spatial corroboration** (≥ 2 neighbouring nodes) OR sustained duration — this single rule removes most false positives.

### M5 · Digital Twin (progression estimate)
- Knothe/influence-function model of the panel, with parameters (`a`, `β`, `c`) continuously re-estimated from live node data via **Extended Kalman Filter / least-squares fit**.
- Outputs: predicted final trough shape, max subsidence, affected surface footprint, ETA to each damage tier — rendered as a GIS overlay before it physically happens.
- This is what converts "we detected movement" into "your village school is inside the 30-day risk footprint."

### Cross-cutting
- **Federated learning:** each mine gateway trains locally, ships weight deltas (not data) to the central server; FedAvg produces a national model. Sells the "scalable across coalfields" + data-sovereignty story.
- **Drift monitoring:** track feature distributions; auto-retrain trigger.
- **Explainability:** SHAP on M4, attention/edge-weights on M3, reconstruction-error-per-channel on M1 → every alert shows *why*.

---

## 7. Software Stack

**Firmware:** ESP-IDF / Arduino-ESP32 · LoRa mesh lib · TFLite Micro · CBOR · OTA update over mesh.
**Edge (Raspberry Pi):** Mosquitto MQTT · Python 3.11 · FastAPI · TimescaleDB (PostgreSQL) · Redis · ONNX Runtime · Docker Compose · rsync-style cloud sync queue.
**Cloud:** FastAPI + PostgreSQL/PostGIS + object storage for waveforms + Celery workers for retraining.
**Frontend:** Next.js 14 + React + Tailwind + MapLibre GL (or Leaflet) + deck.gl for deformation heatmaps + Recharts for time series + WebSocket live feed.
**Mobile:** Flutter app (aligns with existing stack) — offline cache, push alerts, field verification photo upload with GPS.
**Alerts:** MSG91/Gupshup SMS (Indian DLT-compliant), Firebase Cloud Messaging, SMTP email, optional physical siren relay via gateway GPIO.
**GIS:** PostGIS geometry for panels, villages, infrastructure, forest land; risk zones as polygons; export to KML/Shapefile for DGMS filing.

---

## 8. Feature Checklist (map 1:1 to the PS "Expected Solution")

- [x] Low-cost smart sensor nodes on ESP32/Arduino/RPi
- [x] Localized wireless self-healing mesh over mine panels
- [x] Real-time tilt, displacement, vibration, crack monitoring
- [x] AI/ML anomaly detection on live + historical data
- [x] Subsidence prediction with severity & progression estimate
- [x] GIS live deformation maps + risk zone visualization
- [x] Automated early warning via SMS / email / mobile push
- [x] Interactive dashboards: operator view, planner view, regulator view
- [x] Offline operation with periodic cloud synchronization
- [x] Multi-coalfield scalable deployment (multi-tenant, federated)
- [x] Low power, energy-harvesting, IP65 field-ready
- [x] Student-prototype friendly, fully Made-in-India component list

**Extra features that create the winning margin:**
1. Vibration fingerprinting for false-alarm suppression (blasting-schedule aware).
2. RSSI-based inter-node ranging — displacement sensing without per-node GPS.
3. Digital-twin subsidence progression with EKF-calibrated Knothe model.
4. Federated learning across mines — privacy-preserving national model.
5. Sensor self-diagnosis: faulty node classified as fault, never as an alert.
6. Community-facing alert layer: village-level SMS in Hindi/Bengali/Telugu/Tamil.
7. Auto-generated DGMS compliance report (PDF) per monitoring cycle.
8. "What-if" planner mode: simulate a proposed panel layout and see predicted surface impact before mining.

---

## 9. Implementation Roadmap (agent-executable phases)

| Phase | Deliverable | Definition of Done |
|---|---|---|
| **P0** | Repo scaffold, Docker Compose, schema migrations | `docker compose up` brings DB + MQTT + API online |
| **P1** | `synth/subsidence_sim.py` physics generator | Emits labelled multi-panel CSV/Parquet matching §5 schema; trough profiles validated against Knothe closed form |
| **P2** | Data pipeline: ingest → feature store → train/val/test split (split by *panel*, never by row) | No temporal or spatial leakage; baseline metrics logged |
| **P3** | M1 anomaly AE + M2 vibration CNN trained, exported to ONNX/TFLite | AUC ≥ 0.95 on synthetic holdout; false-alarm rate < 2/node/month |
| **P4** | M3 ST-GNN + M4 severity + M5 digital twin | MAE < 10 % of trough magnitude at +48 h; lead time ≥ 24 h before critical |
| **P5** | Firmware: sensing, mesh, deep sleep, store-and-forward, OTA | 3 nodes + gateway run 72 h unattended; node killed → mesh reroutes < 30 s |
| **P6** | Backend API + MQTT ingestion + alert engine + Twilio/MSG91 | End-to-end: node event → alert SMS in < 15 s |
| **P7** | Dashboard: GIS map, node health, time series, alert console, replay mode | Judge can scrub a 30-day incident timeline |
| **P8** | Flutter app + offline cache + push | Alert received with app closed |
| **P9** | Sandbox trapdoor rig + live demo script | Plate lowered → Orange within 60 s → Red on continued drop |
| **P10** | Cloud sync, federated aggregation, multi-tenant, DGMS PDF report | Two simulated mines, one national model |

**Demo narrative for judging (rehearse this):** show the panel map → lower the sandbox plate → nodes tilt → dashboard turns yellow → digital twin projects the trough → orange alert SMS arrives on the judge's phone → then hit the blasting button and show the system *correctly not* alerting. That contrast is the whole pitch.

---

## 10. Evaluation Metrics to Report

- Detection: precision/recall/F1, ROC-AUC, **false alarms per node per month** (target < 2).
- **Lead time distribution** — median hours of warning before critical threshold (target ≥ 24 h). This is the metric that matters to Coal India.
- Forecast: MAE/RMSE on subsidence_mm at +24/48/72 h, coverage of prediction intervals.
- Vibration classifier: per-class F1, confusion matrix.
- System: end-to-end latency (sense → alert), mesh packet delivery ratio, node uptime %, energy autonomy days.
- Economics: ₹/km² of monitored surface/year vs Total Station, InSAR, borehole extensometer.

---

## 11. Risks & Honest Mitigations

| Risk | Mitigation |
|---|---|
| No real labelled field data | Physics-calibrated synthetic + InSAR validation + sandbox rig; state this openly, it is standard practice |
| MEMS tilt drift & thermal noise swamps mm-scale signal | Differential/relative sensing across neighbours, temperature compensation, long-window trend detection instead of instantaneous thresholds, ADXL355 tier for anchor nodes |
| False alarms destroy trust | M2 fingerprinting + spatial corroboration + duration rule + blasting schedule integration |
| LoRa range in hilly/forested coalfield terrain | Multi-hop mesh with cluster heads, adaptive spreading factor, RF site survey in deployment SOP |
| Node theft/vandalism in populated areas | Low-value hardware, tamper detect via IMU + geofence alert, buried/anchored enclosures |
| Monsoon confounding soil movement | Rainfall + soil moisture as model features, not ignored noise |
| Judges ask "why not just InSAR?" | InSAR = 6–12 day revisit, cloud-affected, no real-time alerting, expensive processing. TerraMesh = 1-minute cadence, all-weather, ₹2k/node. Use them together: InSAR for wide-area screening, TerraMesh for panel-level real-time. Say this — it shows maturity |

---

## 12. Repository Structure

```
terramesh-ai/
├── firmware/            # ESP32: sensing, LoRa mesh, TFLite Micro, OTA
├── synth/               # Knothe physics generator + scenario library
├── data/                # raw/, processed/, insar/, sandbox/
├── ml/
│   ├── features/        # feature engineering, windowing
│   ├── models/          # m1_anomaly, m2_vibration, m3_stgnn, m4_severity, m5_twin
│   ├── training/        # panel-wise splits, experiment tracking
│   └── export/          # ONNX / TFLite quantization
├── edge/                # gateway services: mqtt ingest, inference loop, buffer, sync
├── backend/             # FastAPI, alert engine, PostGIS, federated aggregator
├── frontend/            # Next.js dashboard + MapLibre
├── mobile/              # Flutter app
├── hardware/            # BOM, schematics, enclosure, deployment SOP
├── docs/                # this file, pitch deck, DGMS report template
└── docker-compose.yml
```

---

## 13. Instruction Block for the Next AI Agent

> You are building **TerraMesh AI** for SIH 2026 PS 26025 (Ministry of Coal / Coal India Limited), team **Calyxion**.
> Read this file as the single source of truth. Start at **Phase P1** — the physics-based synthetic dataset generator in `synth/subsidence_sim.py` — because no public node-level mine-subsidence dataset exists and every downstream model depends on it. Implement the Knothe influence-function trough with time development, the parameter sweep in §5, all five corruption sources, and the five scenario types. Emit Parquet matching the §5 canonical schema exactly.
> Then proceed phase by phase through §9. Do not skip the sensor-fault class, the spatial-corroboration alert rule, or the panel-wise data split — those three choices are what keep the system credible.
> Keep every design decision inside the constraints of §2: offline-first, degrades gracefully, explainable alerts, buildable by students with Indian off-the-shelf parts under ₹2,600 per node.
