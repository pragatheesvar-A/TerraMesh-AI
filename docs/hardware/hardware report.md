# **Hardware Components and Functional Description** 

# **Project Title** 

**AI-Enabled Low-Cost Real-Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India** 

# **Hardware System Overview** 

The proposed system consists of a distributed network of low-cost sensor nodes installed on the surface above underground coal mining areas. Each sensor node continuously measures parameters such as ground inclination, vibration, displacement, and crack development. The collected data is transmitted through a LoRa-based wireless network to a Raspberry Pi gateway for local processing, storage, and communication with the AI and monitoring platform. 

The hardware architecture is designed to be **low-cost, low-power, scalable, and suitable for continuous outdoor monitoring** . 

# **1. Heltec WiFi LoRa 32 V3** 

# **Component** 

**Heltec WiFi LoRa 32 V3** 

# **Main Function** 

# Acts as the **main controller and communication unit** of each sensor node. 

# **Purpose in the Project** 

The Heltec board collects data from all the sensors connected to the node, performs initial processing, and transmits the sensor data through LoRa. 

# **Functions** 

- Reads sensor measurements. 

- Processes sensor data using the ESP32 microcontroller. 

- Calculates/handles tilt and acceleration measurements. 

- Controls connected sensors. 

- Transmits data through LoRa. 

- Supports wireless communication between nodes/gateway. 

- Monitors battery status. 

# required and makes the sensor node compact and cost-effective. 

Battery       : 82% 

Status        : WARNING 

# **Project Role** 

# **Wireless data transmission for the surface sensor network** 

# **Important Innovation** 

The project can implement **multi-node/multi-hop communication** so that sensor nodes can forward data through neighboring nodes when direct communication with the gateway is unavailable. This supports the project's **Wireless Surface Mesh Network** concept. 

# **3. MPU6050** 

# **Component** 

# **MPU6050 Accelerometer and Gyroscope** 

# **Main Function** 

Measures **inclination/tilt and motion** of the sensor node. 

# **Purpose in the Project** 

Ground deformation may cause small changes in the orientation of a surface-mounted sensor node. The MPU6050 detects changes in orientation and acceleration that can indicate abnormal ground movement. 

# **Functions** 

- Measures acceleration along three axes. 

- Measures angular velocity along three axes. 

- Detects changes in inclination. 

- Provides motion-related data. 

- Helps identify gradual ground deformation. 

# **Example** 

Normal condition: 

Tilt = 0.2° 

Ground movement: 

Tilt = 1.1° 

Further deformation: 

Tilt = 2.0° 

These values are only illustrative; actual warning thresholds must be determined through calibration and geotechnical validation. 

# **Project Role** 

# **Ground tilt/inclination monitoring** 

# **4. ADXL345** 

# **Component** 

**ADXL345 3-Axis Digital Accelerometer** 

# **Main Function** 

# Measures **acceleration and vibration characteristics** . 

# **Purpose in the Project** 

The ADXL345 provides numerical acceleration measurements that can be processed to identify unusual vibration patterns associated with ground movement or other disturbances. 

# **Functions** 

- Measures acceleration in X, Y and Z axes. 

- Detects changes in acceleration. 

- Captures vibration-related data. 

- Provides numerical sensor readings for analysis. 

- Supports feature extraction for AI/ML processing. 

# **Why We Prefer It for the Main Vibration Measurement** 

Unlike a simple vibration switch that mainly provides an ON/OFF indication, the ADXL345 provides **quantitative acceleration data** . 

This is more useful for: 

- anomaly detection 

- vibration pattern analysis 

- historical data analysis 

- AI-based prediction 

# **Project Role** 

# **Quantitative vibration and acceleration monitoring** 

# **5. SW-420 Vibration Sensor — Optional** 

# **Component** 

# **SW-420 Vibration Sensor** 

# **Main Function** 

Detects whether vibration is present. 

# **Purpose in the Project** 

The SW-420 can be used as an inexpensive additional vibration trigger during prototype development. 

# **Functions** 

- Detects vibration. 

- Provides a simple digital trigger. 

- 

# **Limitation** 

It provides relatively basic vibration detection compared with the ADXL345. 

Therefore: 

# **ADXL345 → Primary vibration measurement** 

# **SW-420 → Optional low-cost vibration trigger** 

# **Project Role** 

**Additional low-cost vibration detection** 

# **6. Linear Displacement Sensor** 

# **Component** 

# **Linear Displacement Sensor / Linear Potentiometer** 

# **Main Function** 

# Measures **relative ground displacement or change in distance** . 

# **Purpose in the Project** 

Subsidence can cause relative movement between two surface points. A displacement sensor can detect changes in distance that may indicate ground deformation. 

# **Example** 

Initial position 

A ●────────────● B 

100 mm 

After deformation 

A ●─────────● B 

