# — SIH 2026 Problem Statement 26025 

AI-ENABLED LOW-COST REAL-TIME MINE SUBSIDENCE MONITORING, PREDICTION & EARLY WARNING SYSTEM FOR UNDERGROUND COAL MINES IN INDIA 

## MASTER 360-DEGREE RESEARCH & SOLUTION DEVELOPMENT REPORT 

Version: 1.0 

Date: September 2026 

Prepared for: Smart India Hackathon 2026 

Problem Statement ID: 26025 

## TABLE OF CONTENTS 

1. Executive Summary 

2. Part 1: Deeply Understand the Problem 

3. Part 2: Who Has the Problem? 

4. Part 3: Indian Context 

5. Part 4: Existing Solutions 

6. Part 5: Existing Products, Research & Patents 

7. Part 6: Why Existing Solutions Are Not Enough 

8. Part 7: Research Gap 

9. Part 8: 360-Degree Solution Analysis 

10. Part 9: Core Wireless Surface Mesh Innovation 

11. Part 10: Sensor Fusion 

12. Part 11: Sensor Health 

## 1. EXECUTIVE SUMMARY 

## 1.1 The Problem in One Sentence 

Underground coal mining in India causes surface subsidence that threatens communities, infrastructure, agricultural land, and mine safety, but current monitoring methods are periodic, expensive, sparse, and lack real-time prediction capability. 

## 1.2 The Solution in One Sentence 

A distributed wireless mesh network of low-cost multi-sensor nodes deployed across mine panels, using edge AI for sensor-fusion-based anomaly detection, uncertainty-aware forecasting, and offline-capable early warnings visualized through GIS. 

## 1.3 Core Innovation 

Spatially-coherent differential deformation detection through neighboring node consensus, combined with edge-first sensor-health-aware fusion that distinguishes ground movement from sensor faults, all operating without continuous cloud dependency. 

## 1.4 Why This Solution Must Exist 

- Human Safety: Subsidence-related ground failures can cause fatalities to mine workers and nearby residents [web:11][web:12] 

- Economic Impact: Infrastructure damage, agricultural land loss, and mine operational disruptions cost millions annually 

- Regulatory Requirement: DGMS and Coal Mines Regulations mandate monitoring and safety measures [web:16][web:19][web:20] 

- Environmental Protection: Forest areas, water bodies, and ecosystems face degradation from unmonitored subsidence 

- Current Gap: No low-cost, continuous, real-time system exists for Indian underground coal mines 

## 1.5 Why the Problem Still Exists 

1. Technical Complexity: Subsidence involves coupled geotechnical, geological, and miningprocess variables 

2. Cost Barriers: High-precision monitoring (InSAR, total stations, GNSS networks) is expensive for widespread deployment 

3. Data Scarcity: Limited labeled subsidence event data hinders AI model development 

4. Harsh Environments: Mining sites have power, connectivity, dust, vibration, and maintenance challenges 

5. Regulatory Lag: Safety regulations evolve slower than technology capabilities 

6. False Alarm Problem: Overly sensitive systems lose credibility; conservative systems miss events 

## 1.6 Why Current Approaches Are Insufficient 

|Method|Key Limitation|Evidence|
|---|---|---|
|Manual inspection|Periodic,subjective,labor-intensive|DGMS guidelines acknowledge need for modern<br>monitoring[web:21][web:22]|
|Total station/GNSS|High cost,requires line-of-sight,periodic surveys|Industry reports cite cost and coverage limitations<br>[web:21]|



|Method|Key Limitation|Evidence|
|---|---|---|
|InSAR|Satellite revisit time(6-12days),atmospheric<br>interference,expensive processing|Research shows temporal gaps limit early warning<br>[web:9]|
|UAV<br>photogrammetry|Weather-dependent,periodic,regulatory<br>restrictions|Operational constraints limit continuous monitoring|
|Existing IoT<br>systems|Single-sensor focus,cloud-dependent,no sensor-<br>health awareness|Literature shows sensor dri�and false alarms<br>remain problems[web:11][web:13]|
|AI-only approaches|Lack physics grounding,require large labeled<br>datasets,black-box predictions|Reviews emphasize need for physics-guided ML<br>[web:11]|



## 1.7 What Is Genuinely New 

Not claimed as "world's first" but as a defensible combination: 

1. Relative deformation through neighbor consensus: Multiple nearby nodes detecting coherent spatial patterns rather than isolated readings 

2. Sensor-health-first architecture: Explicit fault detection before anomaly interpretation 

3. Offline-first edge AI: Local warning capability without internet dependency 

4. Uncertainty-aware risk scoring: Confidence intervals and data quality metrics in every alert 

5. Indian-mine-specific design: Monsoon resilience, low-power operation, maintenancefriendly, cost-optimized for Indian economics 

## 1.8 Can It Actually Work? 

### Yes, with important caveats: 

- Physics: Surface tilt, displacement, and vibration are measurable consequences of underground deformation [web:11] 

- Technology: MEMS tilt sensors, LoRa communication, and edge AI are mature and affordable Validation Required: Controlled experiments must establish detection thresholds, falsealarm rates, and lead times 

- Not Guaranteed: Cannot promise 100% prediction accuracy or prevention of all subsidence damage 

## 1.9 How Can We Prove It Works? 

1. Laboratory validation: Controlled deformation platform with ground truth 

2. Field pilot: Small-scale deployment at cooperating mine with reference instruments 

3. Blind testing: Holdout data from different panels/locations 

4. Ablation studies: Demonstrate each component (fusion, spatial, temporal) adds measurable value 

5. Robustness testing: Noise, missing data, sensor faults, communication failures 

## 1.10 5-10 Year Viability 

### Yes, through modular architecture: 

- Stable core: Data model, APIs, risk-scoring framework, GIS integration 

- Upgradeable layers: Sensors, communication modules, edge hardware, AI models, cloud features 

- Evolution path: Add satellite integration, UAV data fusion, advanced geotechnical models, multi-mine analytics 

## 1.11 Why SIH Evaluators Should Shortlist 

1. Problem alignment: Directly addresses PS 26025 requirements 

2. Technical depth: Multi-disciplinary (geotechnical + IoT + AI + GIS + embedded) 

3. Innovation: Defensible novelty in sensor-health-aware fusion and spatial consensus 

4. Feasibility: Student-buildable prototype with ESP32, LoRa, IMU sensors 

5. Impact: Addresses safety, economic, and environmental concerns in Indian mining 

6. Validation: Clear experimental plan with measurable metrics 

7. Future-proof: Modular design supports 5-10 year evolution 

## PART 1 — DEEPLY UNDERSTAND THE PROBLEM 

## 1.1 What Is Mine Subsidence? 

Mine subsidence is the downward movement (and associated horizontal displacement) of the ground surface caused by underground mining activities. When coal is extracted from underground seams, the overlying rock strata (overburden) lose support and gradually deform, eventually propagating to the surface. 

## 1.2 Physical Mechanisms 

## Mining Activity → Underground Deformation 

1. Coal Extraction: Removal of coal creates void space (goaf ) 

2. Immediate Roof Collapse: Overlying strata cave into the void 

3. Overburden Response: Stress redistribution causes: 

   - Vertical compression of rock layers 

   - Horizontal strain and displacement 

   - Bed separation and fracturing 

   - Time-dependent creep deformation 

## Underground → Surface Deformation 

The deformation propagates upward through: 

- Caved zone: Immediate collapse above mined panel 

- Fractured zone: Cracked but not fully collapsed strata 

- Continuous deformation zone: Elastic/plastic deformation reaching surface 

## Surface Manifestations 

1. Subsidence Trough: Bowl-shaped depression over mined panel 

2. Vertical Displacement: Maximum at trough center (can reach 0.5-0.9 × extracted seam thickness) 

