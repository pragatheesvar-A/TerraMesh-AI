#### SIH26025 - Proposed System Architecture 

Mine Context 

Mining depth Mining thickness Panel geometry Geotechnical inputs 

Satellite / GNSS Context InSAR / DInSAR trend GNSS reference points GIS coordinates 

Distributed Ground Nodes Tilt/ inclination Displacement/ strain Crack width Vibration 

Raspberry Pi Edge Gateway Filtering + eatflsretatem checks ae CHEE Local time-series database Local Al inference 

LoRa / LoRaWAN Layer Low-power telemetry neve bean Gateway-based collection 

Spatial-Temporal Al Application Layer Anomaly detection GIS risk map Frequency-aware features Trend charts<sup>history</sup> SensorFuture graphrisk estimation relationships | AlertsRemote<sup>/</sup> notifications optionakcloud / remote services 

Safety Decision Engine Risk + confidence + thresholds 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

# **1. Executive Summary** 

SIH26025 calls for a hardware-centric disaster-management solution capable of detecting micro-ground movements above underground coal-mine panels, estimating subsidence risk in real time, and issuing early warnings. The proposed system is a distributed Mine IoT platform in which low-cost surface sensor nodes send deformation and vibration measurements to an edge gateway. The gateway filters and validates the measurements, extracts compact features, executes AI inference locally, and drives a safety decision engine. Cloud services are optional for dashboards, history, reports, and remote notifications; loss of internet connectivity does not stop the local warning path. 

The design is intentionally broader than a simple threshold alarm, but narrower than a generic allhazards mine-management platform. The core measurements are tilt/inclination, displacement or strain, crack-width evolution, and vibration. Mining context such as seam/panel depth and thickness is incorporated as model input when available. GNSS can provide selected high-quality reference points, while InSAR/DInSAR can add wide-area deformation context and support validation. These are supporting layers rather than hard dependencies for the prototype. 

### **Design principle** 

The project should be presented as Sense -> Understand -> Predict -> Warn, not simply Sensor -> Internet -> Dashboard. 

# **2. Problem and Solution Objective** 

Underground coal extraction can create voids and induce movement in overlying strata. Surface subsidence is a spatial and temporal process: deformation can develop progressively, spread across neighbouring locations, and interact with local mining and geotechnical conditions. A useful earlywarning platform therefore needs both continuous sensing and a way to interpret patterns rather than reacting to one isolated measurement. 

## **2.1 Core objectives** 

- Continuously observe surface ground movement above mining panels using distributed low-cost sensor nodes. 

- Transmit compact telemetry over a low-power wireless link such as LoRa/LoRaWAN. 

- Perform filtering, feature extraction, sensor-health checks, and time-critical inference at the edge. 

- Combine temporal trends, spatial relationships, mining context, and safety thresholds into a risk decision. 

- Provide graded warnings and explain why a zone is considered risky. 

- Continue local monitoring and alarm operation when cloud connectivity is unavailable. 

## **2.2 Scope boundaries** 

The prototype is focused on subsidence monitoring and early warning. Gas, fire, water, worker localization, and broader mine-environment sensing can be added as modular future extensions, but they should not displace the subsidence pipeline in the first demonstrator. Likewise, satellite InSAR/DInSAR and GNSS are best treated as context and validation layers rather than requirements for every sensor node. 

Smart India Hackathon 2026 - Technical Solution Report  |  2 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

# **3. Research-Backed Design Insights** 

The research findings gathered during project development consistently point toward a multi-scale, multi-sensor architecture. Several studies examine subsidence prediction from mining and geotechnical parameters; other work demonstrates continuous strata monitoring with threshold-based alerts; remotesensing studies show the value of DInSAR and time-series InSAR for wide-area deformation; and Mine IoT literature evaluates wireless sensor networks, LoRa/LoRaWAN, edge/cloud data handling, and reliability constraints. 

