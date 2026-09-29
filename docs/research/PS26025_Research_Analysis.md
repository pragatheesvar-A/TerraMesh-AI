### **SMART INDIA HACKATHON 2026** 

**Problem Statement Research & Feasibility Analysis** 

# **AI-Enabled Low-Cost Real-Time Mine Subsidence Monitoring,** 

# **Prediction and Early Warning System for Underground Coal Mines in India** 

Problem Statement ID: 26025   |   Category: Hardware   |   Theme: Disaster Management Sponsoring Ministry/Organization: Ministry of Coal, Government of India 

#### **Prepared for Team Calyxion** 

August 2026 

## **1. Executive Summary** 

Problem Statement 26025, posted by the Ministry of Coal under the Disaster Management theme, asks for a low-cost, AI-enabled, real-time system to monitor, predict and warn against surface subsidence caused by underground coal mining. This matters because India's subsidence monitoring today runs on a mix of periodic ground surveys, GNSS/leveling at isolated points, and satellite InSAR — all of which are either too sparse, too slow to revisit, too expensive to scale, or all three. None of them give a mine operator a live, panel-wide picture of ground movement as it develops. 

This analysis concludes the problem is well-suited to a distributed low-cost sensor mesh: dense arrays of tilt, vibration, displacement and crack sensors on cheap microcontroller nodes (ESP32/Arduino), linked by a wireless mesh (LoRa for range across a mine panel, optionally Zigbee/Wi-Fi mesh for dense in-panel clustering), feeding an AI/ML layer that flags abnormal deformation patterns and predicts subsidence zones before they become visible surface damage. The core innovation — and the differentiator from every existing system reviewed here — is combining true multi-hop mesh sensing (not the star topologies used in current LoRa landslide research) with on-device/edge AI anomaly detection purpose-built for mining-induced subsidence, at a per-node cost in the ₹2,500–4,000 range. 

Section 4 reviews the existing landscape (Indian and international) and identifies the specific gap this fills. Section 7 proposes a five-layer architecture. Section 9 estimates cost and feasibility for a hackathon-scale prototype through to a pilot deployment. Section 11 is an honest look at what will be hard — mine-environment ruggedization, false-positive control, and getting real subsidence-event data to train on — with mitigations for each. 

## **2. Problem Statement Overview** 

|**Field**|**Detail**|
|---|---|
|PS ID|26025|
|Title|Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring,<br>Predicton and Early Warning System for Underground Coal Mines in India|
|Category|Hardware|
|Theme|Disaster Management|
|Sponsoring Organizaton|Ministry of Coal, Government of India|
|Core ask|Wireless surface mesh sensor network + AI/ML anomaly detecton/predicton + GIS<br>dashboard + automated early warning|



_Table 2.1 — PS 26025 at a glance (verified against the official SIH 2026 problem statement catalogue)._ 

The description explicitly names the sensing modalities (tilt/inclination, vibration, displacement/stretch, crack detection, optional positioning), the communication layer (LoRa/Zigbee/Wi-Fi mesh), and the software stack (AI/ML anomaly detection, GIS visualization, SMS/email/app alerts, offline-first with periodic cloud sync). That level of specificity is useful: it means the evaluation will reward a team that can show a working sensor-to-alert pipeline, not just a slide about "AI for mining," and it rewards genuine engineering choices (why LoRa over Zigbee here, why this anomaly-detection model, why this sensor) over generic claims. 

## **3. Background & Rationale** 

Underground coal extraction removes support from strata above the worked-out panel, and the overlying ground gradually settles into the void. This subsidence can be gradual (sagging over months) or sudden (collapse, sinkhole formation over shallow or old workings), and both forms damage surface structures, agricultural land, forests, water bodies and, in the worst case, endanger people living above active or abandoned workings. 

India's coalfields — Jharia, Raniganj, Talcher, Korba and others — sit under or near dense habitation, which raises the stakes: a subsidence event is not just an asset-damage problem, it is a life-safety and disastermanagement problem, which is exactly why the Ministry of Coal has framed this PS under the Disaster Management theme rather than as a productivity or automation problem. 

#### **3.1 Why existing practice falls short** 

- Field surveys and leveling give millimeter accuracy but at isolated points, repeated at intervals of weeks or months — too sparse in space and time to catch fast-developing failure. 

- Real-time GNSS stations are accurate and continuous but expensive per point, so in practice only a handful of critical locations get instrumented, leaving the rest of a panel blind. 