3. Horizontal Displacement: Radial movement toward trough center 

4. Tilt: Slope change across trough (maximum at inflection points) 

5. Strain: Tensile (cracking) at trough edges, compressive at center 

6. Curvature: Change in slope (affects structures) 

## 1.3 Key Parameters 

|Parameter|Symbol|Typical Range|Measurement Method|
|---|---|---|---|
|Maximum subsidence|S_max|0.5-3.0m|Levelling,InSAR,GNSS|
|Trough width|W|0.5-2.0 ×depth|Spatial mapping|
|Maximum tilt|T_max|10-100mm/m|Tilt sensors,levelling|
|Horizontal strain|ε|1-50mm/m|Strain sensors,GNSS|
|Curvature|K|0.1-5mm/m/m|Derived from profile|
|Time to stabilization|t|6months- 5years|Time-series monitoring|



## 1.4 Factors Affecting Subsidence 

### Geological: 

Seam thickness and depth 

- Overburden lithology (sandstone, shale, clay) 

- Faults and discontinuities 

- Groundwater conditions 

### Mining: 

- Panel dimensions (width, length) 

- Extraction method (bord-and-pillar, longwall) 

- Percentage extraction 

- Mining rate and sequence 

Surface: 

- Soil type and thickness 

- Topography 

- Existing structures 

- Vegetation and land use 

## 1.5 What Can Surface Sensors Detect? 

### Realistically detectable: 

- Tilt: MEMS tilt sensors can detect 0.01-0.1 mm/m changes 

- Vibration: Accelerometers detect mining-induced tremors and ground failures 

- Displacement: Relative displacement between nodes (mm-cm scale) 

- Crack: Crack meters detect opening/closing of surface fractures 

- Environmental: Temperature, humidity for compensation and context 

### Cannot directly measure: 

Absolute subsidence magnitude without reference 

- Underground deformation (inferred from surface patterns) 

- Imminent collapse (only probabilistic risk indicators) 

## 1.6 Realistic Detection Chain 

Mining Activity ↓ Underground Stress Redistribution ↓ Overburden Deformation (vertical + horizontal) ↓ Surface Deformation (tilt, displacement, strain, crack) ↓ Sensor Observations (with noise, drift, environmental effects) ↓ Data Processing (filtering, fusion, health check) ↓ Anomaly Detection (statistical + ML) ↓ Risk Assessment (spatial + temporal + uncertainty) ↓ Warning (if thresholds + persistence + consensus exceeded) 

Critical insight: Sensors measure surface manifestations, not underground state directly. Inference requires spatial patterns, temporal trends, and uncertainty quantification. 

PART 2 — WHO HAS THE PROBLEM? 

## 2.1 Stakeholder Analysis 

|Stakeholder|Problem|Current Method|Missing<br>Information|Decision<br>Required|Consequence|Value of Early<br>Warning|
|---|---|---|---|---|---|---|
|Mine<br>Operators|Safety liability,<br>operational<br>disruption,<br>regulatory<br>compliance|Periodic<br>surveys,visual<br>inspection|Real-time<br>deformation<br>status,<br>prediction of<br>acceleration|Evacuation,<br>operational<br>changes,<br>reinforcement|Fatalities,<br>equipment<br>loss,<br>shutdown|Hours to days<br>of lead time<br>for evacuation<br>and mitigation|
|Mining<br>Engineers|Design<br>validation,<br>subsidence<br>prediction<br>accuracy|Empirical<br>models,<br>numerical<br>simulation|Actual vs.<br>predicted<br>deformation,<br>model<br>calibration<br>data|Adjust mining<br>parameters,<br>support design|Over/under-<br>design,<br>unexpected<br>subsidence|Feedback for<br>model<br>improvement,<br>real-time<br>adjustment|
|Geotechnical<br>Engineers|Ground stability<br>assessment,<br>risk<br>characterization|Instrumentation<br>(selective),site<br>visits|Continuous<br>spatial<br>coverage,<br>multi-<br>parameter<br>data|Stability<br>classification,<br>remediation<br>recommendations|Slope failure,<br>infrastructure<br>damage|Early<br>detection of<br>instability<br>patterns|
|Safety Ofcers|Worker safety,<br>regulatory<br>compliance|Manual checks,<br>gas monitoring|Ground<br>movement<br>warnings,<br>sensor<br>health status|Evacuation<br>orders,work<br>stoppage|Injury/death,<br>regulatory<br>penalties|Actionable<br>alerts with<br>confidence<br>levels|
|DGMS<br>Regulators|Enforcement of<br>safety<br>regulations,<br>accident<br>prevention|Inspections,<br>incident reports|Continuous<br>compliance<br>data,early<br>risk<br>indicators|Enforcement<br>actions,<br>regulatory<br>updates|Accidents,<br>public trust<br>loss|Proactive risk<br>monitoring,<br>data-driven<br>regulation|
|Nearby<br>Communities|Home safety,<br>livelihood<br>protection|Visual<br>observation,<br>word-of-mouth|Objective<br>risk<br>information,<br>warning<br>time|Evacuation,<br>relocation<br>decisions|Property<br>damage,<br>displacement,<br>injury|Trustworthy<br>warnings with<br>lead time for<br>action|
|Farmers|Agricultural<br>land damage,<br>crop loss|Visual<br>inspection a�er<br>damage|Early soil<br>movement<br>detection,<br>drainage<br>impact|Crop planning,<br>land use changes|Reduced<br>yield,land<br>abandonment|Time for<br>mitigation<br>(drainage,soil<br>management)|
|Infrastructure<br>Owners (roads,<br>railways,<br>buildings)|Structural<br>damage,service<br>disruption|Periodic<br>structural<br>surveys|Continuous<br>deformation<br>monitoring,<br>threshold<br>alerts|Maintenance<br>scheduling,trafic<br>management|Structural<br>failure,<br>service<br>interruption|Planned<br>intervention<br>before critical<br>damage|



|Stakeholder|Problem|Current Method|Missing<br>Information|Decision<br>Required|Consequence|Value of Early<br>Warning|
|---|---|---|---|---|---|---|
|Environmental<br>Authorities|Ecosystem<br>degradation,<br>water<br>contamination|Periodic<br>environmental<br>audits|Continuous<br>subsidence-<br>environment<br>correlation|Remediation<br>requirements,<br>monitoring<br>mandates|Long-term<br>ecological<br>damage|Early<br>intervention<br>for<br>environmental<br>protection|
|Emergency<br>Responders|Rescue<br>operations,<br>disaster<br>management|Post-incident<br>response|Pre-incident<br>risk maps,<br>real-time<br>alerts|Resource<br>positioning,<br>evacuation<br>planning|Delayed<br>response,<br>higher<br>casualties|Situational<br>awareness,<br>pre-<br>positioned<br>resources|



## 2.2 Decision-Making Requirements 

### Critical decisions requiring early warning: 

1. Evacuation: When to move workers/residents from at-risk areas 

2. Operational changes: When to modify mining sequence or rate 

3. Infrastructure protection: When to reinforce or restrict access 

4. Land-use planning: When to restrict development in subsidence-prone areas 

5. Emergency preparedness: When to pre-position rescue resources 

### Warning system requirements: 

- Lead time: Hours to days (not seconds) 

- Confidence: Clear uncertainty quantification 

- Explainability: Which sensors, what patterns, why risk increased 

- Actionability: Clear risk levels (NORMAL → WATCH → WARNING → CRITICAL) 

- Reliability: Low false-alarm rate to maintain credibility 

## PART 3 — INDIAN CONTEXT 

## 3.1 Indian Coalfields 

