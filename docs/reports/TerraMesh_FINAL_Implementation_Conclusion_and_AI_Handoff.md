# SIH 2026 PS 26025 --- FINAL IMPLEMENTATION CONCLUSION & AI-AGENT HANDOFF

> **Purpose:** This file is the final consolidated handoff for any AI
> agent, developer, researcher, designer, or team member continuing the
> project. It captures the final architecture, implementation scope,
> selected technologies, features, validation plan, costs, limitations,
> business direction, future roadmap, and the rules that must not be
> violated.

## 0. PROJECT IDENTITY

-   **Problem Statement:** SIH 2026 --- PS 26025
-   **Official title:** Development of an AI-enabled Low Cost Real Time
    Mine Subsidence Monitoring, Prediction and Early Warning System for
    Underground Coal Mines in India
-   **Project working title:** AI-enabled Low-Cost Real-Time Mine
    Subsidence Monitoring, Prediction and Early-Warning System for
    Underground Coal Mines in India
-   **Product/platform:** **TerraMesh**
-   **Innovation core:** **SHADOW --- Subsidence Hazard via Anticipated
    Deformation, Observed Warning**
-   **Primary domain:** Mining safety / disaster management /
    geotechnical monitoring
-   **Target users:** Mine managers, mining/strata-control engineers,
    survey/geotechnical officers, safety/rescue teams, DGMS/regulators,
    district disaster authorities, communities/farmers, infrastructure
    owners, environmental/forest authorities.
-   **Core objective:** Build a scientifically credible, technically
    defensible, low-cost, real-time, multi-sensor, predictive,
    explainable, uncertainty-aware, offline-capable and scalable
    surface-deformation early-warning platform for Indian underground
    coal mines.

## 1. FINAL CONCLUSION IN ONE PARAGRAPH

TerraMesh is a **surface-deformation monitoring and early-warning
platform** for underground coal mine subsidence. It places distributed
low-cost sensor nodes over active and legacy workings and continuously
measures tilt, vibration, crack/displacement and temperature, with
optional GNSS reference nodes for absolute anchoring. The nodes
communicate through a **clustered-star private LoRa network** to an edge
gateway. The gateway performs sensor-health screening, filtering and
sensor fusion, spatial neighbour-consensus analysis, anomaly detection,
short-horizon forecasting, physics-based expected-trough residual
analysis, transparent risk scoring, uncertainty estimation and
explainable warning generation. The warning engine produces **NORMAL →
WATCH → WARNING → CRITICAL** states using persistence, spatial
consensus, multi-sensor agreement, model confidence and data quality.
Local alerts continue even when the Internet/cloud is unavailable;
missing data is never interpreted as safe. GIS provides panel-level
deformation, sensor-health, uncertainty, forecast and risk
visualisation. The SIH prototype is validated using a physical
subsidence simulator, tilt table, crack-opening rig and vibration
scenarios, supported by physics-based simulation and InSAR-anchored
deformation realism. The system is explicitly scoped to
**progressive/trough-type subsidence and accelerating creep where
surface precursors exist**; it does not claim exact prediction of sudden
precursor-free crown-hole collapse.

## 2. WHAT HAS BEEN DECIDED

### The system is NOT simply:

-   A landslide sensor network.
-   A collection of cheap sensors.
-   A cloud dashboard.
-   An AI model trained on synthetic data.
-   An InSAR prediction system.
-   A conventional threshold alarm.
-   A true multi-hop wireless mesh as a networking novelty.
-   A full 3D geomechanical digital twin.

### The system IS:

-   A **spatial sensor array** for surface subsidence.
-   A **low-cost continuous monitoring** layer.
-   A **sensor-health-aware** safety system.
-   A **multi-sensor + spatial-consensus** warning system.
-   A **baseline-first predictive** system.
-   A **physics-guided + AI** system.
-   An **edge-first/offline-first** safety architecture.
-   An **uncertainty- and evidence-carrying** decision-support system.
-   A **GIS-based mine decision platform**.
-   A modular platform designed to evolve for 5--10 years.

## 3. CORE PHYSICAL MODEL

Underground extraction creates voids. Overburden responds through
caving/fracturing/continuous deformation and surface deformation appears
as a subsidence trough.

Observable surface quantities: - Vertical settlement. - Tilt. -
Horizontal displacement. - Differential tilt / strain proxy. -
Curvature. - Tension cracks. - Crack-opening rate. -
Vibration/micro-events as a corroborating signal. -
Temperature/environmental conditions for compensation and confounder
modelling.

Important temporal cases: - Active longwall: comparatively predictable
trough development over days--weeks, with residual movement over
months--years. - Old bord-and-pillar workings: progressive degradation
can lead to sudden pothole/sinkhole/crown-hole collapse. - Some sudden
collapses have little or no measurable surface precursor.

### Hard physical limitation

The platform **cannot reliably predict the exact time and location of a
sudden precursor-free collapse** because a surface sensor cannot measure
a movement that has not occurred. Therefore the product claim is:

> **Detect and forecast progressive/trough-type surface deformation and
> accelerating creep, and escalate risk when measurable evidence
> supports it.**

For sudden collapse, the system can warn only when measurable precursors
exist.

## 4. FINAL SYSTEM ARCHITECTURE

``` text
UNDERGROUND MINING ACTIVITY / OLD WORKINGS
                ↓
        Ground deformation
                ↓
     SURFACE SENSOR ARRAY
  ┌─────────────────────────────┐
  │ Tilt / inclination          │
  │ Vibration / acceleration    │
  │ Crack / displacement        │
  │ Temperature                 │
  │ Optional RH / rain          │
  │ Optional RTK-GNSS anchors   │
  └─────────────────────────────┘
                ↓
      ESP32 NODE PROCESSING
  sampling → filtering → temp compensation
  → features → health pre-screen → event trigger
                ↓
       PRIVATE LoRa 865–867 MHz
       clustered-star topology
                ↓
       RASPBERRY PI GATEWAY
                ↓
 sensor validation / sensor-health
                ↓
 per-node fusion
                ↓
 GNSS-anchored array adjustment
                ↓
 differential tilt + neighbour consensus
 + spatial coherence + physics residual
                ↓
 MAD/Hampel + CUSUM + Isolation Forest
                ↓
 Holt/ARIMA baseline → XGBoost
 (GRU/TCN only if it demonstrably wins)
                ↓
 conformal intervals + GP/Kriging variance
                ↓
 transparent weighted risk engine
                ↓
 persistence + spatial consensus
 + multi-sensor agreement + confidence
 + minimum caution for poor data
                ↓
 NORMAL / WATCH / WARNING / CRITICAL
        ↓              ↓
 local siren       SMS/email/app
        ↓              ↓
             GIS DASHBOARD
        ↓
 optional cloud sync / archive / retraining
```

## 5. FINAL HARDWARE IMPLEMENTATION

### Standard node

-   ESP32.
-   MEMS inclinometer OR high-stability MEMS accelerometer used as tilt.
-   MEMS accelerometer for vibration features.
-   Digital temperature sensor / on-board temperature.
-   LoRa radio, India 865--867 MHz for field design.
-   Li-ion battery.
-   Small solar panel.
-   Charge controller.
-   Stable rigid mounting to competent ground.
-   Field version: IP66 enclosure.
-   Prototype version may use low-cost PVC/junction enclosure with the
    limitation explicitly stated.

### Crack node

Standard node +: - Draw-wire encoder, potentiometric crackmeter, or
similar prototype displacement mechanism. - Used only where a
crack/joint exists or is deliberately created in the rig. - Field
upgrade: vibrating-wire crackmeter where required.

### Reference node

-   Standard node + RTK-GNSS module and antenna.
-   Approximately 3--6 reference nodes per panel in the full field
    architecture.
-   For the ultra-low-cost SIH prototype, GNSS can be removed and a
    stable fixed reference plus periodic manual survey/dumpy level can
    be used.

### Gateway

-   Raspberry Pi 4/5 for the recommended architecture.
-   LoRa concentrator for scalable field deployment.
-   4G modem.
-   Optional LoRa backhaul.
-   Solar/PSU.
-   Local siren relay.
-   IP66 cabinet.
-   Prototype may use a laptop as the edge server and a simple
    ESP32/LoRa bridge to reduce cost.

## 6. FINAL COMMUNICATION ARCHITECTURE

### Selected

**Private clustered-star LoRa**

-   Nodes → nearest gateway.
-   India field frequency: 865--867 MHz.
-   No multi-hop routing in the prototype.
-   Spatial intelligence comes from the **physical arrangement of nodes
    and neighbour-consensus analytics**, not from network-layer mesh
    routing.
-   Add gateways rather than unnecessary hops when scaling.
-   4G/NB-IoT is a gateway uplink, not the safety-critical local sensing
    path.
-   Store-and-forward protects operation during connectivity outages.
-   Payload encryption, counters and authenticated communication are
    included in the security design.

### Adaptive cadence

-   NORMAL: slow cadence, approximately 5--15 minutes.
-   Event mode: approximately 10--60 seconds.
-   Event mode is triggered by node pre-screening or gateway command.
-   This manages LoRa airtime and power.

### Why not Zigbee/BLE/Wi-Fi mesh?

-   Zigbee/BLE: range is inadequate for panel-scale deployment without
    many hops.
-   Wi-Fi mesh: higher power and shorter practical range.
-   NB-IoT/LTE-M first: carrier dependency breaks offline-first
    operation.
-   Multi-hop LoRa mesh: unnecessary complexity, power cost and latency
    variance for the prototype.

## 7. FINAL DATA PIPELINE

1.  Ground movement occurs.
2.  Sensors measure physical changes.
3.  Raw samples are timestamped.
4.  Node performs range, flatline, noise and rate checks.
5.  Temperature compensation is applied.
6.  Robust filtering and quiet-window averaging are performed.
7.  Features are extracted:
    -   rolling mean
    -   rate
    -   variance
    -   vibration RMS
    -   crack rate
    -   acceleration indicators
8.  Node transmits compact feature frames.
9.  LoRa packets are encrypted and counter-protected.
10. Gateway receives, decrypts, deduplicates and orders data.
11. Data is persisted locally.
12. Sensor-health module classifies each node.
13. Healthy node measurements are fused.
14. GNSS references anchor the network where available.
15. Differential tilt / strain proxy is calculated.
16. Neighbour consensus is calculated.
17. Spatial coherence is calculated.
18. Expected subsidence profile is generated using the
    influence/profile-function model.
19. Observed minus expected deformation creates the physics residual.
20. Anomaly detection runs.
21. Forecasting runs.
22. Prediction intervals are calculated.
23. Risk is calculated.
24. Confidence/uncertainty is calculated.
25. Warning state machine applies persistence, consensus, multi-sensor
    agreement and data-quality rules.
26. GIS is updated.
27. Local and remote alerts are dispatched.
28. Alert evidence is logged.
29. Data is synchronized to cloud when connectivity returns.

## 8. SENSOR HEALTH --- SAFETY-CRITICAL IMPLEMENTATION

The system must distinguish:

**REAL GROUND MOVEMENT**

from

**SENSOR MALFUNCTION**

### Fault classes

-   Flatline/stuck.
-   Slow drift.
-   Excess noise.
-   Outliers/spikes.
-   Bias step.
-   Communication loss.
-   Battery/power fault.
-   Physical knock/vandalism.
-   Calibration expiry.

### Detection

-   Variance floor.
-   Rolling variance.
-   Hampel filter.
-   Change-point detection.
-   Temperature correlation.
-   Neighbour inconsistency.
-   Accelerometer shock detection.
-   Heartbeat timeout.
-   Battery telemetry.
-   Calibration metadata.
-   Isolation Forest on health features.

### Node states

-   HEALTHY
-   SUSPECT
-   FAULTED

FAULTED nodes: - Are excluded/down-weighted from fusion. - Are visible
as data gaps. - Increase uncertainty. - Never become silently "normal".

### Required validation

Produce a **fault-vs-real-movement confusion matrix** using injected
faults and simultaneous real deformation.

## 9. SENSOR FUSION

### Per-node

Use: - Complementary filter OR linear Kalman Filter. - Temperature
compensation. - Quiet-window averaging. - Tilt state + rate +
uncertainty.

Do NOT use EKF/UKF/particle filters unless future evidence proves they
are necessary.

### Array-level

-   Confidence-weighted least-squares adjustment.
-   GNSS anchoring when available.
-   Health score controls each node's contribution.
-   IDW as simplest interpolation baseline.
-   Ordinary Kriging as comparison.
-   Gaussian Process regression as recommended uncertainty-aware
    interpolation.

Missing nodes: - Do not zero-fill silently. - Inflate interpolation
variance. - Flag the map. - Raise caution when data loss becomes
significant.

## 10. FINAL AI/ML STACK

### Anomaly detection

1.  MAD / robust z-score / Hampel --- essential baseline.
2.  CUSUM / change-point --- onset detection.
3.  Isolation Forest --- multivariate anomaly detection.
4.  Matrix profile --- optional supporting method.

### Forecasting

1.  Persistence / last-value + drift.
2.  EWMA / Holt.
3.  ARIMA/SARIMA.
4.  XGBoost using lagged + engineered + physics features.
5.  GRU/TCN only if they beat the baseline under proper walk-forward
    validation.

### Rejected for SIH

-   Transformer/TFT.
-   Large autoencoders/VAE as primary solution.
-   GNN/ST-GNN due to insufficient labelled spatio-temporal event data.

### Physics-guided component

Use an influence/profile-function forward model to estimate expected
trough behaviour.

Physics residual:

``` text
Residual = Observed deformation - Expected deformation
```

This residual becomes: - An anomaly feature. - A spatial consistency
signal. - An explainability aid. - A way to connect extraction geometry
with measured deformation.

### Inverse velocity

-   Auxiliary only.
-   Only for slow accelerating creep.
-   Wide uncertainty.
-   Never a deterministic collapse-time predictor.
-   Transfer to sinkhole collapse remains uncertain.

## 11. FINAL RISK ENGINE

Transparent evidence fusion:

``` text
risk =
    w1 * normalized anomaly score
  + w2 * probability of threshold exceedance within H
  + w3 * acceleration indicator
  + w4 * spatial consensus fraction
  + w5 * persistence factor
  - w6 * data-quality penalty
```

Important: - Data quality lowers confidence in the risk value. -
Separately, poor data forces a minimum caution level. -
Missing/low-quality data must never reduce safety status. - Initial
weights can be expert-informed. - Final operating point must be tuned on
the scenario set. - ROC/PR trade-off should be shown. - Warning
thresholds must not be arbitrary.

## 12. WARNING ENGINE

Final levels:

### NORMAL

No meaningful evidence of abnormal deformation and data quality is
healthy.

### WATCH

Early anomaly, uncertain evidence, degraded data, clustered node loss or
emerging trend.

### WARNING

Sustained evidence with stronger multi-sensor/spatial support and
increasing deformation risk.

### CRITICAL

Strong sustained evidence, spatial/multi-sensor consensus and high
confidence, or one clearly unambiguous large displacement.

CRITICAL must never be triggered merely by: - One noisy sample. - One
isolated cheap sensor. - A missing-data condition. - A single
uncorroborated sensor fault.

The warning state machine should use hysteresis to avoid rapid status
oscillation.

## 13. UNCERTAINTY + EXPLAINABLE AI

Every alert should show:

1.  Warning level.
2.  Risk value.
3.  Confidence band.
4.  Contributing sensors.
5.  Neighbour agreement.
6.  Spatial-shape agreement.
7.  Current deformation rate.
8.  Acceleration/change in rate.
9.  Forecast trajectory.
10. Prediction interval.
11. Time-to-threshold estimate where meaningful.
12. Node health.
13. Communication state.
14. Last good reading.
15. Percentage of nodes reporting.
16. What changed from the last NORMAL state.

Methods: - Conformal prediction intervals. - GP/Kriging variance. -
Ensemble spread. - SHAP / feature contribution. - Evidence panel.

Do not present uncertainty as a decorative number; it must affect
interpretation and warning confidence.

## 14. OFFLINE-FIRST / FAIL-SAFE IMPLEMENTATION

### Internet down

-   Local sensing continues.
-   Local fusion continues.
-   Local anomaly detection continues.
-   Local forecasting continues.
-   Local warning continues.
-   Local dashboard continues over LAN/hotspot.
-   Data is queued for later sync.

### Cloud down

Same local behaviour.

### Gateway down

-   Nodes buffer data locally.
-   Features can be retained for ≥30 days as a prototype design target.
-   Peer gateway adoption can be added in field architecture.
-   Gateway loss raises area status to WATCH and sends a heartbeat
    failure alert.

### Node down

-   SUSPECT → FAULTED.
-   Gap shown on GIS.
-   Uncertainty increases.
-   Several adjacent failures can raise area to WATCH.

### Power loss

-   Solar+battery ride-through.
-   Low-battery telemetry.
-   Cadence reduces before shutdown.
-   "Going dark" message is sent when possible.

### Partial data

-   Available data continues to be used.
-   Uncertainty increases.
-   Minimum caution level is enforced.

**Core safety principle:**

> **NO DATA ≠ SAFE**

## 15. GIS IMPLEMENTATION

### Stack

-   PostGIS.
-   FastAPI / GeoServer.
-   GeoJSON / vector tiles.
-   Leaflet or MapLibre.
-   QGIS for offline expert analysis and planning.

### Map layers

-   Mine panels.
-   Old-working boundaries.
-   Node locations.
-   Node health.
-   Tilt vectors.
-   Crack locations.
-   Crack-opening changes.
-   Settlement/tilt heatmap.
-   Uncertainty layer.
-   NORMAL/WATCH/WARNING/CRITICAL risk zones.
-   Historical trends.
-   Forecast overlays.
-   InSAR baseline/cross-check layer.

### Dashboard modules

-   Dashboard.
-   Live map.
-   Sensor data.
-   AI prediction.
-   Alerts.
-   Reports.
-   System health.
-   Alert evidence/explanation.

Do not build a heavy 3D globe/game-engine UI for SIH.

## 16. LIGHTWEIGHT PHYSICS MODEL VS DIGITAL TWIN

### Build now

A lightweight physics forward model: - GIS spatial model. - Extraction
geometry. - Influence/profile function. - Expected trough. - Observed vs
expected residual.

### Do not build now

Full FLAC3D/PFC/real-time 3D geomechanical digital twin.

Reason: - High effort. - Requires site-specific parameters. - Difficult
to validate in SIH. - Adds complexity without enough demonstrable
benefit.

Full digital twin remains future work.

## 17. DATASET STRATEGY

There is **no large public labelled dataset of low-cost surface-sensor
time series with Indian underground-coal subsidence event labels**.

Therefore use a layered dataset:

### Layer 1 --- Real rig sensor data

Used for: - Noise. - Drift. - Temperature behaviour. - Real sensor
response. - Fault signatures.

### Layer 2 --- Physics simulation

Generate: - Progressive troughs. - Localized deformation. - Differential
movement. - Different rates. - Different panel geometry. - Different
influence angles. - Sensor noise. - Drift. - Missing samples. - Packet
loss. - Environmental components. - Injected faults.

### Layer 3 --- InSAR-anchored realism

Use published Raniganj/Jharia deformation rates and shapes to calibrate
realistic simulation scenarios.

### Layer 4 --- Augmentation

Include: - Temperature cycles. - Monsoon-like seasonal effects. -
Moisture. - Traffic vibration. - Blasting-like vibration. - Node
dropouts. - Packet loss. - Battery decline.

### Layer 5 --- Controlled physical experiments

-   Sandbox.
-   Tilt table.
-   Crack rig.
-   Shaker.

### Limitation

Synthetic/lab data can establish: - Methodology soundness. - Relative
model ranking. - Failure-mode behaviour.

It **cannot establish field accuracy**. Field accuracy requires a real
mine pilot.

## 18. SIH PHYSICAL PROTOTYPE

Recommended field-representative SIH build: - 7 standard nodes. - 2
crack nodes. - 1--2 GNSS reference nodes OR one good absolute reference
instrument. - 1 Raspberry Pi gateway. - LoRa. - Laptop dashboard. -
Subsidence simulator. - Tilt table. - Crack micrometer stage. -
Shaker. - Ground-truth dial gauge/calipers.

### Ultra-low-cost version

-   6 nodes.
-   ESP32.
-   MPU6050.
-   One crack sensor.
-   2 battery/solar nodes.
-   4 USB-powered nodes.
-   ESP-NOW for tabletop demo.
-   One Ra-02 LoRa pair for link proof.
-   Laptop edge.
-   Telegram/email alert.
-   Buzzer.
-   Small physical rig.

The low-cost demo must state clearly that the **field architecture uses
LoRa 865--867 MHz**, while ESP-NOW is only the budget tabletop
transport.

## 19. FINAL EXPERIMENT SET --- 11 SCENARIOS

1.  Normal quiet operation.
2.  Gradual uniform subsidence.
3.  Localized subsidence.
4.  Differential movement.
5.  Crack initiation and widening.
6.  Vibration disturbance without subsidence.
7.  Single sensor drift/stuck/bias fault.
8.  Communication loss.
9.  Multi-node real subsidence + one simultaneous sensor fault.
10. Internet/cloud outage during a real event.
11. Monsoon-like thermal/moisture cycling without subsidence.

The experiment set must demonstrate: - Detection. - Prediction. -
False-alarm suppression. - Sensor-health discrimination. - Spatial
localisation. - Offline safety. - Robustness.

## 20. VALIDATION METRICS

### Sensor

-   Resolution.
-   Repeatability.
-   Drift.
-   Temperature response.

### Crackmeter

-   Resolution.
-   Linearity.
-   R².

### Communication

-   Packet delivery ratio.
-   Latency.
-   Range.
-   Duty-cycle/airtime.

### AI

-   Precision.
-   Recall.
-   F1.
-   PR-AUC.
-   Detection latency.
-   False-alarm rate/node-day.
-   Miss rate.
-   Warning lead-time distribution.

### Forecast

-   MAE.
-   RMSE.
-   MASE.
-   Prediction interval coverage.
-   Calibration.

### Sensor health

-   Fault-vs-movement confusion matrix.
-   FPR.
-   FNR.
-   Real-event preservation.

### Spatial

-   Localisation error.
-   Differential-tilt accuracy.
-   Consensus performance.
-   False-alarm reduction with/without spatial gating.

### System

-   Edge inference latency.
-   CPU/RAM.
-   Offline success.
-   Data retention.
-   Cost/node.
-   Cost/monitored area.

## 21. REQUIRED VALIDATION TARGETS

These are **design/acceptance targets, not guarantees**:

-   Sensor→alert event latency: **\<60 seconds**.
-   Tilt resolution after compensation: **≤0.01° (\~175 µrad)** usable
    target.
-   Crack/displacement resolution: **≤0.1 mm** target.
-   Node autonomy: **≥14 days without sun** at nominal cadence target.
-   Gateway inference: **\<5 seconds/cycle** on Raspberry Pi-class
    target.
-   Offline local retention: **≥30 days** target.
-   Network PDR: **≥95% at design range** target.
-   Forecast MASE: **\<1** target for meaningful baseline improvement.
-   Interval coverage: approximately nominal coverage.
-   False-alarm and miss rate: report confidence intervals; **no
    guaranteed fixed number**.
-   Offline injected outage handling: target 100% safe handling in
    tested scenarios.

## 22. MANDATORY ABLATION STUDY

Compare:

-   Tilt only.
-   Tilt + crackmeter.
-   Tilt + vibration.
-   Full multi-sensor fusion.
-   Without spatial features.
-   With spatial features.
-   Without temporal model.
-   With temporal model.
-   Without sensor-health module.
-   With sensor-health module.
-   Baseline statistics only.
-   -   Isolation Forest/XGBoost.
-   Without edge/cloud-only.
-   With edge.

### Purpose

Every component must **earn its place**.

If ML does not outperform the baseline, use the baseline.

If spatial features do not reduce false alarms or improve localisation,
do not pretend they do.

If vibration adds little value, keep it as a corroborating/context
feature instead of forcing it into the main decision.

## 23. ROBUSTNESS TESTING

Inject: - Gaussian noise. - Heavy-tailed noise. - 5--40% missing
samples. - Outlier bursts. - Linear drift. - Thermal drift. -
Single-node communication loss. - Clustered communication loss. -
Battery decline. - Reduced sampling cadence. - 0--60 °C environmental
model. - Moisture/seasonal drift. - Traffic vibration. - Blasting-like
vibration. - Multiple simultaneous anomalies.

Safety acceptance: - No silent failure. - Performance degrades
monotonically or gracefully. - Uncertainty grows when data quality
worsens. - Warning status must never become safer merely because data
quality becomes worse.

## 24. SECURITY

### Device

-   Per-node keys.
-   AES-style payload encryption.
-   Message counters/nonces.
-   Replay protection.

### Gateway/cloud

-   TLS.
-   Authentication.
-   RBAC.
-   Audit log.

### Firmware

-   Signed OTA.
-   Version pinning.
-   Rollback.
-   Secure boot where supported.

### Integrity

-   HMAC/message integrity.
-   Server-side plausibility checks.
-   Tamper events from enclosure switch/accelerometer shock.

### Alert integrity

-   Append-only alert records.
-   Local signed records.
-   Cloud mirror when available.
-   Authenticated acknowledgement with reason.

### Anti-spoofing

A single spoofed node should not force CRITICAL because: - Spatial
consensus is required. - Physical plausibility is checked. - Sensor
health is checked. - Implausible sudden values become SUSPECT.

## 25. COST --- FINAL NUMBERS

All cost figures are **indicative estimates, not industrial quotes**.

### Full prototype range

Approximately **₹70,000--₹1,60,000**, dominated by GNSS and gateway.

### Cost-optimised prototype

Approximately **₹15,000**.

### Lean prototype

Approximately **₹8,500--₹10,000**.

### Recommended final SIH budget

Approximately **₹20,000--₹22,000**.

### Comfortable version

Approximately **₹28,000--₹32,000**.

### Ultra-lean

Approximately **₹9,000--₹11,000**.

### Sub-₹10k exact design

Approximately **₹9,010**. With bare modules and skipping the dial gauge:
approximately **₹7,800**.

### Indicative field node

-   BOM: **₹1,000--₹2,500**.
-   Installed screening-grade node: approximately **₹3,000--₹8,000**.

### Field gateway

Approximately **₹8,000--₹20,000** for the cost-optimised gateway.

### Field panel

Approximately: - **20 nodes + 1 gateway:** ₹1.0--₹2.2 lakh capex for
relative-only screening architecture. - Maintenance: approximately
₹0.3--₹0.8 lakh/year. - Continuous screening: approximately **₹3--₹8
lakh/km²** under stated assumptions.

These are estimates and must not be presented as competitor quotes.

## 26. FINAL RECOMMENDED SIH BUILD

Build the smallest complete vertical slice that demonstrates:

``` text
REAL SENSOR
→
WIRELESS DATA
→
LOCAL EDGE PROCESSING
→
SENSOR HEALTH
→
MULTI-SENSOR FUSION
→
SPATIAL CONSENSUS
→
ANOMALY DETECTION
→
FORECAST
→
RISK
→
UNCERTAINTY
→
EXPLANATION
→
GIS
→
SIREN / ALERT
→
OFFLINE RECOVERY
```

Do not leave integration until the final hours.

First freeze an end-to-end thin slice, then add depth.

## 27. FINAL SOFTWARE STACK

### Firmware

-   ESP-IDF / Arduino.
-   C/C++ or MicroPython where appropriate.
-   Sampling.
-   Filtering.
-   Temperature compensation.
-   Feature extraction.
-   Threshold pre-screen.
-   Event trigger.
-   Ring-buffer store-and-forward.
-   Signed OTA.

### Gateway

-   Python.
-   FastAPI.
-   MQTT/Mosquitto.
-   SQLite.
-   scikit-learn.
-   XGBoost.
-   statsmodels/ARIMA where used.
-   SHAP.
-   Conformal prediction tooling.
-   GP/Kriging implementation.
-   Risk engine.
-   Alert service.

### Server/cloud

-   TimescaleDB.
-   PostGIS.
-   Optional GeoServer.
-   Model registry.
-   Retraining.
-   Long-term archive.
-   Multi-gateway/multi-mine dashboard.
-   InSAR ingestion.

### Frontend