97 mm 

The system detects the change in distance. 

# **Functions** 

- Measures linear movement. 

- Detects relative displacement. 

- Converts physical movement into an electrical signal. 

- Provides deformation data to the ESP32. 

# **Project Role** 

# **Ground stretch/displacement monitoring** 

# **Prototype Note** 

a calibrated displacement transducer would be preferable. 

# **7. Crack Detection Sensor** 

# **Component** 

# **Crack Sensor / Crack-Width Measurement Mechanism** 

# **Main Function** 

Detects **crack initiation or crack-width changes** . 

# **Purpose in the Project** 

Surface cracks can be an important visible indication of ground deformation. The sensor is intended to identify the formation or widening of cracks. 

# **Functions** 

- Detects crack opening. 

- Measures changes in crack width where supported by the chosen sensor arrangement. 

- Provides early deformation information. 

- Sends crack-related data to the controller. 

# **Project Role** 

**Early crack detection** 

# **8. 18650 Li-ion Battery** 

# **Component** 

# **18650 Lithium-ion Battery — approximately 3000 mAh** 

# **Main Function** 

Provides electrical power to the sensor node. 

# **Purpose in the Project** 

The sensor nodes are intended to operate continuously in outdoor locations where direct electrical power may not be available. 

# **Functions** 

- Powers the ESP32. 

- Powers sensors. 

- Powers LoRa communication. 

- Provides backup power during low-sunlight conditions. 

# **Project Role** 

**Primary energy storage** 

# **9. Solar Panel** 

# **Component** 

# **Small Solar Panel** 

# **Main Function** 

Provides renewable energy for charging the battery. 

# **Purpose in the Project** 

Because the sensor nodes may be deployed for long periods, solar charging can extend operating time and reduce the need for frequent battery replacement. 

# **Functions** 

- Converts sunlight into electrical energy. 

- Charges the battery through appropriate charging/power-management circuitry. 

- Supports long-term autonomous operation. 

# **Project Role** 

# **Renewable power source for long-term deployment** 

# **10. Battery Charging and Protection Circuit** 

# **Components** 

- **TP4056-based Li-ion charging circuit** 

- **DW01 battery protection** , where applicable 

# **Main Function** 

Provides battery charging and protection functions. 

# **Purpose in the Project** 

The rechargeable battery must be safely managed during charging and operation. 

# **Functions** 

- Controls Li-ion battery charging. 

- 

- Helps prevent unsafe battery operating conditions. 

# **Important Design Note** 

selected/configured specifically for the solar panel, battery chemistry, and required protection features. A basic TP4056 module should not automatically be treated as a complete solar power-management solution. 

# **Project Role** 

**Battery charging and protection** 

# **11. ESP32 Deep Sleep** 

# **Feature** 

# **ESP32 Deep-Sleep Power Management** 

# **Main Function** 

Reduces power consumption when continuous sensor processing/transmission is not required. 

# **Purpose in the Project** 

The sensor node is battery powered. Keeping the ESP32 fully active continuously would consume more energy. 

Instead: 

Wake Up 

↓ 

Read Sensors 

↓ 

Process Data 

↓ 

Transmit Through LoRa 

↓ 

Sleep 

↓ 

Wake Up Again 

# **Functions** 

- Reduces average power consumption. 

- Extends battery operating time. 

- Allows periodic sensor measurements. 

- Supports autonomous operation. 

# **Project Role** 

**Low-power operation and extended battery life** 

# **12. Raspberry Pi Gateway** 

# **Component** 

**Raspberry Pi** 

# **Main Function** 

Acts as the **central gateway and edge-processing unit** for the sensor network. 

# **Purpose in the Project** 

Instead of using a Raspberry Pi for every sensor node, one Raspberry Pi can collect data from multiple LoRa sensor nodes. 

# **Functions** 

- Receives LoRa sensor data. 

- Collects data from multiple sensor nodes. 

- Stores sensor data locally. 

- Performs preliminary/edge data processing. 

- Can run lightweight anomaly-detection models. 

- Provides local monitoring capability. 

- Synchronizes data with a cloud/server when connectivity is available. 

- Can activate local warning devices. 

# **Example** 

Sensor Nodes 

↓ 

LoRa Network 

↓ 

Raspberry Pi 

↓ 

Local Database 

↓ 

Edge Processing 

↓ 

Cloud / AI Platform 

# **Project Role** 

**LoRa gateway + local processing + data storage + edge computing** 

# **13. Buzzer / Local Warning Unit** 

# **Component** 

**Buzzer / Siren + LED indicators** 

# **Main Function** 

Provides a **local warning when abnormal conditions are detected** . 

# **Purpose in the Project** 

The system should not depend completely on internet connectivity for local alerts. 

# **Example** 

GREEN  → Normal 

YELLOW → Warning 