- Satellite InSAR (including advanced SBAS/PS-InSAR) can cover a whole coalfield with millimeter-level precision, but is fundamentally limited by satellite revisit time (typically 6–12 days for Sentinel-1), line-ofsight-only sensitivity (poor at detecting north–south motion), and decoherence over vegetated or rapidlychanging ground — none of which supports an early-warning system that needs hours-to-days of lead time, not weeks. 

- Damage assessment today is largely post-facto: teams go out after cracks or subsidence are already visible, which is the opposite of "early" warning. 

The gap is not sensing accuracy — India already has world-class remote-sensing capability through CMPDI's Geomatics group and academic InSAR work (Section 4). The gap is temporal and spatial density at a cost that lets an operator instrument an entire panel continuously, not just a few benchmark points, and get an alert while there is still time to act. 

## **4. Literature Review & Existing Landscape** 

#### **4.1 Conventional and remote-sensing subsidence monitoring in India** 

CMPDI (Central Mine Planning & Design Institute, a Coal India subsidiary) runs the country's principal geomatics function for coalfield monitoring, using conventional surveying, GNSS and remote sensing. Academic work has extended this with differential and multi-temporal InSAR: a 2024 study combined advanced InSAR and DGPS over the Raniganj coalfield to map surface deformation, and a broader 2025 review of InSAR for ground subsidence in India catalogues current capability and gaps across coalfields nationally. None of this published Indian work reports a continuous, ground-truthed, real-time sensor layer feeding these satellite products — the two data sources (satellite and ground) are largely used separately rather than fused. 

#### **4.2 State of the art internationally: InSAR + deep learning fusion** 

The most advanced published approach found in this review is Chinese: SBAS-InSAR time series (66 Sentinel-1 images over 26 months at the Banji mining area) feeding a CNN-BiGRU-Attention deep-learning model, achieving a mean absolute prediction error of 1.27 mm and RMSE of 1.44 mm regionally. This is the technical benchmark for what AI/ML-assisted subsidence prediction can achieve in accuracy — but it inherits InSAR's revisit-time and cost limitations, and depends on infrastructure (processed satellite feeds, HPC for SBAS processing) that is not "low cost" or "student prototype friendly" in the sense PS 26025 asks for. A parallel 2024 study integrated D- InSAR, SBAS and UAV photogrammetry for higher-precision mapping, reinforcing that the frontier is multi-sensor fusion, not any single technique. 

#### **4.3 IoT-based coal mine safety systems in India** 

There is an active body of Indian academic and student work on "IoT coal mine safety" (several IEEE/IJERT/E3S conference papers reviewed here). These systems are mature and well-trodden, but they monitor a different hazard set entirely: gas concentration (MQ2 for methane/LPG/hydrogen), temperature/humidity (DHT11), and worker-distress panic buttons, typically over Zigbee (IEEE 802.15.4) to a control-room display. Vibration sensors (ADXL345) appear only as an immediate rockfall/roof-collapse trigger, not as a long-term ground-deformation time series. Critically, none of the systems reviewed address surface subsidence, ground tilt, or crack propagation at all — this is a real, current gap in Indian published work, not a saturated space. 

#### **4.4 LoRa/WSN research for landslide and slope monitoring** 

The closest analogous research is landslide early-warning over LoRa, which shares sensing needs (tilt, vibration, moisture) with mine subsidence. Reviewed systems include a Kerala-focused real-time LoRa landslide monitor, a Pantelleria Island LoRaWAN rockfall/landslide network, and a hobbyist-grade LoRa WSN landslide project using LILYGO T-Beam (ESP32 + NEO-6M GPS + SX1276) and Wio-E5 (STM32WLE5JC) nodes. Three consistent limitations stand out across this literature: 

- Topology: every system found uses star or simple point-to-point LoRa ("gateway hears node"), not true multi-hop mesh — coverage is limited by single-hop LoRa range from each node to one gateway, which is fragile over the irregular, sometimes-forested terrain above a mine panel. 

- Detection logic: alerting is threshold-based (e.g., trigger when tilt exceeds ±2°), not learned from data. One paper explicitly notes ML-based prediction as future work only, not implemented. 

- Domain fit: none is tuned to mining-induced subsidence specifically — mining subsidence has a different signature (slow sag over a defined panel geometry, sometimes followed by rapid collapse near old/shallow workings) than rainfall-triggered slope failure, so sensor placement and model features designed for landslides transfer only partially. 

