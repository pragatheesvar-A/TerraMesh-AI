**Problem Statement ID : 26025**

**Problem Statement Title : Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India**

**Description**

**Background:**

Surface subsidence caused by underground coal mining poses significant risks to nearby communities, public infrastructure, agricultural land, forest areas, and the surrounding environment. In India, subsidence monitoring is still largely dependent on conventional field observations, periodic surveys, and post facto damage assessments, which often fail to provide timely warning before critical ground failure occurs.  
<br/>There is a strong need for an indigenous, low cost, intelligent, and real time monitoring solution capable of detecting early signs of ground movement and enabling proactive risk mitigation. Such a system should be affordable, scalable, and deployable across Indian underground coal mines using widely accessible technologies, thereby supporting the national vision of smart and sustainable mining.  
<br/>**Description:**  
<br/>The problem envisages development of an AI-enabled smart mine subsidence monitoring and early warning platform based on a localized wireless surface mesh sensor network deployed above underground mine panels.  
<br/>The proposed solution involves installing a distributed network of low cost smart sensor nodes across the surface over the underground mining area. Each node may be equipped with sensors such as:  
<br/>• tilt/inclination sensors,  
• vibration sensors,  
• displacement/stretch sensors,  
• crack detection sensors,  
• optional low cost positioning modules.  
<br/>These nodes will communicate through a wireless mesh communication network (such as LoRa/Zigbee/Wi-Fi mesh), enabling continuous real time monitoring of micro ground movements over the mine panel.  
<br/>**The system should continuously detect:**  
<br/>• abnormal ground tilt,  
• change in relative distance between nodes,  
• early crack initiation,  
• unusual vibration signatures, which may indicate the onset of subsidence.  
<br/>**Using Artificial Intelligence / Machine Learning, the platform should:**  
<br/>• identify abnormal deformation patterns,  
• predict possible subsidence zones,  
• estimate severity and progression,  
• generate automated early warning alerts,  
• support timely operational decisions.  
<br/>The solution should be robust, low power, scalable, and suitable for Indian geo-mining conditions.  
<br/>**Expected Solution:**  
<br/>A web/mobile enabled intelligent mine subsidence monitoring platform integrating IoT, wireless mesh networking, AI, and GIS technologies for:  
<br/>• development of low cost smart sensor nodes using readily available hardware platforms (e.g., Arduino/ESP32/Raspberry Pi);  
• deployment of a localized wireless mesh network over underground mine panels for continuous surface deformation sensing;  
• real time monitoring of tilt, displacement, vibration, and crack initiation;  
• AI/ML-based anomaly detection and subsidence prediction using live and historical data;  
• GIS based visualization of live deformation maps and risk zones;  
• automated early warning alerts through SMS/email/mobile app notifications;  
• interactive dashboards for mine operators, planners, and regulators;  
• offline capability with periodic cloud synchronization;  
• scalable deployment across multiple underground coalfields.  
<br/>The proposed solution must be low cost, easy to deploy, energy efficient, scalable, and student prototype friendly, while enabling a Made in India smart mining safety solution for sustainable underground coal mining.  
<br/>**Now your problem statement has a clear unique innovation hook:**  
<br/>'Wireless Surface Mesh Network for Real Time Subsidence Detection' that is what will differentiate it from generic AI proposals.

**Organization :**

Ministry of Coal

**Category :**

Hardware

**Theme :**

Smart Automation

| **Member**                                                               |     | **Role**                        | **Main Ownership**                                              | **Final Output**               |
| ------------------------------------------------------------------------ | --- | ------------------------------- | --------------------------------------------------------------- | ------------------------------ |
| **M1 – PRAGATHEESVAR**                                                   |     | 🧠 Team Lead + System Architect | Overall architecture, integration, innovation, SIH presentation | Complete system + architecture |
| **M2**<br><br>**SANTHOSH , PRAGATHEESVAR , PRAISELYN**                   |     | 🔬 Research & Dataset Lead      | Papers, existing systems, dataset, AI research                  | Research report + dataset      |
| **M3**<br><br>**POOVARASAN , PUNITH KUMAR**                              |     | ⚙️ Hardware & Sensor Lead       | Sensor nodes, calibration, PCB/wiring                           | Working sensor node            |
| **M4**<br><br>**PUNITH KUMAR ,**<br><br>**POOVARASAN**                   |     | 📡 IoT & Communication Lead     | LoRa/Mesh, MQTT, ESP32 communication                            | Multi-node wireless network    |
| **M5**<br><br>**NIFRAS, PRAISELYN**                                      |     | 🤖 AI/ML Lead                   | Anomaly detection + prediction + risk score                     | AI model/API                   |
| **M6**<br><br>**NIFRAS ,**<br><br>**PRAGATHEESVAR,**<br><br>**SANTHOSH** |     | 🗺️ GIS + Full-Stack Lead        | Dashboard, mine map, visualization, alerts                      | Working web dashboard          |