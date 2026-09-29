##### **MINISTRY OF COAL   |   DISASTER MANAGEMENT   |   HARDWARE TRACK** 

### **SMART INDIA HACKATHON 2026** 

# **CALXION** 

_Team submission  ·  Ministry of Coal problem statement_ 

**Problem Statement ID  —** SIH26025 





**Underground Sensor Nodes** Geophone · Tilt · Extensometer 

**LoRaWAN Through-Earth Link** 868/915 MHz mesh to surface 

**Problem Statement Title  —** AI-Enabled Low-Cost Real-Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India 

**Theme  —** Disaster Management 

**PS Category  —** Hardware 



**Edge + Cloud AI Engine** LSTM + XGBoost risk scoring 

**Team ID  —** To be allotted on portal 

**Team Name (Registered on portal)  —** CALXION 



**Real-Time Early Warning** SMS · App · Mine-Wide Siren 

**C** 

##### **TEAM CALXION** 

## **StrataSense AI** 

_AI-Enabled, Low-Cost Subsidence Monitoring for Underground Coal Mines_ 



#### **Proposed Solution** 

**Sensor-to-Dashboard Ecosystem:** a low-cost network of DGMS/CIMFR-certifiable, intrinsically-safe underground sensor nodes paired with a live web + mobile risk dashboard. 



**Underground Sensor Nodes** Geophone · Tilt · Extensometer · Piezometer 

**Real-Time Strata Monitoring:** MEMS tilt, tri-axial geophone and borehole-extensometer nodes stream ground movement and micro-tremor data every few seconds. 





<!-- Start of picture text -->
LoRaWAN Surface Gateway<br><!-- End of picture text -->

Through-the-earth relay, ~500 nodes/gateway 

**AI Subsidence Risk Engine:** an LSTM + XGBoost ensemble fuses live sensor readings with mine void maps and geology to output a panel-wise Subsidence Risk Index. 



<!-- Start of picture text -->
Edge AI Filter<br>TinyML on-node<br><!-- End of picture text -->



<!-- Start of picture text -->
Cloud AI Risk Engine<br>LSTM + XGBoost + InSAR fusion<br><!-- End of picture text -->

**Satellite Fusion Layer:** periodic Sentinel-1 InSAR displacement maps calibrate the ground network, bridging second-by-second sensing with wide-area surface trends. 





<!-- Start of picture text -->
StrataSense Dashboard<br><!-- End of picture text -->

**Digital Twin & Void Map:** a 3D model of worked-out panels overlays live readings so engineers see exactly which zone is destabilising, not just one score. 





<!-- Start of picture text -->
Real-Time  History &  DGMS / CMPDI<br>Alerts Trends Reporting<br>SMS · App · Siren 30-day rolling log Digital SSR export<br><!-- End of picture text -->

**Edge-AI False-Alarm Filter:** on-node inference tells blasting vibration apart from genuine strata failure before an alert ever leaves the mine. 

_End-to-end pipeline: sensing → through-earth comms → edge + cloud AI → dashboard & alerts_ 

**Multi-Channel Early Warning:** automated SMS, app push and mine-wide siren/beacon alerts in Hindi and regional languages to miners, management and DGMS-facing dashboards. 

SIH26025  ·  CALXION  ·  02 

**C** 

##### **TEAM CALXION** 

## **TECHNICAL APPROACH** 



#### **Hardware & Technology Stack** 

**Sensing Hardware:** MEMS tilt/accelerometer, tri-axial geophones (microseismic), vibrating-wire borehole extensometers & piezometers, stress cells, solar + battery power, Ex-ia / flameproof enclosure (IS/IEC 60079). 





<!-- Start of picture text -->
Edge AI / TinyML<br><!-- End of picture text -->

**Communication:** LoRa SX1276 through-the-earth transceiver (868/915 MHz), LoRaWAN star-ofstars mesh, 4G / leaky-feeder gateway backhaul to surface. 

**Firmware & Edge AI:** ESP32 / STM32 low-power MCU, FreeRTOS, TensorFlow Lite Micro (TinyML) for on-node false-alarm filtering, OTA updates. 





<!-- Start of picture text -->
TimescaleDB<br><!-- End of picture text -->

**Backend:** FastAPI, Python, PostgreSQL + TimescaleDB, MQTT broker, Redis, Celery, Docker. 