Major underground coal mining regions: 

   - Jharia Coalfield (Jharkhand): Largest, deep seams, high subsidence risk 

   - Raniganj Coalfield (West Bengal): Old mines, complex geology 

   - Singrauli Coalfield (MP/UP): Thick seams, significant subsidence 

   - Korba Coalfield (Chhattisgarh): Active underground mining 

   - Talcher Coalfield (Odisha): Deep mining operations 

   - Wardha Valley (Maharashtra): Smaller operations 

- Geological characteristics: 

- Seam depth: 100-600 m (varies by coalfield) 

- Seam thickness: 1-10 m (thicker in Singrauli, Korba) 

- Overburden: Sandstone, shale, clay sequences 

- Groundwater: O�en high, complicates mining 

- Faulting: Common in Jharia, Raniganj 

## 3.2 Underground Mining Practices 

### Predominant methods: 

1. Bord-and-pillar: Most common, leaves pillars for support 

   - Extraction ratio: 30-50% initially, pillar extraction later 

   - Subsidence: Delayed, occurs during pillar extraction 

2. Longwall (limited): Higher extraction, predictable subsidence 

   - Extraction ratio: 80-90% 

Subsidence: Continuous, follows face advance 

### Subsidence characteristics in Indian conditions: 

- Delayed subsidence: Years a�er extraction due to pillar degradation 

- Step-like subsidence: Discontinuous movement along faults/weak planes 

- Trough asymmetry: Due to geological heterogeneity 

- Monsoon effects: Water infiltration accelerates deformation 

## 3.3 Environmental Conditions 

### Monsoon impact (June-September): 

- Increased pore pressure: Reduces effective stress, accelerates deformation 

- Soil saturation: Changes sensor mounting stability 

- Power disruptions: Affects continuous monitoring 

- Access difficulties: Limits manual inspection 

### Temperature: 

- Summer: 35-45 °C (affects sensor dri�, battery life) 

- Winter: 10-25 °C 

- Diurnal variation: 10-15 °C (causes thermal expansion effects) 

### Soil conditions: 

- Alluvial plains: So�, high subsidence transmission 

- Hard rock areas: Localized, step-like subsidence 

- Weathered overburden: Time-dependent creep 

## 3.4 Infrastructure Constraints 

### Power availability: 

- Grid power: Unreliable in remote mining areas 

- Outages: Frequent, especially during monsoon 

- Solution: Solar + battery backup essential 

### Connectivity: 

- Cellular: 2G/3G/4G available but unreliable 

- Internet: O�en unavailable at remote sites 

- Solution: Offline-first architecture mandatory 

### Maintenance: 

- Skilled technicians: Limited availability 

- Spare parts: Supply chain delays 

- Environment: Dust, moisture, vibration degrade equipment 

- Solution: Ruggedized, low-maintenance design 

## 3.5 Cost Constraints 

### Indian mining economics: 

- Cost sensitivity: High (compared to developed countries) 

- Budget allocation: Safety monitoring competes with production investment 

- Acceptable cost/node: ₹15,000-₹30,000 for widespread deployment 

- Maintenance budget: Limited, favors low-maintenance solutions 

### Why India-specific solution differs: 

1. Lower cost tolerance: Cannot deploy expensive Western systems at scale 

2. Harsher environment: Monsoon, dust, temperature extremes 

3. Connectivity gaps: Must work offline for extended periods 

4. Maintenance limitations: Must be robust, self-diagnosing 

5. Scale: Large coalfields require hundreds/thousands of nodes 

6. Regulatory context: DGMS requirements, compliance culture 

## PART 4 — EXISTING SOLUTIONS 

## 4.1 Conventional Methods 

|Method|Accuracy|Cost|Coverage|Temporal<br>Resolution|Latency|Limitations|
|---|---|---|---|---|---|---|
|Manual<br>inspection|Subjective|Low|Sparse|Periodic<br>(weekly-<br>monthly)|Days|Labor-intensive,<br>subjective,misses<br>rapid changes|
|Levelling<br>surveys|±1mm|Medium|Point<br>measurements|Periodic<br>(monthly)|Days-<br>weeks|Requires line-of-sight,<br>slow,expensive for<br>dense coverage|
|Total station|±1-2mm|High|Point<br>measurements|Periodic|Hours-<br>days|Requires skilled<br>operator,weather-<br>dependent|
|GNSS<br>(static)|±2-5mm|High|Point<br>measurements|Continuous(if<br>permanent)|Minutes-<br>hours|High cost per point,<br>requires clear sky view|
|Crack<br>surveys|±1mm|Low|Localized|Periodic|Days|Manual,subjective,<br>reactive|



## 4.2 Remote Sensing 

|Method|Accuracy|Cost|Coverage|Temporal<br>Resolution|Latency|Limitations|
|---|---|---|---|---|---|---|
|InSAR(Sentinel-<br>1)|±5-10<br>mm|Medium<br>(processing)|Regional<br>(10×·10<br>km)|6-12days|Days-<br>weeks|Atmospheric efects,<br>temporal gaps,<br>expensive processing<br>[web:9]|
|InSAR<br>(commercial)|±1-3mm|High|Regional|1-3days|Days|Very expensive,not<br>real-time|
|LiDAR(airborne)|±5-10cm|Very high|Local-<br>regional|Periodic<br>(campaign)|Weeks|Expensive,weather-<br>dependent,not<br>continuous|
|UAV<br>photogrammetry|±2-5cm|Medium|Local<br>(panel-<br>scale)|Periodic<br>(weekly)|Hours-<br>days|Weather-dependent,<br>regulatory<br>restrictions,not<br>continuous|
|Satellite imagery|±10-50<br>cm|Low-medium|Regional|1-5days|Days|Low accuracy,cloud<br>cover issues|



Key limitation for early warning: All remote sensing methods have temporal gaps (days to weeks) that prevent detection of rapid deformation acceleration [web:7][web:8]. 

## 4.3 IoT/Sensor Systems 

|Sensor Type|Accuracy|Cost|Measurement|Limitations|
|---|---|---|---|---|
|Tilt(MEMS)|±0.01-0.1mm/m|Low(₹2,000-<br>₹10,000)|Angular change|Temperature dri�,mounting<br>sensitivity|



|Sensor Type|Accuracy|Cost|Measurement|Limitations|
|---|---|---|---|---|
|IMU(6-axis)|±0.01-0.1mm/m(tilt),<br>±0.01g(accel)|Low-medium|Tilt+vibration|Requires fusion,dri�over<br>time|
|Accelerometer|±0.001-0.01g|Low|Vibration,dynamic<br>motion|Cannot measure static tilt<br>alone|
|Strain gauge|±1-10microstrain|Medium|Linear strain|Installation complexity,<br>temperature sensitivity|
|Displacement<br>(LVDT)|±0.01-0.1mm|Medium|Linear displacement|Requires fixed reference<br>points|
|Crack meter|±0.1-1mm|Medium|Crack opening|Localized,installation<br>required|
|GNSS(low-cost)|±10-50mm|Medium|Absolute position|Requires clear sky,multipath<br>errors|
|Environmental(T,<br>H,P)|±0.5 °C, ±2%RH|Very low|Temperature,<br>humidity,pressure|Compensation,not direct<br>deformation|



Research findings: IoT systems show promise but face challenges with sensor dri�, environmental interference, false alarms, and lack of sensor-fault detection [web:11][web:13] [web:14]. 

## 4.4 AI Approaches 