RED    → Critical 

The Raspberry Pi/gateway or appropriate controller can activate the local warning mechanism based on validated prototype risk logic. 

# **Project Role** 

# **Local early-warning indication** 

# **14. Waterproof Enclosure** 

# **Component** 

# **Weather-resistant enclosure** 

# **Main Function** 

Protects electronics from environmental conditions. 

# **Purpose in the Project** 

Surface sensor nodes may be exposed to: 

- rain 

- dust 

- moisture 

- sunlight 

- temperature variation 

# **Functions** 

- Protects the ESP32. 

- Protects sensors and wiring. 

- Improves reliability. 

- Allows outdoor deployment. 

# **Project Role** 

# **Environmental protection of sensor nodes** 

## 

**Hardware Main Function Purpose in Project** Controls sensor node and wireless **Heltec WiFi LoRa 32 V3** Controller + LoRa communication Wireless Transfers sensor data between **LoRa** communication nodes/gateway 

|**Hardware**|**Main Function**|**Purpose in Project**|
|---|---|---|
|**MPU6050**|Tilt + motion|Detects ground<br>inclination/deformation|
|**ADXL345**|Acceleration/vibration|Measures quantitative vibration<br>patterns|
|**SW-420**|Basic vibration trigger|Optional low-cost vibration<br>detection|
|**Linear displacement**<br>**sensor**|Measures linear<br>movement|Detects ground displacement|
|**Crack sensor**|Crack opening<br>detection|Detects early surface cracking|
|**18650 Li-ion**|Energy storage|Powers sensor node|
|**Solar panel**|Energy generation|Supports long-term autonomous<br>operation|
|**Charging/protection**<br>**circuit**|Battery management|Safely manages rechargeable<br>power|
|**ESP32 Deep Sleep**|Power management|Extends battery life|
|**Raspberry Pi**|Gateway/edge<br>computer|Collects, stores and processes<br>node data|
|**Buzzer/LED**|Warning|Provides local alert|
|**Weather-resistant**<br>**enclosure**|Protection|Protects electronics in outdoor<br>conditions|



# **16. Overall Hardware Working** 

The complete hardware operation can be represented as: 

GROUND SURFACE 

──────────────────────────────────────────── 

NODE 1          NODE 2          NODE 3 

●                ●                ● │                │                │ ▼ ▼ ▼ MPU6050          MPU6050          MPU6050 ADXL345          ADXL345          ADXL345 Displacement     Displacement     Displacement 

Crack Sensor     Crack Sensor     Crack Sensor │                │                │ └──────────── LoRa Mesh ───────────┘ │ ▼ RASPBERRY PI 

GATEWAY │ `┴` ┌───────── ─────────┐ ↓                   ↓ Local Storage        Edge Processing │                   │ └───────── `┬` ─────────┘ ↓ Cloud / AI ↓ Risk Analysis ↓ GIS Dashboard ↓ Early Warning 

# **17. Hardware-to-Problem Mapping** 

The strongest part of your report should be showing **why each hardware component exists** . 

|**PS Requirement**|**Hardware Solution**|
|---|---|
|Detect abnormal ground tilt|**MPU6050**|
|Detect unusual vibration|**ADXL345**|
|Detect relative ground movement|**Linear displacement sensor**|
|Detect early cracks|**Crack sensor**|
|Continuous distributed monitoring|**Multiple ESP32 sensor nodes**|
|Long-range communication|**LoRa**|
|Wireless surface network|**Multiple LoRa nodes + gateway**|
|Low-cost implementation|**ESP32 + low-cost sensors**|
|Long battery operation|**18650 + deep sleep**|
|Renewable energy|**Solar panel**|
|O�line capability|**Raspberry Pi local storage**|
|Edge processing|**Raspberry Pi**|
|Local warning|**Buzzer/LED**|
|Outdoor deployment|**Weather-resistant enclosure**|
|AI prediction|**Sensor data supplied to AI platform**|
|GIS risk visualization|**Gateway/cloud data integration**|



## 

For your team's SIH submission, I would present the hardware as **three layers** : 

# **Layer 1 — Sensor Node** 

**Heltec ESP32 LoRa V3 + MPU6050 + ADXL345 + displacement sensor + crack sensor + battery + solar** 

# **Layer 2 — Communication & Edge Gateway** 

**LoRa network + Raspberry Pi** 

# **Layer 3 — Intelligence & Warning** 

**Raspberry Pi → AI/ML → GIS → Dashboard → Warning system** 

This makes your hardware section look much more professional than simply listing components. 

**One important point:** don't claim that these low-cost sensors alone can _certify_ or definitively predict a mine collapse. In your SIH report, describe them as a **prototype for detecting deformation/anomalies and generating risk indications** , with thresholds and field deployment requiring calibration and validation by mining/geotechnical experts. 