|**Research theme**|**Design implication**|
|---|---|
|Mining/geotechnical parameters|Mining depth, thickness and available geotechnical data<br>should be usable as contextual features rather than<br>ignored.|
|Continuous strata monitoring|Real-time monitoring and an explicit early-warning layer<br>are central to the system.|
|Spatial-temporal deformation|Neighbouring sensor behaviour and movement trends<br>should be analyzed jointly.|
|Time-series InSAR / DInSAR|Remote sensing can provide broad-area deformation<br>context and validation.|
|GNSS-based monitoring|Selected reference points can anchor or validate low-cost<br>distributed measurements.|
|Mine IoT / WSN|The system should be modular, scalable, low-power, and<br>aware of communication quality.|
|Frequency-aware prediction|Slow deformation trends and fast disturbances should be<br>separated or represented with diferent features.|
|Decision support|Outputs should include risk, confdence, zone, and<br>recommended response level - not just raw sensor values.|



### **Important scientific caution** 

Published model scores, deformation rates, and reported sensor accuracies from external studies are evidence for feasibility, not performance guarantees for this prototype. The final system must be evaluated on its own dataset and test conditions. 

Smart India Hackathon 2026 - Technical Solution Report  |  3 

#### SIH26025 - Proposed System Architecture 

Mine Context Satellite / GNSS Context Distributed Ground Nodes Mining depth InSAR / DInSAR trend Tilt/ inclination Mining thickness GNSS reference points Displacement/ strain Panel geometry GIS coordinates Crack width Geotechnical inputs Vibration Raspberry Pi Edge Gateway LoRa / LoRaWAN Layer Filtering + eatflsretatem checks Low-power telemetry EETE Chsselesbir Node health Local time-series database Gateway-based collection Local Al inference 

Spatial-Temporal Al Application Layer Anomaly detection GIS risk map Frequency-aware features Trend charts<sup>history</sup> SensorFuture graphrisk estimation relationships | AlertsRemote<sup>/</sup> notifications optionakcloud / remote services 

Safety Decision Engine Risk + confidence + thresholds 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

# **5. Hardware Implementation** 

## **5.1 Sensor node** 

Each surface node is a compact, low-power measurement unit. The recommended hackathon platform is an ESP32-class controller with an integrated LoRa radio board such as the Heltec WiFi LoRa 32 or a LILYGO T-Beam class device. A custom ESP32 + LoRa design is also acceptable when board cost or availability requires it. 

|**Component**|**Recommended prototype**|**Role**|**Implementation notes**|
|---|---|---|---|
|Microcontroller + radio|ESP32 + SX1262-class LoRa<br>board|Local sensing, packet<br>creation, power-state control|Use deep sleep / duty cycling<br>where sensor dynamics<br>allow.|
|Tilt / inclination|Prototype IMU such as<br>MPU6050; feld upgrade to<br>calibrated inclinometer|Slow tilt and orientation<br>changes|Prototype device is for<br>demonstration; industrial<br>deployment needs<br>application-appropriate<br>calibrated instrumentation.|
|Vibration|Accelerometer / geophone-<br>class sensor|Short-term disturbance and<br>vibration features|Do not equate every vibration<br>spike with subsidence; use<br>context and neighbouring<br>nodes.|
|Displacement / strain|Strain gauge + HX711 or<br>linear displacement<br>prototype|Relative surface movement|Use a mechanically stable<br>mounting arrangement and<br>calibration routine.|
|Crack width|VL53L0X bracketed across a<br>crack, or dedicated crack-<br>width sensor|Crack opening trend|Prototype measurement<br>depends on geometry; feld<br>deployment should use a<br>purpose-designed crack<br>gauge if required.|
|Power|Li-ion/LiFePO4 battery + solar<br>charging|Autonomous node operation|Size from measured duty-<br>cycle energy budget, not from<br>a nominal panel rating.|
|Status indicators|LED / small display optional|Local commissioning and<br>diagnostics|Useful for feld debugging,<br>not a required safety output.|