-   Leaflet or MapLibre.
-   GeoJSON/vector tiles.
-   Time-series charts.
-   Alert log.
-   Evidence panel.
-   System-health page.

## 28. FINAL PRODUCT FEATURES

1.  Continuous surface monitoring.
2.  Tilt monitoring.
3.  Vibration context.
4.  Crack/displacement monitoring.
5.  Temperature compensation.
6.  Optional humidity/rain sensing.
7.  Optional GNSS anchoring.
8.  Adaptive/event-triggered sensing.
9.  Sensor-health classification.
10. Multi-sensor fusion.
11. Neighbour consensus.
12. Differential tilt/strain proxy.
13. Spatial coherence.
14. Influence-function physics residual.
15. Robust anomaly detection.
16. Change-point detection.
17. Multivariate Isolation Forest.
18. Short-horizon forecasting.
19. Baseline-first model selection.
20. XGBoost forecasting where justified.
21. Conditional GRU/TCN challenge models.
22. Conformal prediction intervals.
23. GP/Kriging uncertainty maps.
24. Transparent risk scoring.
25. NORMAL/WATCH/WARNING/CRITICAL warning engine.
26. Persistence gating.
27. Multi-sensor agreement.
28. Model-confidence gating.
29. Data-quality gating.
30. Explainable alerts.
31. SHAP contribution display.
32. Local siren/buzzer.
33. SMS/email/app notifications.
34. Offline operation.
35. Store-and-forward.
36. Local database.
37. GIS dashboard.
38. Historical trends.
39. Forecast visualisation.
40. Audit logs.
41. OTA updates.
42. Security and authenticated devices.
43. Scalable gateway architecture.
44. InSAR independent cross-check.
45. Optional inverse-velocity creep estimate.
46. Optional peer-gateway adoption.
47. Future multi-mine cloud management.

## 29. EXISTING SOLUTIONS --- FINAL POSITIONING

### InSAR

Strength: - Wide-area history. - Millimetre/year deformation rates. -
Independent spatial baseline.

Weakness for immediate warning: - Satellite revisit. - Processing
latency. - Line-of-sight limitation. - Vegetation/monsoon
decorrelation. - Fast deformation issues.

TerraMesh uses InSAR as a **cross-check/context layer**, not as a
replacement.

### Total station / robotic TS

Strength: - High accuracy. - Mature.

Weakness: - Cost. - Sparse point coverage. - Line-of-sight. -
Infrastructure requirement.

### Permanent GNSS

Strength: - Strong absolute reference.

Weakness: - Expensive per point. - Sparse.

TerraMesh uses only a few GNSS reference nodes in the full architecture.

### Vibrating-wire instrumentation

Strength: - Reliable, industry-grade.

Weakness: - Higher cost and installation complexity.

Use as a field-grade upgrade.

### Landslide LoRa/MEMS networks

Strength: - Proven low-cost wireless sensing.

Difference: - TerraMesh targets mining subsidence mechanics, spatial
trough geometry, old workings, sensor-health discrimination, physics
residuals and DGMS-oriented decision evidence.

### Deep-learning InSAR forecasting

Strength: - Demonstrates forecasting feasibility.

Difference: - TerraMesh forecasts high-cadence in-situ signals at the
edge and provides an operational warning engine.

## 30. HONEST NOVELTY POSITION

Do **not** claim: - First. - Unique. - World's first. - Patented. - Only
system.

Individually, these are prior art: - LoRa + MEMS. - Tilt detection. -
InSAR + ML. - GIS dashboards. - Multi-level alerts.

The potentially defensible contribution is the **combination and
adaptation**:

> **Offline-first + explicitly evaluated
> sensor-health-vs-ground-movement discrimination +
> spatial-consensus/persistence/multi-sensor warning gating +
> baseline-first validated forecasting + physics forward-model
> residuals, specialised for Indian underground-coal surface conditions
> and DGMS decision workflow.**

A formal patent/FTO search is still required before making IP claims.

## 31. TOP 5 CORE INNOVATIONS

1.  **Sensor-health vs. ground-movement discrimination** as a
    first-class evaluated safety module.
2.  **Spatial-consensus + persistence + multi-sensor warning gating**
    with quantified false-alarm reduction.
3.  **Baseline-first walk-forward forecasting**, with simpler models
    winning when deep learning does not prove superior.
4.  **Offline-first fail-safe warning logic** where missing data raises
    caution rather than being treated as normal.
5.  **Physics forward-model residual** as an interpretable anomaly
    feature.

Supporting: - Conformal prediction/evidence-carrying alerts. - Adaptive
event-triggered cadence. - Differential tilt-to-strain. - InSAR
independent cross-check. - Optional inverse velocity.

Future: - GNN. - Full 3D digital twin. - Micro-seismic integration.

## 32. TOP TECHNICAL RISKS + MITIGATIONS

### 1. No-precursor sudden collapse

Mitigation: - Restrict claim to measurable progressive/trough
deformation. - Combine with old-working/void mapping and rain-triggered
watch in future field deployments. - Never claim elimination of the
physical limitation.

### 2. MEMS drift

Mitigation: - Temperature compensation. - Drift detector. - Differential
features. - GNSS re-anchoring. - Periodic calibration.

### 3. Environmental false alarms

Mitigation: - Temperature compensation. - Common-mode rejection. -
Seasonal modelling. - Multi-sensor agreement. - Spatial consensus. -
Persistence. - Quantified ablation.

### 4. Synthetic/lab-only validation

Mitigation: - Be transparent. - Calibrate simulations to real InSAR
deformation. - Use real sensor noise. - Propose a controlled mine pilot.

### 5. LoRa scalability

Mitigation: - Clustered-star. - Adaptive cadence. - Feature frames
instead of continuous raw streaming. - More gateways. - Duty-cycle
planning.

## 33. OTHER IMPORTANT RISKS

-   Small-array spatial evidence may not generalise.
-   Fault taxonomy will be incomplete.
-   Thresholds partly depend on expert knowledge.
-   GNSS multipath can affect reference nodes.
-   Low-cost enclosure is not field-certified.
-   Mining environments are harsher than a lab rig.
-   Field maintenance is non-trivial.
-   Communication outages can occur.
-   Cybersecurity becomes more important at deployment.
-   Regulatory certification is future work.
-   Novelty is combinational and needs prior-art/FTO confirmation.
-   AI can overfit synthetic scenarios.
-   Sudden deformation may reduce all forecast accuracy.
-   LoRa airtime/duty-cycle limits become important at scale.

## 34. 5--10 YEAR ROADMAP

### Year 0--1 --- SIH prototype

-   Physical rig.
-   Low-cost nodes.
-   Edge pipeline.
-   GIS.
-   Warning engine.
-   Validation matrix.
-   Demonstrated offline operation.

### Year 1--3 --- Controlled mine pilot

-   CMPDI/CIMFR/IIT-ISM-type domain partnership.
-   Field sensor calibration.
-   GNSS references.
-   Better enclosures.
-   Real deformation dataset.
-   Monsoon/thermal field validation.
-   DGMS-oriented evidence workflow.

### Year 3--5 --- Mature monitoring platform

-   Multi-panel deployment.
-   Gateway fleet.
-   OTA.
-   Model registry.
-   Production-grade instrumentation.
-   Improved risk calibration.
-   Operational maintenance processes.

### Year 5--7 --- Multi-modal intelligence

Potential: - InSAR integration. - UAV/photogrammetry. - Micro-seismic. -
Better geotechnical instrumentation. - GNN/ST-GNN if enough real data
exists. - Stronger physics-guided models.

### Year 7--10 --- Large-scale intelligent mining safety platform

-   Multiple mines.
-   Multiple coalfields.
-   Fleet-level monitoring.
-   Multi-modal data fusion.
-   Advanced geomechanical modelling.
-   Full digital twin only if sufficient data and validation support it.
-   Enterprise/regulatory interfaces.
-   Predictive asset/infrastructure risk.

## 35. SCALABILITY

### 10 nodes

-   One gateway.
-   SQLite.
-   One model set.

### 100 nodes

-   2--5 clustered gateways.
-   MQTT broker + queue.
-   TimescaleDB.
-   Per-panel calibration.

### 1,000+ nodes / multi-mine

-   Gateway fleet.
-   Sub-band/duty-cycle planning.
-   Horizontal ingest.
-   TimescaleDB + retention/downsampling.
-   Edge inference per gateway.
-   Cloud retraining.
-   Model registry.
-   Staged OTA.
-   Rollback.
-   Regional operations dashboard.

Scale through **more gateways, not unnecessary multi-hop routing**.

## 36. BUSINESS / DEPLOYMENT MODEL

Potential customers/users: - Coal India ecosystem. - Mine operators. -
CMPDI-type planning/R&D organisations. - Safety/regulatory ecosystem. -
Infrastructure owners near subsidence-prone areas. - District
authorities for community protection.

Potential model: - Monitoring-as-a-Service. - Tiered deployment by
mine/panel/node count. - Hardware + software package. -
Maintenance/calibration contract. - Expert geotechnical support. -
Integration partnerships with sensor/equipment companies.

Business value: - Continuous visibility. - Better survey
prioritisation. - Reduced manual monitoring burden. - Faster
identification of unstable areas. - Protection of workers, communities
and infrastructure. - Lower cost per monitored area. - Auditable
evidence.

Commercialisation requires: - Field validation. - Ruggedisation. -
Calibration. - Certification/standards assessment. - Regulatory
engagement. - Procurement validation.

## 37. STAKEHOLDER DECISION SUPPORT

The system should **support**, not autonomously replace, human safety
decisions.

Typical decisions: - Restrict access. - Stop or modify work. -
Prioritise survey. - Establish exclusion zone. - Notify authorities. -
Trigger emergency procedures. - Resume activity only after appropriate
human/domain assessment.

The highest-value triangle is: **Mine manager +
geotechnical/strata-control engineer + DGMS/regulator.**

## 38. INDIAN-SPECIFIC DESIGN REQUIREMENTS

The architecture explicitly addresses: - Jharia. - Raniganj. - East/West
Bokaro. - Singareni. - Talcher. - Ib Valley. - Central Indian
coalfields. - Old workings. - Shallow workings. - Standing water. -
Monsoon. - Rain-triggered effects. - Temperature up to roughly 55--60 °C
on exposed enclosures. - Patchy 2G/4G. - Unreliable grid power. - Long
maintenance distances. - Limited skilled technicians. -
Vegetation/terrain effects on InSAR. - Coal-fire confounding in Jharia.

Temperature compensation is mandatory.

Offline-first behaviour is mandatory.

Stable mounting is mandatory.

## 39. PRESENTATION / SIH JUDGE STRATEGY

The strongest live demo is not a flashy AI dashboard alone.

Show:

1.  Physical deformation rig.
2.  Multiple real sensor nodes.
3.  Live data arriving.
4.  One sensor deliberately failing.
5.  AI identifying sensor fault rather than false ground movement.
6.  Real deformation scenario.
7.  Neighbour nodes agreeing.
8.  Risk rising.
9.  Forecast appearing.
10. GIS risk zone changing.
11. Local siren triggering.
12. Internet cable disconnected.
13. System continuing locally.
14. Internet restored.
15. Buffered data synchronising.
16. Explainability panel showing why the warning occurred.
17. Validation table showing measured results.

This directly demonstrates the strongest differentiators.

## 40. FINAL JUDGE ANSWERS

### "Isn't this just a landslide network?"

No. The sensing hardware is related, but the target mechanism, spatial
features, influence-function residual, old-working context,
sensor-health discrimination and DGMS decision workflow are adapted
specifically to mining subsidence.

### "Can cheap MEMS see subsidence?"

They can be evaluated for progressive/trough deformation. The project
does not assume field-grade absolute accuracy; the exact resolution and
drift are measured on the rig. The target after compensation is ≤0.01°.

### "How do you remove thermal/monsoon noise?"

Temperature compensation, common-mode rejection, seasonal modelling,
multi-sensor agreement, spatial consensus and persistence. The
improvement must be demonstrated through ablation.

### "Isn't your accuracy based on synthetic data?"

Yes, if the SIH prototype has no field labels. That is explicitly
acknowledged. Synthetic/lab data validates methodology and model
ranking, not real-mine field accuracy.

### "Why not InSAR?"

Use InSAR. It is valuable for wide-area historical context and
independent cross-checking, but it is not a seconds-latency on-site
alarm system.

### "Why not a transformer/GNN?"

The available labelled event data is insufficient. A simpler model is
more defensible. GNN becomes appropriate after a real network generates
enough data.

### "What if a sensor fails during a real event?"

The sensor-health module separates likely fault from ground movement
using neighbours, temperature, shock and channel behaviour. Faulted
nodes are excluded/down-weighted, and simultaneous real-event + fault
scenarios are explicitly tested.

### "What if Internet fails?"

Monitoring continues locally. The gateway performs the pipeline and
alerts locally. Data is stored and synchronised later.

### "How do you prevent false alarms?"

Persistence + spatial consensus + multi-sensor agreement + model
confidence + sensor-health filtering. False alarms are measured, not
claimed to be zero.

### "Is it novel?"

The individual components are not novel. The potentially defensible
contribution is their validated combination for Indian underground-coal
surface subsidence and DGMS decision support. A formal prior-art/FTO
search is required.

## 41. WHAT MUST NOT BE BUILT FOR SIH

Do not spend SIH time on: - Transformer/TFT. - GNN/ST-GNN. - Full 3D
digital twin. - FLAC3D/PFC real-time coupling. - True multi-hop mesh. -
Cellular-first architecture. - Cloud-only monitoring. - Game-engine 3D
visualisation. - Autonomous evacuation actuation. - Deterministic exact
collapse-time prediction. - Unvalidated AI models. - Hardware that
exists only to make the project look futuristic.

## 42. WHAT MUST NOT BE CLAIMED

Never claim: - 100% accuracy. - Zero false alarms. - Guaranteed collapse
prevention. - Guaranteed prediction of catastrophic failure. - Exact
collapse time. - Real-mine field accuracy without field validation. -
Patent protection without patent search/filing. - "First", "unique",
"world's first", or "only" without evidence. - Industrial/DGMS
certification for a student prototype. - Synthetic performance as
equivalent to real-mine performance.

## 43. FINAL SCIENTIFIC POSITION

The strongest scientific argument is not:

> "AI predicts mine collapse."

It is:

> **"A low-cost spatial sensor array continuously observes surface
> deformation; sensor-health-aware fusion and spatial consensus
> distinguish credible ground movement from noise and faulty sensors;
> baseline-first forecasting estimates short-horizon deformation trends;
> a physics forward model supplies interpretable expected-vs-observed
> residuals; uncertainty and evidence accompany every warning; and the
> entire warning path runs locally even without cloud connectivity."**

## 44. FINAL PRODUCT POSITION

**TerraMesh** should be positioned as:

> **A low-cost, real-time, edge-first surface subsidence intelligence
> and early-warning platform for underground coal mines.**

**SHADOW** is the core warning intelligence:

> **Subsidence Hazard via Anticipated Deformation, Observed Warning**

## 45. FINAL ARCHITECTURE PRINCIPLE

The architecture must remain:

**LOW COST + REAL TIME + MULTI-SENSOR + SPATIAL + EDGE AI + PREDICTIVE +
GIS + EXPLAINABLE + UNCERTAINTY-AWARE + OFFLINE CAPABLE + FAULT
TOLERANT + MODULAR + SCALABLE + MAINTAINABLE + 5--10 YEAR UPGRADEABLE +
INDIAN-MINE SUITABLE**

## 46. FINAL RED-TEAM VERDICT

The concept survives the major technical challenge if and only if the
team: - Treats sensor failure as a first-class safety problem. - Proves
spatial consensus actually reduces false alarms. - Uses
chronological/walk-forward validation. - Does not leak future
information. - Uses simple baselines before deep learning. - Tests
offline behaviour. - Tests environmental noise. - Tests simultaneous
faults + real deformation. - Reports uncertainty. - Clearly separates
prototype capability from industrial capability. - Clearly separates
synthetic/lab validation from field validation. - Does not overclaim
novelty. - Does not overclaim sudden-collapse prediction.

The principal weaknesses remain: 1. No large real labelled field
dataset. 2. Physical inability to detect precursor-free collapse. 3.
MEMS drift/calibration burden. 4. Small prototype array. 5. LoRa
scale/duty-cycle limits. 6. Incomplete fault taxonomy. 7.
Expert-informed thresholds. 8. GNSS reference cost/error where used. 9.
Need for field certification. 10. Need for formal patent/FTO search.

These are not reasons to abandon the project. They are requirements for
honest scope, testing and future development.

## 47. FINAL RECOMMENDATION TO THE NEXT AI AGENT

When continuing this project, **do not redesign it from scratch**.

Treat the following as the current baseline architecture unless new
evidence proves a change is necessary:

``` text
TerraMesh
  ↓
Distributed surface sensor array
  ↓
ESP32 + MEMS tilt/accel + temperature
  ↓
Crack sensing on selected nodes
  ↓
Optional GNSS reference nodes
  ↓
Clustered-star private LoRa 865–867 MHz
  ↓
Edge gateway
  ↓
Sensor health
  ↓
Complementary/Kalman fusion
  ↓
Differential tilt + spatial consensus
  ↓
Influence-function residual
  ↓
MAD/Hampel + CUSUM + Isolation Forest
  ↓
Persistence/Holt/ARIMA baseline
  ↓
XGBoost if validated
  ↓
GRU/TCN only if it wins
  ↓
Conformal uncertainty
  ↓
Transparent risk engine
  ↓
NORMAL/WATCH/WARNING/CRITICAL
  ↓
SHAP + evidence panel
  ↓
GIS
  ↓
Siren + SMS/email/app
  ↓
Offline store-and-forward
  ↓
Optional cloud synchronisation
```

The next AI agent should prioritize **implementation, integration and
validation**, not unnecessary technology expansion.

## 48. MASTER IMPLEMENTATION CHECKLIST

### Hardware

-   [ ] ESP32 nodes assembled.
-   [ ] MEMS tilt/accel integrated.
-   [ ] Temperature integrated.
-   [ ] Crack sensor nodes assembled.
-   [ ] LoRa link tested.
-   [ ] Power system tested.
-   [ ] Stable mounts built.
-   [ ] Gateway configured.
-   [ ] Local siren connected.
-   [ ] Optional GSM/SMS tested.
-   [ ] GNSS reference tested if used.

### Firmware

-   [ ] Sampling.
-   [ ] Timestamping.
-   [ ] Filtering.
-   [ ] Quiet-window logic.
-   [ ] Temperature compensation.
-   [ ] Feature extraction.
-   [ ] Health pre-screen.
-   [ ] Event trigger.
-   [ ] Local buffer.
-   [ ] Packet counter.
-   [ ] Encryption/authentication.
-   [ ] OTA mechanism.

### Gateway

-   [ ] LoRa ingest.
-   [ ] MQTT.
-   [ ] Data validation.
-   [ ] SQLite.
-   [ ] Sensor health.
-   [ ] Fusion.
-   [ ] Spatial analytics.
-   [ ] Anomaly detection.
-   [ ] Forecasting.
-   [ ] Conformal intervals.
-   [ ] Risk engine.
-   [ ] Warning state machine.
-   [ ] Alert dispatch.
-   [ ] Local dashboard.
-   [ ] Cloud sync.

### AI

-   [ ] MAD/Hampel baseline.
-   [ ] CUSUM.
-   [ ] Isolation Forest.
-   [ ] Holt/ARIMA.
-   [ ] XGBoost.
-   [ ] Optional GRU/TCN challenger.
-   [ ] Physics residual.
-   [ ] SHAP.
-   [ ] Conformal prediction.
-   [ ] GP/Kriging uncertainty.
-   [ ] Walk-forward evaluation.
-   [ ] Bootstrap confidence intervals.

### GIS/UI

-   [ ] Panel map.
-   [ ] Node status.
-   [ ] Health status.
-   [ ] Tilt vectors.
-   [ ] Cracks.
-   [ ] Heatmap.
-   [ ] Uncertainty.
-   [ ] Risk zones.
-   [ ] Trends.
-   [ ] Forecast.
-   [ ] Alert log.
-   [ ] Explanation.
-   [ ] System health.

### Validation

-   [ ] 11 scenarios.
-   [ ] Ablation study.
-   [ ] Robustness testing.
-   [ ] Sensor calibration.
-   [ ] Communication test.
-   [ ] Offline test.
-   [ ] Fault-injection test.
-   [ ] Simultaneous fault + event.
-   [ ] Metric report.
-   [ ] Limitations report.

## 49. FINAL ONE-LINE DEFINITION

> **TerraMesh is an edge-first, low-cost spatial sensor intelligence
> platform that continuously measures surface deformation above
> underground coal workings, separates real movement from
> sensor/environmental faults, forecasts progressive deformation,
> quantifies uncertainty, and issues explainable multi-level warnings
> that remain operational even when connectivity fails.**

------------------------------------------------------------------------

# APPENDIX A --- SOURCE-COMPLETE RESEARCH RECORD

The original detailed research synthesis is preserved below so that no
research decision, limitation, cost figure, architecture choice,
validation detail, or evidence-policy statement is lost.

# SIH 2026 --- Problem Statement 26025

## Deep Technical, Scientific, Competitive & Validation-Driven Research Report

### AI-enabled Low-Cost Real-Time Mine Subsidence Monitoring, Prediction and Early-Warning System for Underground Coal Mines in India

**Document status:** Research synthesis for team decision-making, v1.0
**Date:** 2026-09-01 **Evidence policy:** Every material claim is tagged
--- **\[VF\]** Verified fact (primary/peer-reviewed), **\[RF\]**
Research finding (literature, may be context-specific), **\[EA\]**
Engineering assumption, **\[PA\]** Prototype assumption, **\[EV\]**
Estimated value, **\[UI\]** Uncertain / insufficient evidence. Where
evidence could not be established, the report says so explicitly rather
than guessing.

> **One-line honest framing:** This report does **not** assume the
> "wireless surface mesh + edge AI" idea is correct. It builds the case
> from the physical mechanism upward, tests the idea against prior art
> and physics, kills the parts that don't survive, and specifies only
> what a student team can actually build and defend in front of critical
> judges.

------------------------------------------------------------------------

## 1. Executive Summary

**The problem (verified).** Underground coal extraction in India removes
rock/coal, creating voids; the overburden sags, and after a delay the
deformation reaches the surface as a subsidence trough --- vertical
settlement, tilt, horizontal strain, and tension cracks. In Indian
coalfields this is a live safety and land-use problem: InSAR studies
over Raniganj measure surface subsidence up to \~21 mm/yr (2017--2023,
Sentinel-1) **\[VF\]**, and Jharia studies report localized rates from
\~29 mm/yr up to \>120 mm/yr in worst zones **\[VF\]**. DGMS
(Directorate General of Mines Safety, Dhanbad) regulates this under the
Coal Mines Regulations 2017 and has ordered blasting/mining halts
pending "scientific study" after subsidence events over old workings
**\[VF\]**.

**Why current practice is insufficient (research finding).** Standard
monitoring is *periodic* (levelling, total station, DGPS campaigns) or
*remote and latent* (InSAR: excellent spatial coverage, but 6--12 day
revisit, days-to-weeks processing latency, line-of-sight only,
decorrelation over vegetation/monsoon) **\[RF\]**. Neither gives a mine
safety officer a *continuous, on-site, low-latency* signal with an
explicit warning and confidence level. Continuous geotechnical
instrumentation (borehole extensometers, robotic total stations,
permanent GNSS) exists but is capital-intensive and sparse **\[RF\]**.

**The research gap we target.** *Low-cost, spatially dense, continuously
sampled, edge-processed surface deformation monitoring with
uncertainty-aware, sensor-health-aware early warning that keeps working
when connectivity fails* --- validated baseline-first. Individually,
each piece exists (LoRa landslide networks, MEMS tiltmeters, InSAR-ML
forecasting); the *combination tuned for Indian underground-coal surface
conditions and DGMS decision needs, with honest validation*, is where a
defensible contribution sits **\[EA\]**.

**Core concept (survives scrutiny, with caveats).** A distributed
network of low-cost nodes on the surface above active/old panels, each
measuring **tilt (MEMS inclinometer), 3-axis acceleration/vibration, and
crack opening (displacement)**, plus temperature for compensation; a few
**RTK-GNSS reference nodes** for absolute anchoring. Nodes form a **LoRa
star-of-clusters** to a solar gateway running **edge analytics**:
sensor-health screening → sensor fusion (per-node Kalman/complementary
filter) → **spatial consistency check across neighbours** → anomaly
detection (robust statistics + Isolation Forest) → short-horizon
deformation forecasting (classical baseline vs. GRU/TCN, chosen by
measured skill) → **multi-level warning
(NORMAL/WATCH/WARNING/CRITICAL)** gated by *temporal persistence +
spatial consensus + multi-sensor agreement + model confidence* → GIS
dashboard + local siren/SMS. Cloud is a sync target, not a dependency.

**What is genuinely defensible as innovation (not "unique", not
"first"):** 1. **Sensor-health vs. ground-movement discrimination as a
first-class, evaluated module** --- most low-cost systems skip this; for
a *safety* system it is mandatory. 2. **Spatial-consensus warning
gating** --- using neighbour agreement (differential tilt/strain between
adjacent nodes) as an explicit false-alarm suppressant, with a measured
false-alarm-rate reduction. 3. **Baseline-first, walk-forward validated
forecasting** --- reporting whether deep models actually beat a
persistence/ARIMA baseline on *this* signal, and defaulting to the
simpler model when they don't. 4. **Offline-first fail-safe warning
logic** --- the system degrades to conservative local rules when
nodes/links/cloud drop, and *never* renders missing data as "normal". 5.
**Uncertainty- and evidence-carrying alerts** --- every alert ships with
contributing sensors, neighbour agreement, acceleration trend,
confidence, and data-quality flags (SHAP / conformal intervals at
prototype scale).

**What to demonstrate at SIH:** a physical sand-box / tilt-table rig
with 6--9 nodes, scripted deformation scenarios (gradual, localized,
differential, crack initiation, vibration, sensor failure, comms loss),
and a live dashboard showing detection, deformation map, forecast,
warning level, explanation, and sensor health --- with a validation
matrix quantifying detection latency, false-alarm rate, forecast RMSE
vs. baseline, and offline behaviour.

**What NOT to build:** full 3D "digital twin" / FLAC3D coupling (future
work), cellular-first architecture, ML models the team can't validate,
or any claim of "predicting catastrophic collapse". The scientifically
honest claim is **deformation-trend forecasting and risk escalation with
lead time on the order of the trough's development time**, not point
prediction of sudden failure.

------------------------------------------------------------------------

## 2. PS 26025 Requirement Analysis