**AI / ML:** PyTorch, LSTM/GRU time-series forecasting, XGBoost & LightGBM risk scoring, scikitlearn, ONNX Runtime for edge export. 



**Geospatial & Satellite:** Sentinel-1 SAR, InSAR/SBAS processing (SNAP), QGIS, GDAL, digital elevation & void-map overlay. 



<!-- Start of picture text -->
Kubernetes · AWS<br><!-- End of picture text -->





<!-- Start of picture text -->
LoRaWAN Mesh<br><!-- End of picture text -->





<!-- Start of picture text -->
PyTorch · XGBoost<br><!-- End of picture text -->





<!-- Start of picture text -->
Ex-ia / IEC 60079<br><!-- End of picture text -->





<!-- Start of picture text -->
Sentinel-1 InSAR<br><!-- End of picture text -->





<!-- Start of picture text -->
Digital Twin / QGIS<br><!-- End of picture text -->





<!-- Start of picture text -->
React Native App<br><!-- End of picture text -->

**Frontend & Deployment:** React.js, React Native, Mapbox GL, Chart.js, Socket.io, Kubernetes, AWS / on-prem hybrid, Grafana, Prometheus. 

SIH26025  ·  CALXION  ·  03 

**C** 

##### **TEAM CALXION** 

## **FEASIBILITY AND VIABILITY** 



#### **Feasibility** 

**1.  Technical:** geophones, extensometers and LoRa/TinyML are mature, field-proven technologies already used in Indian mines. 



#### **Business Potential** 

   **1.  AMC / subscription:** per-panel monitoring contracts with CIL subsidiaries (ECL, BCCL, CCL, SECL). 

**2.  Economic:** solar + LoRa removes trenching and cabling, the single largest cost in underground instrumentation. 

   **2.  Tiered hardware bundles:** basic tilt-only nodes up to full multi-sensor panel kits. 

**3.  Operational:** needs DGMS / CIMFR flameproof approval and integration with existing Support Stability Report workflows. 

**3.  Certification partnerships:** bundled DGMS / CIMFR type-approval support for faster adoption. 



#### **Viability** 

**4.  Market opportunity:** 350+ underground coal mines under Coal India alone; strata failure is a leading cause of underground fatalities. 

**5.  Sustainability:** sensor nodes scale panel-by-panel; the same AI core extends to other Ministry of Coal safety problem statements. 

**4.  Scheme alignment:** eligible under Ministry of Coal S&T and mine-safety funding. 



#### **Engineering Solutions** 

**5.  Ex-ia-first design:** every energy-storing element stays under IS safety limits from day one. 



#### **Challenges** 

   **6.  Adaptive mesh relay:** self-healing LoRa mesh, hop count tuned per seam. 

   **7.  Physics-informed ML:** extraction ratio and depth of cover cut the labelled-data need. 

**6.  Explosive-atmosphere compliance:** every board must be Ex-ia or flameproof per IS/IEC 60079, unlike open-pit hardware. 

**7.  Underground RF propagation:** LoRa attenuates through coal and rock; gateway spacing must match seam geometry. 

**8.  Sparse failure data:** labelled subsidence datasets are limited, so the model leans on rock-mechanics features. 



###### **Supporting Facts for Feasibility and Viability** 

- Roof and strata failure has historically been among the leading causes of fatalities in Indian underground coal mines, per DGMS accident records. 



#### **Use Cases** 

**9.  Evacuation triggers:** automatic alerts when a panel crosses a critical risk threshold. 

Peer-reviewed reviews report ML models such as XGBoost reaching over 94% accuracy in mininginduced subsidence prediction when fused with InSAR, GNSS and UAV data. 

**10.  Digital SSR:** sensor-backed reports replacing paper logs for DGMS inspection. 

**11.  Land use & compensation:** rehabilitation maps for old workings, plus objective logs for faster damage-claim resolution. 

SIH26025  ·  CALXION  ·  04 

**C** 

##### **TEAM CALXION** 

## **IMPACT AND BENEFITS** 



<!-- Start of picture text -->
Benefits of the Solution<br>Social Technological Economic Environmental<br><!-- End of picture text -->



#### **Social** 

Eases anxiety of working under uncertain roof and strata conditions. 