## **5.2 Gateway** 

The gateway is the local intelligence point. A Raspberry Pi 4/5-class device with a compatible LoRa interface can receive node telemetry, maintain a local database, execute filtering and feature extraction, run the AI model, and drive local alerts. A smaller Pi-class device can be used if processing requirements remain modest. 

|**Gateway element**|**Purpose**|
|---|---|
|Raspberry Pi|Edge compute, local orchestration, storage, API services|
|LoRa interface / concentrator|Receive node telemetry|
|Local database|Store raw, cleaned, features and event data|
|UPS / battery backup (optional)|Preserve local operation during gateway power|



Smart India Hackathon 2026 - Technical Solution Report  |  5 

||SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning|
|---|---|
||interruptions|
|Siren / beacon driver|Physical warning output through GPIO or a suitable<br>protected interface|
|4G/Wi-Fi/Ethernet (optional)|Remote dashboards, notifcations and synchronization|



## **5.3 Hardware signal path** 

```
Surface node -> local sampling -> filtering / feature extraction -> LoRa packet -> gateway -> local
database -> edge AI -> safety decision -> alarm / dashboard
```

# **6. Communication Architecture** 

LoRa is attractive for sparse, low-data-rate sensor telemetry because the node payloads are small and the deployment can span a substantial surface area. LoRaWAN can provide a standardized gateway/network architecture when a formal network-server design is desired. A simple point-togateway LoRa arrangement is easier for a hackathon prototype; the final report should name the architecture actually implemented rather than using LoRa, LoRaWAN, and LoRa Mesh interchangeably. 

## **6.1 Recommended packet content** 

```
{ node_id, timestamp, tilt, displacement, crack_width, vibration_rms, battery, rssi, sensor_status }
```

## **6.2 Communication health** 

Every node should report enough information for the gateway to distinguish a safe measurement from missing data. A silent node is not equivalent to a safe node. The gateway should track last-seen time, battery level, received signal strength, and sensor-health flags. 

## **6.3 ZigBee vs LoRa** 

|**Criterion**|**ZigBee**|**LoRa / LoRaWAN**|**Decision for SIH26025**|
|---|---|---|---|
|Range|Shorter local range|Longer range|Prefer LoRa for dispersed<br>surface telemetry.|
|Power|Low|Very low for small telemetry|LoRa is attractive for<br>battery/solar nodes.|
|Data rate|Higher|Lower|Lower rate is acceptable<br>because the payload is<br>compact.|
|Mesh|Native mesh commonly used|LoRaWAN uses gateway<br>architecture; mesh is a<br>diferent design|Use the simplest topology that<br>matches the prototype.|
|Scalability|Good for local clusters|Good for sparse distributed<br>sensing|Gateway-centric<br>LoRa/LoRaWAN is the<br>preferred direction.|
|Internet dependency|Not inherently required|Not inherently required at<br>the radio layer|Keep local gateway + local<br>alarms independent of the|



Smart India Hackathon 2026 - Technical Solution Report  |  6 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

internet. 

# **7. Signal Processing and Data Pipeline** 

Subsidence signals are noisy and can contain both slow deformation and fast disturbances. The preprocessing layer should preserve meaningful trends while reducing false alarms from vibration, sensor noise, mounting effects, and environmental variation. 

## **7.1 Processing stages** 

1. Validate packet integrity and timestamp consistency. 

2. Check sensor-health fields, battery and communication quality. 

3. Apply calibration and unit conversion. 

4. Filter obvious noise and outliers using a lightweight method appropriate to each signal. 

5. Create sliding windows and calculate temporal features such as slope, rate of change, variance, acceleration of trend, and rolling statistics. 

6. For selected signals, use frequency-aware decomposition such as VMD when the computational budget and model design justify it. 

7. Create spatial features from neighbouring nodes, including agreement, correlation, cluster behaviour, and deformation spread. 