#### **4.5 Gap summary** 

|**Approach**|**Strength**|**Gap for PS 26025**|
|---|---|---|
|Conventonal survey/leveling<br>(India)|mm-level accuracy at surveyed points|Sparse in tme (weeks/months) and<br>space; not real-tme|
|Satellite InSAR / SBAS-InSAR<br>(India + global)|Wide-area coverage, mm precision,<br>mature Indian academic base (CMPDI,|6–12 day revisit; LOS-only sensitvity;<br>poor in vegetaton; expensive|



|**Approach**|**Strength**|**Gap for PS 26025**|
|---|---|---|
||Raniganj studies)|processing; not "low cost/student-<br>friendly"|
|InSAR + CNN-BiGRU-<br>Atenton (China, published)|State-of-art predicton accuracy (~1.3<br>mm MAE)|Inherits InSAR's latency/cost; not<br>deployable as a low-cost prototype|
|Indian IoT coal-mine-safety<br>systems (Zigbee, gas/temp)|Cheap, proven, real-tme, India-specifc|Zero coverage of subsidence/ground<br>deformaton — diferent hazard<br>entrely|
|LoRa landslide WSN (India,<br>Italy, hobbyist)|Right sensor set (tlt/vibraton), low-<br>cost hardware, long range|Star topology not mesh; threshold<br>alerts not AI/ML; tuned for rainfall-<br>triggered slope failure, not mine panels|



_Table 4.1 — Gap analysis across the reviewed landscape. PS 26025's own innovation hook — a wireless surface mesh network fused with AI/ML prediction, purpose-built for mine subsidence — sits precisely in the empty cell none of these fill._ 

## **5. Regulatory & Institutional Context** 

The Directorate General of Mines Safety (DGMS), under the Ministry of Labour & Employment, is India's statutory mine-safety regulator and issues circulars and Coal Mine Regulations that govern subsidence and structural safety practice, including a standing Science & Technology (S&T) circular track that funds/approves pilot safety technologies — a relevant route if the team pursues field deployment beyond the hackathon. CMPDI (a Coal India Ltd. subsidiary) is the applied-geomatics arm most likely to be the eventual technical stakeholder or evaluator, since it already runs InSAR/DGPS subsidence studies over coalfields such as Raniganj. Framing the solution as complementary to, not a replacement for, CMPDI's existing remote-sensing work (dense ground truth that improves the accuracy and lead time of what CMPDI already tracks from space) is a stronger pitch than positioning it as a competing system. 

## **6. Problem Analysis — Decomposing the Ask** 

Stripped to its engineering requirements, PS 26025 is five sub-problems stacked on top of each other, and each has its own success criterion: 

1. Sensing: measure tilt, relative displacement between nodes, crack initiation, and vibration, continuously, at the surface above a mine panel. 

2. Communication: get that data off dozens of scattered nodes to a collection point without wired infrastructure, in a way that survives node failure and difficult terrain — this is the "wireless mesh" requirement. 

3. Intelligence: turn noisy multi-sensor time series into (a) an anomaly flag, (b) a predicted subsidence zone, and (c) a severity/progression estimate — three distinct ML tasks, not one. 

4. Presentation: put that intelligence in front of a human — GIS deformation maps, dashboards, and automated SMS/email/app alerts — so it drives a decision, not just a log file. 

5. Operations: run in a working mine environment — low power, offline-capable with periodic sync, scalable to multiple coalfields, and buildable by a student team on a hackathon budget. 

A team that treats this as "one AI model" will underperform; the judges' own description separates detection, prediction, severity estimation and alerting as distinct outputs, so the architecture and the demo should visibly do the same. 

## **7. Proposed Solution Architecture** 

A five-layer architecture, matched directly to the five sub-problems in Section 6: 

- Layer 1 — Sensing nodes: distributed low-cost hardware on the surface above the panel. 

- Layer 2 — Mesh communication: gets node data to a local gateway. 

- Layer 3 — Edge/gateway processing: aggregation, first-pass filtering, offline buffering. 

- Layer 4 — AI/ML cloud backend: anomaly detection, subsidence prediction, severity scoring. 

- Layer 5 — Presentation: GIS dashboard, mobile app, automated alerts. 

#### **7.1 Layer 1 — Sensor node design** 