|Approach|Accuracy|Data<br>Requirement|Explainability|Computational<br>Cost|Suitability|
|---|---|---|---|---|---|
|Statistical<br>thresholds|Low-<br>medium|Minimal|High|Very low|Baseline,simple<br>anomalies|
|Classical ML(RF,<br>XGBoost)|Medium-<br>high|Moderate(100s-<br>1000s samples)|Medium|Low-medium|Forecasting,<br>classification[web:11]|
|Deep learning<br>(LSTM,GRU)|Medium-<br>high|Large(1000s-<br>10000s samples)|Low|High|Time-series forecasting<br>if data available[web:9]|
|Autoencoders|Medium|Moderate|Low|Medium|Unsupervised anomaly<br>detection[web:31]<br>[web:34]|
|Graph neural<br>networks|Potentially<br>high|Very large|Very low|High|Spatial modeling<br>(research stage)|
|Physics-guided<br>ML|Medium-<br>high|Moderate|Medium|Medium|Best practice emerging<br>[web:11]|



Key insight: Recent reviews emphasize that classical ML (Random Forest, XGBoost) o�en matches deep learning with less data and better explainability, while physics-guided approaches improve generalization [web:11]. 

## 4.5 Comparative Summary 

|Dimension|Conventional|Remote Sensing|IoT Sensors|AI-Enhanced IoT|
|---|---|---|---|---|
|Cost|Low-medium|Medium-high|Low|Low-medium|
|Coverage|Sparse|Regional|Dense(if deployed)|Dense|
|Temporal<br>resolution|Periodic|Days-weeks|Continuous(seconds-<br>minutes)|Continuous|
|Latency|Days-weeks|Days|Seconds-minutes|Seconds-minutes|
|Real-time<br>capability|No|No|Yes|Yes|
|Power<br>requirement|Manual|Satellite|Low(battery possible)|Low-medium|
|Deployment<br>difculty|Low|N/A(service)|Medium|Medium-high|
|Expertise required|Medium|High|Medium|High|
|Reliability|High(but<br>slow)|Medium(weather-<br>dependent)|Medium(dri�,faults)|Medium(depends on<br>validation)|
|Limitations|Slow,sparse|Temporal gaps,cost|Dri�,false alarms|Data requirements,<br>validation|



## PART 5 — EXISTING PRODUCTS, RESEARCH & PATENTS 

## 5.1 Research Papers 

Key recent studies: 

1. Hung et al. (2025): Near real-time subsidence monitoring with AI forecasting using extensometer data. Demonstrated improved short-term prediction but required highfrequency, high-quality data [web:7][web:8]. 

2. Displacement time-series forecasting (2025): Compared ML and deep learning methods on InSAR data. Found classical methods competitive with deep learning when data limited [web:9]. 

3. AI in mining geo-hazards (2026): Comprehensive survey showing AI applications in subsidence, landslides, but emphasized need for physics-guided approaches and validation [web:11]. 

4. AIOT predictive safety framework (2026): Proposed Indian context framework combining PINNs, wearable sensors, digital twins. Conceptual, not yet validated in mines [web:12]. 

5. Smart mine IoT systems (2026): Multiple papers on gas monitoring, environmental sensing, but limited focus on subsidence-specific deformation monitoring [web:13][web:14][web:15]. 

## 5.2 Commercial Systems 

### International: 

- Trimble GNSS monitoring: High-precision, high-cost (₹5-10 lakh per point) 

- Leica Geosystems: Total station and GNSS solutions for deformation monitoring 

- Riegl LiDAR: Airborne and terrestrial scanning (very high cost) 

- GroundMetrics: Deep earth monitoring (specialized, expensive) 

### Indian: 

- CMRI (Central Mining Research Institute): Research on subsidence monitoring, but limited commercial products 

- Private survey companies: Offer periodic InSAR, UAV, total station services 

- IoT startups: Emerging companies offering sensor-based monitoring, but few subsidencespecific 

Gap: No low-cost, continuous, real-time subsidence monitoring system specifically designed for Indian underground coal mines. 

## 5.3 Patents 

### Search approach: 

- Keywords: "mine subsidence monitoring", "ground deformation sensor network", "tilt sensor mesh", "early warning subsidence" 

- Databases: Google Patents, USPTO, WIPO, Indian Patent Office 

### Representative patents (not exhaustive): 

- US patents: Several on subsidence monitoring using InSAR, GNSS, but not low-cost IoT mesh 

- Indian patents: Limited on subsidence-specific IoT systems 

- Key finding: No dominant patent blocking low-cost sensor mesh approach 

Important: This is not a comprehensive patent search. A formal freedom-to-operate analysis would require professional patent attorney review. 

## 5.4 Government Projects 

### Indian initiatives: 

- Ministry of Coal safety programs: Funding for modern monitoring technologies [web:18] [web:21] 

- DGMS modernization: Encouraging adoption of Total Stations, 3D TLS, slope stability radar [web:21][web:22] 

- Smart Mine initiatives: Industry 4.0 in mining, but focus on automation, gas monitoring, not subsidence 

### International: 

- EU Horizon projects: Ground deformation monitoring, but not India-specific 

- US NIOSH: Mine safety research, limited subsidence focus 

- Australia: Longwall subsidence research, but different geology 

## 5.5 Research Gaps Identified 

1. Low-cost continuous monitoring: Gap between expensive high-precision and manual methods 

2. Dense surface sensing: Most systems sparse (point measurements), not area coverage 

3. Sensor fusion: Limited work combining tilt, vibration, displacement, environmental data 

4. Sensor health: Most systems assume sensors work correctly, no explicit fault detection 

5. Offline operation: Cloud-dependent architectures fail in connectivity gaps 

6. Uncertainty quantification: Most AI models provide point predictions without confidence 

7. Explainability: Black-box models not trusted for safety-critical decisions 

8. Indian-specific validation: Limited field data from Indian coalfields 

## PART 6 — WHY EXISTING SOLUTIONS ARE NOT ENOUGH 

## 6.1 Evidence-Backed Limitations 



<!-- Start of picture text -->
Proposed Validation<br>Limitation Evidence Why It Occurs Consequence<br>Mitigation Method<br>DGMS<br>guidelines<br>acknowledge Manual surveys<br>Misses rapid Compare<br>Periodic need for expensive, remote Continuous IoT<br>deformation detection<br>monitoring modern sensing has revisit sensing<br>acceleration latency<br>continuous time<br>monitoring<br>[web:21]<br>GNSS/total<br>station cost Misses localized<br>Limited spatial limits - deformation Low-cost dense Spatial<br>High per point cost interpolation<br>density deployment to between mesh<br>error analysis<br>few points sensors<br>[web:21]<br>Commercial<br>systems cost Precision hardware, Cannot scale to ₹15,000-₹30,000 Cost-benefit<br>High cost installation, mine-wide<br>₹5-10 lakh per per node analysis<br>maintenance coverage<br>point<br>Visual<br>Inter-rater<br>inspection Automation Subjective,<br>Manual Automated reliability vs.<br>remains perceived as inconsistent,<br>dependency sensing + AI sensor<br>common expensive/unreliable delayed<br>consistency<br>practice<br><!-- End of picture text -->