8. Persist raw values, cleaned values, features, model outputs, and alert events for traceability. 

## **7.2 Vibration feature example** 

```
Raw acceleration -> window -> RMS / peak / variance / band-energy -> compact LoRa features
```

The node does not need to stream a full high-rate waveform continuously to the gateway. Local feature extraction can reduce radio use and storage volume while preserving information needed for anomaly and risk models. 

# **8. AI / ML Architecture** 

The recommended AI design is hybrid rather than a single monolithic model. The system separates immediate abnormality detection from future-risk estimation and combines both with engineering constraints and contextual information. 

## **8.1 Stage A - anomaly detection** 

Isolation Forest, One-Class SVM, clustering/outlier methods, or another lightweight unsupervised detector can learn the normal operating envelope. The purpose is to answer: "Is this behaviour unusual now?" It should not by itself declare a mine-wide subsidence event. 

## **8.2 Stage B - temporal prediction** 

A GRU/LSTM, temporal convolution model, or another lightweight sequence model can estimate the near-term trajectory of deformation-related features. The target should be defined clearly - for example, 

Smart India Hackathon 2026 - Technical Solution Report  |  7 



#### Multi-Level Warning Logic 

NORMAL WARNING Routine monitoring Increasing trend / anomaly 



<!-- Start of picture text -->
HIGH<br><!-- End of picture text -->



<!-- Start of picture text -->
Multi-node evidence<br><!-- End of picture text -->

CRITICAL Immediate safety response 



<!-- Start of picture text -->
- Dashboard update - Visual / remote alert<br><!-- End of picture text -->



<!-- Start of picture text -->
- Supervisor notification<br><!-- End of picture text -->



<!-- Start of picture text -->
- Targeted inspection<br><!-- End of picture text -->

- Siren / beacon 

- Supervisor notification 

- Follow mine emergency pfocedu 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

|Warning|Emerging anomaly or deteriorating<br>trend|Visual warning, remote notifcation,<br>closer observation.|
|---|---|---|
|High|Multiple neighbouring nodes agree,<br>trend persists, context supports concern|Supervisor notifcation, targeted<br>inspection, increased monitoring.|
|Critical|Severe threshold breach or strong multi-<br>source evidence|Local siren/beacon and urgent<br>notifcation; follow mine emergency<br>procedure.|



### **Safety rule** 

The prototype should support established mine emergency procedures. It should not claim that an experimental ML model independently commands evacuation without human and procedural safeguards. 

# **10. Sensor Fusion and Reliability** 

## **10.1 Multi-sensor evidence** 

A strong warning should ideally be supported by several signals. For example, increasing displacement + increasing crack width + consistent tilt trend + agreement from neighbouring nodes is stronger evidence than a single isolated spike. 

## **10.2 System-health state** 

Hazard state and system-health state should be displayed separately. The dashboard should distinguish Normal / Warning / High / Critical hazard risk from Healthy / Degraded / Offline monitoring status. 

|**Example**|**Interpretation**|
|---|---|
|One node abnormal; battery low; neighbours normal|Possible sensor or local disturbance; generate<br>maintenance/inspection fag.|
|Several neighbours show consistent deformation and node<br>health is good|Strong evidence of a genuine regional pattern.|
|Internet down but gateway and radio healthy|Local AI and physical warning remain operational.|
|Gateway ofine|System should clearly indicate monitoring loss rather than<br>showing the area as safe.|



# **11. GNSS, GIS and InSAR Integration** 

GNSS, GIS, and InSAR/DInSAR are valuable complementary technologies, but they should not be allowed to overcomplicate the first hardware demonstrator. 

|**Technology**|**Primary role**|**Recommended use**|
|---|---|---|
|GNSS|Georeferenced surface displacement<br>reference|Use at selected strategic points for<br>validation / anchoring.|
|GIS|Spatial context and asset map|Use for sensor locations, panel|



Smart India Hackathon 2026 - Technical Solution Report  |  9 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