|**Sensor**|**Purpose**|**Example low-cost part**|
|---|---|---|
|Tilt/inclinaton|Detects abnormal ground tlt at each<br>node|MPU6050 (accelerometer + gyroscope,<br>I2C)|
|Vibraton|Catches unusual vibraton signatures<br>preceding failure|SW-420 / ADXL345 MEMS accelerometer|
|Displacement/stretch|Measures relatve movement between<br>two anchor points|Wire-extensometer with linear<br>potentometer, or resistve strain gauge|
|Crack detecton|Flags crack initaton/widening at<br>instrumented surface points|Low-cost conductve-strip crack sensor<br>(breaks circuit as crack widens)|
|Positoning (optonal)|Coarse absolute positon for node<br>mapping, not primary sensing|NEO-6M GPS module|
|Compute + radio|Runs sampling, local fltering, and mesh<br>transmission|ESP32 (Wi-Fi/BLE) + SX1276/78 LoRa<br>module|
|Power|Field-deployable, solar-assisted|18650 Li-ion cell + small solar panel +<br>TP4056 charge controller|



_Table 7.1 — Per-node bill of materials. All parts are readily available from Indian electronics retailers, satisfying the PS's "widely accessible technologies" and "student prototype friendly" requirements._ 

#### **7.2 Layer 2 — Wireless mesh: the innovation hook, engineered** 

The PS names LoRa, Zigbee and Wi-Fi mesh as options rather than mandating one, and the honest answer is that no single radio is best everywhere on a mine panel — so the recommended design is a hybrid mesh, not a singleprotocol network: 

|**Radio**|**Typical range/hop**|**Natve mesh?**|**Power**|**Best role here**|
|---|---|---|---|---|
|LoRa (SX1276/78)|1–5+ km line-of-sight|Not natvely — needs a mesh<br>protocol layered on top (e.g.,|Very low|Long-haul backbone<br>linking node clusters to|



|**Radio**|**Typical range/hop**|**Natve mesh?**|**Power**|**Best role here**|
|---|---|---|---|---|
|||food routng)||the gateway across a<br>full mine panel|
|Zigbee (802.15.4)|10–100 m/hop|Yes — self-healing mesh built<br>into the protocol|Low|Dense short-range<br>clustering where nodes<br>sit close together (e.g.,<br>around a crack line or<br>subsided edge)|
|Wi-Fi mesh|30–100 m/hop|Yes, but power-hungry|High|Only at the<br>gateway/base staton<br>for high-bandwidth<br>dashboard connectvity,<br>not batery nodes|



_Table 7.2 — Radio comparison and recommended role. This hybrid (LoRa backbone + Zigbee in-cluster mesh) is the specific engineering decision that turns the PS's generic "mesh network" line into a defensible design choice — and it is the piece missing from every LoRalandslide paper reviewed in Section 4.4, which used single-hop star topologies._ 