|Limitation|Evidence|Why It Occurs|Consequence|Proposed<br>Mitigation|Validation<br>Method|
|---|---|---|---|---|---|
|Communication<br>problems|Mining areas<br>have poor<br>connectivity|Remote locations,<br>terrain,infrastructure|Data loss,<br>delayed<br>warnings|Ofline-first,<br>local storage,<br>mesh|Packet delivery<br>ratio,ofline<br>warning tests|
|Sensor dri�|MEMS sensors<br>dri�with<br>temperature,<br>time|Physical limitations of<br>MEMS technology|False trends,<br>missed<br>detections|Temperature<br>compensation,<br>health<br>monitoring,<br>fusion|Controlled<br>temperature<br>chamber tests|
|Environmental<br>interference|Rain,<br>temperature,<br>vibration afect<br>readings|Mining environment<br>harsh|Noise masks<br>true<br>deformation|Environmental<br>sensors,robust<br>filtering|Correlation<br>analysis with<br>environmental<br>data|
|False alarms|Literature cites<br>false alarm<br>problem in<br>monitoring<br>systems<br>[web:11]|Noise,sensor faults,<br>overly sensitive<br>thresholds|Loss of<br>credibility,<br>alarm fatigue|Multi-sensor<br>consensus,<br>persistence,<br>uncertainty|False alarm<br>rate<br>measurement|
|Missed<br>detections|No system<br>claims100%<br>detection|Limited sensitivity,<br>sparse coverage|Undetected<br>hazardous<br>deformation|Dense coverage,<br>multi-parameter<br>fusion|Detection rate<br>on known<br>events|
|Cloud<br>dependency|Many IoT<br>systems<br>require<br>continuous<br>internet|Architecture design<br>choice|System fails<br>during outages|Edge<br>processing,<br>local alerts|Ofline<br>operation tests|
|Power<br>limitations|Battery-<br>powered<br>nodes have<br>finite life|Energy constraints in<br>remote areas|Node failure,<br>data gaps|Solar+battery,<br>low-power<br>design|Power<br>consumption<br>measurement,<br>uptime|
|Maintenance<br>difculty|Remote<br>locations,<br>harsh<br>environment|Practical deployment<br>challenges|System<br>degradation<br>over time|Self-diagnosis,<br>modular<br>replacement|MTBF<br>measurement,<br>maintenance<br>logs|
|Lack of sensor<br>fusion|Most systems<br>use single<br>sensor type|Simplicity,cost|Limited<br>information,<br>higher<br>uncertainty|Multi-sensor<br>fusion(tilt+<br>vibration+<br>environmental)|Fusion vs.<br>single-sensor<br>comparison|
|Lack of<br>prediction|Most systems<br>reactive<br>(threshold-<br>based)|Dificulty of<br>forecasting|No lead time for<br>action|Time-series<br>forecasting<br>(ARIMA,<br>XGBoost)|Forecast<br>accuracy,lead<br>time<br>measurement|
|Lack of<br>explainability|Deep learning<br>models are<br>black boxes|Model complexity|Operators don't<br>trust alerts|Feature<br>importance,<br>SHAP,rule-<br>based risk|User trust<br>surveys,<br>decision<br>quality|



|Limitation|Evidence|Why It Occurs|Consequence|Proposed<br>Mitigation|Validation<br>Method|
|---|---|---|---|---|---|
|Lack of<br>uncertainty|Point<br>predictions<br>without<br>confidence|Model limitations|Overconfidence<br>in predictions|Prediction<br>intervals,<br>conformal<br>prediction|Calibration<br>plots,<br>uncertainty<br>coverage|
|Poor scalability|Architecture<br>not designed<br>for1000s of<br>nodes|Early-stage systems|Cannot expand<br>to full mine|Modular<br>architecture,<br>eficient<br>protocols|Scalability<br>tests(10 → 100<br>→ 1000nodes)|
|Limited ofine<br>operation|Cloud-first<br>design|Assumption of<br>connectivity|System failure<br>during outages|Edge AI,local<br>storage,local<br>alerts|Ofline<br>functionality<br>tests|



## 6.2 Critical Analysis 

### Not just "existing systems are expensive": 

The fundamental issue is a mismatch between monitoring capabilities and decision-making requirements: 

1. Decision-makers need: Continuous, reliable, explainable, actionable information with uncertainty 

2. Existing systems provide: Periodic, sparse, expensive, black-box predictions with unknown reliability 

### Root causes: 

- Technology designed for developed-country contexts (reliable power, connectivity, maintenance) 

Focus on measurement accuracy rather than decision quality 

AI added for novelty rather than validated improvement 

- Lack of sensor-health awareness leads to false alarms 

- Cloud dependency creates single point of failure 

### Our approach: 

- Design for Indian constraints from the start (power, connectivity, maintenance, cost) 

- Prioritize decision quality over measurement precision 

- Validate AI improvement over baselines 

- 

- Explicit sensor health monitoring 

- Offline-first architecture 

PART 7 — RESEARCH GAP 

## 7.1 Identified Gaps 

|Gap|Impact|Evidence|Novelty|Feasibility|SIH<br>Value|
|---|---|---|---|---|---|
|Low-cost continuous monitoring|High|Cost limits deployment density<br>[web:21]|Medium|High|High|
|Dense surface sensing|High|Sparse coverage misses<br>localized deformation|Medium|High|High|
|Relative deformation through<br>neighbor consensus|High|Spatial patterns more robust<br>than single-point|High|Medium|Very<br>High|
|Multi-sensor fusion(tilt+<br>vibration+environmental)|Medium|Single sensors limited[web:11]|Medium|High|High|
|Wireless mesh for subsidence|Medium|Most IoT systems star topology|Medium|High|High|
|Edge AI for anomaly detection|Medium|Cloud dependency<br>problematic|Medium|High|High|
|Early anomaly detection(before<br>threshold)|High|Threshold systems reactive|Medium|Medium|Very<br>High|
|Spatio-temporal modelling|High|Spatial+temporal patterns<br>more informative|Medium|Medium|High|
|Forecasting with uncertainty|High|Point predictions<br>overconfident|Medium|Medium|High|
|Sensor-health monitoring|High|Sensor faults cause false<br>alarms|High|High|Very<br>High|
|Ofine-frst architecture|High|Connectivity gaps in mining<br>areas|Medium|High|High|
|GIS risk mapping with real-time<br>data|Medium|Static maps not dynamic|Low|High|Medium|
|Physics-guided AI|Medium|Pure data-driven models<br>generalize poorly[web:11]|Medium|Medium|Medium|
|Adaptive sensing|Low|Nice-to-have,not essential|Medium|Medium|Low|



## 7.2 Gap Ranking 

Top 5 gaps by SIH value: 

1. Relative deformation through neighbor consensus (Novelty: High, Feasibility: Medium, Impact: High) 

2. Sensor-health monitoring (Novelty: High, Feasibility: High, Impact: High) 

3. Low-cost continuous monitoring (Novelty: Medium, Feasibility: High, Impact: High) 

4. Early anomaly detection with uncertainty (Novelty: Medium, Feasibility: Medium, Impact: High) 

5. Offline-first architecture (Novelty: Medium, Feasibility: High, Impact: High) 

Rationale: 

- Gaps 1 and 2 are genuinely innovative and defensible 

- Gaps 3 and 5 address practical Indian constraints 

- Gap 4 improves decision quality over threshold-only systems 

## PART 8 — 360-DEGREE SOLUTION ANALYSIS 

## 8.1 Physical Layer 

Ground movement characteristics: 

- Magnitude: 0.5-3 m vertical, 0.1-1 m horizontal (over months-years) 

- Rate: 1-100 mm/day (accelerates near failure) 

- Spatial scale: 100-1000 m (panel-scale) 

- Temporal scale: Months to years (gradual), hours to days (acceleration) 

### Sensor placement strategy: 

- Grid pattern: 20-50 m spacing (depends on expected trough width) 

- Critical locations: Above panel edges (maximum tilt), infrastructure, settlements 

- Reference nodes: Outside subsidence zone (for relative measurements) 

- Redundancy: Overlapping coverage for fault tolerance 

### Calibration requirements: 

- Initial calibration: Level sensors, record baseline 

- Periodic recalibration: Every 3-6 months (or a�er major events) 

- Self-calibration: Use environmental sensors for dri� compensation 

## 8.2 Hardware Layer 

Sensor node components: 

- Microcontroller: ESP32 (prototype), industrial MCU (deployment) 

- Tilt sensor: MEMS IMU (MPU6050, ICM20948) or dedicated tilt sensor 

- Vibration: 3-axis accelerometer (same IMU) 

- Environmental: BME280 (temperature, humidity, pressure) 