|||boundaries, roads/buildings and risk<br>zones.|
|---|---|---|
|DInSAR|Wide-area deformation measurement|Use as periodic spatial context and<br>validation where suitable products are<br>available.|
|Time-series InSAR|Longer-term deformation trend and<br>dense spatial information|Use as an advanced monitoring layer; do<br>not make live processing a prototype<br>dependency.|
|SAR platform selection|Diferent sensors can perform<br>diferently for mining subsidence|Select the data source based on the<br>actual study area, coverage and product<br>availability; do not claim one platform is<br>universally best.|



### **Prototype strategy** 

For a hackathon demonstrator, use prerecorded or prepared InSAR/GNSS data to demonstrate fusion. Keep the core warning path fully functional with the physical sensor network and Raspberry Pi even without satellite connectivity. 

# **12. Dashboard and User Interface** 

The dashboard should turn sensor streams into an operational picture. A map-first interface is preferable to a page dominated by raw telemetry. 

|**Screen**|**Key elements**|
|---|---|
|Mine overview|Mine zones, panel map, current risk, system-health<br>summary|
|Zone detail|Tilt/displacement/crack/vibration trends, neighbouring-<br>node agreement, risk and confdence|
|Alerts|Time, zone, severity, evidence, acknowledgement state,<br>recommended action|
|Node health|Battery, RSSI, last-seen time, sensor-health fag, calibration<br>state|
|History / reports|Trend plots, event replay, model performance, exported<br>records|



# **13. Recommended Prototype Bill of Materials** 

|**Item**|**Qty. for demo**|**Approx. purpose**|**Priority**|
|---|---|---|---|
|ESP32 + LoRa development<br>board|4-8|Sensor nodes|Core|
|MPU6050-class IMU /<br>accelerometer|4-8|Tilt + vibration prototype|Core|



Smart India Hackathon 2026 - Technical Solution Report  |  10 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

|Strain gauge + HX711 or<br>displacement mechanism|2-4|Displacement demonstration|Core|
|---|---|---|---|
|VL53L0X or dedicated crack-<br>width mechanism|2-4|Crack-width demonstration|Core|
|Raspberry Pi 4/5-class gateway|1|Edge processing + local storage|Core|
|LoRa gateway/concentrator<br>interface|1|Receive node packets|Core|
|Battery + solar charging<br>prototype|4-8|Autonomous nodes|Core|
|Siren / beacon + driver|1|Physical warning|Core|
|GNSS reference module|1 optional|Validation/reference|Optional|
|Gas/temp/humidity/water<br>modules|As needed|Future mine-safety extension|Optional|
|4G modem / Wi-Fi|1 optional|Remote dashboard /<br>notifcations|Optional|



# **14. Power and Deployment Strategy** 

Battery life should be designed from a measured energy budget. The node can wake, sample, compute compact features, transmit, and sleep. Sampling and transmission periods should be selected based on the dynamics of the parameter being observed; not every signal needs the same rate. 

```
Daily energy = sensor + MCU + radio + storage/charging losses
Solar harvest >= average daily consumption + reserve margin
```

For field deployment, environmental sealing, cable strain relief, mounting stability, calibration, lightning/surge protection, and battery safety become as important as the electronics themselves. Hobbygrade prototype sensors are suitable for demonstrating the concept but are not a substitute for minerated instrumentation in a production installation. 

# **15. Software Stack** 

|**Layer**|**Suggested technology**|**Purpose**|
|---|---|---|
|Node frmware|Arduino/C++ or ESP-IDF|Sensor acquisition, fltering, LoRa<br>packetization, power management|
|Gateway|Python + system services|Ingestion, preprocessing, orchestration|
|Local database|InfuxDB / TimescaleDB / SQLite for<br>small demo|Time-series storage|
|ML|Python, scikit-learn,<br>PyTorch/TensorFlow as appropriate|Anomaly detection and prediction|
|Edge model|ONNX Runtime / TensorFlow Lite as<br>appropriate|Low-overhead inference|
|API|FastAPI or lightweight REST service|Expose data and model outputs|