Protects surface villages long affected by subsidence, e.g. Jharia and Raniganj. 

Builds trust through transparent, sensor-backed risk data. 



#### **Technological** 

Brings low-cost edge-AI sensing to a segment still using manual readings. 

Complements CIL’s satellite InSAR monitoring with continuous ground truth. 



#### **Potential Impact on the Target Audience** 

**Mine Management & CIL Subsidiaries:** prevents production stoppages and equipment loss from unplanned panel collapse. 

**Miners & Support Staff:** an early-warning layer for the single largest historical cause of underground fatalities. 

**DGMS & Regulators:** a transparent, sensor-backed record replacing periodic manual strata observation. 

**Surface Communities:** advance warning of subsidence beneath villages and roads above old workings, as seen in Jharia and Raniganj. 

A reusable sensor-to-AI pipeline, extensible to other strata-control PSs. 



#### **Economic** 

Targets fewer unplanned panel-downtime days from undetected movement. 

Aims for hours-to-days of warning versus today’s reactive surveys. Removes underground cabling cost versus fibre-optic systems. 



#### **Environmental** 

Supports precise extraction planning, limiting over-extraction subsidence. 

Feeds into post-mining land rehabilitation and afforestation planning. Cuts the footprint of reactive, ad-hoc emergency responses. 

SIH26025  ·  CALXION  ·  05 

**C** 

##### **TEAM CALXION** 

## **RESEARCH AND REFERENCES** 



#### **Research Keywords** 



<!-- Start of picture text -->
Mine subsidence prediction Underground coal mine safety Microseismic monitoring<br>LoRaWAN through-the-earth InSAR/SBAS deformation mapping<br>Strata movement early warning Intrinsically safe IoT sensors<br>Digital twin void mapping XGBoost & LSTM risk scoring Coalfield subsidence (India)<br>Low-cost geotechnical sensors<br><!-- End of picture text -->



#### **References — Research & Best Practices** 

Mining-Induced Subsidence — comprehensive review, Geotech. & Geological Eng. _link.springer.com/content/pdf/10.1007/s10706-025-03271-3.pdf_ 



#### **Comparison with Existing Approaches** 

|**Capability**|**StrataSense AI**|**Manual**<br>**Reading**|**Satellite InSAR-**<br>**Only**|**Cabled DFOS**|
|---|---|---|---|---|
|Real-time continuous alerts|**Yes**|No|No|**Yes**|
|Underground ground-truth sensing|**Yes**|**Yes**|No|**Yes**|
|No underground cabling needed|**Yes**|**Yes**|**Yes**|No|
|AI prediction engine|**Yes**|No|**Partial**|**Partial**|
|DGMS / Ex-ia compliance built-in|**Yes**|N/A|N/A|**Partial**|
|Wide-area satellite fusion|**Yes**|No|**Yes**|No|
|Panel-level digital twin|**Yes**|No|No|**Partial**|
|Multilingual field alerts|**Yes**|No|No|No|



IoT LoRaWAN Wireless Sensor Network for Underground Mine Monitoring, MDPI _mdpi.com/1424-8220/24/21/6971_ 

Land Subsidence Detection in Jharia Coalfield — DInSAR, GPS & Levelling _ias.ac.in/public/Volumes/jess/124/06/1359-1376.pdf_ 

Surface Deformation Monitoring of Raniganj Coalfield — InSAR & DGPS _tandfonline.com/doi/full/10.1080/19475705.2024.2375546_ 

Directorate General of Mines Safety (DGMS) — official regulator _dgms.gov.in_ 

CIMFR — Flameproof & Intrinsically Safe Equipment Testing _cimfr.res.in/division/flame-proof-and-equipment-safety.html_ 



#### **Existing Initiatives We Build On** 

Coal India × NRSC/ISRO satellite dashboard MoU (Jul 2026) — satellite-only, periodic revisit _isro.gov.in/NRSC_ISRO_MoU_BCCL_CMPDI.html_ 

_StrataSense AI targets the gap between today’s manual instrument rounds and satellite-only monitoring: continuous, low-cost, panel-level ground truth fused with wide-area InSAR._ 

Worldsensing — commercial GNSS/tiltmeter ground-deformation monitoring for mining _worldsensing.com/mining_ 

SIH26025  ·  CALXION  ·  06 