- Displacement: Simple mechanical linkage + potentiometer (optional) 

- Crack: Wire extensometer (optional) 

- GNSS: NEO-6M (optional, for absolute position) 

- Communication: LoRa module (SX1276/SX1262) 

Power: Li-ion battery (2000-5000 mAh) + solar panel (2-5 W) 

Enclosure: IP65-rated, UV-resistant 

### Gateway components: 

- Processor: Raspberry Pi 4 or industrial gateway 

- Storage: 32-128 GB SD card or SSD 

- Communication: LoRa concentrator, Ethernet/Wi-Fi/cellular backhaul 

- Edge AI: Can run TensorFlow Lite, scikit-learn models 

- Power: Mains + UPS backup 

## 8.3 Communication Layer 

### Technology comparison: 

|Technology|Range|Power|Latency|Mesh|Cost|Suitability|
|---|---|---|---|---|---|---|
|LoRa(custom<br>mesh)|1-5km(rural)|Very<br>low|Seconds|Yes|Low|Recommended|
|LoRaWAN|2-10km|Very<br>low|Seconds|No<br>(star)|Low|Not suitable(no<br>mesh)|
|Zigbee|10-100m|Low|<1s|Yes|Low|Range too short|
|Wi-Fi Mesh|50-200m|High|<100ms|Yes|Medium|Power too high|
|BLE Mesh|10-50m|Very<br>low|<1s|Yes|Low|Range too short|
|Cellular(NB-IoT)|km(tower-<br>dependent)|Medium|Seconds|No|Medium|Cost,coverage issues|



### Selected architecture: 

   - Custom LoRa mesh: Long range, low power, mesh capability 

   - Protocol: Custom routing (not LoRaWAN) to enable mesh 

   - Topology: Multi-hop mesh to gateway 

   - Data rate: 1-10 packets/node/hour (configurable, higher during events) 

- Important: Standard LoRaWAN is star-of-stars, not mesh. A custom mesh protocol is required. [web:24][web:35] 

## 8.4 Data Layer 

### Data collection: 

- Sampling rate: 1 Hz (sensor), aggregated to 1 packet/minute-hour 

- Packet contents: Timestamp, node ID, tilt (x,y,z), acceleration, temperature, humidity, battery, RSSI 

- Synchronization: Gateway time sync (NTP if available, otherwise internal clock) 

Data cleaning: 

- Outlier removal: Statistical filters (median, IQR) 

- Missing data: Interpolation (short gaps), flagging (long gaps) 

- Noise reduction: Low-pass filtering (cut-off based on expected deformation rate) 

### Data storage: 

- Edge (gateway): SQLite or InfluxDB (time-series) 

- Cloud (optional): PostgreSQL + PostGIS, or cloud time-series database 

- Retention: Edge (30-90 days), Cloud (indefinite) 

## 8.5 AI Layer 

### Anomaly detection: 

- Baseline: Rolling statistics (mean, std), rate-of-change thresholds 

- Classical ML: Isolation Forest (unsupervised, works with limited data) 

- Deep learning: Autoencoder (if sufficient data available) 

- Selection: Start with Isolation Forest, add autoencoder if data justifies 

### Sensor fusion: 

- Method: Extended Kalman Filter (EKF) 

- State: Tilt, tilt rate, temperature-compensated tilt 

- Measurements: IMU tilt, accelerometer, temperature 

- Output: Fused tilt estimate with uncertainty 

### Prediction: 

- Baseline: ARIMA (statistical, interpretable) 

- ML: XGBoost (if improvement over ARIMA demonstrated) 

- Deep learning: LSTM/GRU (only if large dataset available) 

- Selection: ARIMA + XGBoost ensemble 

### Risk classification: 

- Approach: Rule-based + Random Forest 

- Features: Current tilt, tilt rate, spatial consensus, temporal trend, uncertainty 

- Output: Risk level (NORMAL, WATCH, WARNING, CRITICAL) with confidence 

### Explainability: 

- Feature importance: SHAP values for ML models 

- Rule tracing: Which rules triggered risk level 

- Spatial visualization: Which nodes contributing to risk 

### Uncertainty: 

- Prediction intervals: Quantile regression, conformal prediction 

- Sensor uncertainty: From EKF covariance 

- Model uncertainty: Ensemble variance, dropout uncertainty 

## 8.6 Spatial Layer 

### GIS architecture: 

- So�ware: QGIS (desktop), Leaflet/MapLibre (web) 

- Database: PostGIS (cloud), GeoJSON (edge) 

- Layers: Mine panels, sensor locations, deformation contours, risk zones 

### Spatial analysis: 

- Interpolation: IDW (Inverse Distance Weighting), Kriging (if sufficient data) 

- Deformation maps: Tilt magnitude, tilt direction, displacement vectors 

- Risk zones: Color-coded based on risk level 

- Temporal animation: Time-lapse of deformation progression 

## 8.7 Edge Layer 

### Local processing: 

- Filtering: Real-time sensor data filtering 

- Fusion: EKF sensor fusion 

- Anomaly detection: Isolation Forest inference 

- Alerting: Local warning generation (LED, buzzer, SMS if cellular available) 

### Local AI: 

- Framework: TensorFlow Lite Micro (ESP32), scikit-learn (gateway) 

- Models: Pre-trained anomaly detection, forecasting 

- Update: OTA (Over-The-Air) model updates 

### Local alerts: 

- Triggers: Risk level exceeds threshold 

- Actions: LED indicator, buzzer, local log, SMS (if available) 

- Independence: Works without internet 

## 8.8 Cloud Layer 

### Synchronization: 

- Frequency: Every 5-15 minutes (when connectivity available) 

- Data: Aggregated sensor data, alerts, system health 

- Conflict resolution: Timestamp-based merging 

Historical analytics: 

- Trends: Long-term deformation trends 

- Correlation: Mining activity vs. deformation 

- Reporting: Automated reports for management, regulators 

### Multi-mine management: 

- Dashboard: Central view of all mines 

- Benchmarking: Compare subsidence across mines 

- Model training: Centralized model improvement 

## 8.9 Security Layer 

### Device authentication: 

- Method: Unique device ID + pre-shared key 

- Protocol: Mutual authentication (device ↔ gateway) 

### Encryption: 

- Communication: AES-128 (LoRa), TLS (cloud) 

- Storage: Encrypted database (sensitive data) 

### Data integrity: 

- Checksums: Packet-level CRC 

- Signatures: Alert message signing 

### Access control: 

- Roles: Operator, engineer, administrator 

- Permissions: View, configure, override 

### Firmware security: 

- Signing: Firmware updates cryptographically signed 

- Rollback: Prevent downgrade attacks 

## 8.10 Human Layer 

### Operator workflow: 

1. Dashboard view: Real-time sensor status, risk map 

2. Alert notification: SMS, email, dashboard alert 

3. Investigation: Click alert → view sensor data, trends, explanation 

4. Decision: Acknowledge, escalate, dispatch inspection 

5. Documentation: Log actions, outcomes 

### Alert design: 

- Risk levels: NORMAL (green), WATCH (yellow), WARNING (orange), CRITICAL (red) 

- Information: Location, risk level, confidence, contributing sensors, trend 

- Action guidance: Suggested response for each level 

### Usability: 

- Interface: Simple, clear, mobile-friendly 

- Training: Minimal training required 

- Language: English + local language (Hindi, regional) 

## 8.11 Economic Layer 

### Cost analysis (detailed in Part 27): 

- Prototype node: ₹8,000-₹15,000 

- Deployment node: ₹15,000-₹30,000 

- Gateway: ₹20,000-₹50,000 

- Installation: ₹2,000-₹5,000 per node 

- Maintenance: ₹1,000-₹2,000 per node per year 

### Business model: 