Smart India Hackathon 2026 - Technical Solution Report  |  11 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

|Dashboard|React + map/GIS library or Grafana for<br>rapid demo|Visualization and operator interface|
|---|---|---|
|Notifcations|Telegram / SMS / email gateway as<br>optional service|Remote alerts|



# **16. AI Training and Dataset Strategy** 

The most difficult practical issue is obtaining labelled subsidence-failure data. The project should therefore separate three dataset types. 

|**Dataset type**|**Use**|
|---|---|
|Real sensor data|Calibration, noise characterization, validation and fnal<br>testing where available.|
|Historical / remote-sensing data|Longer-term spatial deformation patterns and contextual<br>features.|
|Synthetic / simulated sequences|Prototype model development, edge-case generation and<br>demonstration before sufcient real labels exist.|



### **Evaluation rule** 

Train/validation/test splits must respect time and location. Randomly mixing neighbouring time windows from the same event can make performance appear better than it really is. Final evaluation should test unseen periods, nodes or zones where possible. 

# **17. Novelty and Differentiation** 

The project should not claim novelty for commodity components or generic IoT features. ESP32, LoRa, cloud dashboards, threshold alerts, and generic LSTM use are established patterns. The stronger differentiation is the way the components are combined around the subsidence problem. 

|**Potential contribution**|**Why it matters**|
|---|---|
|Spatial-temporal subsidence intelligence|Treats movement as a coordinated pattern across space and<br>time rather than a single-node threshold event.|
|Frequency-aware edge features|Separates slow deformation trends from fast disturbances<br>when useful.|
|Context-aware risk|Uses mining/panel/geotechnical context together with live<br>measurements.|
|Risk + confdence output|Communicates not only severity but also strength of<br>supporting evidence.|
|Sensor-health aware monitoring|Distinguishes "safe" from "not currently observed" and<br>reduces false confdence from failed nodes.|
|Multi-scale integration|Allows ground IoT, GNSS, GIS and InSAR to contribute<br>complementary evidence.|



Smart India Hackathon 2026 - Technical Solution Report  |  12 

||SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning|
|---|---|
|Ofine-frst safety path|Local gateway inference and alarms continue when cloud<br>services are unavailable.|
|Modular deployment|New sensor types or communication layers can be added<br>without redesigning the entire platform.|



# **18. Implementation Roadmap** 

|**Phase**|**Deliverables**|
|---|---|
|Phase 1 - Prototype node|ESP32 + LoRa + tilt/vibration; reliable packet transmission;<br>basic battery telemetry.|
|Phase 2 - Ground deformation|Add displacement and crack-width mechanism; calibration<br>and fltering.|
|Phase 3 - Gateway|Raspberry Pi ingestion, local database, node-health<br>monitoring, local alarm.|
|Phase 4 - Baseline intelligence|Threshold engine + anomaly detection + trend features.|
|Phase 5 - Spatial-temporal AI|Neighbour correlation, graph representation, temporal<br>prediction.|
|Phase 6 - Context + validation|Add mining context, prepared GNSS/InSAR inputs, GIS<br>map.|
|Phase 7 - Demo hardening|Fault injection, communication loss tests, sensor<br>disconnect tests, repeatable evaluation.|
|Phase 8 - SIH presentation|Live sensor event -> edge AI -> risk level -> physical alarm<br>-> dashboard evidence.|
|**19. Testng and Evaluaton Plan**<br>**Test category**|**Example metric / test**|
|Sensor accuracy|Compare prototype sensor response with a reference<br>measurement under controlled displacement/tilt.|
|Communication|Packet delivery ratio, latency, RSSI, behaviour under<br>partial obstruction.|
|Power|Average current, daily energy, estimated autonomy under<br>actual duty cycle.|
|Edge AI|Inference latency, CPU/RAM use, ofine operation.|
|Prediction|MAE/RMSE for continuous targets or precision/recall/F1 for<br>event classifcation, using time-aware splits.|
|Early warning|Lead time between detectable precursor and confgured<br>warning event, with false-alarm rate.|
|Reliability|Node loss, gateway restart, sensor freeze, time-sync errors,<br>packet corruption.|