Multi-hop routing on the LoRa backbone (each node can relay a neighbor's packet toward the gateway) is what makes this a true mesh rather than the star topologies found throughout the reviewed literature — and it is what keeps the system alive when a single node fails or loses line-of-sight, which matters over the kind of uneven, sometimes-collapsing terrain this PS is meant to monitor. 

#### **7.3 Layer 3 — Edge/gateway processing** 

A Raspberry Pi (or equivalent SBC) at each mine panel acts as the LoRa/Zigbee-to-internet gateway: it buffers incoming sensor packets locally (satisfying the PS's "offline capability with periodic cloud synchronization" requirement), runs a lightweight first-pass filter (discard obvious sensor noise, flag values crossing hard safety thresholds for an immediate local alert even if the network is down), and batches the rest for upload. 

#### **7.4 Layer 4 — AI/ML backend** 

Three distinct models, matched to the three intelligence outputs the PS asks for: 

- Anomaly detection ("identify abnormal deformation patterns"): unsupervised methods — Isolation Forest or a lightweight autoencoder — trained on normal-operation sensor fusion data, since labeled subsidencefailure events are scarce. Flags deviation from learned-normal behavior across the tilt/vibration/displacement/crack feature set. 

- Subsidence prediction ("predict possible subsidence zones"): a sequence model (LSTM/GRU, or the CNNBiGRU-attention pattern shown effective on InSAR time series in Section 4.2) over each node cluster's time series, combined spatially across the mesh to estimate which zone of the panel is trending toward failure. 

- Severity/progression estimation: a regression or trend-slope model over the predicted deformation rate, mapped to a simple traffic-light severity scale (watch / warning / critical) that operations staff can act on without interpreting raw model output. 

Given the cold-start problem (no historical Indian mine-subsidence sensor dataset exists to train on), the hackathon-stage plan should be explicit that models are pre-trained on synthetic/physics-informed deformation curves plus any available InSAR ground-truth time series (e.g., the Raniganj dataset referenced in Section 4.1) for 

realism, with a clear plan to retrain on real sensor data once a pilot is live. Judges respond well to teams that name this limitation rather than paper over it. 

#### **7.5 Layer 5 — GIS dashboard, alerts and offline-first app** 

- GIS layer: open-source stack (Leaflet/QGIS-derived web maps) rendering a live deformation heatmap over the mine panel boundary, color-coded by severity. 

- Dashboards: role-based views for mine operators (live status), planners (trend history), and regulators (compliance/audit log) — the PS explicitly separates these three audiences. 

- Alerts: automated SMS/email/push through a low-cost gateway (e.g., Twilio-equivalent Indian SMS API, or GSM module at the gateway for zero-connectivity sites). 

- Offline-first mobile app: caches the latest known state locally and syncs when connectivity returns, matching the PS's offline-capability requirement for remote coalfield sites. 

## **8. Unique Innovation Hook** 

##### **_“Wireless Surface Mesh Network for Real-Time Subsidence Detection”_** 

This differentiates the proposal on three concrete, literature-backed axes rather than a marketing claim: 

6. True multi-hop mesh, not star topology — every LoRa-based landslide/rockfall system found in this review (Kerala, Pantelleria, T-Beam hobbyist project) is single-hop star or point-to-point. A relay-capable hybrid LoRa/Zigbee mesh is a genuine architectural step beyond the published state of the art in this specific sensor class. 

7. AI/ML prediction, not threshold alerting — the closest low-cost analogues trigger on a fixed tilt angle; this proposal's anomaly-detection + sequence-prediction stack (Section 7.4) is closer in spirit to the InSAR+CNNBiGRU-Attention approach (Section 4.2) but achievable at ground-sensor cost instead of satellite-processing cost. 

8. Purpose-built for mining subsidence, not adapted from a different hazard — landslide systems optimize for rainfall-triggered slope failure; Indian mine-safety IoT optimizes for gas/heat/worker distress. Nothing reviewed here targets the specific tilt+displacement+crack signature of panel-induced subsidence with a mesh+AI combination, which is exactly the empty cell in Table 4.1. 

## **9. Technical Feasibility & Cost Estimate** 

#### **9.1 Prototype-scale cost (hackathon demo)** 

|**Item**|**Qty**|**Unit cost (₹)**|**Subtotal (₹)**|
|---|---|---|---|
|Sensor node (ESP32 + LoRa + MPU6050 + vibraton +<br>crack + power)|6|3,200|19,200|
|Gateway (Raspberry Pi + LoRa/Zigbee gateway<br>module)|1|6,500|6,500|



|**Item**|**Qty**|**Unit cost (₹)**|**Subtotal (₹)**|
|---|---|---|---|
|Solar + batery kits|6|450|2,700|
|Enclosures, wiring, misc.|6|300|1,800|
|Cloud/SMS API credits (prototype ter)|-|-|1,500|
|Total (approx.)|||31,700|



_Table 9.1 — Indicative prototype BOM for a 6-node demo mesh, well within typical SIH team/institutional budgets and consistent with the PS's "student prototype friendly" requirement._ 

#### **9.2 Pilot-scale economics** 

At a per-node cost of roughly ₹2,500–4,000, instrumenting a real mine panel (say 40–60 nodes spaced across tens of hectares) lands in the ₹1–2.5 lakh range plus one gateway per panel — a small fraction of the cost of a single subsidence-related surface damage claim, let alone a life-safety incident, which is the economic argument that matters most to a Ministry of Coal evaluator. 

#### **9.3 Technical risk points** 

- LoRa multi-hop mesh firmware is the hardest engineering piece — budget real prototyping time for it rather than treating it as a configuration detail. 

- Crack and displacement sensors need physical calibration against known deformation to be credible in a demo; a simple mechanical test rig showing a crack sensor responding to a controlled gap is worth more to judges than a slide claiming ''mm-level accuracy.'' 

- Model training data is synthetic at this stage (Section 7.4) — say so plainly and show the retraining plan. 

## **10. Impact Assessment** 

- Safety: early warning ahead of ground failure protects both mineworkers and surface communities living above active/legacy workings — directly serves the PS's Disaster Management theme. 

- Infrastructure & agriculture: continuous monitoring lets operators and regulators intervene before roads, buildings, and farmland suffer irreversible damage, rather than assessing damage after the fact. 

- Cost to industry: cheaper than either doing nothing (liability, remediation, halted operations under a DGMS directive) or over-instrumenting with GNSS/InSAR-only coverage at every point. 

- Policy alignment: supports the Ministry of Coal's smart/sustainable mining vision and complements CMPDI's existing geomatics program rather than duplicating it; fits Make in India / Atmanirbhar Bharat framing given the low-cost, indigenous hardware stack. 

- Scalability: the same node design generalizes across Jharia, Raniganj, Talcher and other coalfields since it does not depend on site-specific satellite tasking. 

## **11. Risks & Challenges** 

|**Risk**|**Mitgaton**|
|---|---|
|Harsh environment (dust, moisture, temperature<br>swings, subsidence itself damaging nodes)|IP65+ enclosures, conformal-coated PCBs, redundant node<br>spacing so single-node loss doesn't blind a zone|
|False positves eroding operator trust|Mult-sensor fusion before alertng (require agreement<br>across tlt+vibraton+displacement, not single-sensor trigger);<br>severity ters instead of binary alarms|
|Power in remote, sunlight-variable sites|Solar + batery sized for worst-case cloudy runtme;<br>aggressive ESP32 deep-sleep duty cycling|
|Mesh reliability over collapsing/irregular terrain|Mult-hop relay so packets route around failed/obstructed<br>nodes; local edge alert at gateway even if cloud link is down|
|No real historical subsidence-event training data|Physics-informed synthetc training data + available InSAR<br>tme series (e.g., Raniganj) for pretraining; explicit retraining<br>plan once pilot sensor data accumulates|
|Regulatory adopton path|Positon as a DGMS S&T-circular-eligible pilot and as<br>complementary to CMPDI's existng geomatcs work, not a<br>replacement|



## **12. Implementation Roadmap** 

9. Hackathon/prototype (0–2 weeks): 4–6 node mesh, threshold + basic anomaly-detection demo, live dashboard, simulated subsidence event triggering an SMS alert. 

10. Post-hackathon validation (1–3 months): controlled test rig with mechanically induced tilt/crack/displacement to validate sensor response and calibrate the anomaly model. 

11. Pilot (3–9 months): 40–60 node deployment on one active or legacy panel with DGMS/CMPDI engagement, real-data model retraining. 

12. Scale (9+ months): multi-coalfield rollout, integration with CMPDI's InSAR products for sensor-satellite fusion. 

## **13. References** 

1. Subsidence monitoring techniques in coal mining: Indian scenario 

2. A review of monitoring, calculaton, and simulaton methods for ground subsidence induced by coal mining — <u>Internatonal Journal of Coal Science & Technology</u> 3. Integrated high-precision monitoring method for surface subsidence in mining areas using D-InSAR, SBAS, and UAV <u>technologies — Scientfc Reports</u> 

4. High-precision monitoring and predicton of mining area surface subsidence using SBAS-InSAR and CNN-BiGRU-atenton <u>model — Scientfc Reports</u> 

5. Ground subsidence monitoring in India using InSAR: A review of current status and future prospects — ScienceDirect 

6. Surface deformaton monitoring of Raniganj coalfeld, India, using advanced InSAR and DGPS 

7. CMPDI Geomatcs services 

8. Harnessing LoRa for real-tme landslide monitoring and early alerts in Kerala's terrain — ScienceDirect 9. Design of a Low-Cost and Low-Power LoRa-Based IoT System for Rockfall and Landslide Monitoring — MDPI 10. LoRa-Based Wireless Sensors Network for Rockfall and Landslide Monitoring: Pantelleria Island — MDPI 11. Applicaton of LoRa WSN in Landslide Monitoring Systems — Hackster.io 

12. A LoRa-based Wireless Sensor Network monitoring system for urban areas subjected to landslide — ACM DL 13. An IoT System for Monitoring and Alertng Safety in Coal Mines — E3S Web of Conferences 

14. Major Initatves of DGMS for OSH in Mines — Ministry of Mines, Govt. of India 

15. DGMS Circulars 

16. SIH 2026 — All Problem Statements Master Catalogue (verifed PS 26025 metadata: category, theme, sponsor) 