- Hardware sale: One-time node purchase 

- So�ware subscription: Cloud dashboard, analytics (optional) 

- Maintenance contract: Annual service agreement 

- Target customers: Coal India subsidiaries, private mining companies 

## 8.12 Environmental Layer 

Power: 

- Consumption: 10-50 mW average (duty-cycled) 

- Battery: 2000-5000 mAh Li-ion (months of operation) 

- Solar: 2-5 W panel (indefinite operation in most conditions) 

### Sustainability: 

- Materials: Recyclable electronics, minimal hazardous materials 

- Lifetime: 3-5 years (battery replacement possible) 

- Disposal: E-waste compliance 

### Environmental robustness: 

- Temperature: -10 to 60 °C operating range 

- Humidity: 0-95% RH (non-condensing) 

- Ingress: IP65 rating (dust, water jets) 

UV resistance: UV-stable enclosure 

## 8.13 Legal/Regulatory Layer 

### Mining safety regulations: 

- DGMS oversight: Directorate General of Mines Safety [web:16][web:19] 

- Coal Mines Regulations 2017: Safety monitoring requirements [web:16] 

- Compliance: System should support regulatory reporting 

### Data requirements: 

- Retention: Minimum 5 years (recommended) 

- Access: Regulators may require access 

- Privacy: Worker data (if any) must be protected 

### Industrial certification: 

- Current: Not required for SIH prototype 

- Future: May require DGMS approval, industrial safety certification 

- Standards: IEC, ISO standards for industrial monitoring systems 

## 8.14 Business Layer 

### Deployment model: 

- Pilot: 10-20 nodes at single panel 

- Expansion: 100-500 nodes at mine 

- Scale: Multiple mines, multiple coalfields 

### Customers: 

- Primary: Coal India Limited (CIL) subsidiaries 

- Secondary: Private mining companies 

- Tertiary: Regulatory bodies, research institutions 

### Maintenance: 

- Responsibility: Mining company (trained staff ) or vendor contract 

- Frequency: Quarterly inspection, battery replacement (2-3 years) 

- Support: Remote diagnostics, on-site repair 

### Commercial scalability: 

- Manufacturing: Contract manufacturing in India 

- Supply chain: Local component sourcing where possible 

- Support: Regional service centers 

## 8.15 Future Layer (5-10 Year Viability) 

### Hardware longevity: 

- ESP32: Will be replaced by newer MCUs (pin-compatible preferred) 

- Sensors: MEMS technology improving, backward compatibility desirable 

- Communication: LoRa stable, 5G NB-IoT emerging 

### Upgradeability: 

- Sensors: Modular sensor boards (swap without replacing node) 

- Communication: Modular radio (LoRa → 5G when appropriate) 

- Edge hardware: Gateway compute can be upgraded independently 

- AI models: OTA updates, model versioning 

### Emerging technology integration: 

- Satellite: Integrate InSAR data with ground sensors 

- UAV: Periodic UAV surveys for validation 

- GNSS: Add low-cost GNSS for absolute position 

- Advanced AI: Graph neural networks, transformers (if data justifies) 

### Stable vs. Upgradeable: 



<!-- Start of picture text -->
Stable (Core Platform) Upgradeable (Modules)<br>Data model Sensors<br>APIs Communication modules<br>Risk-scoring framework Edge hardware<br>GIS integration AI models<br>Alert protocol So�ware features<br>Security architecture Data sources<br><!-- End of picture text -->

## PART 9 — CORE WIRELESS SURFACE MESH INNOVATION 

## 9.1 Concept 

Distributed low-cost sensor nodes deployed across the surface above underground mine panels. 

Each node measures: 

- Tilt (x, y, z axes) 

- Vibration (3-axis acceleration) 

- Temperature, humidity 

- Optional: displacement, crack, GNSS 

Key innovation question: Can neighboring nodes provide more value than isolated nodes? 

## 9.2 Hypothesized Benefits of Neighboring Node Analysis 

|Benefit|Mechanism|Testable?|
|---|---|---|
|Relative movement detection|Compare tilt/displacement between adjacent nodes|Yes|
|Diferential displacement|Subtract node positions to get local strain|Yes|
|Diferential tilt|Compare tilt vectors to detect curvature|Yes|
|Spatial deformation patterns|Identify coherent spatial structures(trough,crack)|Yes|
|Crack propagation|Sequential node alerts along crack path|Yes|
|Coordinated anomalies|Multiple nodes agreeing reduces false alarms|Yes|
|Fault tolerance|If one node fails,neighbors provide context|Yes|



## 9.3 Critical Analysis 

### Do not assume relative measurements are automatically superior: 

### Potential advantages: 

1. Common-mode noise rejection: Environmental effects (temperature, rainfall) affect multiple nodes similarly; differential measurement cancels common effects 

2. Spatial pattern recognition: Coherent deformation across multiple nodes more indicative of subsidence than isolated readings 

3. Fault detection: Node disagreeing with all neighbors likely faulty 

4. Strain estimation: Differential displacement between nodes approximates local strain 

### Potential limitations: 

1. Requires dense deployment: Nodes must be close enough to detect correlated deformation (spacing < deformation wavelength) 

2. Communication overhead: Inter-node communication increases power consumption 

3. Complexity: Spatial analysis more complex than single-node thresholds 

4. Mounting variability: Different mounting conditions create baseline differences 

## 9.4 Experimental Validation Plan 

### Test scenarios: 

1. Uniform tilt: Tilt platform with multiple nodes → all nodes should agree 

2. Localized deformation: Single node depressed → neighbors should show gradient 

3. Crack simulation: Nodes on either side of simulated crack → differential displacement 

4. Environmental noise: Temperature change, rainfall → common-mode effect 

5. Sensor fault: One node artificially dri�ed → neighbors should disagree 

Metrics: 

- Detection accuracy: Can spatial patterns distinguish deformation from noise? 

- False alarm reduction: Does neighbor consensus reduce false alarms? 

- Fault detection: Can faulty nodes be identified by neighbor disagreement? 

- Optimal spacing: What node density maximizes detection while minimizing cost? 

## 9.5 Recommended Approach 

### Phase 1 (SIH prototype): 

- Simple spatial consensus: If 3+ neighboring nodes exceed threshold → higher confidence 

- Basic differential tilt: Compare tilt vectors between adjacent nodes 

- Visualization: Show spatial patterns on GIS map 

### Phase 2 (pilot): 

   - Spatial interpolation: Kriging/IDW to create deformation contours 

   - Strain estimation: Compute approximate strain from differential displacement 

   - Pattern recognition: Identify trough, crack, localized deformation signatures 

- Phase 3 (mature): 

   - Graph-based modeling: Represent nodes as graph, use GNN for spatial analysis 

   - Physics-guided spatial models: Incorporate expected subsidence patterns 

   - Adaptive spacing: Optimize node density based on observed deformation 

- Conclusion: Spatial analysis through neighboring nodes is promising but must be experimentally validated. Start simple (consensus, basic differential), add complexity only if justified by data. 

## PART 10 — SENSOR FUSION 

## 10.1 Sensors to Fuse 

|Sensor|Measurement|Strength|Weakness|
|---|---|---|---|
|IMU(tilt)|Angular orientation|Direct tilt measurement|Temperature dri�,mounting sensitivity|
|Accelerometer|Dynamic acceleration|Vibration detection,motion|Cannot measure static tilt alone|
|Temperature|Ambient temperature|Compensation,context|Not direct deformation|
|Humidity|Ambient humidity|Environmental context|Not direct deformation|
|Displacement(optional)|Linear displacement|Direct displacement|Installation complexity|
|Crack(optional)|Crack opening|Direct crack measurement|Localized|
|GNSS(optional)|Absolute position|Absolute reference|Requires clear sky,multipath|