Smart India Hackathon 2026 - Technical Solution Report  |  13 

||SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning|
|---|---|
|Usability|Time to understand alert cause and locate the afected<br>zone on the dashboard.|



# **20. Cost-Control Strategy** 

The low-cost objective should come from the architecture rather than a single cheap component. The main levers are low-cost microcontrollers, small telemetry packets, low-power duty cycling, reduced cabling, modular sensor selection, edge feature extraction, and gateway-centric processing. A final bill of materials should be quoted using the actual suppliers available to the team and should include enclosures, connectors, mounting hardware, solar charging, batteries, and spares rather than only the electronic boards. 

# **21. Key Risks and Mitigations** 

|**Risk**|**Mitigation**|
|---|---|
|False alarms from machinery / trafc|Use vibration features, context, temporal persistence,<br>neighbour agreement and calibration.|
|Sensor drift / poor mounting|Rigid installation, calibration, reference checks and node-<br>health monitoring.|
|Wireless packet loss|Bufer at node, sequence numbers, retries where<br>appropriate, last-seen monitoring, gateway placement<br>studies.|
|Internet failure|Keep data storage, AI inference and physical alarm local to<br>the gateway.|
|Insufcient labelled failure data|Use anomaly detection, simulation for development,<br>historical/remote-sensing context and careful validation.|
|Overly complex AI|Start with lightweight models; only add VMD/graph/deep<br>models when measured beneft justifes edge cost.|
|Unsafe feld interpretation|Use engineering review and established mine procedures;<br>prototype warnings are decision support, not certifcation.|
|Scope creep|Keep gas, worker tracking, and other hazards modular and<br>secondary to subsidence.|



# **22. Recommended Final SIH Demonstration** 

The most convincing live demonstration is a controlled deformation event rather than a generic dashboard tour. A sensor node should experience a known change, transmit the measurement, and show how the edge system responds. 

9. Create a controlled physical tilt or crack-width change on one or more prototype nodes. 

10. Show the LoRa packet arriving at the Raspberry Pi and the local node-health status. 

11. Show filtering and feature extraction turning raw readings into a trend. 

Smart India Hackathon 2026 - Technical Solution Report  |  14 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

12. Introduce a second neighbouring node so the audience can see spatial agreement rather than a single-node trigger. 

13. Display the AI risk and confidence with the evidence that produced them. 

14. Trigger the appropriate physical alarm level and dashboard event. 

15. Demonstrate an internet disconnect while the local gateway continues to monitor and alarm. 

### **Judge-facing message** 

The differentiator is not that the system can read sensors. The differentiator is that it can turn distributed, noisy, multi-source ground observations into a local, explainable, context-aware early-warning decision. 

# **23. Conclusion** 

The proposed SIH26025 solution is a layered, low-cost Mine IoT system built around continuous surface deformation monitoring and edge intelligence. Its core hardware consists of distributed ESP32-class LoRa sensor nodes measuring tilt, vibration, displacement, and crack evolution, plus a Raspberry Pi gateway for local storage, feature extraction, AI inference, and physical alarms. The intelligence layer combines anomaly detection, temporal trend analysis, spatial sensor relationships, and mining context, while a safety decision engine adds engineering thresholds and confidence-aware response levels. 

GNSS, GIS, and InSAR/DInSAR improve geospatial context and validation, but the core warning path is intentionally capable of operating without them and without cloud connectivity. This keeps the prototype practical while leaving a clear path toward a larger multi-scale deployment. The result is not simply an IoT monitoring dashboard; it is a proposed decision-support and early-warning architecture designed around the specific characteristics and constraints of underground coal-mine subsidence. 