The official PS text is short; the table below extracts the *stated* and
*strongly implied* requirements and maps each to a capability,
technology, and validation method. Items marked **\[implied\]** are
engineering interpretation, not literal PS text.

  ----------------------------------------------------------------------------------------------------------------------------------------
  \#             PS Requirement     Proposed Capability               Technology                   Validation Method
                 (stated/implied)                                                                  
  -------------- ------------------ --------------------------------- ---------------------------- ---------------------------------------
  R1             AI-enabled         Anomaly detection + deformation   Robust stats, Isolation      Walk-forward CV; PR-AUC, RMSE
                                    forecasting + risk scoring        Forest, GRU/TCN vs. ARIMA    vs. baseline; ablation
                                                                      baseline                     

  R2             Low cost           Prototype-grade nodes; commodity  ESP32, MEMS IMU/tilt, LoRa,  Bill of materials; cost/node &
                                    MCU/sensors; solar; open-source   Raspberry Pi gateway         cost/area vs. total-station/InSAR
                                    stack                                                          campaign cost

  R3             Real-time          Sub-minute sensing cadence in     Adaptive sampling;           Measured end-to-end latency
                                    event mode; edge inference in     on-gateway inference         (sensor→alert)
                                    seconds                                                        

  R4             Monitoring         Continuous                        MEMS inclinometer,           Bench accuracy/repeatability/drift
                                    tilt/vibration/crack/settlement   accelerometer,               tests
                                    proxy                             draw-wire/crack gauge,       
                                                                      RTK-GNSS refs                

  R5             Prediction         Short-horizon deformation         Time-series models; creep    Forecast error on held-out future
                                    trajectory + acceleration/creep   (inverse-velocity) analysis  windows; lead-time distribution
                                    detection                                                      

  R6             Early warning      Multi-level, evidence-carrying    Rule+ML warning engine,      False-alarm rate, miss rate, detection
                                    alerts with lead time             persistence+consensus gating latency on scripted scenarios

  R7             Underground coal   Design for                        Solar power, offline-first,  Robustness tests
                 mines, India       old-workings/pillar-extraction    temperature compensation,    (rain/thermal/vibration/missing-data)
                 **\[implied\]**    subsidence, monsoon noise, remote IP66 enclosures              
                                    sites, patchy power/network                                    

  R8             Scalable           10 → 1000+ nodes, multi-panel,    LoRa clustering, gateway     Load test / simulation of network +
                 **\[implied\]**    multi-mine                        fleet, OTA, time-series DB   DB + inference at scale

  R9             GIS **\[implied by Spatial risk map: panels, nodes,  PostGIS + Leaflet/MapLibre + Spatial-consistency checks vs. known
                 "monitoring        tilt vectors, cracks, risk zones, GeoJSON                      deformation pattern in rig
                 system"\]**        sensor health                                                  

  R10            Offline /          Local sensing→processing→alert;   Edge DB                      Cut internet / cloud / gateway; verify
                 field-robust       deferred cloud sync               (SQLite/TimescaleDB-lite),   safe local behaviour
                 **\[implied\]**                                      store-and-forward            

  R11            Explainable /      Why-the-risk-rose panel;          SHAP, feature importance,    Human-readable explanation for each
                 trustworthy        confidence & data-quality         conformal/prediction         scripted event; calibration plots
                 **\[implied by                                       intervals                    
                 "early                                                                            
                 warning"\]**                                                                      
  ----------------------------------------------------------------------------------------------------------------------------------------

**Interpretation note \[EA\]:** PS 26025 does not mandate a specific
sensor set, protocol, or model family --- it specifies *outcomes* (AI,
low cost, real time, prediction, early warning). This is an advantage:
the team can select the *simplest* stack that meets the outcomes and
defend the choices with evidence.

------------------------------------------------------------------------

## 3. Mine Subsidence Fundamentals (first principles)

**3.1 Mechanism.** Coal seams are extracted by **bord-and-pillar
(room-and-pillar)** --- leaving pillars for support, sometimes followed
by **depillaring/pillar extraction** --- or by **longwall** (full
extraction of a panel, roof caves behind supports). Removing material
transfers overburden load to remaining pillars and abutments. If pillars
yield, are robbed, or weather over decades (old workings), or if a
longwall face passes, the roof strata deflect downward. **\[VF, standard
rock-mechanics\]**

**3.2 Propagation to surface.** Deflection propagates upward through the
overburden as a **caved zone → fractured zone → continuous deformation
zone**. At the surface it appears as a **subsidence trough** wider than
the extracted area, offset by the **angle of draw** (angle from vertical
to the trough edge; commonly \~25--35° but site-specific) **\[RF\]**.
The trough has: - **Maximum subsidence** *S*max at the centre (for
"supercritical" panels, *S*max ≈ a·m, where *m* is extracted thickness
and *a* the subsidence factor, \~0.5--0.9 for caving longwall; much less
and more irregular for pillar workings) **\[RF\]**. - **Tilt** (first
spatial derivative of subsidence) --- max at inflection point; damages
structures, tilts poles, ponds water. - **Curvature / strain** (second
derivative) --- **tensile strain** at trough edges opens **ground
cracks**; **compressive strain** near the centre. - **Horizontal
displacement** --- points move toward the trough centre.

**3.3 Temporal character.** - **Longwall (active):** subsidence largely
follows the face within days--weeks; a "dynamic" trough travels with the
face; **residual** subsidence continues months--years. Relatively
*predictable*. **\[RF\]** - **Old bord-and-pillar workings:**
**pillar/roof collapse can be sudden ("pothole"/"sinkhole" subsidence)**
--- a near-vertical collapse into a void, minutes-to-hours, hard to
predict, often triggered by rain infiltration, vibration, or progressive
weathering. This is the **hardest and most dangerous case** and the one
most relevant to legacy Indian coalfield townships. **\[RF\]** -
**Sinkhole (crown-hole)** over shallow workings: local, abrupt, small
footprint.

**3.4 What surface sensors CAN infer \[EA, physics-bounded\]:** - Onset
and progression of **continuous/trough-type** subsidence (tilt rate,
crack opening rate, differential settlement) --- good observability. -
**Acceleration of creep** preceding some progressive failures ---
*inverse-velocity* method gives a failure-time estimate for slow,
brittle, accelerating failures (established for open-pit slopes;
**transfer to sinkhole collapse is not established --- \[UI\]**). -
**Vibration/micro-seismic bursts** possibly associated with roof
cracking (weak, noisy indicator at the surface with cheap accelerometers
--- **\[UI\]**, needs validation).

**3.5 What surface sensors CANNOT reliably do \[VF/EA\]:** - Predict the
**exact time and location of a sudden crown-hole collapse** from a void
with no precursory surface motion. Physically, if the surface is not
moving, surface sensors have nothing to measure. Honest system claim
must exclude this. - Distinguish deep-seated mining subsidence from
**shrink-swell soil, foundation settlement, or slope creep** without
spatial context and domain knowledge. - Replace subsurface
instrumentation (extensometers, piezometers) for mechanism attribution.

**Design consequence:** the system is honestly a **surface-deformation
early-warning system for progressive/trough-type subsidence and
accelerating creep**, providing lead time proportional to how gradually
the ground moves. For sudden collapse it can only warn *if and when*
surface precursors appear.

------------------------------------------------------------------------

## 4. Indian Mining Context

**4.1 Coalfields & methods.** Major underground coal areas: **Jharia,
Raniganj, East Bokaro, West Bokaro (Damodar Valley); Singareni
(Telangana); Talcher, Ib Valley (Odisha); parts of Central India
(SECL/WCL)**. Historically dominated by **bord-and-pillar**; large areas
of **unmapped/partially mapped old workings**, many shallow, many with
standing water. Longwall penetration in India is limited but present
(e.g., some SCCL and CIL panels). **\[RF\]**

**4.2 Why an India-specific design differs \[RF/EA\]:** - **Legacy old
workings under inhabited land** (Jharia/Raniganj townships) --- the
dominant hazard is *progressive/sudden subsidence over decades-old
voids*, not clean longwall troughs. Jharia is additionally complicated
by **coal-fire-induced subsidence**, which confounds mining-only signals
(InSAR studies explicitly separate fire zones) **\[VF\]**. - **Monsoon**
(June--Sept): intense rainfall → pore-pressure changes, softening, and
*rain-triggered* collapses; also a major *noise* source (thermal,
moisture, vegetation growth, soil swelling). Seasonal signal must be
modelled/removed. - **Thermal range:** surface enclosures can exceed
55--60 °C in summer sun; MEMS bias drifts with temperature → **on-node
temperature compensation is mandatory, not optional**. -
**Connectivity:** many sites have patchy 2G/4G; **offline-first is a
requirement, not a feature**. - **Power:** grid unreliable at remote
nodes → **solar + battery** sizing for monsoon low-insolation weeks. -
**Maintenance:** long distances, limited skilled technicians → nodes
must self-report health and tolerate months between visits. - **Cost
sensitivity & scale:** CIL operates hundreds of mines; a per-node cost
that is trivially deployable matters more than marginal accuracy. -
**Vegetation & terrain** degrade InSAR coherence in many Indian coal
belts → strengthens the case for *in-situ* sensing as a complement.

**4.3 Regulatory context \[VF\].** DGMS under the Mines Act 1952 / Coal
Mines Regulations 2017; subsidence over old workings has triggered
DGMS-directed operational halts and district-disaster-authority action
pending scientific assessment. A monitoring system that produces
**auditable, timestamped, DGMS-presentable evidence** has institutional
pull. CMPDI (CIL's planning/R&D arm) and national institutes (IIT-ISM
Dhanbad, CIMFR Dhanbad) are the natural domain validators --- cite them,
don't fabricate specific unpublished projects.

> **\[UI\]** Specific national subsidence-incident casualty statistics:
> not reliably established here. Do **not** put a fabricated number in
> the deck. Cite DGMS annual reports / parliamentary answers only if the
> team can pull the actual figure.

------------------------------------------------------------------------

## 5. Stakeholder Analysis

  --------------------------------------------------------------------------------------------------------------
  Stakeholder      Core problem       Current practice    Missing            Decision they   Benefit of early
                                                          information        must make       warning
  ---------------- ------------------ ------------------- ------------------ --------------- -------------------
  Mine manager /   Legal duty for     Periodic surveys,   Continuous,        Stop work /     Documented lead
  agent            safety of persons  visual inspection,  quantified         evacuate /      time; defensible
                   & surface          statutory reports   ground-movement    restrict access decisions
                                                          status per panel   / notify DGMS   

  Mining /         Verify             Convergence         Real deformation   Adjust          Model calibration;
  strata-control   pillar/panel       stations,           vs. predicted;     extraction      targeted
  engineer         design assumptions occasional          where & when it    sequence,       intervention
                                      monitoring          deviates           support,        
                                                                             stowing         

  Survey /         Detect & map       Levelling/total     Between-campaign   Where to survey Focuses scarce
  geotechnical     movement           station campaigns   changes; automated next; declare a survey effort;
  officer                             (weekly--monthly)   trend + alarm      zone unsafe     catches fast
                                                                                             changes

  Safety officer / Protect workers &  Inspection rounds,  Which surface      Rescheduling,   Situational
  rescue           responders         gas monitoring      zones are          exclusion       awareness during
                                                          destabilising      zones, drills   response

  DGMS / regulator Enforce safety;    Inspections,        Objective          Approve/deny    Evidence-based,
                   approve resumption incident            time-series        resumption;     faster, fairer
                                      investigation,      evidence           mandate         decisions
                                      scientific study                       measures        
                                      orders                                                 

  District         Protect residents  Reactive evacuation Advance risk       Relocation      Orderly evacuation
  disaster         on                 after cracks appear indication near    timing,         vs. panic
  authority        subsidence-prone                       settlements        cordoning       
                   land                                                                      

  Residents /      Homes, wells,      Notice              Trustworthy,       Whether/when to Time to move
  farmers          fields, livestock  cracks/tilting      explained risk     move            belongings,
                   at risk            themselves          level                              livestock, claim
                                                                                             compensation

  Railway / road / Linear             Periodic inspection Tilt/strain at     Speed           Prevent
  powerline owners infrastructure                         asset crossings    restrictions,   derailment/outage
                   across trough                                             closure,        
                                                                             jacking         

  Environment /    Land degradation,  Surveys, complaints Spatial extent &   Reclamation     Prioritise
  forest authority water-table, fire                      rate               planning        reclamation
  --------------------------------------------------------------------------------------------------------------

**Takeaway:** the highest-value user is the **mine manager +
geotechnical engineer + DGMS triangle**, because they make *reversible,
high-consequence* decisions (stop/restrict/resume) that currently rest
on sparse data. The system's job is to make those decisions
*evidence-based and timely*, not to automate them.

------------------------------------------------------------------------

## 6. Existing Monitoring Methods

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Method           Accuracy       Temporal res.      Spatial res.  Rel. cost     Coverage         Latency          Power         Expertise     Env. limits        Real-time fit
                   (vertical)                                                                                                                                     
  ---------------- -------------- ------------------ ------------- ------------- ---------------- ---------------- ------------- ------------- ------------------ -----------------
  Precise          sub-mm--mm     campaign (wk--mo)  line/points   low kit, high local lines      days             none          surveyor      needs access,      ✗
  levelling        **\[RF\]**                                      labour                                                                      clear LoS          

  Total station /  mm @ few 100 m campaign; robotic  points        high          local            min--days        mains/solar   high          rain/heat haze,    partial (robotic)
  robotic TS       **\[RF\]**     \~continuous       (prisms)      (robotic)                                                                   LoS                

  DGPS / campaign  mm--cm         campaign           points        medium        local            hours--days      battery       medium        sky view,          ✗
  GNSS             **\[RF\]**                                                                                                                  multipath          

  Permanent        mm--cm, few mm seconds--minutes   points        high per      points           seconds--hours   solar OK      medium        sky view,          ✓ (sparse)
  RTK/PPP GNSS     with long                                       station                                                                     multipath          
                   averaging                                                                                                                                      
                   **\[RF\]**                                                                                                                                     

  InSAR            mm/yr rates;   6--12 day revisit  5--20 m       low data      regional         days--weeks      n/a           very high     decorrelation:     ✗ for warning; ✓
  (Sentinel-1,     \~cm                              pixels, wide  cost, high                     processing                                   veg, monsoon, fast for
  C-band)          single-pair                       area          skill                                                                       motion, LoS only   context/history
                   **\[VF\]**                                                                                                                                     

  InSAR + corner   mm/yr          6--12 day          points/area   medium        regional         days--weeks      n/a           very high     same               ✗ for warning
  reflectors / PSI **\[VF\]**                                                                                                                                     

  Terrestrial /    cm **\[RF\]**  campaign           dense surface high          site             days             n/a           high          vegetation, cost   ✗
  airborne LiDAR                                                                                                                                                  

  UAV              cm--dm         campaign (flights) dense         medium        site             hours--days      battery       medium        wind, GCPs,        ✗
  photogrammetry / **\[RF\]**                                                                                                                  permissions        
  SfM                                                                                                                                                             

  MEMS tiltmeter / 0.001--0.01°   seconds--minutes   point (dense  **very low**  as dense as      seconds          solar/coin    low--medium   thermal drift,     ✓
  inclinometer     practical;                        if many)                    deployed                                                      mounting           
  node             µ-rad lab                                                                                                                                      
                   **\[RF\]**                                                                                                                                     

  MEMS             detects        10--1000 Hz        point         very low      dense            seconds          solar         low           traffic/blasting   ✓ (as
  accelerometer    mg-level                                                                                                                    noise              corroborator)
  (vibration)      events                                                                                                                                         
                   **\[RF\]**                                                                                                                                     

  Draw-wire /      0.01--0.1 mm   seconds            point across  low--medium   crack-specific   seconds          solar         low           needs a crack to   ✓
  crackmeter /     **\[RF\]**                        a crack                                                                                   span; thermal      
  extensometer                                                                                                                                                    
  (surface)                                                                                                                                                       

  Borehole         mm subsurface  manual or logged   vertical      high          point            varies           varies        high          drilling access    ✓ if logged
  extensometer /   **\[RF\]**                        profile       (drilling)                                                                                     (costly)
  inclinometer                                                                                                                                                    

  Micro-seismic    event location continuous         array         high          panel            seconds--min     mains         very high     noise, siting      ✓ (costly,
  array                                                                                                                                                           specialist)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Synthesis \[RF/EA\]:** InSAR wins spatial coverage and history but
loses on latency and fast/ vegetated conditions; robotic total stations
and permanent GNSS win accuracy but are sparse and costly; **dense
low-cost MEMS + crackmeter nodes** are the only option that is
simultaneously *continuous, on-site, low-latency, and spatially dense*
--- at the price of lower per-sensor accuracy and calibration burden.
The defensible system uses **MEMS nodes for detection/alerting, a few
GNSS nodes for absolute anchoring, and InSAR as an independent
cross-check and historical baseline.**

------------------------------------------------------------------------

## 7. Existing Technologies (component landscape)

-   **Communication:** LoRa/LoRaWAN (sub-GHz, km-range, low power, low
    data rate), Zigbee (2.4 GHz mesh, \~10s--100s m), BLE mesh (short
    range), Wi-Fi mesh (power-hungry, short), NB-IoT/LTE-M
    (carrier-dependent), 2G/4G (coverage-dependent). Landslide/rockfall
    literature overwhelmingly converges on **LoRa/LoRaWAN** for exactly
    this niche **\[VF --- multiple peer-reviewed deployments\]**.
-   **MCU:** ESP32 (Wi-Fi/BLE, dual-core, ADC, cheap), STM32L
    (ultra-low-power), Raspberry Pi (Linux, for gateway/edge AI),
    Arduino-class AVR (too limited for fusion).
-   **Sensors:** MEMS IMU (e.g., 6/9-axis modules), dedicated MEMS
    inclinometers (higher stability), digital accelerometers, draw-wire
    encoders, LVDT/potentiometric crackmeters, capacitive/vibrating-wire
    options, u-blox RTK GNSS modules, digital temperature/humidity.
-   **Edge AI:** TensorFlow Lite / ONNX Runtime / scikit-learn on
    Raspberry Pi; TFLite-Micro on MCU (for trivial models only).
-   **Backend:** time-series DB (TimescaleDB/InfluxDB), MQTT broker,
    FastAPI/Flask, Grafana or custom.
-   **GIS:** PostGIS, GeoServer, Leaflet/MapLibre, QGIS (desktop
    analysis), GeoJSON/vector tiles.
-   **Remote sensing (context layer):** Sentinel-1 (free), commercial
    SAR, Google Earth Engine for pipeline.

------------------------------------------------------------------------

## 8. Existing Systems and Prior Art

  -------------------------------------------------------------------------------------------------------------------------------------------------------
  Existing system /    Technology         Capability                  Strength            Limitation               Cost/complexity   Difference from
  body of work                                                                                                                       proposed
  -------------------- ------------------ --------------------------- ------------------- ------------------------ ----------------- --------------------
  **Sentinel-1 InSAR   C-band SAR +       Regional mm/yr deformation  Free data, wide     Days--weeks latency,     Low \$ / very     We add continuous
  subsidence studies,  PS/SBAS + DGPS     maps, time series           area, validated     LoS, decorrelation, no   high skill        in-situ sensing +
  Raniganj/Jharia**    validation                                     vs. DGPS            on-site alarm                              real-time warning;
  (Tandfonline 2024;                                                                                                                 use InSAR as
  Springer NRR 2025;                                                                                                                 cross-check
  etc.) **\[VF\]**                                                                                                                   

  **Deep-learning      LSTM/other on      Forecasts deformation from  Demonstrates ML     Still tied to satellite  Research code,    We forecast on
  InSAR time-series    InSAR series       satellite series            forecasting is      cadence/latency; not an  high skill        high-cadence in-situ
  deformation                                                         feasible on real    alarm system                               series at the edge
  prediction in coal                                                  coal-mine                                                      
  mines** (Geo-spatial                                                deformation                                                    
  Information Science                                                                                                                
  2025) **\[VF\]**                                                                                                                   

  **Generative         TCN-TimeGAN +      Interpretable               Shows               InSAR-domain; complex;   Research          We borrow the *idea*
  augmentation +       physics-informed   mining-deformation          physics-guided +    not real-time field                        (physics priors,
  physics-informed net KAN                prediction with physics     interpretable ML    system                                     interpretability) at
  (PI-KAN) for mining                     priors                      for *this exact                                                prototype scale
  deformation from                                                    problem*                                                       
  InSAR** (Remote                                                                                                                    
  Sensing 2025)                                                                                                                      
  **\[VF\]**                                                                                                                         

  **IoT geosensor      LoRa + MEMS        Cost-effective landslide    Proven low-cost     Landslide (slope)        Low \$            We adapt to
  networks for         tilt/accel +       early warning               LoRa+MEMS field     mechanism, not mining                      subsidence
  landslide EWS**      rain + edge                                    deployments;        subsidence;                                trough/creep +
  (Sensors 2021, MDPI;                                                documented          shallow-movement focus                     old-workings
  Frontiers Earth Sci                                                 false-alarm                                                    context +
  2022; Designs 2025)                                                 reduction (SIGMA:                                              sensor-health
  **\[VF\]**                                                          70→38)                                                         module + DGMS
                                                                                                                                     workflow

  **Darjeeling         Tilt + moisture +  Real-time slope EWS in      Indian field        Rain-induced landslides, Low--med          Different failure
  Himalaya IoT slope   rainfall,          Indian terrain              validation of the   not mining                                 mechanism; we target
  monitoring**         telemetry                                      low-cost approach                                              mining subsidence
  (Sensors 2020)                                                                                                                     signals
  **\[VF\]**                                                                                                                         

  **Robotic total      Automated TS +     mm continuous deformation   High accuracy,      Expensive, sparse        High \$           We trade accuracy
  station /            prisms + software  of points                   mature, used on     points, LoS, needs                         for density + cost +
  GeoMoS-type                                                         dams/pits           stable base                                no-LoS + offline
  commercial                                                                                                                         edge AI
  monitoring**                                                                                                                       
  (Leica/Trimble                                                                                                                     
  class) **\[RF\]**                                                                                                                  

  **Vibrating-wire +   VW sensors +       Reliable long-term geotech  Industry-standard   Costly per channel,      High \$           We use commodity
  datalogger           loggers +          monitoring                  reliability, low    limited AI, sparse                         MEMS + edge ML;
  geotechnical         telemetry                                      drift                                                          accept validation
  arrays**                                                                                                                           burden
  (Campbell/GeoKon                                                                                                                   
  class) **\[RF\]**                                                                                                                  

  **Mine-wide safety   Various            Underground environmental + Institutional       Underground focus;       ---               We focus on
  IoT (gas, strata,                       strata monitoring           adoption            surface subsidence EWS                     *surface*
  TARP) in CIL/SCCL**                                                                     not the core                               deformation above
  **\[UI --- exists in                                                                                                               panels +
  various forms;                                                                                                                     community-facing
  specifics not                                                                                                                      warning
  verified here\]**                                                                                                                  

  **Patents:           Method claims      Prediction/classification   Shows active IP     Method-specific, often   ---               Our combination
  mining-subsidence                       methods                     activity            model/geology-specific                     (surface mesh +
  prediction /                                                                                                                       sensor-health +
  phreatic-leakage                                                                                                                   consensus gating +
  classification**                                                                                                                   offline) needs a
  (e.g., USPTO                                                                                                                       proper
  11,060,402                                                                                                                         freedom-to-operate
  shallow-seam                                                                                                                       search before any
  water-leakage level                                                                                                                novelty claim
  classification)                                                                                                                    
  **\[VF that patents                                                                                                                
  in this space                                                                                                                      
  exist\]**                                                                                                                          
  -------------------------------------------------------------------------------------------------------------------------------------------------------

**Conclusion:** the *individual ingredients are all prior art*. The
literature explicitly does **not** yet present a validated, low-cost,
offline-first, sensor-health-aware, consensus-gated **surface** in-situ
EWS specialised for **Indian underground-coal subsidence**. That is the
space to claim --- carefully, as a *combination and adaptation*, never
as "first" or "unique" without a patent/prior-art search.

------------------------------------------------------------------------

## 9. Existing Solution Limitations

  -------------------------------------------------------------------------------------------------
  Limitation          Why it occurs    Consequence       Proposed mitigation    Validation method
  ------------------- ---------------- ----------------- ---------------------- -------------------
  Periodic            Campaign surveys Fast changes      Continuous MEMS        Detection-latency
  (non-continuous)    are              between campaigns sampling,              test vs. simulated
  monitoring          labour-limited   missed            event-triggered burst  fast event
                                                         mode                   

  InSAR latency &     Orbital          Not usable for    In-situ edge           Measured
  revisit             cadence +        hours-scale       processing, seconds    sensor→alert
                      processing chain warning           latency                latency

  InSAR decorrelation C-band coherence Data gaps exactly In-situ sensors        Compare coverage
  (veg/monsoon/fast   loss             when risk is high unaffected by          during simulated
  motion)                                                vegetation; use InSAR  "monsoon" (occlude
                                                         only as baseline       optical/none for
                                                                                MEMS)

  High cost of        Precision        Sparse            Commodity MEMS; many   BoM; cost/area
  accurate systems    hardware +       deployment; gaps  cheap points \> few    vs. alternative
  (robotic TS, VW     install                            expensive              
  arrays, GNSS)                                                                 

  Sensor drift (MEMS) Temperature,     False trends →    On-node temp           Drift test over
                      aging, mounting  false alarms or   compensation; drift    thermal cycles;
                      creep            masked real       detection; periodic    drift-detector ROC
                                       motion            GNSS/absolute          
                                                         re-anchor; relative    
                                                         (differential)         
                                                         features               

  Environmental noise Shared physical  False positives   Multi-sensor           False-alarm rate
  (thermal, traffic,  environment                        agreement, spatial     with/without gating
  blasting, rain)                                        consensus, temporal    (ablation)
                                                         persistence, seasonal  
                                                         model                  

  Missing data / node Power, radio,    Blind spots;      Explicit data-quality  Fault-injection
  dropout             hardware         unsafe "assume    state; degrade to      tests
                                       normal"           conservative rules;    
                                                         never impute silently  

  Poor prediction of  No surface       Over-promising;   Scope claim to         Documented scope;
  sudden collapse     precursor exists loss of trust     progressive/creep      scenario set
                      for some                           subsidence; state      excludes
                      sinkholes                          limits openly          "no-precursor" as
                                                                                detectable

  Cloud dependency    Architecture     Outage = no       Offline-first edge;    Cut-cloud test
                      choice           monitoring        cloud = sync only      

  Weak explainability Black-box ML     Operators/DGMS    SHAP + evidence        Human-readable
                                       don't trust or    panel + confidence     explanation per
                                       act                                      event; expert
                                                                                review

  No uncertainty      Point            Overconfident     Conformal/prediction   Calibration
  quantification      predictions      alarms            intervals; ensemble    (coverage) plots
                                                         spread                 

  Poor sensor-health  Not modelled     Malfunction       Dedicated              Confusion matrix:
  awareness                            mistaken for      sensor-health          fault vs. movement
                                       ground movement   classifier upstream of 
                                       (or vice-versa)   fusion                 

  Limited scalability Point-to-point   Can't grow to CIL LoRa clustering,       Simulated 1000-node
                      radio, monolith  scale             gateway fleet, TSDB,   load test
                      backend                            OTA                    
  -------------------------------------------------------------------------------------------------

**Caveat \[EA\]:** not every existing system suffers every limitation.
Robotic TS and VW arrays are *reliable and accurate* --- their weakness
is cost and density, not trust. InSAR's weakness is latency, not
accuracy of long-term rates. State this precisely to judges.

------------------------------------------------------------------------

## 10. Research Gap

Ranked by (Impact / Evidence base / Novelty / Feasibility for SIH / SIH
value), each 1--5:

  -------------------------------------------------------------------------------------------------------
  Gap                       Impact     Evidence   Novelty    Feasibility   SIH value  Notes
  ------------------------- ---------- ---------- ---------- ------------- ---------- -------------------
  G1. Low-cost, dense,      5          4          3          5             5          Landslide LoRa nets
  **continuous surface**                                                              exist;
  monitoring for mining                                                               mining-subsidence
  subsidence (vs. slope                                                               adaptation is thin
  landslides)                                                                         

  G2. **Sensor-health       5          3          4          4             5          Rarely treated as
  vs. ground-movement                                                                 first-class;
  discrimination** in                                                                 mandatory for
  low-cost EWS                                                                        safety

  G3. **Spatial-consensus + 4          4          3          5             5          SIGMA-type results
  persistence +                                                                       exist; a clean
  multi-sensor gating** to                                                            ablation is
  cut false alarms,                                                                   compelling
  *quantified*                                                                        

  G4. **Offline-first       4          3          3          5             4          Under-addressed;
  fail-safe** warning logic                                                           easy to demo
  (never "assume normal")                                                             dramatically

  G5. **Baseline-first,     4          5          2          5             4          Scientific
  walk-forward** honest ML                                                            credibility
  evaluation for this                                                                 differentiator
  signal                                                                              

  G6. **Physics-guided**    4          4          4          3             4          PI-KAN/PI-GNN
  features/priors                                                                     precedent on InSAR;
  (angle-of-draw,                                                                     simplified version
  influence-function shape,                                                           feasible
  creep/inverse-velocity)                                                             
  fused with ML at edge                                                               
  scale                                                                               

  G7. **Uncertainty- &      4          3          3          4             4          Conformal
  evidence-carrying                                                                   prediction is cheap
  alerts** for                                                                        and defensible
  regulator/community                                                                 

  G8. **GIS risk            3          3          2          5             3          Integration value,
  visualisation** tuned to                                                            not research
  DGMS decision workflow                                                              novelty

  G9. Handling **Indian     4          4          3          3             4          Jharia coal-fire
  monsoon / thermal /                                                                 confound is
  coal-fire** confounders                                                             documented
  explicitly                                                                          
  -------------------------------------------------------------------------------------------------------

**Chosen focus for SIH:** G1 + G2 + G3 + G4 + G5 as the *spine*, with
G6/G7 as differentiators demonstrated at a modest level.

------------------------------------------------------------------------

## 11. Design Requirements (derived)

**Functional:** continuous multi-sensor sampling;
adaptive/event-triggered cadence; per-node fusion; spatial consistency
across neighbours; anomaly detection; short-horizon forecasting;
multi-level warning with evidence & confidence; sensor-health reporting;
GIS map; local + remote alerting; offline operation with deferred sync;
OTA update; audit log.

**Non-functional \[EA/EV\]:** - Node cost target (prototype-grade): **\<
₹3,000--6,000/node** BoM (excluding GNSS nodes). **\[EV\]** -
Sensor→alert latency in event mode: **\< 60 s** end-to-end. **\[PA
target\]** - Tilt resolution after compensation: **≤ 0.01° (≈175 µrad)**
usable; repeatability characterised. **\[PA target --- must be
measured\]** - Crack/displacement resolution: **≤ 0.1 mm**. **\[PA
target\]** - Node autonomy: **≥ 14 days** without sun (monsoon buffer)
at nominal cadence. **\[EV\]** - Gateway edge inference: **\< 5 s** per
cycle on Raspberry Pi-class. **\[PA\]** - Offline retention: **≥ 30
days** of raw + features locally. **\[PA\]** - False-alarm rate and miss
rate: **reported with confidence intervals** on the scenario set; no
fixed "guaranteed" number. - Fail-safe: any missing/low-quality data
path escalates to **WATCH** (not NORMAL) and flags the map.

------------------------------------------------------------------------

## 12. Wireless Surface Mesh --- Critical Evaluation

**Claim under test:** *neighbour-relative measurements across a surface
sensor network add real information for subsidence detection.*

**Physics argument for \[EA, grounded in trough geometry\]:** A
subsidence trough imposes a *spatially coherent* pattern --- tilt
changes sign across the inflection point, strain is tensile at edges and
compressive at centre, and displacement points inward. Adjacent nodes
therefore see **correlated, geometrically structured** changes. In
contrast: - **Thermal expansion / diurnal noise** is broadly
*common-mode* across nearby nodes and correlated with temperature →
differencing suppresses it. - **A single drifting/failing sensor**
produces motion at *one* node inconsistent with its neighbours → spatial
check flags it as a *sensor* problem, not ground movement. - **Real
localized subsidence (crown-hole onset)** produces a *localized but
physically-shaped* anomaly --- steep differential tilt between the
collapsing node and its ring of neighbours, with the right sign pattern.

**So the useful quantities are:** 1. **Differential tilt** between
adjacent nodes (≈ curvature/strain proxy along the baseline). 2.
**Differential settlement** (from GNSS anchors + tilt integration along
node chains). 3. **Spatial coherence score** --- does the anomaly match
a trough/influence-function shape? 4. **Consensus count** --- how many
neighbours corroborate within a time window.

**Arguments against / caveats \[UI\]:** - "Mesh" networking (multi-hop
routing) is **not required** for this --- a **star/clustered-star LoRa
topology** to a gateway is simpler and sufficient; the *analytical*
benefit is spatial, computed centrally, not a networking-layer mesh.
Calling it a "mesh" risks over-claiming; call it a **spatial sensor
network / array**. - Differential features need **known, stable relative
node positions** (survey once with RTK) and **stable mountings**
(concrete pads / driven posts to competent ground, not loose soil). -
Node spacing must be **smaller than the expected trough half-width /
influence radius**; too sparse and the spatial structure is
undersampled. Requires site-specific layout (over panel edges, over
known old-working boundaries, near structures). - Improvement is **not
automatic** --- must be shown by ablation (with vs. without spatial
features → false-alarm rate and detection latency).

**Verdict:** keep it, but **reframe** as *"spatial sensor array with
neighbour-consensus analytics"*, deployed in a **clustered-star LoRa**
topology, and **prove the spatial benefit by ablation** rather than
asserting it.

------------------------------------------------------------------------

## 13. Sensor Architecture

**Per standard node (prototype-grade):** \| Function \| Sensor class \|
Why \| Prototype option (class, not endorsement) \| Notes \|
\|---\|---\|---\|---\|---\| \| Tilt / inclination \| MEMS inclinometer
or high-stability IMU accel used as tilt \| Primary trough/creep
indicator; cheap; dense \| Digital MEMS accelerometer/inclinometer
module \| Needs temp compensation + still-period averaging \| \|
Vibration / micro-events \| MEMS accelerometer (higher-g, higher-ODR
path) \| Corroborating indicator; blasting/traffic context \| Same IMU
or dedicated accelerometer \| Weak standalone; use as feature only \| \|
Crack / displacement \| Draw-wire encoder or potentiometric/LVDT
crackmeter \| Direct strain across a known crack; high resolution \|
Draw-wire across crack / rod extensometer \| Only where cracks exist /
expected \| \| Temperature \| Digital temp sensor (on-board + ambient)
\| Bias compensation for MEMS; seasonal model \| Standard digital sensor
\| Essential \| \| Humidity / rain (subset of nodes) \| Digital RH +
tipping-bucket at gateway \| Monsoon confounder modelling \| --- \| Not
every node \| \| Absolute position (reference nodes only, \~1 per
cluster / 3--6 per panel) \| RTK-GNSS module + patch antenna \| Anchors
relative network to absolute frame; catches whole-array drift \| u-blox
RTK-class \| Higher cost/power; few units \|

**Prototype vs. industrial \[VF/EA\]:** MEMS + draw-wire nodes are
**prototype/screening grade**. A DGMS-grade deployment would add/638
substitute **vibrating-wire crackmeters, borehole extensometers,
survey-grade GNSS, and certified enclosures/calibration**. The deck must
state this line explicitly --- hobby hardware is **not** presented as
field-certified.

**Signal conditioning at node:** oversample + median/robust filter;
compute "quiet-window" mean tilt (reject when vibration RMS high);
temperature-model bias correction; on-node features (rolling
mean/rate/variance, vibration RMS, crack rate); transmit features +
periodic raw snippets.

------------------------------------------------------------------------

## 14. Communication Architecture

**Comparison (for this niche):** \| Protocol \| Range (rural LoS) \|
Power \| Data rate \| Mesh \| Cost \| Scalability \| Offline-friendly \|
Verdict \| \|---\|---\|---\|---\|---\|---\|---\|---\|---\| \| **LoRa
(P2P/private) / LoRaWAN** \| 2--10+ km **\[RF\]** \| very low \| 0.3--50
kbps \| star (LoRaWAN) / clustered \| low \| high (ADR, multi-GW) \| yes
\| **SELECTED** \| \| Zigbee \| 10--100 m, mesh extends \| low \| 250
kbps \| yes \| low \| medium \| yes \| Rejected: range too short for
panel-scale, dense hops \| \| BLE mesh \| \<100 m \| low \| \~1 Mbps \|
yes \| very low \| low \| yes \| Rejected: range \| \| Wi-Fi mesh \|
\<200 m \| high \| high \| yes \| low HW \| low \| yes \| Rejected:
power, range \| \| NB-IoT / LTE-M \| carrier \| low-med \| 10s--100s
kbps \| no (star to tower) \| SIM/data cost \| high \| **no (carrier
dependency)** \| Backup uplink only \| \| 4G router at gateway \|
carrier \| n/a (mains/solar) \| high \| no \| data plan \| high \| no \|
**Gateway uplink (with store-and-forward)** \|

**Selected architecture:** **Clustered-star private LoRa** (nodes →
cluster head/gateway on sub-GHz ISM band, India 865--867 MHz **\[VF ---
India ISM allocation\]**), one **solar Raspberry Pi gateway per
cluster/panel**, gateway uplink via **4G with NB-IoT or LoRa-backhaul
fallback**, and **store-and-forward** so a broken uplink never stops
local sensing/alerting. No networking-layer multi-hop mesh in the
prototype (keeps it debuggable); spatial analytics done at the gateway.

**Why not a true mesh:** multi-hop routing adds latency variance, power
cost, and debugging pain; LoRa link budget already covers panel scale
from one gateway; adding a second gateway is cheaper than meshing.
Revisit only if a site has severe terrain blocking.

------------------------------------------------------------------------

## 15. Sensor-Fusion Architecture

**Two levels:**

**(a) Per-node state estimation.** Fuse tilt (from accel in quiet
windows) with gyro (if present) and temperature via a **complementary
filter or lightweight Kalman filter** to produce a de-noised,
drift-corrected tilt state + rate + uncertainty. EKF/UKF are **not
justified** at the node --- the tilt model is near-linear over small
angles; a linear KF or complementary filter is adequate and cheaper.
**\[EA\]**

**(b) Array-level fusion at gateway.** Combine per-node states + GNSS
anchors + crackmeters into a **spatial deformation estimate**: - Anchor
relative tilt-integrated displacements to GNSS reference nodes
(least-squares network adjustment). - **Confidence-weighted fusion**:
weight each node by its current sensor-health score and estimated noise;
down-weight/exclude flagged nodes. - **Spatial interpolation** of
settlement/tilt to a grid: start with **IDW** (baseline), compare
**Ordinary Kriging** and **Gaussian Process regression** (gives
predictive variance → uncertainty map). Choose by cross-validated
interpolation error on the rig. **\[EA\]** - Missing node →
interpolation proceeds with inflated variance in that cell + map flag;
**never** silently zero-filled.

**Method selection rationale:** \| Method \| Use \| Why here \| Cost \|
Missing-data \| Failure handling \| \|---\|---\|---\|---\|---\|---\| \|
Complementary / linear KF \| per-node tilt \| small-angle linear, cheap,
real-time \| trivial \| predicts through gaps, grows covariance \|
covariance flags divergence \| \| Confidence-weighted least squares \|
array adjustment \| transparent, uses health weights \| low \| drops
nodes gracefully \| explicit weights \| \| IDW \| interpolation baseline
\| simplest, no model fitting \| trivial \| fine \| --- \| \| Ordinary
Kriging \| interpolation \| models spatial correlation length of trough
\| medium \| fine \| variogram sanity check \| \| GP regression \|
interpolation + uncertainty \| principled predictive variance for risk
map \| medium \| fine \| lengthscale priors from physics \| \|
EKF/UKF/particle \| --- \| **rejected**: nonlinearity not severe enough
to justify cost/complexity for SIH \| --- \| --- \| --- \|

------------------------------------------------------------------------

## 16. AI/ML Comparison

For each: **Input → Output → Assumptions → Data need → Compute → Pros →
Cons → Suitability (SIH)**.

### Anomaly detection

  ---------------------------------------------------------------------------------------------------------------------------------------------
  Model            I → O            Assumptions      Data          Compute       Pros               Cons                      Suitability
  ---------------- ---------------- ---------------- ------------- ------------- ------------------ ------------------------- -----------------
  Robust z-score / feature stream → stationary-ish   tiny          trivial       interpretable, no  misses                    **Essential
  MAD / Hampel on  flag             baseline,                                    training, great    multivariate/correlated   baseline**
  rates                             unimodal noise                               baseline           anomalies                 

  CUSUM /          series → change  known pre-change small         trivial       detects slow       tuning drift parameter    **Essential**
  change-point     time             stats                                        drifts/onsets,                               (onset detection)
                                                                                 gives onset time                             

  Isolation Forest multivariate     anomalies are    100s--1000s   low (Pi fine) multivariate,      not temporal; needs       **Recommended**
                   features →       few & different  samples                     fast, few params   feature engineering       
                   anomaly score                                                                                              

  One-Class SVM    features →       kernel choice;   moderate      medium        nonlinear boundary param-sensitive, slower   Optional
                   in/out           scaling                                                                                   

  Autoencoder /    window →         enough "normal"  **large**     medium-high   learns complex     data-hungry, opaque,      Optional / future
  VAE              reconstruction   data;            normal set                  normal patterns    false alarms on regime    
                   error            representative                                                  shift                     

  Matrix-profile   series → discord motif/discord    moderate      low-med       parameter-light,   univariate mainly         Recommended
  (time-series                      structure                                    interpretable                                (nice, cheap)
  discords)                                                                                                                   
  ---------------------------------------------------------------------------------------------------------------------------------------------

### Forecasting

  -------------------------------------------------------------------------------------------------------------------------
  Model               I → O      Assumptions    Data            Compute   Pros            Cons            Suitability
  ------------------- ---------- -------------- --------------- --------- --------------- --------------- -----------------
  Persistence /       series →   short horizon, none            trivial   the baseline    no regime       **Essential
  last-value + drift  h-step     smooth                                   every model     change          baseline**
                                                                          must beat                       

  Linear trend / EWMA series →   local          tiny            trivial   captures creep  limited         **Essential**
  / Holt              h-step +   linearity                                rate &                          
                      slope                                               acceleration                    

  ARIMA / SARIMA      series →   (seasonal)     100s            low       principled PIs, manual order,   **Recommended**
                      h-step +   stationarity                             seasonal        univariate      
                      PI         after                                    (monsoon)                       
                                 differencing                                                             

  Random Forest /     features → good features; 1000s           low-med   strong tabular  needs careful   **Recommended**
  XGBoost on          h-step     iid-ish                                  perf, feature   lag features;   
  lagged+engineered              residuals                                importance,     extrapolation   
  features                                                                multivariate    weak            

  GRU / LSTM          window →   enough         **10³--10⁴+**   med (Pi   learns          data-hungry,    Conditional (only
                      h-step     sequential                     OK for    nonlinear       opaque,         if it beats
                                 data;                          small)    temporal deps   overfits small  baseline)
                                 station-ish                                              sets            

  Temporal CNN (TCN)  window →   local temporal 10³--10⁴        med       parallel,       same data       Conditional
                      h-step     patterns                                 stable          concerns        
                                                                          training, long                  
                                                                          receptive field                 

  Transformer / TFT   window →   large data     **large**       high      SOTA on big     overkill; won't **Not recommended
                      h-step +                                            multivariate;   validate on SIH for SIH**
                      PI + attn                                           interpretable   data            
                                                                          attn                            
  -------------------------------------------------------------------------------------------------------------------------

### Spatial / graph

  -----------------------------------------------------------------------
  Model                               Note
  ----------------------------------- -----------------------------------
  GNN / GCN / GraphSAGE / ST-GNN      Elegant fit (nodes=sensors,
                                      edges=neighbours). **But** needs
                                      many nodes + lots of labelled
                                      spatio-temporal events to train;
                                      with 6--20 rig nodes it will
                                      **not** be validatable. Use
                                      **hand-crafted graph features**
                                      (differential tilt,
                                      neighbour-consensus, spatial
                                      coherence score) instead --- same
                                      physics, no training-data cliff.
                                      GNN = **future work** once a real
                                      network yields data. **\[EA\]**

  -----------------------------------------------------------------------

### Physics-guided

  -----------------------------------------------------------------------
  Approach                            Note
  ----------------------------------- -----------------------------------
  Influence-function /                Feasible: fit expected trough
  profile-function priors (Knothe/    shape; residual from expected shape
  stochastic medium theory) as        is a strong anomaly feature.
  *features* or *shape regularisers*  **\[EA\]**

  Inverse-velocity (Fukuzono) for     Established for slopes; **apply
  failure-time estimate on            only to slow accelerating signals,
  accelerating creep                  present as an estimate with wide
                                      uncertainty, do not claim for
                                      sudden collapse. \[RF/UI\]**

  PINN / PI-KAN / PI-GNN              Precedent exists on InSAR mining
                                      data (Remote Sensing 2025)
                                      **\[VF\]**, but full PINN training
                                      is beyond a robust SIH validation.
                                      Borrow the *principle* (physics
                                      priors + interpretability),
                                      implement the *lightweight*
                                      version.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 17. Final Algorithm Selection

  ---------------------------------------------------------------------------
  Layer                   Selected                    Rejected (reason)
  ----------------------- --------------------------- -----------------------
  Node fusion             Complementary filter /      EKF/UKF/particle
                          linear KF + temperature     (unjustified
                          model                       nonlinearity/cost)

  Sensor health           Rule set (range, flatline,  Deep models (no fault
                          noise floor, rate-of-change data)
                          limits, comms/battery) +    
                          **Isolation Forest on       
                          health features** +         
                          **neighbour-inconsistency   
                          test**                      

  Anomaly detection       **MAD/Hampel + CUSUM        Autoencoder/VAE
                          change-point** (baseline) → (data-hungry, opaque)
                          **Isolation Forest**        for prototype
                          (multivariate) → optional   
                          **matrix-profile**          

  Spatial                 **Hand-crafted graph        GNN (insufficient
                          features** (differential    training data)
                          tilt, consensus count,      
                          spatial-coherence           
                          vs. influence-function      
                          shape) + **GP/Kriging       
                          interpolation with          
                          variance**                  

  Forecasting             **Persistence+drift / Holt  Transformer/TFT
                          / ARIMA baseline** →        (overkill,
                          **XGBoost on lagged+physics unvalidatable)
                          features**; **GRU/TCN only  
                          if walk-forward skill beats 
                          baseline by a margin        
                          exceeding CI**              

  Creep-to-failure        **Inverse-velocity trend**  Any deterministic
                          as an *auxiliary* estimate  "time-of-collapse"
                          with explicit wide          claim
                          uncertainty, slow-signal    
                          only                        

  Risk scoring            **Weighted evidence         End-to-end learned risk
                          fusion** (rule-based,       (opaque, unvalidatable)
                          transparent) combining      
                          anomaly score, forecast     
                          exceedance probability,     
                          acceleration, spatial       
                          consensus, persistence,     
                          data quality                

  Uncertainty             **Conformal prediction      Full Bayesian deep
                          intervals** for forecasts;  learning
                          **ensemble/GP variance**    (compute/complexity)
                          for maps                    

  Explainability          **SHAP** on                 ---
                          XGBoost/Isolation Forest;   
                          **evidence panel** (which   
                          sensors, which neighbours,  
                          trend)                      
  ---------------------------------------------------------------------------

**Governing rule:** *the simplest model that meets the metric wins.*
Deep models are included **only** as challengers that must earn their
place via walk-forward evidence.

------------------------------------------------------------------------

## 18. Time-Series Prediction (methodology)

**Targets:** (a) *h*-step tilt/settlement/crack trajectory (h ≈
minutes--hours in rig; hours--days in field); (b) probability that a
monitored quantity exceeds a threshold within horizon *H*; (c) for
accelerating creep, an inverse-velocity failure-time estimate with
interval.

**Validation discipline (mandatory):** - **Chronological split** ---
train on earliest data, validate on middle, test on latest. **Never
random shuffle.** - **Walk-forward / rolling-origin** evaluation:
expand/roll the training window, forecast next block, step, repeat. -
**Cross-panel / cross-location**: train on some rig locations/scenarios,
test on unseen ones. - **Leakage audit**: no future-derived features
(e.g., no centred rolling stats, no target scaling fit on full
series). - **Metrics:** MAE, RMSE, MASE (vs. seasonal-naïve),
forecast-interval coverage (should ≈ nominal), and for event tasks:
precision, recall, F1, PR-AUC, **detection latency**, **warning lead
time distribution**, false-alarm rate per node-day, miss rate. -
**Baseline comparison table** always shown: naïve / Holt / ARIMA /
XGBoost / (GRU). Report whether deltas exceed bootstrap confidence
intervals.

**Honest expectation \[EA\]:** on smooth progressive deformation, simple
models forecast well; near abrupt onsets, *all* models degrade --- which
is why **warning does not depend on forecast alone** but on anomaly +
acceleration + consensus.

------------------------------------------------------------------------

## 19. Risk Scoring

**Transparent, rule-based evidence fusion** (not a black box), producing
a 0--1 risk index per node and per grid cell:

    risk = w1·anomaly_score_norm
         + w2·P(threshold exceedance within H)          # from forecast + conformal interval
         + w3·acceleration_indicator                     # 2nd derivative / inverse-velocity trend
         + w4·spatial_consensus_fraction                 # neighbours corroborating, correct sign pattern
         + w5·persistence_factor                         # how long the anomaly has held
         - w6·data_quality_penalty                       # LOW quality REDUCES confidence, RAISES caution level separately

-   Weights initialised from expert judgement, then **tuned on the
    scenario set** to trade off false alarms vs. missed events (report
    the ROC/PR trade-off, pick an operating point with stakeholders).
-   **Data quality is handled twice**: it lowers *confidence* in the
    risk number, and independently forces a **minimum caution level**
    (missing data ⇒ at least WATCH).
-   Risk is mapped to **NORMAL / WATCH / WARNING / CRITICAL** via
    thresholds that are themselves justified (Section 20), not
    hard-coded arbitrarily.

------------------------------------------------------------------------

## 20. Uncertainty & Explainability

**Uncertainty:** - Forecasts: **conformal prediction** intervals
(distribution-free, cheap, valid coverage) --- defensible to judges. -
Maps: **GP/Kriging predictive variance**; ensemble spread across
models. - Risk index: propagate sensor-health weights + interval widths
→ a **confidence band** on risk. - **Calibration check**: reliability
diagrams; interval coverage vs. nominal.

**Explainability --- every alert carries:** 1. Warning level + risk
value + **confidence band**. 2. **Which sensors** drove it (SHAP /
contribution bars). 3. **Which neighbouring nodes agree** (map
highlight) and whether the spatial *shape* matches subsidence. 4.
**Trend**: is deformation *accelerating*? current rate, change in rate.
5. **Forecast**: expected trajectory + interval; time-to-threshold
estimate + interval. 6. **Data quality**: node health, comms status,
last good reading, % nodes reporting. 7. **What changed** vs. last
NORMAL state.

**Threshold derivation (not assumed correct):** - **Engineering
limits**: allowable tilt/strain for nearby structures/infrastructure
(from geotech literature / structural damage classification --- cite,
don't invent numbers). - **Statistical baseline**: multiples of each
node's characterised quiet-period noise (e.g., k·σ, k tuned). -
**Historical/observed**: rates seen before known events in the rig /
literature. - **Model probability**: exceedance probability from
forecast. - **Consensus & persistence**: CRITICAL requires
*multi-sensor + multi-node + sustained* evidence, or a single
unambiguous large displacement --- **never one noisy sensor for one
sample**.

------------------------------------------------------------------------

## 21. Sensor Health (safety-critical module)

Detects and classifies: \| Fault \| Signature \| Detector \|
\|---\|---\|---\| \| Flatline / stuck \| zero variance over window \|
variance floor test \| \| Drift \| slow monotone trend inconsistent with
neighbours & uncorrelated with load, correlated with temperature/age \|
trend + neighbour-inconsistency + temp-correlation \| \| Excess noise \|
variance ≫ characterised baseline \| rolling variance vs. baseline \| \|
Outliers / spikes \| isolated large jumps, no neighbour echo \| Hampel +
neighbour check \| \| Bias step \| step with no physical cause, no
neighbour echo \| change-point + spatial check \| \| Comms loss \|
missed uplinks \| heartbeat timeout \| \| Battery/power fault \| voltage
trend, brown-out resets \| on-node telemetry \| \| Physical disturbance
(node knocked/vandalised) \| large step in tilt + shock event in accel +
often single-node \| accel-shock + step + isolation \| \| Calibration
expiry \| time since last calibration \| metadata rule \|

**Decision logic:** a node-level anomaly is routed to **"ground
movement" vs. "sensor fault"** by asking: *do neighbours corroborate
with the right spatial sign/shape?* + *is it correlated with
temperature/known noise?* + *does the accelerometer show a mechanical
shock?* + *is the health classifier flagging the channel?* Output: each
node is `HEALTHY / SUSPECT / FAULTED`; FAULTED nodes are excluded from
fusion and **shown on the map as data gaps**, never as "normal".

**This is a headline differentiator** --- most low-cost EWS papers do
not evaluate this. The team should present a **confusion matrix (fault
vs. real movement)** from fault-injection experiments.

------------------------------------------------------------------------

## 22. Edge Computing

**Split:** - **Node (ESP32/STM32):** sampling, filtering, temp
compensation, feature extraction, threshold pre-screen, event-trigger
burst mode, store-and-forward buffer. No ML beyond simple rules. -
**Gateway (Raspberry Pi 4/5 or equiv.):** ingest, array fusion, spatial
features, Isolation Forest, ARIMA/XGBoost forecasting, conformal
intervals, risk engine, warning logic, local DB (SQLite/TimescaleDB),
local dashboard, siren/SMS driver, OTA orchestration, cloud
store-and-forward. - **Cloud (optional):** aggregation across gateways,
model retraining, fleet dashboards, long-term archive, multi-mine view.

**Why edge:** latency (seconds not minutes), works with no internet,
cheap bandwidth, privacy/control. Model training is offline/cloud;
**inference is edge**.

------------------------------------------------------------------------

## 23. Offline Architecture (fail-safe)

  -----------------------------------------------------------------------
  Failure                             System behaviour
  ----------------------------------- -----------------------------------
  Internet down                       Gateway keeps sensing, fusing,
                                      forecasting, alerting locally;
                                      queues data for sync; dashboard on
                                      LAN/hotspot still works

  Cloud down                          Same; no user-visible loss of
                                      monitoring

  Gateway down                        Nodes buffer locally (≥30 days
                                      features); a **peer gateway** (if
                                      deployed) can adopt orphaned nodes;
                                      **loss of a gateway raises area
                                      status to WATCH** and alerts
                                      operator (gateway heartbeat)

  Node down / comms lost              Node marked SUSPECT→FAULTED;
                                      interpolation variance inflated;
                                      **map shows gap**; if several
                                      adjacent nodes drop, area → WATCH

  Power loss                          Solar+battery ride-through;
                                      low-battery telemetry; node reduces
                                      cadence gracefully before shutdown,
                                      sends "going dark" message

  Partial data                        Risk engine runs with available
                                      nodes + inflated uncertainty;
                                      **minimum caution level enforced**
  -----------------------------------------------------------------------

**Principle:** *the absence of data is itself information and must never
be rendered as "safe".*

------------------------------------------------------------------------

## 24. GIS Architecture

**Stack (simplest sufficient):** **PostGIS** (panels, node locations,
readings-as-time-series or link to TSDB, cracks, risk polygons) →
**FastAPI/GeoServer** serving **GeoJSON / vector tiles** → **Leaflet or
MapLibre** web dashboard. **QGIS** for offline expert analysis and
layout planning.

**Layers:** mine panels & old-working boundaries; node positions +
health (colour); tilt vectors (arrows, scaled); crack locations &
opening; interpolated settlement/tilt heatmap + **uncertainty layer**;
risk zones (NORMAL→CRITICAL choropleth); historical trend sparklines per
node; forecast overlay; InSAR baseline layer (imported).

**Reject:** heavy 3D globe / game-engine visualisation for the prototype
--- presentation cost without decision value. A clean 2D map +
time-series panels is what a safety officer and DGMS inspector actually
use.

------------------------------------------------------------------------

## 25. Digital Twin Assessment

**Question:** does a "Mine Subsidence Digital Twin" add technical value
beyond visualisation?

**Assessment \[EA\]:** - A **lightweight twin** = (a) the GIS spatial
model + (b) an influence-function / profile-function forward model that
predicts the *expected* trough for a given extraction geometry, so
measured deformation can be compared to predicted. This **does** add
value: residual (observed − predicted) is a strong anomaly feature and
helps attribution. **Include this as "physics forward model", not
branded "digital twin".** - A **full 3D geomechanical twin** (FLAC3D/PFC
coupled, real-time state estimation) is **high effort, needs site
geomechanical parameters, and cannot be validated at SIH**. → **Future
work.**

**Verdict:** implement the *forward influence-function model* (cheap,
useful, defensible); classify the *full digital twin* as **Optional /
Future Work** and say so plainly.

------------------------------------------------------------------------

## 26. Dataset Strategy

**Reality \[VF/RF\]:** there is **no large public labelled dataset of
low-cost surface-sensor time series with subsidence-event labels for
Indian underground coal mines**. What exists: - **InSAR-derived
deformation time series** (Sentinel-1 over Raniganj/Jharia) --- *free,
real, but satellite-cadence and not sensor-level*. Use for: realistic
deformation *shapes and rates* to drive simulations, and as an
**independent validation/context layer**. **\[VF\]** - Landslide
LoRa/MEMS datasets from literature --- *different mechanism*, but useful
for sensor-noise characterisation. **\[RF\]** - Published subsidence
profiles / subsidence-parameter tables (angle of draw, subsidence
factor) --- for the physics forward model. **\[RF\]**

**Strategy (transparent, layered):** 1. **Real sensor data** from the
physical rig (Section 27) --- primary source for sensor noise, drift,
thermal behaviour, fault signatures. 2. **Physics-based simulation**:
influence-function trough evolving over time (varying panel geometry,
rate, angle of draw), sampled at node locations, plus measured
sensor-noise/drift models and injected faults → large labelled scenario
library for model training & stress tests. 3. **InSAR-anchored
realism**: calibrate simulation rates/shapes to published
Raniganj/Jharia values. 4. **Data augmentation**: temperature cycles,
monsoon seasonal component, traffic/blasting vibration, node dropouts,
packet loss. 5. **Controlled lab experiments**: sand-box collapse,
tilt-table ramps, crack-opening rigs --- real physical deformation, real
sensor response.

**Stated limitations (must be in the deck):** synthetic/lab data
**cannot** establish real-world field accuracy; it establishes
*methodology soundness, relative model ranking, and failure-mode
behaviour*. Field accuracy requires a pilot deployment (future work,
ideally with CMPDI/CIMFR/IIT-ISM).

------------------------------------------------------------------------

## 27. Prototype Design

**Physical rig (bench + sandbox):** - **Sandbox / subsidence
simulator:** a \~1--2 m box of compacted sand/soil with a **lowerable
plate or removable supports / deflatable bladder** underneath to create
controlled voids and troughs; a section for **induced cracks**; a
**shaker/tapper** for vibration. - **Tilt table** for calibrated angular
ramps (verify node tilt resolution/repeatability). - **Crack-opening
rig:** micrometer stage moving two anchors apart (verify crackmeter
resolution). - **6--9 nodes** on the sandbox surface in a grid over the
void zone + edges; **1--2 GNSS reference nodes** (or a simulated
absolute reference via a dial-gauge/laser). - **1 gateway** (Raspberry
Pi) + LoRa concentrator; laptop dashboard.

**Node BoM (class-level, prototype):** ESP32 dev board; MEMS
IMU/inclinometer module; (optional) dedicated accelerometer;
draw-wire/pot crackmeter on crack nodes; digital temp sensor; LoRa
module (865--867 MHz); Li-ion + small solar panel + charge controller;
IP66 box; mounting plate/stake. **\[EV\] \~₹3,000--6,000/node** excl.
GNSS; **GNSS reference node** materially higher.

**Software:** node firmware (C/MicroPython); gateway services (Python:
ingest, fusion, ML, risk, alerts, API); PostGIS + TimescaleDB/SQLite;
Leaflet/MapLibre dashboard; SHAP/conformal libs; MQTT.

------------------------------------------------------------------------

## 28. Experimental Design

Scripted scenarios (each repeated ≥ N times, with ground truth from
plate displacement / dial gauges / table angle):

  --------------------------------------------------------------------------------------
  \#             Scenario         Ground truth   Expected system     Key metric
                                                 output              
  -------------- ---------------- -------------- ------------------- -------------------
  1              Normal (quiet)   no motion      NORMAL, all HEALTHY false-alarm rate
                                                                     over long run

  2              Gradual uniform  plate lowered  WATCH→WARNING as    detection latency,
                 subsidence       slowly         rate/threshold      forecast RMSE, lead
                                                 cross; forecast     time
                                                 tracks              

  3              Localized        one support    anomaly localised   spatial
                 subsidence (one  removed        to correct nodes;   localisation error,
                 zone)                           spatial shape       consensus behaviour
                                                 matches             

  4              Differential     asymmetric     differential-tilt   differential-tilt
                 movement (tilt   plate          feature fires;      accuracy
                 across array)                   correct gradient    
                                                 direction           

  5              Crack initiation micrometer     crackmeter detects; crack-rate error,
                 & widening       stage          risk rises;         latency
                                                 explanation cites   
                                                 crack               

  6              Vibration        shaker on,     NO false WARNING;   false-alarm rate
                 disturbance (no  plate still    vibration logged as under vibration
                 subsidence)                     context             

  7              Single sensor    inject in      node →              fault-vs-movement
                 fault (drift /   firmware       SUSPECT/FAULTED,    confusion matrix
                 stuck / bias                    **not**             
                 step)                           ground-movement     
                                                 alarm; excluded     
                                                 from fusion         

  8              Communication    disable TX     node → FAULTED, map time-to-detect
                 loss (kill a                    gap, area → WATCH   dropout, correct
                 node's radio)                   if clustered        status

  9              Multi-node real  plate +        real event still    recall under fault,
                 subsidence + 1   injected fault detected; faulted   no masking
                 concurrent                      node handled        
                 sensor fault                    separately          

  10             Cloud/internet   pull WAN cable local detection +   end-to-end offline
                 outage during                   alert unaffected;   success
                 event                           data syncs later    

  11             Monsoon-like     heat lamp /    seasonal component  false-alarm rate
                 thermal +        wetting, plate modelled out; no    under environmental
                 moisture cycling still          false WARNING       drift
  --------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 29. Validation Framework

  ---------------------------------------------------------------------------------------------------------------------------------------------
  Claim               Metric              Test method      Dataset/experiment   Baseline            Acceptance criterion Limitation
                                                                                                    (target, not         
                                                                                                    guarantee)           
  ------------------- ------------------- ---------------- -------------------- ------------------- -------------------- ----------------------
  Node measures tilt  resolution,         tilt-table       rig                  datasheet           resolution ≤0.01°;   prototype sensor grade
  reliably            repeatability,      ramps, thermal                                            drift characterised  
                      drift               chamber/cycles                                            & compensated        

  Crackmeter resolves resolution,         micrometer stage rig                  datasheet           ≤0.1 mm; R²\>0.99    thermal effects on
  opening             linearity                                                                     linear               frame

  Network delivers    PDR, latency, range field walk       outdoor LoS + rig    LoRa link budget    PDR ≥95% at design   site-specific RF
  data                                    test + rig                                                range; latency \<60  
                                                                                                    s event mode         

  Anomaly detection   precision, recall,  scenarios 2--5,9 scenario library +   MAD/CUSUM           ML beats baseline    scenario coverage
                      F1, PR-AUC, latency vs. 1,6,11       rig                                      PR-AUC beyond        finite
                                                                                                    bootstrap CI, else   
                                                                                                    use baseline         

  Sensor-health       fault-vs-movement   scenarios 7--9   fault injection      naïve threshold     high separation;     fault taxonomy
  discrimination      confusion matrix,                                                             real events not      incomplete
                      FPR/FNR                                                                       masked               

  Spatial-consensus   FAR with            ablation on      rig                  no-spatial variant  measurable FAR       small array
  reduces false       vs. without spatial scenarios 1,6,11                                          reduction reported   
  alarms              gating                                                                        with CI              

  Forecasting         MAE, RMSE, MASE,    walk-forward     scenario 2 + sim     persistence/ARIMA   MASE\<1; coverage ≈  short horizons only
                      interval coverage                                                             nominal ±; DL only   
                                                                                                    if it beats others   

  Warning lead time   lead-time           scenarios 2,3,5  rig                  ---                 positive median lead none for no-precursor
                      distribution                                                                  time on progressive  events
                                                                                                    events; report       
                                                                                                    spread               

  Risk calibration    reliability diagram all scenarios    scenario library     ---                 monotone, roughly    synthetic-influenced
                                                                                                    calibrated           

  Explainability      expert review of    domain reviewer  all events           ---                 reviewer can act on  reviewer availability
                      evidence panel      (if available)                                            the explanation      

  Edge inference      latency, CPU, RAM   profiling on Pi  rig                  ---                 \<5 s/cycle, fits in hardware-specific
                                                                                                    RAM                  

  Offline operation   end-to-end success  scenarios 8,10   rig                  ---                 100% of injected     limited outage types
                      under outage                                                                  outages handled      
                                                                                                    safely               

  Cost                ₹/node, ₹/monitored BoM + layout     ---                  total-station /     order-of-magnitude   not lifecycle-costed
                      area                calc                                  InSAR-campaign      lower ₹/area for     
                                                                                quote               screening            
  ---------------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 30. Ablation Study

  -----------------------------------------------------------------------
  Configuration           Purpose                 Expected result
  ----------------------- ----------------------- -----------------------
  Tilt only               isolate primary sensor  detects trough/creep;
                                                  weak on cracks, weak
                                                  fault discrimination

  Tilt + crackmeter       add direct strain       better on
                                                  localized/edge events

  Tilt + vibration        test vibration value    small gain as
                                                  corroborator; risk of
                                                  noise → shows why it's
                                                  feature-only

  Full multi-sensor       full node               best per-node detection
  fusion                                          

  Without spatial         test the array thesis   **higher false-alarm
  features                                        rate**, weaker
                                                  localisation, worse
                                                  fault discrimination

  With spatial features   "                       lower FAR, correct
                                                  localisation,
                                                  fault/movement
                                                  separation

  Without temporal model  detection only          no lead time, no
                                                  forecast

  With temporal model     \+ forecast             positive lead time on
                                                  progressive events

  Without sensor-health   test safety module      faults masquerade as
  module                                          movement → false
                                                  CRITICALs

  With sensor-health      "                       faults isolated; real
  module                                          events preserved

  Baseline stats only (no test ML value           may be *sufficient* ---
  ML)                                             if so, recommend it

  \+ Isolation Forest /   "                       keep only where it
  XGBoost                                         beats baseline beyond
                                                  CI

  Without edge            test offline thesis     fails during outage
  (cloud-only)                                    scenarios

  With edge               "                       passes
  -----------------------------------------------------------------------

**Purpose:** prove each component *earns its place*. If spatial features
or ML don't move the metrics, **say so and drop them** --- that honesty
scores points with technical judges.

------------------------------------------------------------------------

## 31. Robustness Testing

Inject and measure graceful degradation for: Gaussian + heavy-tailed
sensor noise; 5--40% missing samples; outlier bursts; simulated drift
(linear + thermal); comms loss (single & clustered); battery decline /
reduced cadence; ambient temperature swings (0--60 °C model);
moisture/seasonal drift; transient vibration (traffic, blasting analog);
**multiple simultaneous anomalies** (real event + fault + dropout).
Acceptance: no silent failure, monot-ish performance degradation,
uncertainty grows appropriately, caution level never *decreases* due to
worse data.

------------------------------------------------------------------------

## 32. Cost Analysis

**All figures \[EV\] with assumptions stated; not industrial quotes.**

**SIH prototype (one-time):** \| Item \| Qty \| Unit \[EV\] \| Notes \|
\|---\|---\|---\|---\| \| Standard node (ESP32+IMU+temp+LoRa+solar+box)
\| 7 \| ₹3,000--6,000 \| prototype grade \| \| Crackmeter add-on \| 2 \|
₹1,500--4,000 \| draw-wire/pot \| \| GNSS reference node \| 1--2 \|
₹12,000--30,000 \| RTK module + antenna \| \| Gateway (Raspberry Pi +
LoRa concentrator + solar/PSU + box) \| 1 \| ₹8,000--18,000 \| \| \| Rig
(sandbox, tilt table, crack stage, shaker, dial gauges) \| 1 \|
₹5,000--15,000 \| mostly materials \| \| Misc (cabling, mounts, spare
parts) \| --- \| ₹3,000--6,000 \| \| \| **Prototype total** \| \| **≈
₹70,000--1,60,000** \| dominated by GNSS + gateway \|

**Indicative field-pilot per-panel (illustrative ranges, NOT a bid)
\[EV\]:** - Screening-grade node installed (incl. pad/pole, labour):
₹8,000--20,000. - Gateway station (solar, 4G, enclosure, install):
₹40,000--1,20,000. - Per panel (say 15--25 nodes + 1 gateway + 3 GNSS
refs): **order ₹4--12 lakh** capex; **maintenance ₹0.5--1.5 lakh/yr**
(site visits, batteries, recalibration). Assumptions: existing site
access, no telecom capex, open-source software. - **Cost/monitored
area:** for a \~0.25--0.5 km² panel → **\~₹10--40 lakh/km² screening
coverage** capex \[EV\].

> **Cost-optimised build:** see **Appendix B** for an ultra-low-cost
> version --- prototype ≈ **₹15,000** (lean ≈ ₹9,000), field screening
> node BOM ≈ **₹1,000--2,500** --- achieved mainly by dropping RTK-GNSS
> in favour of relative (differential) measurement, single-channel LoRa,
> commodity MEMS, and edge software on existing/₹1,700 compute.

**Comparison \[RF, qualitative\]:** robotic total-station or permanent
survey-GNSS deformation networks and specialist micro-seismic arrays
typically cost substantially more per equivalent spatial coverage;
recurring InSAR analysis is cheap on data but needs specialist
processing and does not give on-site real-time alarms. **Do not state a
specific competitor price without a real quote --- \[UI\].** The
defensible claim: *this system targets an order-of-magnitude lower ₹ per
unit spatial coverage for continuous screening, trading per-point
accuracy and certification for density, latency, and offline
capability.*

------------------------------------------------------------------------

## 33. Scalability

  ------------------------------------------------------------------------------------------
  Dimension      10 nodes       100                 1,000+ / multi-mine      Mechanism
  -------------- -------------- ------------------- ------------------------ ---------------
  Radio          1 gateway      2--5 gateways       gateway fleet, sub-band  add gateways,
                                (clustered-star)    planning, LoRa ADR,      not hops
                                                    duty-cycle mgmt          

  Ingest         MQTT single    broker + queue      broker cluster / managed horizontal
                 broker                             queue                    

  Storage        SQLite         TimescaleDB         Timescale +              continuous
                                                    downsampling/retention   aggregates
                                                    tiers + object storage   

  Inference      on 1 Pi        per-gateway edge    per-gateway edge + cloud edge scales
                                                    retraining               with gateways

  Models         1 set          per-panel           model registry, per-site MLOps registry
                                calibration         params, canary rollout   

  Updates        manual         OTA per cluster     staged OTA,              firmware +
                                                    health-gated, rollback   model OTA

  Fault          operator       gateway heartbeats, regional NOC dashboard,  hierarchical
  tolerance      watches        peer adoption       auto-tickets             monitoring

  Sync           direct         store-and-forward   store-and-forward +      offline-first
                                                    backpressure             by design
  ------------------------------------------------------------------------------------------

**Bottleneck honesty \[EA\]:** LoRa airtime/duty-cycle limits
per-gateway node count and cadence; this is managed by clustering +
adaptive cadence (fast only in event mode), not by pretending it's
infinite.

------------------------------------------------------------------------

## 34. Security & Fail-Safe Design

-   **Device auth:** per-node keys; LoRaWAN-style AES-128 session keys
    (or private-LoRa with per-node AES + nonce/counter to stop replay).
-   **Transport:** payload encryption node→gateway; TLS gateway→cloud.
-   **Firmware:** signed OTA images, version pinning, rollback; secure
    boot where MCU supports it.
-   **Data integrity:** message counters, HMAC, server-side plausibility
    checks; tamper events (enclosure switch + accel shock) logged.
-   **Access control:** RBAC on dashboard/API; audit log of every alert,
    ack, and config change (DGMS-auditable).
-   **Anti-spoofing:** spatial consensus + physical-plausibility checks
    make a single spoofed node unable to force CRITICAL; sudden
    implausible values → SUSPECT.
-   **Alert tampering:** alerts are append-only, signed, mirrored
    locally and (when available) to cloud; suppressing an alert requires
    authenticated ack with reason.
-   **Fail-safe cardinal rule:** unknown/missing/low-integrity data ⇒
    **raise caution, never lower it**; the UI must visibly distinguish
    "measured NORMAL" from "no data".

------------------------------------------------------------------------

## 35. Patent / Prior-Art Analysis

**Method \[required before any novelty claim\]:** search (a) **Google
Patents / Espacenet / Indian Patent Advanced Search (InPASS)** for:
"mine subsidence monitoring wireless sensor", "surface deformation early
warning IoT", "tilt sensor array subsidence", "sensor fault
discrimination geotechnical", "LoRa landslide"; (b)
**Scopus/IEEE/ScienceDirect/Springer** for the same; (c)
government/institutional project registries (CMPDI, CIMFR, IIT-ISM, DST/
MeitY).

**Known landscape \[VF that these categories are populated\]:** -
Numerous **landslide/slope** IoT-EWS papers and some patents (LoRa +
MEMS + rainfall). - **InSAR-based** mining-subsidence prediction papers,
incl. deep-learning and physics-informed (Remote Sensing 2025;
Geo-spatial Information Science 2025). **\[VF\]** -
Robotic-total-station and vibrating-wire **commercial monitoring**
systems and their patents. - Coal-mine water/geo-hazard **method
patents** (e.g., USPTO 11,060,402 phreatic-leakage level
classification). **\[VF\]**

**Honest novelty position:** - **Not novel:** LoRa+MEMS sensing;
InSAR-ML forecasting; tilt-based deformation detection; multi-level
alerts; GIS dashboards --- all prior art. - **Possibly novel as a
combination (needs FTO search):** *offline-first + explicitly evaluated
sensor-health-vs-ground-movement discrimination + spatial-consensus
warning gating with quantified false-alarm reduction + baseline-first
validated forecasting, specialised for Indian underground-coal surface
conditions and DGMS decision workflow.* - **Forbidden language until
evidenced:** "first", "unique", "patented", "only system that...".

------------------------------------------------------------------------

## 36. Innovation Ranking

Scores 1--5 (Novelty / Impact / Feasibility / Cost / SIH value /
Evidence base):

  ---------------------------------------------------------------------------------------------------------
  \#      Candidate innovation               Nov     Imp     Feas    Cost    SIH     Evid    Keep?
  ------- ---------------------------------- ------- ------- ------- ------- ------- ------- --------------
  I1      Sensor-health vs. ground-movement  4       5       4       5       5       3       ★ Top
          discrimination as evaluated module                                                 

  I2      Spatial-consensus + persistence +  3       4       5       5       5       4       ★ Top
          multi-sensor warning gating                                                        
          (quantified FAR cut)                                                               

  I3      Baseline-first walk-forward honest 2       4       5       5       4       5       ★ Top
          ML evaluation (report when simple                                                  
          wins)                                                                              

  I4      Offline-first fail-safe warning    3       4       5       5       4       3       ★ Top
          logic ("no data ≠ safe")                                                           

  I5      Physics forward-model residual     4       4       3       4       4       4       ★ Top
          (influence function) as anomaly                                                    
          feature + interpretability                                                         

  I6      Conformal prediction intervals +   3       4       4       5       4       4       Keep
          evidence-carrying alerts for                                                       (supporting)
          DGMS/community                                                                     

  I7      Adaptive event-triggered cadence   2       3       5       5       3       3       Keep
          for LoRa airtime vs. latency trade                                                 (supporting)

  I8      InSAR-as-independent-cross-check   3       3       3       4       3       4       Optional
          integration layer                                                                  

  I9      Inverse-velocity auxiliary         3       3       3       5       3       3       Optional (with
          failure-time estimate (bounded,                                                    heavy caveats)
          slow signals)                                                                      

  I10     Differential-tilt-to-strain        3       3       4       5       3       3       Keep (part of
          estimation across node baselines                                                   I2)

  I11     GNN spatio-temporal model          4       3       1       4       2       3       Future work

  I12     Full 3D digital twin               3       2       1       2       2       2       Future work
  ---------------------------------------------------------------------------------------------------------

**Selected top 5: I1, I2, I3, I4, I5** (with I6, I7, I10 as built-in
supporting features).

------------------------------------------------------------------------

## 37. Final Technology Selection

  ------------------------------------------------------------------------------------------------------------------------
  Layer            Alternatives     Selected                     Why                Rejected          Reason
  ---------------- ---------------- ---------------------------- ------------------ ----------------- --------------------
  Node MCU         ESP32 / STM32L / **ESP32** (STM32L if         cheap, capable,    AVR               too weak; Pi
                   AVR / Pi         power-critical)              ADC, community,                      
                                                                 LoRa-friendly                        

  Tilt             MEMS             **MEMS inclinometer or       cost + density;    VW/electrolytic   cost; **for field
                   accel-as-tilt /  high-stability MEMS accel**  adequate with                        cert, VW is the
                   MEMS                                          compensation                         upgrade**
                   inclinometer /                                                                     
                   electrolytic /                                                                     
                   VW tiltmeter                                                                       

  Vibration        MEMS accel /     **MEMS accel** (feature      already present,   geophone          cost, not needed for
                   geophone         only)                        cheap                                screening

  Displacement     draw-wire / pot  **draw-wire or pot           cost               VW at prototype   cost
                   / LVDT / VW      (prototype)**, VW for field                                       
                   crackmeter                                                                         

  Absolute ref     none / RTK-GNSS  **RTK-GNSS reference nodes   anchors array,     total station     cost, LoS,
                   / total station  (few)**                      catches global                       single-point
                                                                 drift                                

  Comms            LoRa / Zigbee /  **Private clustered-star     range + power +    Zigbee/BLE/WiFi   range; NB-IoT-first
                   BLE / WiFi /     LoRa (865--867 MHz)** + 4G   offline + cost                       
                   NB-IoT / 4G      gateway uplink w/                                                 
                                    store-forward                                                     

  Topology         multi-hop mesh / **Clustered-star**           debuggable, low    multi-hop mesh    power, latency,
                   star /                                        latency variance,                    complexity
                   clustered-star                                add gateways to                      
                                                                 scale                                

  Node fusion      complementary /  **Complementary or linear    small-angle        EKF/UKF/PF        unjustified
                   KF / EKF / UKF / KF**                         linear; cheap                        nonlinearity
                   PF                                                                                 

  Interpolation    IDW / Kriging /  **GP (with Kriging & IDW as  predictive         ---               ---
                   GP               baselines)**                 variance →                           
                                                                 uncertainty map                      

  Anomaly          stats / IF /     **MAD+CUSUM → Isolation      interpretable,     AE/VAE            data-hungry, opaque
                   OCSVM / AE / VAE Forest** (+ optional         low-data,                            
                                    matrix-profile)              multivariate                         

  Forecast         naïve / Holt /   **Holt/ARIMA baseline →      validatable,       Transformer/TFT   overkill,
                   ARIMA / RF / XGB XGBoost; GRU/TCN only if it  interpretable                        unvalidatable
                   / GRU / TCN /    wins**                                                            
                   Transformer                                                                        

  Spatial ML       GNN /            **Hand-crafted graph         no training-data   GNN               insufficient
                   hand-crafted     features**                   cliff, same                          labelled events
                   graph features                                physics                              

  Uncertainty      none / Bayesian  **Conformal + ensemble/GP    cheap, valid       Bayesian DL       compute/complexity
                   DL / conformal / variance**                   coverage,                            
                   ensemble                                      defensible                           

  Explainability   none / feature   **SHAP + evidence panel**    actionable,        ---               ---
                   importance /                                  standard                             
                   SHAP                                                                               

  Edge runtime     cloud-only /     **Pi +                       fits models,       cloud-only        violates offline req
                   TFLite-Micro /   scikit-learn/XGBoost/ONNX;   offline                              
                   Pi +             nodes rules-only**                                                
                   sklearn/ONNX                                                                       

  DB               files / InfluxDB **SQLite (edge) +            simple edge,       ---               ---
                   / TimescaleDB /  TimescaleDB (server) +       powerful server,                     
                   SQLite           PostGIS**                    spatial                              

  GIS UI           Leaflet /        **Leaflet or MapLibre +      lightweight,       Cesium/Unreal     presentation cost,
                   MapLibre /       GeoJSON/vector tiles**       offline-capable,                     no decision value
                   CesiumJS /                                    sufficient                           
                   Unreal                                                                             

  Physics model    none / influence **Influence/profile function cheap, useful      FLAC3D twin       unvalidatable at SIH
                   function /       forward model**              residual feature                     
                   FLAC3D twin                                                                        
  ------------------------------------------------------------------------------------------------------------------------

**Classification:** - **Essential:** ESP32 nodes, MEMS tilt, temp
compensation, draw-wire crackmeters (subset), LoRa clustered-star, Pi
gateway edge processing, SQLite/Timescale/PostGIS, MAD+CUSUM+Isolation
Forest, Holt/ARIMA/XGBoost forecasting, rule-based risk engine,
spatial-consensus gating, sensor-health module, offline-first logic,
Leaflet/MapLibre GIS, local siren + SMS. - **Recommended:** RTK-GNSS
reference nodes, conformal intervals, SHAP evidence panel, GP
interpolation, influence-function residual feature, InSAR cross-check
layer, adaptive cadence. - **Optional:** matrix-profile,
inverse-velocity auxiliary estimate, second gateway peer-adoption. -
**Future:** GNN/ST-GNN, full 3D digital twin, micro-seismic integration,
VW-instrument field upgrade, autonomous evacuation actuation. - **Not
recommended:** Transformer/TFT, multi-hop mesh, cloud-only architecture,
cellular-first, game-engine visualisation, any "predict exact collapse
time" claim.

------------------------------------------------------------------------

## 38. Final System Architecture

**Hardware** - **Standard node:** ESP32 · MEMS inclinometer/accel · MEMS
accelerometer (vibration features) · digital temperature (board +
ambient) · optional RH · LoRa radio (865--867 MHz) · Li-ion + solar +
charge controller · IP66 enclosure · rigid mount to competent ground. -
**Crack node:** standard node + draw-wire/pot crackmeter across a
crack/joint. - **Reference node:** standard node + RTK-GNSS module +
antenna (3--6 per panel). - **Gateway:** Raspberry Pi 4/5 · LoRa
concentrator · 4G modem (+ optional LoRa backhaul) · solar/PSU · local
siren relay · IP66 cabinet.

**Communication** - Nodes → nearest gateway, **clustered-star private
LoRa**, AES-encrypted, message counters. - Adaptive cadence: slow (e.g.,
5--15 min) in NORMAL; fast (10--60 s) in event mode triggered by node
pre-screen or gateway command. - Gateway → cloud: MQTT/HTTPS over 4G,
**store-and-forward**.

**Software** - **Firmware:** sampling, robust filtering, temperature
compensation, feature extraction, threshold pre-screen, event trigger,
ring-buffer store-and-forward, signed OTA. - **Gateway services
(Python):** ingest/MQTT → validation & sensor-health classifier →
per-node fusion → array adjustment (GNSS-anchored, health-weighted) →
spatial features (differential tilt, consensus, influence-function
residual) → anomaly detection (MAD/CUSUM/IsolationForest) → forecasting
(Holt/ARIMA/XGBoost + conformal) → risk engine (transparent weighted
fusion) → warning state machine (persistence + consensus +
multi-sensor + confidence) → alert dispatch (dashboard, siren,
SMS/email) → local DB → cloud sync. - **Server/cloud (optional):**
TimescaleDB + PostGIS, model registry & retraining,
multi-gateway/multi-mine dashboard, long-term archive, InSAR
ingestion. - **Dashboard:** Leaflet/MapLibre map (panels, nodes+health,
tilt vectors, cracks, settlement heatmap + uncertainty, risk zones),
per-node time series + forecast, alert log with ack workflow,
explanation panel, system-health page.

**AI pipeline** Preprocessing → **sensor-health** → fusion → **anomaly
detection** → **spatial analysis** → **forecasting** → **risk scoring**
→ **uncertainty (conformal/variance)** → **explainability (SHAP +
evidence)** → **warning engine**.

**Deployment** Edge-first (all detection/alerting on gateway) · optional
local server per mine · optional cloud for fleet · offline sync
everywhere.

**Alerts** Dashboard banners + map · local siren at gateway/site ·
SMS/email/app push to role-based recipients · every alert carries level,
risk, confidence, contributing sensors, neighbour agreement, trend,
forecast, data quality.

------------------------------------------------------------------------

## 39. End-to-End Workflow

  --------------------------------------------------------------------------------------------------------------------
  Stage                    Input             Process                     Output
  ------------------------ ----------------- --------------------------- ---------------------------------------------
  1\. Ground movement      strata deflection physical                    surface
                           over void                                     tilt/strain/displacement/cracking/vibration

  2\. Sensor measurement   physical          MEMS/crackmeter/GNSS        raw digital samples + timestamps + temp
                           quantities        sampling + oversample       

  3\. Node validation      raw samples       range/flatline/noise/rate   cleaned samples + per-channel quality flags
                                             checks, temp compensation   

  4\. Node preprocessing   cleaned samples   robust filter, quiet-window compact feature frame + periodic raw snippet
                                             averaging, feature          
                                             extraction (rate, variance, 
                                             vib RMS, crack rate)        

  5\. LoRa transmission    feature frame     AES encrypt, counter,       packets at gateway (or buffered)
                                             adaptive cadence,           
                                             store-forward               

  6\. Gateway ingest       packets           decrypt, dedupe, order,     validated time-series store
                                             persist to SQLite           

  7\. Sensor-health        node features +   rules + Isolation Forest +  node status HEALTHY/SUSPECT/FAULTED
                           neighbours +      neighbour-inconsistency     
                           telemetry                                     

  8\. Fusion               healthy node      complementary/KF per node;  per-node tilt/displacement + uncertainty;
                           states + GNSS     health-weighted network     array state
                           anchors +         adjustment                  
                           crackmeters                                   

  9\. Spatial analysis     array state       differential tilt,          deformation + uncertainty grid; spatial
                                             consensus count,            anomaly flags
                                             influence-function          
                                             residual, GP interpolation  

  10\. Anomaly detection   node + spatial    MAD/CUSUM + Isolation       anomaly scores + onset times
                           features          Forest                      

  11\. Temporal            per-node/array    Holt/ARIMA/XGBoost (+ GRU   h-step trajectory + intervals; P(threshold
  forecasting              series            if it wins) + conformal     exceedance ≤ H); acceleration indicator

  12\. Risk estimation     anomaly +         transparent weighted        risk index per node & cell (0--1)
                           forecast +        fusion, tuned weights       
                           acceleration +                                
                           consensus +                                   
                           persistence −                                 
                           data-quality                                  

  13\.                     interval widths,  propagation                 confidence band on risk; calibration status
  Confidence/uncertainty   health weights,                               
                           ensemble spread                               

  14\. Warning engine      risk +            state machine w/            NORMAL/WATCH/WARNING/CRITICAL + rationale
                           confidence +      hysteresis; min-caution on  
                           persistence +     low data                    
                           consensus +                                   
                           multi-sensor +                                
                           data quality                                  

  15\. GIS visualization   array state,      map rendering, layers, time operator dashboard
                           risk, health,     series                      
                           history                                       

  16\. Operator decision   dashboard +       human judgement + SOP/TARP  restrict/evacuate/survey/notify DGMS/resume;
                           explanation +                                 ack logged
                           confidence                                    
  --------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 40. FINAL SIH BUILD

**Build exactly this:** - **Nodes:** 7 standard (ESP32 + MEMS
tilt/accel + temp + LoRa + solar) + 2 crack nodes (draw-wire) + 1--2
GNSS reference nodes (or one high-quality absolute reference instrument
on the rig). - **Gateway:** 1 × Raspberry Pi 4/5 + LoRa concentrator +
laptop for dashboard. - **Edge device:** the Pi runs the full
pipeline. - **AI models:** MAD + CUSUM (baseline anomaly); Isolation
Forest (multivariate anomaly); Holt/ARIMA + XGBoost forecaster with
conformal intervals; rule-based sensor-health classifier + small
Isolation Forest on health features; transparent weighted risk engine;
SHAP explanations; GP/Kriging/IDW interpolation. - **Database:**
SQLite + TimescaleDB (server), PostGIS for spatial. - **Backend:**
Python (FastAPI), MQTT broker (Mosquitto). - **Frontend:**
Leaflet/MapLibre dashboard + time-series charts + alert log +
explanation panel. - **GIS:** panels, nodes+health, tilt vectors,
cracks, settlement + uncertainty heatmap, risk zones, history. - **Alert
system:** dashboard + buzzer/siren on gateway + SMS/email (GSM module or
SMTP) with role routing. - **Power:** Li-ion + small solar + charge
controller per node; PSU/solar for gateway. - **Demo setup:** sandbox
subsidence simulator (lowerable plate / removable supports / bladder) +
tilt table + crack micrometer stage + shaker; nodes gridded over void +
edges. - **Dataset:** rig-collected real sensor data +
physics-simulation scenario library (influence-function troughs
calibrated to published Raniganj/Jharia rates) + augmentation + injected
faults; InSAR layer imported for context. - **Experiments:** the 11
scenarios in Section 28. - **Metrics:** detection latency,
precision/recall/F1/PR-AUC, false-alarm rate (per node-day), miss rate,
warning lead-time distribution, forecast MAE/RMSE/MASE + interval
coverage, fault-vs-movement confusion matrix, spatial localisation
error, edge inference latency, offline-success rate, ₹/node & ₹/area.

**Do NOT build for SIH:** GNN, 3D digital twin, cellular-first network,
multi-hop mesh, Transformer models, autonomous evacuation actuation, or
anything claiming exact collapse-time prediction.

------------------------------------------------------------------------

## 41. Judge Evaluation (critical)

**Scores (0--10, self-assessed *if the build and validation above are
executed honestly*):**

  ------------------------------------------------------------------------
  Criterion               Score                   Comment
  ----------------------- ----------------------- ------------------------
  Problem understanding   9                       Mechanism, Indian
                                                  context, DGMS workflow
                                                  all addressed

  Problem relevance       9                       Real, regulated,
                                                  life-safety problem in
                                                  Indian coalfields

  Innovation              6.5                     Combination +
                                                  honest-validation angle;
                                                  ingredients are prior
                                                  art

  Technical depth         8.5                     First-principles +
                                                  baseline-first +
                                                  ablation + robustness

  AI justification        8.5                     Models chosen by
                                                  evidence, not hype;
                                                  simpler-wins rule

  IoT architecture        8                       Clustered-star LoRa,
                                                  solar, offline-first ---
                                                  appropriate

  "Mesh" innovation       5.5                     Reframed as spatial
                                                  array + consensus
                                                  analytics; not a
                                                  networking novelty

  Prediction methodology  7                       Walk-forward, conformal,
                                                  honest about
                                                  sudden-collapse limits

  Accuracy / validation   8                       Strong framework;
                                                  limited by synthetic/lab
                                                  data

  Reliability             8                       Sensor-health +
                                                  fail-safe + robustness
                                                  testing

  Cost                    8.5                     Genuinely low-cost
                                                  prototype; ranges
                                                  honestly stated

  Scalability             7.5                     Gateway-fleet story is
                                                  sound; LoRa airtime
                                                  acknowledged

  Indian suitability      9                       Monsoon, thermal,
                                                  connectivity, power,
                                                  DGMS all designed for

  Prototype feasibility   8.5                     Buildable by a student
                                                  team in the timeframe

  Social impact           8.5                     Community + worker +
                                                  infrastructure
                                                  protection

  Commercial potential    7.5                     CIL/CMPDI/DGMS pull;
                                                  needs field pilot +
                                                  certification

  Novelty                 6                       Defensible as
                                                  adaptation/combination
                                                  only

  Presentation potential  8.5                     Live rig demo +
                                                  dashboard + validation
                                                  matrix is compelling
  ------------------------------------------------------------------------

**Top 10 weaknesses** 1. No real field data --- validation rests on
lab + simulation. 2. Cannot warn of no-precursor sudden sinkhole
collapse (physical limit). 3. Low-cost MEMS calibration/drift is a
persistent operational burden. 4. "Mesh" framing over-claims; it's a
spatial array. 5. Spatial-consensus benefit shown only on a small (6--9
node) array. 6. LoRa airtime/duty-cycle limits cadence at scale. 7.
Sensor-health module's fault taxonomy is necessarily incomplete. 8.
Thresholds partly rely on expert judgement, not site history. 9. GNSS
reference nodes push up cost and add their own error modes (multipath).
10. Novelty is combinational; a thorough patent search is still pending.

**Top 10 judge objections & best evidence-based answers** 1. *"This is
just a landslide sensor network."* → Mechanism, features (differential
tilt/strain vs. trough shape, influence-function residual),
sensor-health module, and DGMS decision workflow are
subsidence-specific; landslide nets don't do fault-vs-movement
discrimination or influence-function residuals. 2. *"Can cheap MEMS
actually see subsidence?"* → Yes for progressive/trough deformation: rig
tilt-table tests characterise resolution ≤0.01°; published rates
(Raniganj \~21 mm/yr, Jharia up to \>120 mm/yr) integrated over trough
width give tilt signals well above characterised noise; we show the SNR
calc. 3. *"How do you separate subsidence from thermal/monsoon noise?"*
→ Common-mode rejection via differencing, temperature compensation,
seasonal modelling, and spatial-consensus gating; ablation quantifies
the false-alarm reduction. 4. *"Your accuracy numbers are from synthetic
data."* → Correct and stated openly; synthetic/lab data validates
methodology and model ranking; field accuracy needs a pilot (proposed
with CMPDI/CIMFR). We never claim a field accuracy %. 5. *"Why not
InSAR?"* → We use it --- as an independent cross-check and historical
baseline; it can't deliver seconds-latency on-site alarms or work
through monsoon decorrelation. 6. *"Why not a GNN / transformer?"* →
Insufficient labelled spatio-temporal events to validate; hand-crafted
graph features encode the same physics without the data cliff; GNN is
future work. 7. *"What if a sensor fails during a real event?"* →
Scenario 9 tests exactly this: faulted node is isolated by the health
module, real event still detected; confusion matrix reported. 8. *"What
happens with no internet?"* → Scenarios 8 & 10: full local detection +
siren + SMS; cloud is sync-only; missing data raises caution, never
lowers it. 9. *"How do you avoid crying wolf?"* → CRITICAL requires
multi-sensor + multi-node consensus + temporal persistence + model
confidence, or one unambiguous large displacement; false-alarm rate
reported with CIs. 10. *"Is any of this novel?"* → As individual parts,
no. As an offline-first, sensor-health-aware, consensus-gated,
baseline-validated system tuned for Indian underground-coal surfaces and
DGMS workflow --- plausibly, pending a formal patent search; we don't
say "first" or "unique".

**Top 10 technical questions judges may ask (with answers)** 1. *Angle
of draw you assume?* → Site-specific; we use a range (\~25--35°) from
literature and fit it from the rig; the influence-function model exposes
it as a parameter. 2. *Node spacing rule?* → Smaller than expected
trough half-width / influence radius; densest over panel edges,
old-working boundaries, and near structures. 3. *Tilt resolution after
temperature compensation?* → Target ≤0.01°; actual value measured on the
tilt table across 0--60 °C and reported with repeatability. 4. *LoRa
data budget per node per day?* → Feature frames only (\~10s--100s
bytes), slow cadence in NORMAL; event-mode bursts are short; within ISM
duty-cycle limits --- we show the airtime calc. 5. *Forecast horizon and
skill?* → Minutes--hours (rig); reported as MASE vs. seasonal-naïve on
walk-forward; deep model used only if it beats baseline beyond bootstrap
CI. 6. *How are warning thresholds set?* → Engineering limits for nearby
structures + k·σ of characterised node noise + observed pre-event
rates + model exceedance probability; tuned with stakeholders on the
ROC/PR curve. 7. *Conformal prediction --- why?* → Distribution-free
finite-sample coverage guarantee; cheap; gives honest intervals without
assuming Gaussian errors. 8. *Battery life in monsoon?* → Sized for ≥14
days no-sun at NORMAL cadence; node drops cadence gracefully and sends a
"going dark" message before shutdown. 9. *Multipath on the cheap GNSS
refs?* → Long averaging, siting away from reflectors, plausibility
checks; GNSS is an anchor, not the primary detector. 10. *Path to a real
deployment?* → Pilot on one panel with CMPDI/CIMFR/IIT-ISM; swap
screening MEMS for vibrating-wire where certification requires;
DGMS-auditable logging already built in.

------------------------------------------------------------------------

## 42. Red-Team Analysis

  -------------------------------------------------------------------------------------------
  Attack on the    Finding         Severity       Mitigation              Validation
  idea                                                                    
  ---------------- --------------- -------------- ----------------------- -------------------
  Sensors can't    False for       High (scope)   Scope claim to          SNR analysis;
  detect           progressive                    progressive/creep;      scenario set
  meaningful       subsidence (SNR                state limit             
  deformation      calc + rig);                                           
                   **true** for                                           
                   no-precursor                                           
                   sinkholes                                              

  Can't separate   Hard but        Med            Common-mode rejection,  Ablation FAR
  subsidence from  tractable                      temp comp, seasonal     with/without
  environmental                                   model, consensus gating 
  noise                                                                   

  Model can't      True for abrupt Med            Warning ≠               Walk-forward;
  predict future   onsets; OK for                 forecast-only;          lead-time dist
  deformation with smooth trends                  anomaly +               
  available data                                  acceleration +          
                                                  consensus               

  Not enough       True for        Med            Baseline-first; physics Ablation; baseline
  training data    deep/GNN models                simulation;             table
                                                  hand-crafted features   

  Mesh network     We don't use a  Low            Clustered-star LoRa;    PDR field test
  won't be         multi-hop mesh                 add gateways            
  reliable                                                                

  Low-cost sensors Real ongoing    Med-High       Temp comp, drift        Drift test;
  lose calibration burden                         detection, GNSS         drift-detector ROC
                                                  re-anchor, differential 
                                                  features, scheduled     
                                                  recal                   

  Can't operate    Designed        Low            Edge pipeline;          Cut-cloud/gateway
  offline          offline-first                  store-forward; local    tests
                                                  alerts                  

  False alarms     Risk without    Med            Persistence +           FAR with CIs;
  uncontrolled     gating                         consensus +             ablation
                                                  multi-sensor +          
                                                  confidence gating       

  Missed events    Possible near   High           Multiple independent    Miss rate;
                   abrupt onset                   indicators;             robustness tests
                                                  conservative            
                                                  min-caution on poor     
                                                  data                    

  Novelty          Real risk to    Med            Combinational-novelty   Prior-art table
  overclaimed      credibility                    language only; patent   
                                                  search pending          

  Prototype not    Lab ≠ field     Med-High       State explicitly;       Documented
  representative                                  calibrate sim to InSAR; limitations
                                                  propose pilot           

  Sensor fails     Handled         Med            Health module isolates; Scenario 9
  during event                                    real event preserved    confusion matrix

  Comms fails      Handled         Low-Med        Local detection +       Scenarios 8, 10
  during event                                    siren; buffer + sync    

  AI uncertain     Handled         Low            Conformal intervals;    Calibration plots
                                                  low-confidence → raise  
                                                  caution + human review  
  -------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 43. Risk & Mitigation Matrix

  ---------------------------------------------------------------------------------------------
  Potential        Severity    Probability   Effect        Mitigation            Residual risk
  weakness                                                                       
  ---------------- ----------- ------------- ------------- --------------------- --------------
  No-precursor     High        Med (legacy   Late/no       Explicit scope;       **Bounded, not
  sudden collapse              workings)     warning for   combine with          eliminated**
  missed                                     that failure  subsurface            --- stated as
                                             mode          instrumentation &     a known limit
                                                           known-void mapping in 
                                                           real deployment;      
                                                           rain-triggered watch  
                                                           escalation            

  MEMS drift       Med         Med-High      False WARNING Temp comp, drift      Low-Med with
  causes false                               or masked     detector, GNSS        maintenance
  trend                                      real motion   anchor, differential  
                                                           features, recal       
                                                           schedule              

  Environmental    Med         Med           Alert         Consensus +           Low,
  noise → false                              fatigue, lost persistence +         quantified by
  alarms                                     trust         multi-sensor +        FAR
                                                           seasonal model gating 

  Synthetic-data   Med         High          Overstated    Report only           Low if framed
  optimism                                   performance   methodology/ranking   honestly
                                                           claims; calibrate to  
                                                           InSAR; pilot proposed 

  LoRa airtime     Med         Med           Reduced       Clustered-star,       Low
  limits at scale                            cadence /     adaptive cadence,     
                                             coverage      more gateways         

  GNSS reference   Low-Med     Med           Array anchor  Siting, averaging,    Low
  errors                                     bias          plausibility checks,  
  (multipath)                                              redundancy            

  Gateway single   Med         Low-Med       Local         Peer-gateway          Low-Med
  point of failure                           monitoring    adoption; heartbeat → 
                                             gap           WATCH + operator      
                                                           alert; buffered nodes 

  Power outage in  Med         Med           Nodes go dark Battery sizing,       Low
  monsoon                                                  graceful cadence      
                                                           reduction, "going     
                                                           dark" message, map    
                                                           flag                  

  Security: node   Med         Low           Manipulated   AES + counters +      Low
  spoofing                                   readings      spatial/physical      
                                                           plausibility +        
                                                           consensus             

  Novelty          Low         Med           Weaker        Honest combinational  Low
  challenged       (safety) /                innovation    framing; complete     
                   Med                       score         patent search before  
                   (scoring)                               claims                

  Threshold        Med         Med           Wrong alarm   Multi-source          Med until
  miscalibration                             rate          derivation;           field data
                                                           stakeholder-tuned     
                                                           operating point;      
                                                           post-deployment       
                                                           recalibration         

  Team over-scopes Med         Med           Nothing fully Freeze scope to       Low with
  build                                      validated     Section 40; ablation  discipline
                                                           proves what matters   
  ---------------------------------------------------------------------------------------------

**Statement to judges:** *"We do not claim zero disadvantages. Every
known limitation above has been identified, its severity and probability
estimated, and either mitigated or explicitly bounded. The residual
risks are stated, not hidden."*

------------------------------------------------------------------------

## 44. Final Recommendation

Build the **Section 40 SIH prototype**: a \~10-node low-cost surface
sensor array (MEMS tilt + vibration + crackmeters + a few RTK-GNSS
anchors) on a physical subsidence-simulator rig, feeding a solar
Raspberry-Pi gateway that runs a **baseline-first, edge, offline-first**
pipeline --- sensor-health screening → health-weighted fusion →
spatial-consensus analytics → robust + Isolation-Forest anomaly
detection → Holt/ARIMA/XGBoost forecasting with conformal intervals →
transparent weighted risk engine → persistence-and-consensus-gated
NORMAL/WATCH/WARNING/CRITICAL warnings with SHAP explanations →
Leaflet/MapLibre GIS + siren/SMS. Validate with the 11 scripted
scenarios and the Section 29 matrix, run the Section 30 ablation, and
report every metric with confidence intervals and stated limitations.

**Distinguish clearly, always:** - **Scientifically established:**
subsidence mechanism and trough geometry; InSAR-measured Indian
coalfield subsidence rates; LoRa+MEMS viability for geohazard EWS;
walk-forward validation and conformal prediction as correct
methodology. - **Experimentally demonstrated (by this project):**
detection latency, false-alarm/miss rates, forecast skill vs. baseline,
fault-vs-movement discrimination, offline behaviour --- **on a lab rig
and simulation**, not the field. - **Proposed engineering design:** the
clustered-star architecture, risk-engine weighting, warning state
machine, sensor-health taxonomy. - **Future work:** field pilot with
CMPDI/CIMFR/IIT-ISM, vibrating-wire instrument upgrade, GNN
spatio-temporal model, full 3D digital twin, micro-seismic integration,
formal patent filing.

------------------------------------------------------------------------

## 45. Sources & Evidence

**Indian coalfield subsidence --- peer-reviewed (accessed via search,
2026-09):** - Surface deformation monitoring of Raniganj coalfield,
India, using advanced InSAR and DGPS --- *Geomatics, Natural Hazards and
Risk*, 15(1), 2024.
https://www.tandfonline.com/doi/full/10.1080/19475705.2024.2375546 ---
**\[VF\]** Sentinel-1 2017--2023; max subsidence rate ≈ −21.18 mm/yr. -
Comprehensive Assessment of Ground Deformation ... Jeenagora Opencast,
Jharia Coalfield Using PS-InSAR --- *Natural Resources Research*, 2025.
https://link.springer.com/article/10.1007/s11053-025-10584-w ---
**\[VF\]** - SBAS-InSAR analysis of regional ground deformation
accompanying coal fires in Jharia Coalfield, India --- *Geocarto
International*, 2023.
https://www.tandfonline.com/doi/full/10.1080/10106049.2023.2167004 ---
**\[VF\]** coal-fire/subsidence confound. - Underground burning of
Jharia coal mine (India) and associated surface deformation using InSAR
--- *Int. J. Applied Earth Obs. Geoinformation*, 2021.
https://www.sciencedirect.com/science/article/pii/S0303243421002312 ---
**\[VF\]** - Line-of-sight and ground velocity distributions, East
Jharia coalfield --- *ScienceDirect*, 2024.
https://www.sciencedirect.com/science/article/abs/pii/S2352938524003100
--- **\[VF\]** localized rates \~80--\>120 mm/yr reported in Jharia
benches/dumps. - Geology, structure and tectonics of the Jharia
coalfield --- 3D model --- *ScienceDirect (Tectonophysics)*.
https://www.sciencedirect.com/science/article/abs/pii/0016714279900255
--- **\[VF\]** geological context.

**Regulatory / institutional:** - Directorate General of Mines Safety
--- Major Initiatives for OSH in Mines (Ministry of Mines PPT).
https://mines.gov.in/admin/storage/ckeditor/DAY_2_PPT_18_1737544792.pdf
--- **\[VF\]** DGMS mandate. - BCCL Akashkinaree blasting suspension
after DGMS safety-review directive --- news (Sahi).
https://www.sahi.com/news/bharat-coking-coal-suspends-new-akashkinaree-blasting-operations-after-dgms-safety-review-directive-6087636-PE1\_
--- **\[RF, secondary\]** DGMS-directed operational halt example. - DGMS
Rules and Regulations guide --- Mining Gyan.
https://mininggyan.com/blog/dgms-rules-and-regulations/ --- **\[RF,
secondary\]** Mines Act 1952 / Coal Mines Regulations 2017 overview. -
DGMS Compliance for Mining Operations in India --- iCeipts.
https://iceipts.com/blog/dgms-compliance-mining-operations-india-guide
--- **\[RF, secondary\]**

**Low-cost IoT / LoRa geohazard early warning --- peer-reviewed:** -
Internet of Things Geosensor Network for Cost-Effective Landslide Early
Warning Systems --- *Sensors* 21(8):2609, 2021.
https://www.mdpi.com/1424-8220/21/8/2609/htm --- **\[VF\]** LoRa+MEMS
cost-effective EWS; SIGMA decisional method reduced false warnings
70→38. - Design of a Low-Cost and Low-Power LoRa-Based IoT System for
Rockfall and Landslide Monitoring --- *Designs* 9(6):144, 2025.
https://www.mdpi.com/2411-9660/9/6/144 --- **\[VF\]** ESP32 + SX1276 +
triaxial MEMS + GPS node. - Real-Time Monitoring System of Landslide
Based on LoRa Architecture --- *Frontiers in Earth Science*, 2022.
https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2022.899509/full
--- **\[VF\]** - IoT-Based Geotechnical Monitoring of Unstable Slopes
for Landslide Early Warning in the Darjeeling Himalayas --- *Sensors*,
2020. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7273224/ ---
**\[VF\]** Indian field deployment, low-cost tilt + moisture. -
Development and Deployment of IoT-Based Early Warning System for
Rainfall-Induced Landslides ... Surface and Subsurface Sensors ---
*Applied Sciences* 16(12):5738.
https://www.mdpi.com/2076-3417/16/12/5738 --- **\[VF\]** - LoRa-Based
Wireless Sensors Network for Rockfall and Landslide Monitoring:
Pantelleria Island --- *J. Low Power Electronics and Applications*
12(3):47. https://www.mdpi.com/2079-9268/12/3/47 --- **\[VF\]** -
Adaptive landslide monitoring in WSN using FLPSO-based MIP systems ---
*ScienceDirect*, 2025.
https://www.sciencedirect.com/science/article/pii/S2590123025004104 ---
**\[RF\]** - LoRa Based Metrics Evaluation for Real-Time Landslide
Monitoring on IoT Platform --- ResearchGate/conference.
https://www.researchgate.net/publication/360127891 --- **\[RF\]**

**AI / physics-informed deformation forecasting --- peer-reviewed /
preprint:** - A Generative Augmentation and Physics-Informed Network for
Interpretable Prediction of Mining-Induced Deformation from InSAR Data
--- *Remote Sensing* 18(7):987, 2025. https://doi.org/10.3390/rs18070987
--- **\[VF\]** TCN-TimeGAN + physics-informed KAN,
subsidence-consistency priors, temporal attribution. - Deep
learning-based InSAR time-series deformation prediction in coal mine
areas --- *Geo-spatial Information Science*, 2025.
https://www.tandfonline.com/doi/full/10.1080/10095020.2025.2500521 ---
**\[VF\]** - Physics-informed machine learning in geotechnical
engineering: a direction paper --- *Georisk*, 2025.
https://www.tandfonline.com/doi/full/10.1080/17486025.2025.2502029 ---
**\[VF\]** - Physics-Informed Graph Neural Network for Spatial-temporal
Production Forecasting --- arXiv:2209.11885.
https://arxiv.org/pdf/2209.11885 --- **\[RF\]** PI-GNN
efficiency/interpretability. - PINN model for predicting subgrade
settlement induced by shield tunnelling --- *Underground Space*, 2024.
https://www.sciencedirect.com/science/article/abs/pii/S2214391224002307
--- **\[VF\]** - Machine Learning with Physics Knowledge for Prediction:
A Survey --- arXiv:2408.09840. https://arxiv.org/pdf/2408.09840 ---
**\[RF\]** - Prediction of Surface Subsidence in Mining Areas Based on
Ascending--Descending SBAS-InSAR and Neural Network Optimization ---
*Sensors*, 2024. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11314687/
--- **\[VF\]** - Integrated high-precision monitoring for surface
subsidence using D-InSAR, SBAS, and UAV --- *PMC11143354*, 2024.
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11143354/ --- **\[VF\]**
multi-technique fusion precedent.

**Patents:** - US 11,060,402 B2 --- Method for classifying phreatic
leakage disaster level in shallow coal seam mining.
https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11060402
--- **\[VF\]** evidence that coal-mine geohazard classification methods
are patented; illustrates active IP space.

**Evidence gaps explicitly flagged \[UI\]:** - National
subsidence-incident casualty/loss statistics for Indian underground coal
mines --- not established here; pull from DGMS annual reports / Lok
Sabha answers before citing. - Specific current CIL/CMPDI/SCCL
surface-subsidence IoT projects --- exist in various forms but not
verified in this pass; do not cite specifics without a primary source. -
Exact commercial prices of robotic total station / vibrating-wire /
micro-seismic systems --- not quoted; use "substantially higher per unit
coverage" qualitatively unless the team obtains real quotes. - Standard
subsidence parameters (angle of draw, subsidence factor) for *specific*
Indian seams --- use ranges from literature and fit from the rig; do not
present a single value as fact.

------------------------------------------------------------------------

------------------------------------------------------------------------

## Appendix A --- Final Decision Summary (quick reference)

### THE ONE-SENTENCE FINAL CONCEPT

A low-cost, solar-powered surface sensor array (MEMS tilt + vibration +
crack gauges, anchored by a few RTK-GNSS nodes) over active and legacy
coal panels, linked by clustered-star LoRa to an edge gateway that
performs sensor-health screening, health-weighted fusion,
neighbour-consensus spatial analytics, baseline-first anomaly detection
and deformation forecasting with conformal uncertainty, and
persistence-and-consensus-gated multi-level early warnings with
explanations --- operating fully offline and treating missing data as
elevated caution, never as safe.

### THE FINAL TECHNOLOGY STACK

ESP32 nodes · MEMS inclinometer/accelerometer + on-node temperature
compensation · draw-wire crackmeters (subset) · RTK-GNSS reference nodes
(few) · private clustered-star LoRa 865--867 MHz + 4G gateway uplink
with store-and-forward · Raspberry Pi edge gateway · Mosquitto MQTT ·
Python/FastAPI · SQLite (edge) + TimescaleDB + PostGIS (server) ·
Leaflet/MapLibre + GeoJSON GIS · solar + Li-ion power · local siren +
SMS/email alerting · AES-128 + signed OTA.

### THE FINAL ALGORITHM STACK

Complementary/linear Kalman node fusion · rule-based + Isolation-Forest
sensor-health classifier + neighbour-inconsistency test · MAD/Hampel +
CUSUM change-point + Isolation Forest anomaly detection · hand-crafted
spatial-graph features (differential tilt, consensus count,
influence-function residual) · GP/Kriging/IDW interpolation with
predictive variance · Holt/ARIMA + XGBoost forecasting (GRU/TCN only if
it beats baseline beyond bootstrap CI) · conformal prediction intervals
· inverse-velocity auxiliary failure-time estimate (slow signals only) ·
transparent weighted-evidence risk engine · hysteresis warning state
machine · SHAP explanations.

### THE TOP 5 INNOVATIONS

1.  Sensor-health vs. ground-movement discrimination as a first-class,
    evaluated module (confusion matrix reported).
2.  Spatial-consensus + persistence + multi-sensor warning gating with a
    quantified false-alarm-rate reduction (ablation).
3.  Baseline-first walk-forward validation that reports when the simple
    model wins and defaults to it.
4.  Offline-first fail-safe warning logic where absence of data raises
    caution and is never rendered as normal.
5.  Physics forward-model (influence/profile function) residual used as
    an interpretable anomaly feature.

### THE TOP 5 TECHNICAL RISKS & MITIGATIONS

1.  No-precursor sudden collapse missed → scope claim to
    progressive/creep subsidence; pair with void mapping +
    rain-triggered watch in real deployments; bounded, not eliminated.
2.  MEMS drift → temperature compensation + drift detector + GNSS
    re-anchoring + differential features + recal schedule.
3.  Environmental (monsoon/thermal) false alarms → common-mode
    rejection + seasonal model + consensus/persistence gating; FAR
    quantified.
4.  Synthetic/lab-only validation → claim methodology and model ranking
    only; calibrate simulation to InSAR rates; propose field pilot.
5.  LoRa airtime limits at scale → clustered-star topology + adaptive
    event-triggered cadence + additional gateways.

### THE TOP 10 JUDGE QUESTIONS

See Section 41 for the full list with evidence-based answers: (1) "just
a landslide network?" (2) can cheap MEMS see subsidence? (3) subsidence
vs. noise separation (4) synthetic-data accuracy (5) why not InSAR (6)
why not GNN/transformer (7) sensor fails during an event (8) no-internet
behaviour (9) false-alarm control (10) is any of it novel.

------------------------------------------------------------------------

## Appendix B --- Ultra-Low-Cost Build (cost-optimised for SIH 2026)

**Goal:** cut the prototype from ₹70k--1.6L down to **≈ ₹10,000--18,000
total**, and drive the *defensible field* cost to **≈ ₹1,000--2,500 per
node**, without breaking the science. Judges reward **cost per unit area
monitored** and **scalability**, not the lowest gadget price --- so
every cut below is justified, and the reliability trade-off is stated.

### B.1 The five cost killers (and why each is safe to cut for the prototype)

  -----------------------------------------------------------------------------------------------
  Cut              Was              Now               Saving             Trade-off / honesty
  ---------------- ---------------- ----------------- ------------------ ------------------------
  **Drop RTK-GNSS  ₹12k--30k each   One ordinary node \~₹25k--60k        System becomes
  reference                         on stable                            **relative-deformation
  nodes**                           off-panel ground                     only** (fine --- that is
                                    as a                                 what detects
                                    **differential                       troughs/creep). Absolute
                                    (relative)                           drift of the whole array
                                    baseline**;                          is caught by the fixed
                                    absolute check by                    reference + periodic
                                    occasional                           manual survey. GNSS =
                                    dumpy-level or                       **field upgrade, not
                                    phone survey                         prototype need**.

  **No 8-channel   ₹8k--10k gateway Single **Ra-02 /  \~₹8k              Single-channel handles
  LoRa             HAT              Ra-01 (SX127x)                       \~10--30 low-cadence
  concentrator**                    module (\~₹200)**                    nodes easily.
                                    on the edge                          Multi-channel gateway is
                                    device                               a **scale-up item**.

  **Edge on        Raspberry Pi 4   Team **laptop**   \~₹4k--6k          Laptop isn't field
  hardware you     (₹5k--7k)        as edge server +                     hardware --- but the
  already own**                     a ₹300 ESP32 or                      *pipeline* is identical;
                                    ₹1,700 Pi Zero 2                     for the field pilot swap
                                    W as LoRa bridge                     in a Pi Zero 2 W
                                                                         (₹1,700) or Pi 4.
                                                                         Demonstrate the pipeline
                                                                         runs in \<100 MB RAM to
                                                                         prove Pi-class
                                                                         feasibility.

  **Minimal sensor inclinometer +   **One             \~₹300--500/node   Dedicated inclinometers
  set**            accel +          MPU6050/MPU9250                      are more stable --- but
                   crackmeter + RH  (\~₹90--160)**                       MPU6050 + temperature
                   per node         does tilt *and*                      compensation +
                                    vibration;                           quiet-window averaging
                                    crackmeter only                      is adequate for a
                                    on 2 nodes; **one                    screening demo and is
                                    temp+RH sensor                       the honest "low-cost"
                                    per cluster**,                       story.
                                    not per node                         

  **Cheap power &  Li-ion pack +    1× **18650 +      \~₹400--700/node   PVC/junction boxes are
  enclosure**      IP66 box         TP4056                               not IP66-certified.
                                    (\~₹230)** +                         State: "field version
                                    **1--2 W solar                       uses IP66 enclosures
                                    (\~₹150)** +                         (\~₹150--300)".
                                    **PVC pipe / ₹50                     
                                    junction box**;                      
                                    or USB power                         
                                    banks for the                        
                                    indoor demo                          
  -----------------------------------------------------------------------------------------------

### B.2 Ultra-low-cost node BOM (indicative India retail, single units; cheaper in bulk) **\[EV\]**

  -----------------------------------------------------------------------
  Component               Purpose                 Approx ₹
  ----------------------- ----------------------- -----------------------
  ESP32 DevKit (or bare   MCU + processing +      250--350
  ESP32-WROOM in bulk)    radio driver            

  MPU6050 (6-axis) ---    tilt + vibration        90--160
  *MPU9250 if                                     
  magnetometer wanted*                            

  Ra-02 (SX1278, 433 MHz) LoRa link               180--260
  or Ra-01 --- *use                               
  865--867 MHz module                             
  where available for                             
  India ISM*                                      

  DS18B20 / on-board temp MEMS temperature        40--70
                          compensation            

  TP4056 charge module +  battery charging        15--25
  protection                                      

  18650 Li-ion cell (new) energy store            180--260

  5 V 1--2 W solar panel  harvesting              120--200

  PVC pipe cap / small    enclosure + mount       40--90
  junction box + gland                            

  Headers, wire, screws,  assembly                80--150
  silica gel,                                     
  PCB/perfboard                                   

  **Node subtotal**                               **≈ ₹1,000--1,700**

  Crack add-on (2 nodes): direct crack-opening    +120--250
  10-turn linear pot                              
  **or** soft-pot +                               
  string + pulley +                               
  spring                                          
  -----------------------------------------------------------------------

### B.3 Full prototype bill of materials **\[EV\]**

  ----------------------------------------------------------------------------------
  Item                        Qty               Unit ₹            Line ₹
  --------------------------- ----------------- ----------------- ------------------
  Standard sensor nodes       8                 1,350             10,800

  Crack-node add-ons          2                 200               400

  Fixed reference node (same  included in the 8 ---               ---
  as standard)                                                    

  Edge/LoRa bridge: ESP32     1                 300               300
  (laptop = edge server)                                          

  *Optional* Pi Zero 2 W + SD 1                 2,100             2,100 (optional)
  (to show field-grade edge)                                      

  Cluster environment sensor  1                 250               250
  (BME280)                                                        

  Buzzer/siren + relay +      1                 450               450
  spare GSM SIM800L (SMS)                                         

  Subsidence rig: box, sand,  1                 700               700
  threaded-rod/scissor-jack                                       
  plate lowering, removable                                       
  supports                                                        

  Ground-truth: dial gauge    1                 450               450
  (or reuse team calipers) +                                      
  small vibration motor                                           

  Consumables: solder,        ---               ---               1,500
  heat-shrink, jumper sets,                                       
  tape, spare modules                                             

  **Prototype total (without                                      **≈ ₹15,300**
  optional Pi)**                                                  

  **Lean version:** 6 nodes +                                     **≈
  power banks (no                                                 ₹8,500--10,000**
  solar/batteries) + no GSM                                       
  ----------------------------------------------------------------------------------

### B.4 Cost-per-area story for the pitch **\[EV --- assumptions stated\]**

-   **Field node, screening-grade, installed:** BOM ₹1,000--2,500 + IP66
    box ₹200 + concrete pad/pole + labour ₹1,500--4,000 → **≈
    ₹3,000--8,000/node installed**.
-   **Cluster gateway (field):** Pi Zero 2 W + single-channel LoRa + 4G
    dongle + 20 W solar + battery + cabinet → **≈ ₹8,000--20,000**
    (vs. ₹40k--1.2L for a full multi-channel solar station).
-   **Per panel (\~0.25--0.5 km²), 20 nodes + 1 gateway,
    relative-only:** **≈ ₹1.0--2.2 lakh capex**, maintenance ₹0.3--0.8
    lakh/yr.
-   **Cost per monitored area:** **≈ ₹3--8 lakh/km²** for continuous
    screening --- the headline number to compare against
    robotic-total-station networks and recurring specialist InSAR
    processing (qualitatively far higher per km² of *continuous,
    on-site, real-time* coverage; **do not quote a competitor price
    without a real quote --- \[UI\]**).

### B.5 Design-for-cost principles (state these as deliberate engineering choices)

1.  **Relative-first measurement** --- differential tilt/strain between
    neighbours needs no survey-grade absolute positioning; removes the
    single most expensive component.
2.  **One sensor, two signals** --- the IMU delivers both tilt and
    vibration; no separate vibration sensor.
3.  **Share slow-changing sensors** --- one temperature/humidity/rain
    sensor per cluster, not per node.
4.  **Edge on commodity/existing compute** --- laptop for the demo,
    ₹1,700 Pi Zero 2 W for the field; models kept small enough to prove
    it.
5.  **Single-channel LoRa** until node count per gateway forces an
    upgrade --- scale by adding ₹200 radios and ₹2k gateways, not ₹10k
    concentrators.
6.  **Open-source everything** --- ESP-IDF/Arduino, Python,
    scikit-learn/XGBoost, SQLite, Leaflet, PostGIS: ₹0 licensing.
7.  **Rechargeable + tiny solar** sized only for the real cadence (slow
    in NORMAL, fast only in event mode) --- smaller panel, smaller cell.
8.  **Repairable, standard parts** --- every module is a ₹50--300
    commodity a technician can swap; no proprietary spares.
9.  **Bulk-buy bare modules** --- ESP32-WROOM + SX1278 bare modules
    roughly halve per-node cost at 100+ units.

### B.6 What you must NOT cut (safety-critical, low or zero cost anyway)

-   **Temperature compensation** for the MEMS (₹40 sensor + software)
    --- without it the "low-cost sensor" story collapses under thermal
    drift.
-   **Sensor-health module** (software only, ₹0) --- the main
    credibility differentiator.
-   **Spatial-consensus + persistence gating** (software only, ₹0) ---
    this is what keeps false alarms down on cheap sensors.
-   **Offline-first logic** (software only, ₹0).
-   **Stable mounting** to competent ground (₹50--200 of pad/post) --- a
    wobbly mount destroys data quality regardless of sensor price.

### B.7 Revised headline for the deck

> **Prototype BOM ≈ ₹15,000 (lean ≈ ₹9,000). Field screening node ≈
> ₹1,000--2,500 (BOM). Continuous, real-time, offline-capable panel
> coverage at an estimated ₹3--8 lakh/km² --- one to two orders of
> magnitude below equivalent-coverage automated survey or specialist
> instrumentation, achieved by measuring *relative* deformation with
> commodity MEMS and pushing all intelligence to open-source edge
> software.**

------------------------------------------------------------------------

## Appendix C --- Overall Final Budget (single consolidated figure)

**All figures indicative India retail, single-unit; \~30--50% lower at
100+ unit bulk. \[EV\]**

  -----------------------------------------------------------------------------------
  \#                Category            Detail                      Amount ₹
  ----------------- ------------------- --------------------------- -----------------
  1                 Sensor nodes        8 × standard node @ ₹1,350  10,800
                                        (ESP32 + MPU6050 + Ra-02    
                                        LoRa + DS18B20 + TP4056 +   
                                        18650 + 1--2 W solar +      
                                        enclosure + assembly)       

  2                 Crack sensing       2 × crack add-on (10-turn   400
                                        pot / soft-pot + string +   
                                        pulley + spring)            

  3                 Edge + LoRa bridge  Raspberry Pi Zero 2 W + 32  2,100
                                        GB SD + supply (field-grade 
                                        edge; laptop also usable)   

  4                 LoRa bridge radio   Ra-02 module for the        220
                                        gateway                     

  5                 Cluster environment BME280                      250
                    sensor              (temp/humidity/pressure)    

  6                 Alerting            Buzzer + relay + SIM800L    500
                                        GSM (SMS) + spare SIM       

  7                 Subsidence demo rig Box, sand,                  700
                                        threaded-rod/scissor-jack   
                                        plate-lowering mechanism,   
                                        removable supports          

  8                 Ground truth        Dial gauge + small          450
                                        vibration motor (or reuse   
                                        team calipers)              

  9                 Consumables         Solder, perfboard/PCB,      1,500
                                        headers, jumpers,           
                                        heat-shrink, silica gel,    
                                        tape, glands                

  10                Shipping / handling Module orders, local        800
                                        courier                     

  11                Failure buffer      \~12% for burnt ESP32s /    2,200
                                        dead cells / fried LoRa     
                                        modules during dev          

  12                Demo/presentation   HDMI cable, USB hub, small  600
                                        tripod/stand, printed       
                                        layout                      

                    **OVERALL FINAL                                 **≈ ₹20,500**
                    BUDGET                                          
                    (Recommended)**                                 
  -----------------------------------------------------------------------------------

### Budget tiers

  -------------------------------------------------------------------------
  Tier                      What it covers          Total ₹
  ------------------------- ----------------------- -----------------------
  **Lean / minimum viable** 6 nodes, USB power      **≈ ₹9,000--11,000**
                            banks (no               
                            solar/battery), laptop  
                            as edge (no Pi), no GSM 
                            (dashboard + buzzer     
                            only), cardboard rig    

  **Recommended (full demo, Table above --- 8       **≈ ₹20,000--22,000**
  field-representative)**   nodes + 2 crack nodes,  
                            solar+battery, Pi Zero  
                            2 W edge, GSM SMS,      
                            proper rig, buffers     

  **Comfortable (no supply  Recommended + 2 spare   **≈ ₹28,000--32,000**
  worries)**                nodes + spare Pi +      
                            extra cells/solar +     
                            larger consumables      
                            stock                   
  -------------------------------------------------------------------------

### Not included (call out to mentors / college)

-   Team laptop(s) for development and as edge server --- assumed
    already owned.
-   3D printing / lab-tool access (soldering station, multimeter,
    oscilloscope) --- assumed from college lab.
-   Travel, accommodation, and stall/poster costs for the SIH grand
    finale --- separate from the product budget.
-   Any field-pilot / DGMS-grade hardware (vibrating-wire sensors,
    RTK-GNSS, IP66-certified enclosures, borehole work) --- **future
    work, not in the SIH budget.**

### One-line answer

> **Overall final SIH build budget ≈ ₹20,000 (recommended),
> ₹9,000--11,000 (lean), ₹30,000 (with full spares). Everything above is
> commodity, open-source, and repairable with ₹50--300 parts.**

------------------------------------------------------------------------

## Appendix D --- Sub-₹10,000 Build (hard budget cap)

**Total ≈ ₹9,000. Every rupee justified; every sacrifice stated.
\[EV\]**

### D.1 What changes vs. Appendix B/C (and why it's still defensible)

  -----------------------------------------------------------------------
  Change                  Reason                  Honest trade-off / how
                                                  to defend it
  ----------------------- ----------------------- -----------------------
  **6 nodes** (not 10)    Cost                    Enough for a spatial
                                                  array: 1 over the
                                                  void + 4--5 in a ring.
                                                  Ablation still works.

  **ESP-NOW (built-in 2.4 LoRa modules ×7 ≈       ESP-NOW is a real
  GHz) as the demo        ₹1,500                  low-power peer
  transport** + **one                             protocol, perfect for
  Ra-02 LoRa pair as a                            the tabletop rig. Say:
  link proof-of-concept**                         *"Field version uses
                                                  LoRa 865--867 MHz; we
                                                  validated the LoRa
                                                  node↔gateway link
                                                  separately (2-node
                                                  range/PDR test) and ran
                                                  the rig on ESP-NOW."*
                                                  Judges accept this.

  **MPU6050 internal      Drops the DS18B20 (₹50  Slightly noisier temp
  temperature register**  × 6)                    reference; adequate for
  for compensation                                demo compensation.

  **Laptop = edge         Drops the Pi (₹2,100)   Show `htop` proving the
  server** (team-owned)                           pipeline uses \<100 MB
                                                  RAM / \<15% CPU → "runs
                                                  on a ₹1,700 Pi Zero 2 W
                                                  in the field."

  **2 nodes               Full battery kit ×6 ≈   The 2 solar nodes
  battery+solar, 4 nodes  ₹1,600                  demonstrate autonomy;
  on a USB hub**                                  the other 4 are powered
                                                  for the indoor demo.
                                                  State it plainly.

  **Telegram bot / email  Drops ₹450              Laptop has internet at
  alerts** (free API)                             the venue; the *alert
  instead of **GSM                                logic* is identical.
  SIM800L**                                       GSM SMS is a ₹450 field
                                                  add-on.

  **Reuse college lab     ---                     Soldering iron,
  tools + team calipers**                         multimeter, calipers
                                                  assumed available. Buy
                                                  one ₹300 dial gauge
                                                  only if no calipers.
  -----------------------------------------------------------------------

### D.2 Sub-₹10k Bill of Materials

  -------------------------------------------------------------------------------
  \#             Item                Qty            Unit ₹         ₹
  -------------- ------------------- -------------- -------------- --------------
  1              ESP32 dev board     7              250            1,750
                 (node + 1 gateway)                                

  2              MPU6050 (6-axis,    6              100            600
                 has temp register)                                

  3              Ra-02 SX1278 LoRa   2              220            440
                 module (link                                      
                 proof-of-concept                                  
                 pair: 1 node +                                    
                 gateway)                                          

  4              Crack sensor:       1              120            120
                 10-turn linear                                    
                 pot + string +                                    
                 pulley + spring (1                                
                 node)                                             

  5              18650 cell +        2              260            520
                 TP4056 + holder                                   
                 (autonomy demo                                    
                 nodes)                                            

  6              5 V 1--2 W solar    2              150            300
                 panel (autonomy                                   
                 demo nodes)                                       

  7              USB powered hub (4  1              300            300
                 mains-powered                                     
                 nodes)                                            

  8              Enclosure: PVC      6              40             240
                 end-cap / small                                   
                 clear box + mount                                 

  9              Coin vibration      1              40             40
                 motor (scenario 6)                                

  10             Buzzer + small      1              60             60
                 relay (local alarm)                               

  11             Subsidence rig:     1              400            400
                 box + sand +                                      
                 threaded-rod/mini                                 
                 scissor-jack                                      
                 plate + removable                                 
                 supports + bolts                                  

  12             Dial gauge for      1              300            300
                 ground truth (skip                                
                 if team has                                       
                 calipers)                                         

  13             Consumables:        ---            ---            1,300
                 breadboards, jumper                               
                 sets, perfboard,                                  
                 solder, headers,                                  
                 hookup wire,                                      
                 heat-shrink, silica                               
                 gel                                               

  14             Shipping / courier  ---            ---            400
                 (combine all                                      
                 orders)                                           

  15             Failure buffer      ---            ---            1,150
                 (\~13%: burnt ESP32                               
                 / dead cell / fried                               
                 LoRa)                                             

                 **TOTAL**                                         **≈ ₹9,010**
  -------------------------------------------------------------------------------

*Drop item 12 (use calipers) and buy bare ESP32-WROOM modules in a
10-pack → total falls to ≈ ₹7,800.*

### D.3 Per-member allocation (sub-₹10k)

  -----------------------------------------------------------------------------
  Member            Role              Buys                    ₹
  ----------------- ----------------- ----------------------- -----------------
  **1**             Hardware / Node   7 × ESP32 (1,750), 6 ×  **3,810**
                                      enclosure (240), 2 ×    
                                      (18650+TP4056+holder)   
                                      (520), 2 × solar (300), 
                                      USB hub (300), share of 
                                      consumables (700)       

  **2**             Firmware / Comms  2 × Ra-02 LoRa (440),   **840**
                                      antennas + pigtails     
                                      (200), extra            
                                      wire/jumpers (200)      

  **3**             Edge / Backend    --- uses team laptop;   **0**
                                      helps M1 with           
                                      consumables if needed   

  **4**             AI / ML           6 × MPU6050 (600),      **760**
                                      crack pot +             
                                      string/pulley (120),    
                                      coin vibration motor    
                                      (40)                    

  **5**             GIS / Frontend +  Dial gauge (300),       **360**
                    Validation        buzzer + relay (60)     

  **6**             Domain / Rig +    Rig materials (400),    **1,200**
                    Presentation      printing/poster (400),  
                                      shipping (400)          

  ---               **Shared pool**   Failure buffer + spare  **1,150 + \~700**
                    (held by Member   headers/solder          
                    1)                                        

                                      **Total**               **≈ ₹9,000**
  -----------------------------------------------------------------------------

### D.4 Rules to stay under ₹10,000

1.  **One combined order** --- pick one distributor, one shipment;
    splitting orders wastes ₹300--600 in shipping.
2.  **Bare modules in multi-packs** --- ESP32-WROOM 5-/10-packs and
    MPU6050 5-packs are \~35% cheaper per unit.
3.  **Borrow, don't buy** tools --- soldering station, multimeter, bench
    supply, calipers from the college lab.
4.  **Software is ₹0** --- ESP-IDF/Arduino, Python, scikit-learn,
    XGBoost, SQLite, Leaflet, PostGIS, Telegram Bot API.
5.  **Buffer is not for scope creep** --- it only replaces dead parts.
    If unused, it stays unspent.
6.  **Field upgrades are a slide, not a purchase** --- LoRa fleet, Pi
    Zero, GSM, solar on every node, IP66 boxes, RTK-GNSS: all shown as
    "₹X to productionise," none bought now.

### D.5 One-line answer

> **Full working SIH prototype for ≈ ₹9,000 (₹7,800 if you use bare
> modules and skip the dial gauge): 6 MEMS nodes + ESP-NOW mesh + one
> LoRa link proof + laptop edge + subsidence rig, running the complete
> sensor-health → fusion → anomaly → forecast → warning → GIS pipeline.
> LoRa/Pi/GSM/solar-everywhere are costed field upgrades, not prototype
> spend.**

------------------------------------------------------------------------

### Evidence-tag legend

**\[VF\]** Verified fact (primary/peer-reviewed) · **\[RF\]** Research
finding (may be context-specific) · **\[EA\]** Engineering assumption ·
**\[PA\]** Prototype assumption · **\[EV\]** Estimated value ·
**\[UI\]** Uncertain / insufficient evidence

*All quantitative targets in this document are design targets to be
measured, not performance guarantees. This system performs anomaly
detection, deformation forecasting, and risk estimation with quantified
uncertainty and warning lead time; it does not and cannot guarantee
prediction of sudden, precursor-free ground failure.*

# APPENDIX B --- MASTER RESEARCH/REQUIREMENTS PROMPT USED FOR THE PROJECT

use this prompt also for better 99 + accuracy : \# MASTER 360° RESEARCH
& SOLUTION DEVELOPMENT PROMPT

## SIH 2026 --- Problem Statement 26025

### AI-ENABLED LOW-COST REAL-TIME MINE SUBSIDENCE MONITORING, PREDICTION & EARLY WARNING SYSTEM FOR UNDERGROUND COAL MINES IN INDIA

------------------------------------------------------------------------

# ROLE

Act as a multidisciplinary expert team consisting of:

-   Senior mining engineer
-   Geotechnical/mining subsidence researcher
-   Underground coal-mining safety specialist
-   Geological engineer
-   AI/ML researcher
-   Time-series forecasting researcher
-   Sensor-fusion specialist
-   IoT engineer
-   Wireless mesh-network architect
-   Embedded systems engineer
-   Edge-AI engineer
-   GIS/geospatial scientist
-   Backend/cloud architect
-   Cybersecurity engineer
-   Safety-critical systems engineer
-   Product architect
-   Technology commercialization expert
-   Patent/prior-art researcher
-   Indian mining-domain researcher
-   Smart India Hackathon evaluator
-   Startup/product strategist

Your job is to perform a **360-degree research, engineering, validation,
innovation, product, feasibility, and competition analysis** for SIH
2026 Problem Statement 26025.

------------------------------------------------------------------------

# OFFICIAL PROBLEM STATEMENT

**Problem Statement ID:** 26025

**Title:**

> Development of an AI-enabled Low Cost Real Time Mine Subsidence
> Monitoring, Prediction and Early Warning System for Underground Coal
> Mines in India

The problem concerns surface subsidence caused by underground coal
mining, which creates risks to:

-   Nearby communities
-   Public infrastructure
-   Agricultural land
-   Forest areas
-   Environment
-   Mine operations
-   Safety

The proposed direction involves:

-   Low-cost surface sensor nodes
-   Tilt/inclination sensing
-   Vibration sensing
-   Displacement/stretch sensing
-   Crack detection
-   Optional positioning
-   Wireless mesh communication
-   AI/ML
-   Real-time monitoring
-   Subsidence prediction
-   GIS visualization
-   Early warning
-   Offline capability
-   Low-power operation
-   Scalability

A key proposed innovation direction is:

> **Distributed Wireless Surface Mesh Network for Real-Time Subsidence
> Detection**

------------------------------------------------------------------------

# PRIMARY OBJECTIVE

Do NOT simply generate an attractive AI + IoT project.

Determine what solution is:

**Scientifically defensible + technically correct + experimentally
testable + low cost + real time + reliable + explainable + scalable +
maintainable + future-proof + suitable for Indian underground coal
mines + genuinely innovative + demonstrable by students + valuable to
real users.**

The research must answer:

> **Why should this solution exist?**

> **Why does the problem still exist?**

> **Why are current approaches insufficient?**

> **What exactly is new?**

> **Can it actually work?**

> **How can we prove that it works?**

> **Can the same product remain useful for 5--10 years through
> upgrades?**

> **Why should an SIH evaluator shortlist it?**

------------------------------------------------------------------------

# PART 1 --- DEEPLY UNDERSTAND THE PROBLEM

Explain mine subsidence from first principles.

Research:

-   What mine subsidence is
-   Causes
-   Physical mechanisms
-   Underground-to-surface deformation
-   Subsidence trough
-   Vertical displacement
-   Horizontal displacement
-   Tilt
-   Strain
-   Cracking
-   Vibration
-   Gradual deformation
-   Sudden ground failure
-   Subsidence progression
-   Factors affecting subsidence

Investigate the relationship:

**Mining activity → underground deformation → overburden response →
surface deformation → sensor observations → risk → warning**

Clearly state what can realistically be detected or inferred from
surface sensing.

------------------------------------------------------------------------

# PART 2 --- WHO HAS THE PROBLEM?

Identify every important stakeholder.

Research:

-   Mine operators
-   Mining engineers
-   Geotechnical engineers
-   Safety officers
-   Regulators
-   Nearby communities
-   Farmers
-   Infrastructure owners
-   Environmental authorities
-   Emergency responders

For every stakeholder determine:

**Problem → Current method → Missing information → Decision required →
Consequence → Value of early warning**

------------------------------------------------------------------------

# PART 3 --- INDIAN CONTEXT

Focus specifically on India.

Research:

-   Indian coalfields
-   Underground mining practices
-   Geological conditions
-   Seam characteristics
-   Overburden
-   Panel geometry
-   Mining methods
-   Ground conditions
-   Monsoon
-   Rainfall
-   Temperature
-   Soil
-   Infrastructure
-   Connectivity
-   Power
-   Maintenance
-   Remote locations
-   Cost constraints

Explain why a solution designed for India may differ from foreign
solutions.

------------------------------------------------------------------------

# PART 4 --- EXISTING SOLUTIONS

Research conventional, modern and emerging approaches.

### Conventional

-   Manual inspection
-   Levelling
-   Total station
-   GNSS
-   Crack surveys

### Remote sensing

-   InSAR
-   LiDAR
-   UAV
-   Photogrammetry
-   Satellite imagery

### IoT/sensor systems

-   Tilt
-   IMU
-   Accelerometer
-   Vibration
-   Strain
-   Displacement
-   Crack
-   GNSS
-   Environmental sensors

### AI approaches

-   Statistical thresholds
-   Classical ML
-   Deep learning
-   Time-series models
-   Spatial models
-   Graph models
-   Physics-guided ML

Compare:

**Accuracy \| Cost \| Spatial coverage \| Temporal resolution \| Latency
\| Power \| Reliability \| Deployment difficulty \| Expertise \|
Real-time capability \| Limitations**

------------------------------------------------------------------------

# PART 5 --- EXISTING PRODUCTS, RESEARCH & PATENTS

Search deeply for:

-   Research papers
-   Government projects
-   Academic prototypes
-   Commercial monitoring systems
-   Patents
-   Wireless sensor networks
-   AI subsidence systems
-   Real-time deformation monitoring systems

Determine:

### What already exists?

### What is similar?

### What is different?

### What has already been patented?

### What has already been demonstrated?

### What research gaps remain?

Never claim "first," "unique," "world's first," or "patented" without
evidence.

------------------------------------------------------------------------

# PART 6 --- WHY EXISTING SOLUTIONS ARE NOT ENOUGH

Do not simply say:

> "Existing systems are expensive."

Investigate evidence-backed limitations such as:

-   Periodic monitoring
-   Lack of continuous sensing
-   Limited spatial density
-   High cost
-   Manual dependency
-   Communication problems
-   Sensor drift
-   Noise
-   Environmental interference
-   False alarms
-   Missed detections
-   Missing data
-   Cloud dependency
-   Power limitations
-   Maintenance difficulty
-   Lack of sensor fusion
-   Lack of prediction
-   Lack of explainability
-   Lack of uncertainty
-   Poor scalability
-   Limited offline operation

For every limitation:

**Limitation → Evidence → Why it occurs → Consequence → Proposed
mitigation → Validation method**

------------------------------------------------------------------------

# PART 7 --- RESEARCH GAP

Identify the strongest gaps.

Investigate:

-   Low-cost continuous monitoring
-   Dense surface sensing
-   Relative deformation
-   Multi-sensor fusion
-   Wireless mesh
-   Edge AI
-   Early anomaly detection
-   Spatio-temporal modelling
-   Forecasting
-   Uncertainty-aware prediction
-   Sensor-health monitoring
-   Offline-first architecture
-   GIS risk mapping
-   Physics-guided AI
-   Adaptive sensing

Rank each:

**Impact \| Evidence \| Novelty \| Feasibility \| SIH value**

------------------------------------------------------------------------

# PART 8 --- 360-DEGREE SOLUTION ANALYSIS

Analyze the solution from ALL relevant dimensions.

Do not restrict research to AI.

Cover:

### Physical

-   Ground movement
-   Geotechnical conditions
-   Sensor placement
-   Sensor calibration

### Hardware

-   Sensors
-   Microcontrollers
-   Power
-   Enclosure
-   Gateway

### Communication

-   Mesh
-   LoRa
-   LoRaWAN
-   Zigbee
-   Wi-Fi Mesh
-   Other suitable technologies

### Data

-   Collection
-   Cleaning
-   Synchronization
-   Missing data
-   Noise
-   Storage

### AI

-   Anomaly detection
-   Sensor fusion
-   Prediction
-   Risk classification
-   Explainability
-   Uncertainty

### Spatial

-   GIS
-   Deformation maps
-   Risk zones

### Edge

-   Local processing
-   Local AI
-   Local alerts

### Cloud

-   Synchronization
-   Historical analytics
-   Multi-mine management

### Security

-   Authentication
-   Encryption
-   Data integrity

### Human

-   Operator workflow
-   Alerts
-   Decision support
-   Usability

### Economic

-   Cost
-   Maintenance
-   Deployment

### Environmental

-   Power
-   Sustainability
-   Environmental robustness

### Legal/regulatory

-   Mining safety
-   Data requirements
-   Industrial certification
-   Regulatory considerations

### Business

-   Deployment model
-   Customers
-   Maintenance
-   Commercial scalability

### Future

-   5--10 year viability
-   Upgradeability
-   Emerging technology integration

------------------------------------------------------------------------

# PART 9 --- CORE WIRELESS SURFACE MESH INNOVATION

Critically investigate:

> **Distributed low-cost sensor nodes deployed across the surface above
> underground mine panels.**

Nodes may measure:

-   Tilt
-   Displacement
-   Vibration
-   Crack
-   Temperature
-   Optional GNSS

Investigate whether neighboring nodes can provide:

-   Relative movement
-   Differential displacement
-   Differential tilt
-   Spatial deformation patterns
-   Crack propagation
-   Coordinated anomalies

Do not assume relative measurements are automatically superior.

Determine experimentally how much value they provide.

------------------------------------------------------------------------

# PART 10 --- SENSOR FUSION

Investigate methods for combining:

**Tilt + displacement + vibration + crack + environmental information +
positioning**

Compare:

-   Statistical fusion
-   Weighted fusion
-   Kalman Filter
-   EKF
-   UKF
-   Bayesian fusion
-   Ensemble approaches
-   ML-based fusion

Select only what is justified.

------------------------------------------------------------------------

# PART 11 --- SENSOR HEALTH

Treat sensor failure as a separate problem.

Detect:

-   Drift
-   Stuck values
-   Outliers
-   Battery failure
-   Communication failure
-   Calibration failure
-   Physical displacement

The system must distinguish:

> **Actual ground deformation**

from:

> **Sensor malfunction**

------------------------------------------------------------------------

# PART 12 --- AI/ML ALGORITHM RESEARCH

Do not select algorithms because they sound advanced.

Compare:

### Anomaly Detection

-   Isolation Forest
-   One-Class SVM
-   Autoencoder
-   VAE
-   Robust statistical methods

### Forecasting

-   Statistical baselines
-   ARIMA
-   Random Forest
-   XGBoost
-   LSTM
-   GRU
-   Temporal CNN
-   Transformer/TFT

### Spatial/Graph

-   GCN
-   GraphSAGE
-   GNN
-   Spatio-temporal GNN

### Physics-guided

-   Physics-informed ML
-   Physics-guided ML
-   Hybrid geotechnical + ML models

Select algorithms based on:

**Data availability + accuracy + computational cost + latency +
explainability + robustness + prototype feasibility.**

------------------------------------------------------------------------

# PART 13 --- BASELINE-FIRST VALIDATION

Never use an advanced model without comparison.

Use:

**Simple threshold/statistical baseline**

↓

**Classical ML**

↓

**Deep learning**

↓

**Advanced model where justified**

Determine whether complexity actually produces measurable improvement.

If the simpler model performs adequately, select it.

------------------------------------------------------------------------

# PART 14 --- VALIDATION WITHOUT DATA LEAKAGE

For time-series data, investigate:

-   Chronological split
-   Walk-forward validation
-   Rolling validation
-   Cross-panel validation
-   Cross-location validation
-   Unseen-condition testing

Do not use random splitting when it causes temporal leakage.

Clearly explain:

**Training → Validation → Test**

and ensure future information never enters training.

------------------------------------------------------------------------

# PART 15 --- SAFETY AND WARNING VALIDATION

Develop a scientifically justified warning system.

Potential structure:

**NORMAL → WATCH → WARNING → CRITICAL**

Do not assume thresholds.

Determine thresholds using:

-   Engineering knowledge
-   Statistical behaviour
-   Historical observations
-   Sensor fusion
-   Temporal persistence
-   Spatial consensus
-   Model confidence

Investigate false positives and false negatives.

Measure:

-   Precision
-   Recall
-   F1
-   False alarm rate
-   Miss rate
-   Detection latency
-   Warning lead time
-   Calibration
-   Prediction uncertainty

Never claim zero false alarms.

Never claim guaranteed prediction of catastrophic collapse.

------------------------------------------------------------------------

# PART 16 --- UNCERTAINTY & EXPLAINABLE AI

The system should explain:

-   Why risk increased
-   Which sensors contributed
-   Whether neighboring nodes agree
-   Whether deformation is accelerating
-   Data quality
-   Sensor health
-   Model confidence
-   Prediction uncertainty

Investigate:

-   SHAP
-   Feature importance
-   Prediction intervals
-   Confidence intervals
-   Bayesian uncertainty
-   Conformal prediction where appropriate

------------------------------------------------------------------------

# PART 17 --- EDGE + OFFLINE-FIRST SYSTEM

Determine what should happen when:

-   Internet fails
-   Cloud fails
-   Gateway fails
-   Individual nodes fail
-   Multiple nodes fail

Design:

**Sense → Process → Predict → Alert**

locally wherever technically feasible.

Cloud should primarily support synchronization, historical analytics and
broader management---not make immediate safety response completely
dependent on internet connectivity.

------------------------------------------------------------------------

# PART 18 --- COMMUNICATION SELECTION

Compare:

-   LoRa
-   LoRaWAN
-   Zigbee
-   Wi-Fi Mesh
-   BLE Mesh
-   Cellular/NB-IoT

Evaluate:

-   Range
-   Power
-   Latency
-   Reliability
-   Mesh capability
-   Cost
-   Scalability
-   Indian availability
-   Prototype feasibility

Select the best architecture rather than listing everything.

------------------------------------------------------------------------

# PART 19 --- HARDWARE SELECTION

Compare:

-   ESP32
-   Arduino-class boards
-   Raspberry Pi
-   Appropriate edge computers

Compare sensors for:

-   Tilt
-   IMU
-   Vibration
-   Displacement
-   Crack
-   Temperature
-   Humidity
-   GNSS

Clearly separate:

**Prototype-grade hardware**

from:

**Industrial-grade deployment hardware.**

Do not claim hobby hardware is suitable for safety-critical deployment
without qualification.

------------------------------------------------------------------------

# PART 20 --- GIS

Research:

-   QGIS
-   PostGIS
-   Leaflet
-   MapLibre
-   GeoJSON
-   Heatmaps
-   Spatial interpolation
-   IDW
-   Kriging
-   Gaussian Processes

Determine the most appropriate architecture.

Display:

-   Mine panels
-   Sensor locations
-   Deformation
-   Tilt
-   Cracks
-   Risk zones
-   Historical trends
-   Predictions
-   Sensor health

------------------------------------------------------------------------

# PART 21 --- DIGITAL TWIN

Critically evaluate whether a mine digital twin provides real technical
value.

If it does not significantly improve monitoring, prediction or
decision-making:

**Classify it as optional/future.**

Do not add it simply because it sounds futuristic.

------------------------------------------------------------------------

# PART 22 --- DATASET STRATEGY

Investigate real datasets first.

Search:

-   Mine subsidence
-   InSAR
-   Ground deformation
-   Mining sensors
-   Geological data
-   Environmental data

If sufficient labeled data does not exist, develop a transparent
strategy using:

-   Real sensor data
-   Controlled experiments
-   Synthetic data
-   Physics-based simulation
-   Historical observations

Clearly identify limitations of synthetic data.

Never claim real-world performance based only on synthetic testing.

------------------------------------------------------------------------

# PART 23 --- PHYSICAL PROTOTYPE

Design a student-buildable demonstration.

Test:

1.  Normal ground
2.  Gradual deformation
3.  Localized deformation
4.  Differential movement
5.  Crack initiation
6.  Vibration disturbance
7.  Sensor failure
8.  Communication loss
9.  Multiple-node deformation

Show:

**Live sensor data → anomaly → prediction → risk → GIS → warning**

------------------------------------------------------------------------

# PART 24 --- 360° VALIDATION MATRIX

Create:

  -----------------------------------------------------------------------------------------
  Claim   Evidence   Metric   Test   Baseline   Acceptance Criterion  Result   Limitation
  ------- ---------- -------- ------ ---------- --------------------- -------- ------------

  -----------------------------------------------------------------------------------------

Validate:

-   Sensor accuracy
-   Sensor repeatability
-   Sensor drift
-   Network latency
-   Packet delivery
-   Communication range
-   Edge latency
-   AI accuracy
-   Forecasting error
-   Warning lead time
-   False alarms
-   Missed detections
-   GIS consistency
-   Offline operation
-   Power consumption
-   System uptime
-   Cost

------------------------------------------------------------------------

# PART 25 --- ABLATION STUDY

Determine whether each component actually contributes.

Compare:

-   Single sensor
-   Multiple sensors
-   Without sensor fusion
-   With sensor fusion
-   Without spatial information
-   With spatial information
-   Without temporal modelling
-   With temporal modelling
-   Without edge processing
-   With edge processing

Show measurable improvement.

------------------------------------------------------------------------

# PART 26 --- ROBUSTNESS TESTING

Test:

-   Noise
-   Outliers
-   Missing data
-   Sensor drift
-   Communication failure
-   Battery reduction
-   Temperature changes
-   Rain-related effects
-   Vehicle vibration
-   Multiple simultaneous anomalies

Determine whether the system degrades safely.

------------------------------------------------------------------------

# PART 27 --- COST ANALYSIS

Calculate:

### SIH prototype cost

and separately:

### Potential field-deployment cost

Estimate:

-   Sensor node
-   Gateway
-   Power
-   Communication
-   Enclosure
-   Installation
-   Maintenance
-   Software
-   Storage
-   Connectivity

Use ranges where exact costs cannot be verified.

Calculate:

**Cost/node**

**Cost/monitored area**

**Maintenance burden**

**Potential cost advantage**

------------------------------------------------------------------------

# PART 28 --- 5--10 YEAR PRODUCT VIABILITY

Evaluate whether the **same core product/platform** can remain useful
for 5--10 years.

This does NOT mean creating 10 separate products.

The objective is:

> **Build one modular platform that can continuously evolve through
> upgrades.**

Analyze:

-   Hardware longevity
-   Sensor replacement
-   Edge hardware upgrades
-   Communication-module replacement
-   AI model upgrades
-   Software updates
-   New sensors
-   Satellite integration
-   UAV integration
-   GNSS integration
-   New GIS capabilities
-   New mining data
-   Cybersecurity updates

Determine:

**What remains stable?**

and

**What can be upgraded?**

------------------------------------------------------------------------

# PART 29 --- FUTURE-PROOF ARCHITECTURE

Design the architecture so:

**Core Platform**

remains stable while:

**Sensors + Communication + Edge Hardware + AI Models + Software + Data
Sources**

can evolve.

Evaluate:

-   Modular interfaces
-   Standard protocols
-   APIs
-   Hardware abstraction
-   Model versioning
-   OTA updates
-   Database migration
-   Interoperability

------------------------------------------------------------------------

# PART 30 --- 5--10 YEAR ROADMAP

Create a realistic roadmap:

### Year 0--1

SIH prototype

### Year 1--3

Controlled mine pilot

### Year 3--5

Mature monitoring platform

### Year 5--7

Multi-modal intelligence

### Year 7--10

Large-scale intelligent mining safety platform

For every stage specify:

**Capability → Technology upgrade → Problem solved → Benefit →
Validation → Readiness → Risk**

Clearly label technologies as:

-   Available
-   Deployable
-   Emerging
-   Research-stage
-   Speculative

------------------------------------------------------------------------

# PART 31 --- SCALABILITY

Analyze:

**10 nodes → 100 nodes → 1,000 nodes → multiple panels → multiple mines
→ multiple coalfields**

Evaluate:

-   Network
-   Gateway
-   Database
-   AI
-   Cloud
-   Sensor management
-   Model management
-   Security
-   Maintenance

------------------------------------------------------------------------

# PART 32 --- SECURITY & FAIL-SAFE DESIGN

Research:

-   Device authentication
-   Encryption
-   Secure communication
-   Data integrity
-   Access control
-   Alert integrity
-   Firmware security
-   Sensor spoofing

Define fail-safe behaviour.

The system must never silently interpret:

**"No data" = "Normal."**

------------------------------------------------------------------------

# PART 33 --- BUSINESS & REAL-WORLD DEPLOYMENT

Analyze:

-   Who would buy it?
-   Who would operate it?
-   Who would maintain it?
-   What would deployment look like?
-   What would recurring costs be?
-   What barriers exist?
-   What partnerships may be required?
-   What industrial certification may eventually be needed?
-   What regulatory approvals may be relevant?

Separate SIH prototype feasibility from industrial commercialization.

------------------------------------------------------------------------

# PART 34 --- SOCIAL, ENVIRONMENTAL & ECONOMIC IMPACT

Quantify where evidence allows:

-   Potential warning-time improvement
-   Monitoring coverage
-   Cost reduction
-   Manual workload reduction
-   Infrastructure-risk reduction
-   Community safety benefit
-   Environmental monitoring
-   Energy efficiency

Do not invent impact numbers.

------------------------------------------------------------------------

# PART 35 --- NOVELTY ANALYSIS

Compare the final proposed architecture against existing research and
patents.

Identify:

### Existing

### Incremental improvement

### Potentially novel combination

### Strongest defensible innovation

Do not call something novel merely because the team has not seen it
before.

------------------------------------------------------------------------

# PART 36 --- INNOVATION RANKING

Generate at least 10 candidate innovations.

Score:

**Novelty / Impact / Feasibility / Cost / SIH value / Evidence**

Then select the strongest 3--5.

Avoid unnecessary technology stacking.

------------------------------------------------------------------------

# PART 37 --- RED-TEAM THE ENTIRE SOLUTION

Attempt to prove that the solution will fail.

Ask:

-   Can sensors actually detect meaningful deformation?
-   Can surface movement be distinguished from environmental noise?
-   Is enough training data available?
-   Can AI prediction work with limited data?
-   Can low-cost sensors maintain calibration?
-   Can the mesh network operate reliably?
-   What happens when sensors fail?
-   What happens when communication fails?
-   What happens when AI is uncertain?
-   Can false alarms be controlled?
-   Can missed events be detected?
-   Is the claimed novelty legitimate?
-   Is the prototype representative?
-   Is the cost realistic?
-   Is the 5--10 year roadmap credible?

For every weakness:

**Problem → Severity → Probability → Mitigation → Validation → Residual
risk**

Do not hide weaknesses.

------------------------------------------------------------------------

# PART 38 --- INTERNAL COLLEGE HACKATHON SHORTLISTING

Evaluate the project as if you are selecting teams for an internal
college hackathon.

Create a scoring system based on:

-   Problem understanding
-   Innovation
-   Technical depth
-   AI relevance
-   Hardware feasibility
-   Prototype quality
-   Validation
-   Cost
-   Impact
-   Demo potential
-   Presentation quality
-   Novelty
-   Future potential
-   Team execution feasibility

Identify:

### Top 10 reasons the project could be rejected internally

### Top 10 improvements required before internal selection

### Minimum viable prototype required to qualify

### Evidence that should be shown to evaluators

### Questions internal judges may ask

------------------------------------------------------------------------

# PART 39 --- SIH SHORTLISTING ANALYSIS

Act as a highly critical SIH evaluator.

Score:

-   PS alignment
-   Problem understanding
-   Innovation
-   Technical depth
-   AI justification
-   IoT
-   Wireless mesh
-   Prediction
-   Validation
-   Reliability
-   Cost
-   Scalability
-   Indian suitability
-   Social impact
-   Prototype feasibility
-   Novelty
-   Future viability
-   Presentation potential

Then provide:

### SIH shortlist probability assessment

Do NOT invent an actual probability percentage unless a defensible
methodology exists.

Instead classify:

**Weak / Moderate / Strong / Very Strong**

and explain why.

------------------------------------------------------------------------

# PART 40 --- JUDGE QUESTION BANK

Generate the hardest questions judges may ask.

Especially:

### Problem

"Why is this problem still unsolved?"

### Existing solutions

"Why not simply use InSAR?"

### Sensors

"Why these sensors?"

### Communication

"Why LoRa/mesh?"

### AI

"Why this algorithm?"

### Data

"Where will you get training data?"

### Accuracy

"How do you know your prediction is correct?"

### False alarms

"What if the sensor gives a false reading?"

### Reliability

"What happens if multiple nodes fail?"

### Connectivity

"What happens without internet?"

### Cost

"How much does one node cost?"

### Scalability

"Can this work over an actual mine?"

### Novelty

"What exactly is new?"

### Safety

"Would you trust AI with human safety?"

### Future

"Can this platform remain useful for 5--10 years?"

Provide technically honest answers.

------------------------------------------------------------------------

# PART 41 --- FINAL TECHNOLOGY SELECTION

After researching everything, create ONE final selection table:

  ----------------------------------------------------------------------------------
  Layer   Alternatives   Selected   Purpose   Why Selected  Rejected   Why Rejected
  ------- -------------- ---------- --------- ------------- ---------- -------------

  ----------------------------------------------------------------------------------

Every technology must be classified:

-   Essential
-   Recommended
-   Optional
-   Future
-   Not recommended

Do not include technology simply because it sounds advanced.

------------------------------------------------------------------------

# PART 42 --- FINAL SYSTEM ARCHITECTURE

Provide ONE final architecture:

**Surface Sensor Nodes**

↓

**Wireless Mesh Network**

↓

**Edge Gateway**

↓

**Data Validation**

↓

**Sensor Health**

↓

**Sensor Fusion**

↓

**Anomaly Detection**

↓

**Spatial Analysis**

↓

**Temporal Forecasting**

↓

**Risk Estimation**

↓

**Uncertainty + Explainability**

↓

**Early Warning Engine**

↓

**GIS Dashboard**

↓

**Operator Decision**

↓

**Historical Cloud Synchronization**

Specify the technology and algorithm used at every stage.

------------------------------------------------------------------------

# PART 43 --- FINAL INPUT → PROCESSING → OUTPUT

Clearly define:

## INPUT

-   Sensor readings
-   Node position
-   Mine panel information
-   Historical observations
-   Environmental information

## PROCESSING

-   Filtering
-   Calibration
-   Sensor-health analysis
-   Sensor fusion
-   Anomaly detection
-   Spatial modelling
-   Temporal forecasting
-   Risk scoring
-   Uncertainty estimation

## OUTPUT

-   Current deformation status
-   Anomaly status
-   Predicted trend
-   Risk level
-   Confidence
-   GIS risk zone
-   Warning
-   Explanation
-   Sensor health
-   Historical trend

------------------------------------------------------------------------

# PART 44 --- FINAL SIH PROTOTYPE

Specify exactly what the student team should build.

Include:

-   Number of sensor nodes
-   Sensor components
-   Microcontroller
-   Communication
-   Gateway
-   Edge hardware
-   AI algorithms
-   Database
-   Backend
-   Frontend
-   GIS
-   Alert mechanism
-   Power
-   Physical demonstration environment
-   Dataset
-   Experiments
-   Metrics

Separate:

**What we demonstrate at SIH**

from:

**What requires real mine deployment.**

------------------------------------------------------------------------

# PART 45 --- "WHAT WE SHOULD NOT BUILD"

This is mandatory.

Identify technologies/features that should NOT be included because they:

-   Add unnecessary complexity
-   Cannot be validated
-   Are too expensive
-   Are not sufficiently mature
-   Do not solve the PS
-   Cannot be demonstrated
-   Create unacceptable risks
-   Are only buzzwords

Explain why each should be excluded.

------------------------------------------------------------------------

# PART 46 --- FINAL 360° RISK MATRIX

Create:

  ---------------------------------------------------------------------------------------------
  Risk   Category     Severity   Probability Detection   Mitigation   Validation   Residual
                                                                                   Risk
  ------ ---------- ---------- ------------- ----------- ------------ ------------ ------------

  ---------------------------------------------------------------------------------------------

Include:

-   Technical
-   AI
-   Hardware
-   Sensor
-   Communication
-   Data
-   Environmental
-   Operational
-   Safety
-   Cybersecurity
-   Cost
-   Scalability
-   Regulatory
-   Commercial

------------------------------------------------------------------------

# PART 47 --- FINAL RESEARCH CONCLUSION

Answer clearly:

1.  What is the exact problem?
2.  Who suffers?
3.  Why does it matter?
4.  Why are existing methods insufficient?
5.  What is the research gap?
6.  What is the core innovation?
7.  Why is the surface mesh important?
8.  Which sensors should be used?
9.  Which communication technology?
10. Which AI algorithms?
11. Why those algorithms?
12. How does sensor fusion work?
13. How does prediction work?
14. How is uncertainty handled?
15. How are false alarms reduced?
16. How are sensor failures handled?
17. How does offline operation work?
18. How does GIS help?
19. How is the system validated?
20. What can be demonstrated at SIH?
21. What is genuinely novel?
22. What should NOT be built?
23. What does it cost?
24. How does it scale?
25. Can the same platform remain useful for 5--10 years?
26. How can it be upgraded?
27. Why is it a strong SIH candidate?

------------------------------------------------------------------------

# PART 48 --- FINAL OUTPUT

End with these exact sections:

## 1. ONE-SENTENCE PROBLEM

## 2. ONE-SENTENCE SOLUTION

## 3. ONE-SENTENCE CORE INNOVATION

## 4. FINAL PRODUCT NAME

## 5. FINAL TECHNOLOGY STACK

## 6. FINAL HARDWARE STACK

## 7. FINAL AI/ML ALGORITHM STACK

## 8. FINAL COMMUNICATION STACK

## 9. FINAL DATA FLOW

## 10. FINAL SYSTEM ARCHITECTURE

## 11. TOP 5 INNOVATIONS

## 12. TOP 5 DIFFERENTIATORS FROM EXISTING SOLUTIONS

## 13. TOP 5 VALIDATION EXPERIMENTS

## 14. TOP 5 TECHNICAL RISKS

## 15. TOP 5 MITIGATIONS

## 16. SIH PROTOTYPE --- WHAT WE BUILD NOW

## 17. 5--10 YEAR PRODUCT EVOLUTION

## 18. INTERNAL COLLEGE HACKATHON READINESS

## 19. SIH SHORTLIST READINESS

## 20. TOP 10 JUDGE QUESTIONS + ANSWERS

## 21. WHAT WE SHOULD NOT BUILD

## 22. FINAL RED-TEAM VERDICT

## 23. FINAL RECOMMENDATION

------------------------------------------------------------------------

# ABSOLUTE RESEARCH RULES

1.  Never fabricate evidence.
2.  Never fabricate accuracy.
3.  Never fabricate costs.
4.  Never fabricate datasets.
5.  Never fabricate patents.
6.  Never fabricate government requirements.
7.  Never claim 100% prediction accuracy.
8.  Never claim guaranteed prevention of subsidence.
9.  Never claim zero false alarms.
10. Never call something novel without prior-art investigation.
11. Never add AI merely for presentation.
12. Never add technology merely because it is futuristic.
13. Never hide weaknesses.
14. Never confuse prototype capability with industrial capability.
15. Never treat synthetic-data performance as equivalent to real-mine
    performance.
16. Never use future information during time-series validation.
17. Always distinguish fact, evidence, assumption, estimate and
    speculation.
18. Prefer simpler validated technology over unnecessary complexity.
19. Every selected component must have a specific technical purpose.
20. Every major performance claim must have a validation method.

------------------------------------------------------------------------

# FINAL PRINCIPLE

The objective is NOT:

> **"Make the most futuristic-looking project."**

The objective is:

> **"Build the most scientifically credible, technically defensible,
> innovative, low-cost, real-time, validated and future-proof solution
> possible for PS 26025."**

The SIH prototype is the **first practical implementation of a
long-lived product platform**, not the complete endpoint.

The final architecture should therefore be:

**LOW COST + REAL TIME + MULTI-SENSOR + WIRELESS MESH + EDGE AI +
PREDICTIVE + GIS + EXPLAINABLE + UNCERTAINTY-AWARE + OFFLINE CAPABLE +
FAULT TOLERANT + MODULAR + SCALABLE + 5--10 YEAR UPGRADEABLE +
INDIAN-MINE SUITABLE.**

Before finalizing the recommendation, critically attempt to disprove it.

Only recommend the final architecture after it survives:

**technical analysis + scientific validation planning + feasibility
analysis + prior-art analysis + robustness analysis + cost analysis +
red-team analysis + internal hackathon evaluation + SIH judge
evaluation.**