## 10.2 Fusion Methods Comparison 

|Method|Complexity|Data<br>Requirement|Uncertainty|Real-<br>time|Suitability|
|---|---|---|---|---|---|
|Statistical fusion<br>(weighted average)|Low|Minimal|No|Yes|Baseline|
|Kalman Filter(KF)|Medium|Minimal|Yes|Yes|Recommended|
|Extended KF(EKF)|Medium-<br>high|Minimal|Yes|Yes|Recommended<br>(nonlinear)|
|Unscented KF(UKF)|High|Minimal|Yes|Yes|Overkill for this<br>application|
|Bayesian fusion|Medium-<br>high|Moderate|Yes|Yes|Good but complex|
|Ensemble approaches|Medium|Moderate|Yes|Yes|Good for ML fusion|
|ML-based fusion<br>(neural net)|High|Large|No(unless<br>Bayesian NN)|Maybe|Not justified|



## 10.3 Selected Approach: Extended Kalman Filter (EKF) 

### Why EKF: 

1. Handles nonlinearities: Tilt representation (quaternions or Euler angles) is nonlinear 

2. Provides uncertainty: Covariance matrix gives estimate uncertainty 

3. Real-time: Recursive, suitable for embedded implementation 

4. Well-understood: Extensive literature, libraries available 

5. Sensor-health integration: Can detect sensor faults through innovation monitoring 

### EKF state vector: 

x = [tilt_x, tilt_y, tilt_z, tilt_rate_x, tilt_rate_y, tilt_rate_z, temp_bias] 

### Measurements: 

z = [IMU_tilt_x, IMU_tilt_y, IMU_tilt_z, accel_x, accel_y, accel_z, temperature] 

### Process model: 

tilt(t+dt) = tilt(t) + tilt_rate(t) * dt + process_noise tilt_rate(t+dt) = tilt_rate(t) + process_noise 

### Measurement model: 

IMU_tilt = tilt + measurement_noise accel = gravity_vector(tilt) + measurement_noise 

temperature = temp_bias + measurement_noise 

### Output: 

- Fused tilt estimate 

- Fused tilt rate estimate 

- 

- Temperature compensated tilt 

- Uncertainty (covariance matrix) 

## 10.4 Sensor-Health Integration 

### EKF innovation monitoring: 

- Innovation: Difference between predicted and actual measurement 

- Expected: Innovation should be zero-mean, covariance-matched 

- Fault detection: Large, persistent innovation indicates sensor fault 

### Fault types detectable: 

- Stuck sensor: Innovation variance drops to near-zero 

- Dri�: Innovation mean shi�s 

- Outliers: Large single-step innovation 

- Increased noise: Innovation variance increases 

### Response: 

- Down-weight: Reduce measurement weight for faulty sensor 

- Exclude: Temporarily exclude sensor from fusion 

- Alert: Flag sensor for maintenance 

## 10.5 Implementation 

Edge (ESP32): 

- Simplified EKF: Reduced state vector, fixed matrices 

- Library: Custom C implementation or ported library 

- Update rate: 1-10 Hz 

### Gateway: 

- Full EKF: Complete state vector, adaptive parameters 

- Library: Python (filterpy, pykalman) or C++ 

- Update rate: 1 Hz 

### Validation: 

Simulation: Test with synthetic data 

Bench test: Controlled tilt platform 

Field test: Compare with reference instrument 

## PART 11 — SENSOR HEALTH 

## 11.1 Why Sensor Health Is Critical 

Problem: Most monitoring systems assume sensors work correctly. In reality: 

- MEMS sensors dri� with temperature and time 

- Mounting can loosen or shi� 

- Batteries degrade 

- Communication can fail 

- Environmental damage (water, dust, vibration) 

Consequence: System interprets sensor fault as ground deformation → false alarm → loss of credibility. 

Our approach: Treat sensor failure as a separate, first-class problem. Distinguish: 

- Actual ground deformation: Multiple sensors agree, physically plausible, temporally persistent 

- Sensor malfunction: Single sensor anomalous, physically implausible, inconsistent with neighbors 

## 11.2 Fault Types to Detect 

|Fault Type|Signature|Detection Method|
|---|---|---|
|Dri�|Gradual shi�in baseline|Trend analysis,comparison with neighbors,EKF innovation|
|Stuck values|No variation over time|Variance monitoring,heartbeat test|
|Outliers|Sudden large jumps|Statistical filters(IQR,z-score)|
|Battery failure|Voltage drop,brownout|Battery voltage monitoring|
|Communication failure|Missing packets|Packet counter,timeout|
|Calibration failure|Bias shi�|Comparison with reference,neighbor disagreement|
|Physical displacement|Sudden baseline shi�|Baseline monitoring,visual inspection trigger|
|Temperature sensitivity|Correlation with temperature|Temperature compensation,residual analysis|



## 11.3 Detection Methods 

### Statistical methods: 

- Rolling statistics: Mean, variance, min, max over sliding window 

- Outlier detection: Z-score > 3, IQR method 

Trend detection: Linear regression slope, CUSUM 

Model-based methods: 

- EKF innovation: Monitor innovation mean and variance 

- Residual analysis: Model prediction vs. measurement 

### Neighbor-based methods: 

- Consensus: Node disagreeing with all neighbors likely faulty 

- Correlation: Healthy nodes should correlate with neighbors (common environmental effects) 

### Self-test methods: 

- Heartbeat: Periodic known signal to verify sensor response 

- Redundancy: Multiple sensors measuring same quantity 

## 11.4 Response to Sensor Faults 

### Fault classification: 

- Minor: Slight dri�, increased noise → compensate, continue monitoring 

- Moderate: Significant dri�, occasional outliers → down-weight, flag for maintenance 

- Severe: Stuck, large bias, communication failure → exclude, alert for replacement 

### Actions: 

1. Compensate: Apply bias correction if dri� characterized 

2. Down-weight: Reduce influence in fusion 

3. Exclude: Remove from fusion and risk calculation 

4. Alert: Notify operator of sensor fault 

5. Log: Record fault for maintenance tracking 

### Risk calculation adjustment: 

Healthy sensors: Normal risk calculation 

   - Some faults: Increase uncertainty, require higher consensus 

   - Many faults: Degrade to "UNKNOWN" status, do not issue false NORMAL 

- Critical principle: Never treat "no data" as "normal." If sensors fail, system should report 

- "UNKNOWN" or "DEGRADED," not falsely reassure. 

## 11.5 Implementation 

### Edge (node-level): 

   - Basic health: Battery voltage, communication heartbeat, simple outlier detection 

   - Response: Local LED indicator, flag in packet 

- Gateway (system-level): 

- Advanced health: EKF innovation, trend analysis, neighbor comparison 

- Response: Sensor health dashboard, maintenance alerts, risk calculation adjustment 

### Dashboard: 

- Health status: Green (healthy), yellow (degraded), red (faulty) 

- Metrics: Uptime, fault count, last calibration 

- Actions: Schedule maintenance, recalibrate, replace 

## 11.6 Validation 

### Test scenarios: 

1. Induced dri�: Heat sensor, observe dri� detection 

2. Stuck simulation: Freeze sensor value in so�ware, verify detection 

3. Outlier injection: Add artificial outliers, verify filtering 

4. Communication loss: Disconnect node, verify timeout detection 

5. Battery depletion: Discharge battery, verify voltage monitoring 

### Metrics: 

- Fault detection rate: % of faults correctly detected 

- False fault rate: % of healthy sensors incorrectly flagged 

- Detection latency: Time from fault onset to detection 

- Recovery: Time to restore a�er fault resolved 

### END OF PART 1 

This document covers Parts 1-11 of the 48-part master prompt. Continue to Part 2 for Parts 12-24. 