# **24. References and Research Basis** 

16. Problem statement context: SIH26025 - AI-enabled, low-cost, real-time mine subsidence monitoring, prediction and early warning system (as supplied in the project discussion). 

17. BlinkedBuild-hosted SIH 2026 problem statement catalogue: 

   - https://www.blinknbuild.in/Assets/SIH_2026_All_226_Problem_Statements_Master_Catalogue.pdf 

18. SIH26025 problem summary: https://zaidsayyed.in/tools/sih-problem-statements/sih26025 

19. SIH 2026 theme/problem summary: 

   - https://www.mtsv4.in/sih-2026-themes/disaster-management/sih26025 

20. Research finding 1: longwall coal-mine subsidence prediction using 11 mining/geotechnical parameters and optimized GEP; summarized performance included a reported correlation coefficient near 0.96 for the GEP + ABC combination and sensitivity findings for mining depth and density. 

21. Research finding 2: integrated strata-management system using continuous monitoring, minespecific thresholds, AI analysis, and alarms for advance roof/strata failure warning. 

22. Research finding 3: PIV-based physical modelling of coal-mining strata movement; mining thickness and seam depth were examined in relation to deformation and subsidence. 

23. Research findings 4-5: time-series InSAR and DInSAR approaches for mining-related surface deformation, including comparison with ground observations. 

Smart India Hackathon 2026 - Technical Solution Report  |  15 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

24. Research findings 6-9: wireless sensor networks and IoT-based mine safety monitoring using environmental sensors, LoRa/ZigBee or Wi-Fi links, threshold alerts and automated response concepts. 

25. Research finding 10: integrated mine safety platform using cluster/outlier detection, spatiotemporal analysis, localization, IoT and cloud components. 

26. Research finding 12: VMD-based dual-branch spatiotemporal graph modelling for nonstationary mining time series; used here as methodological inspiration for frequency-aware spatial-temporal prediction. 

27. Research finding 14-15: Mine IoT reviews covering three-layer architectures, sensors, network topologies, LoRaWAN, deployment constraints, battery life, communication quality, and data management. 

28. Research finding 16: automated coal-mining subsidence monitoring architecture using GNSS CORS, GIS, communication, data processing, prediction and early warning. 

29. Research finding 17: comparison of ALOS-2, Sentinel-1 and Radarsat-2 InSAR for longwall mining subsidence monitoring; used here as evidence that SAR-source suitability should be evaluated for the specific study context. 

30. Research finding 18: TOPSIS-based technology selection; used here as a general rationale for multicriteria selection rather than as a universal ranking of Cloud over IoT for mining. 

# **Appendix A - Minimal End-to-End Data Model** 

```
Node telemetry
- node_id
- timestamp
- latitude / longitude (or local grid coordinates)
- tilt_x / tilt_y
- displacement
- crack_width
- vibration_rms / peak / band_energy
- battery
- rssi
- sensor_health
```

```
Derived features
- slope / trend
- rolling mean / variance
- acceleration of trend
- neighbour agreement / graph features
- anomaly_score
```

```
Decision output
- risk_level
- risk_score
- confidence
- affected_zone
- evidence
- alert_state
```

# **Appendix B - Core Design Rules** 

- Do not equate one sensor spike with mine-wide subsidence. 

Smart India Hackathon 2026 - Technical Solution Report  |  16 

SIH26025 | AI-Enabled Mine Subsidence Monitoring & Early Warning 

- Do not treat a missing sensor as a safe measurement. 

- Do not make cloud connectivity a prerequisite for local warning. 

- Do not claim exact failure-time prediction without appropriate labelled data. 

- Do not present prototype hobby sensors as mine-certified instruments. 

- Do not use published model accuracy as the accuracy of the proposed system. 

- Do keep the SIH prototype focused on subsidence and early warning. 

Smart India Hackathon 2026 - Technical Solution Report  |  17 

