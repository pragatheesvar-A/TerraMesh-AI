# SIH26025 — Landslide / Structural Crack Monitoring System
## Final Hardware Report

---

## 1. Executive Summary

This report consolidates the complete hardware design for the SIH26025 sensor-node network: a LoRa-connected mesh of low-power monitoring nodes (tilt/vibration, crack-width, strain) reporting to a Raspberry Pi 4 gateway, with AI/edge processing, GNSS/InSAR/GIS integration, and siren/beacon-based early warning. It covers sensor specifications, BOM and Indian pricing, power budgeting and battery life, LoRa link design, calibration, testing, failure modes, and the prototype build sequence for a 5-node deployment.

---

## 2. Sensor-Node Architecture Overview

Each node is built around a **Heltec WiFi LoRa 32 V3** (ESP32-S3 + SX1262), interfacing with three sensing subsystems and a power-management stage:

```
        ┌─────────────────────────────────────────┐
        │           Heltec ESP32-S3 (V3)           │
        │        + SX1262 LoRa Transceiver         │
        └──────┬────────┬────────┬─────────┬───────┘
               │        │        │         │
          MPU6050   VL53L0X   HX711 +   TP4056 +
         (tilt/vib) (crack-  strain    Li-ion 18650
           I2C       width)   gauge    /solar input
                      I2C      (SPI-
                              like 2-wire)
```

Each node samples periodically, applies on-device threshold checks, and transmits compact payloads over LoRa to the gateway. The gateway aggregates, runs edge-AI anomaly scoring, cross-references GNSS/InSAR data, and triggers the siren/beacon network when thresholds are breached.

---

## 3. Sensor Subsystems

### 3.1 MPU6050 — Tilt & Vibration

- 3-axis accelerometer (±2/±4/±8/±16 g, programmable) + 3-axis gyroscope (±250 to ±2000 °/s)
- 16-bit ADC per channel, I2C interface (up to 400 kHz)
- On-chip Digital Motion Processor (DMP) can offload sensor fusion (tilt angle, quaternion output), reducing MCU compute load
- Typical operating current: ~3.9 mA active, ~5 µA in sleep with wake-on-motion — useful for duty-cycled sampling
- **Use in this design:** slope/structure tilt angle (derived from accelerometer gravity vector) and short-burst vibration signatures (possible micro-seismic activity or debris movement)
- **Limitation:** MEMS gyro drift over long integration times means tilt angle should be derived primarily from the accelerometer (gravity vector), with the gyro reserved for short-duration vibration/event detection, not long-term absolute angle tracking

### 3.2 VL53L0X — Crack-Width / Displacement Measurement

- Time-of-Flight (ToF) laser ranging sensor, 940 nm invisible laser
- Range: ~30 mm to ~2000 mm (best-case, high-reflectance target, in "long range" mode); realistic reliable range for typical (non-ideal, low-reflectance, angled) targets is closer to 30–1200 mm
- Ranging accuracy: ±3% typical under good conditions; degrades with ambient IR (direct sunlight), target angle, and target reflectivity
- I2C interface, single unit covers a narrow field of view (~25° full cone)
- **Use in this design:** measuring relative displacement across a crack by mounting the sensor on one side of the crack and a flat target plate on the other, so the sensor reports the changing gap distance over time (differential measurement, not absolute crack width from datasheet alone)
- **Key limitations to document for the judges/report:**
  - Direct sunlight significantly reduces usable range and increases noise — outdoor deployments need a shroud/baffle
  - Only works reliably on man-made structural cracks with a flat, stable target surface; not suited to irregular natural rock-face cracks without a target plate
  - Not a substitute for high-precision LVDT/crack-meter in critical infrastructure — positioned here as a low-cost, distributed early-warning sensor, not a certified structural-monitoring instrument

### 3.3 HX711 + Strain Gauge — Load / Strain Sensing

- HX711 is a 24-bit ADC specifically designed for bridge sensors (load cells / strain gauges), with two selectable differential input channels and integrated gain (128/64/32)
- Output data rate: 10 Hz or 80 Hz (pin-selectable)
- Interfaces to the MCU via a simple 2-wire (clock + data) protocol, not true SPI/I2C but easy to bit-bang on any GPIO pair
- Used with a quarter- or half-bridge strain gauge configuration bonded to the structural member or embedded in a purpose-built strain sensor bracket
- **Use in this design:** detecting slow strain accumulation (creep) or sudden load-shift events preceding structural failure
- Typical current draw: ~1.5 mA active (HX711) — gauge excitation adds a small additional load depending on bridge resistance (120 Ω vs 350 Ω gauges)
- **Calibration note:** requires a two-point calibration (zero load + known reference load) per node at install time — see Section 6

---

## 4. Compute & Radio — Heltec ESP32-S3 + SX1262

- **MCU:** ESP32-S3FN8, Xtensa LX7 dual-core, up to 240 MHz, 8 MB flash, 512 KB SRAM, built-in Wi-Fi + BLE (unused in field deployment to save power, but available for local commissioning/debug)
- **LoRa radio:** Semtech SX1262 — supports 863–928 MHz region-dependent bands (India: 865–867 MHz IN865 band under license-exempt LoRaWAN rules), up to +22 dBm output power, high receiver sensitivity (down to about −148 dBm at low data rates), integrated power amplifier and low-power RX
- Onboard Li-ion battery management (charge/discharge control, overcharge protection, USB/battery auto-switch), Type-C USB
- Onboard 0.96" OLED — useful for field commissioning/debug, can be disabled in production firmware to save power

---

## 5. Per-Node Bill of Materials (Estimated Indian Pricing)

*Prices are street-level estimates from Indian electronics retailers (as of the report date) and will vary by vendor, quantity, and GST. Verify current prices before procurement.*

| Component | Est. Price (₹) | Notes |
|---|---|---|
| Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262) | 1,800 – 2,500 | India-specific import/reseller pricing; confirm 865–867 MHz variant availability |
| MPU6050 breakout module | 80 – 150 | GY-521 module, widely available |
| VL53L0X ToF module | 250 – 400 | GY-VL53L0XV2 breakout |
| HX711 breakout module | 80 – 150 | |
| Strain gauge (120 Ω, single) | 150 – 400 | Depends on gauge factor/brand |
| 3.7 V 18650 Li-ion cell (3000 mAh, protected) | 250 – 400 | Reputed brand recommended (Samsung/LG-cell rebrands) |
| TP4056 charge module (with protection) | 30 – 60 | USB-C variant preferred |
| Small 5–6 V solar panel (1–2 W) | 250 – 500 | Optional, for solar-assisted nodes |
| Weatherproof enclosure (IP65/67) | 300 – 700 | Size dependent |
| Mounting hardware, cabling, connectors | 200 – 400 | Per node, approximate |
| 868/915 MHz antenna (if not integrated) | 100 – 250 | SMA whip antenna |
| Misc. (wires, JST connectors, heat-shrink) | 100 – 150 | |
| **Estimated per-node total** | **₹3,590 – ₹5,960** | Wide range reflects component-grade choices |

### 5.1 Gateway BOM (Raspberry Pi 4-based)

| Component | Est. Price (₹) | Notes |
|---|---|---|
| Raspberry Pi 4 Model B (4 GB) | 5,500 – 6,500 | 4 GB sufficient for edge-AI inference workload described |
| SX1262/SX1276 LoRa HAT or USB LoRa gateway module | 2,500 – 4,500 | e.g., RAK2245/RAK2287-class concentrator or a single-channel SX1262 HAT depending on scale needed |
| 32–64 GB microSD (A2-rated) | 500 – 900 | |
| Official/quality 5V/3A USB-C power supply | 500 – 800 | |
| Enclosure + cooling (fan/heatsink) | 500 – 1,000 | |
| GNSS/GPS module (for local reference, optional) | 800 – 1,500 | u-blox NEO-6M/M8N class |
| 4G/Wi-Fi backhaul dongle (if no local network) | 1,500 – 3,000 | Optional, site-dependent |
| **Estimated gateway total** | **₹11,800 – ₹18,200** | Excludes optional 4G data costs |

### 5.2 5-Node Prototype Cost Estimate

| Item | Qty | Est. Cost (₹) |
|---|---|---|
| Sensor nodes | 5 | 17,950 – 29,800 |
| Gateway (1x) | 1 | 11,800 – 18,200 |
| Siren/beacon unit(s) | 1–2 | 2,000 – 5,000 (see Section 8) |
| Spares/contingency (~10%) | — | 3,175 – 5,300 |
| **Total prototype estimate** | | **≈ ₹35,000 – ₹58,300** |

---

## 6. Installation, Mounting & Calibration

### 6.1 Installation & Mounting
- Nodes housed in IP65/67 enclosures, mounted on stable reference points (rock bolts, structural anchors, or dedicated posts) away from direct vibration sources unrelated to the monitored structure
- VL53L0X sensor and its target plate must be mounted rigidly on opposite sides of the crack, aligned perpendicular to the measurement axis, and shielded from direct sunlight with a baffle/hood
- Strain gauge bonded per manufacturer surface-prep procedure (clean, degrease, bond with cyanoacrylate/epoxy per gauge datasheet), then coated with a protective sealant
- MPU6050 rigidly fixed (no compliant mounting) so measured tilt reflects the structure, not the enclosure

### 6.2 Calibration Procedure (per node, at install)
1. **MPU6050:** zero-offset calibration with the node held level (record offsets in flash); log baseline tilt angle as the reference "0" for that node's location
2. **VL53L0X:** record baseline distance to target plate as the reference crack-gap value; take multiple samples and average to reduce noise
3. **HX711 + strain gauge:** two-point calibration — zero-load reading, then a known reference load/strain applied (or computed reference deflection) to derive counts-per-unit-strain
4. Store all calibration constants in node non-volatile memory (flash) so they survive power loss and are transmitted once to the gateway for record-keeping

### 6.3 Sensor-Health Monitoring
- Each transmitted payload includes a health/status byte: sensor ACK/NACK per I2C device, battery voltage, RSSI/SNR of last uplink, and a rolling watchdog counter
- Gateway flags a node as "degraded" if expected transmissions are missed beyond a configurable threshold (e.g., 3 consecutive missed cycles), distinct from a genuine alarm condition

---

## 7. Siren / Beacon Warning Hardware

- Gateway-triggered relay module driving a 12V/24V siren + strobe beacon at the monitored site, powered by a dedicated battery/solar branch separate from the node power budget
- Triggered locally by the gateway (low-latency, no dependency on cloud/internet) when any node crosses a configured threshold, or when multiple nodes show correlated trend anomalies
- Estimated cost: ₹2,000 – ₹5,000 depending on siren/strobe rating and enclosure

---

## 8. AI / Edge-Processing Hardware Flow

```
Node sensors → local threshold check (MCU) → LoRa uplink
      → Gateway (Pi 4): buffering, feature extraction
      → Lightweight on-device model (e.g., TFLite Micro-class
        anomaly/trend classifier) for multi-node correlation
      → Decision: normal / watch / alarm
      → Alarm → siren/beacon relay + uplink to cloud/dashboard (if backhaul available)
```

- Node-level logic performs cheap threshold/rate-of-change checks (catches obvious events fast, keeps radio duty cycle low)
- Gateway-level model correlates multiple nodes' data over time (e.g., simultaneous tilt + strain trend across adjacent nodes is a stronger signal than a single noisy sensor)
- Raspberry Pi 4 (4 GB) is comfortably sufficient for a small TFLite/ONNX-runtime anomaly-detection model at this data rate; no GPU/accelerator required at prototype scale

---

## 9. GNSS + InSAR + GIS Integration

- A reference GNSS module at the gateway (or a dedicated GNSS node) provides an absolute position/elevation baseline; repeated high-precision GNSS logging over time can detect slow ground displacement independent of the LoRa sensor mesh
- Satellite InSAR (Interferometric SAR) data (where available for the region, e.g., from open satellite archives) provides wide-area ground-deformation context that complements the point-sensor network — used as a coarse regional cross-check, not a real-time input
- Node/gateway GPS coordinates and sensor readings are pushed into a GIS layer (e.g., QGIS-compatible export or a simple web map) so alerts are geolocated against the monitored site's terrain/structure map

---

## 10. LoRa Communication Design & Realistic Range Testing

- **Band:** IN865 (865–867 MHz) for Indian deployment compliance
- **Topology:** star topology — all sensor nodes report directly to a single gateway (mesh/repeater topology deferred to future scale-up if line-of-sight range is insufficient at a given site)
- **Link budget approach:** rather than quoting vendor "line-of-sight km" figures (which assume ideal antenna height and clear Fresnel zone), the realistic approach is:
  1. Fix a target spreading factor/bandwidth combination (e.g., SF9/BW125 as a balanced starting point for range vs. airtime)
  2. Conduct an actual site walk-test: transmit fixed-interval packets from increasing distances, logging RSSI/SNR and packet-delivery ratio at each point
  3. Use the walk-test data to set the deployed spreading factor per node (adaptive data rate where terrain allows), rather than assuming a single blanket range figure
  4. Expect significant derating from vendor spec in hilly/vegetated terrain — plan node spacing conservatively (initial prototype: treat 500 m–1 km as a realistic working range per hop in non-line-of-sight terrain, to be confirmed by the walk-test, not the 10+ km open-field figures often quoted)
- **Duty cycle:** keep transmissions short and infrequent (see power budget below) both for battery life and to stay well within regulatory duty-cycle/airtime norms

---

## 11. Power Budget & Battery Life

### 11.1 Battery Capacity
- Cell: 3.7 V, 3000 mAh Li-ion (18650) → **nominal energy = 3.7 V × 3000 mAh = 11.1 Wh**
- After accounting for real-world usable capacity (discharge cutoff, converter/regulator losses, ageing derating), a **conservative usable-energy budget of ≈ 8 Wh** is used for runtime planning

### 11.2 Estimated Battery Life by Average Load

Using the 8 Wh conservative usable-energy figure at a nominal 3.7 V system rail:

| Average current draw | Approx. runtime (8 Wh / (V×I)) |
|---|---|
| 3 mA (aggressive deep-sleep duty cycle, infrequent reporting) | ≈ 90 days |
| 6 mA (moderate duty cycle) | ≈ 45 days |
| 10 mA (frequent sampling/reporting) | ≈ 27 days |
| 20 mA (near-continuous sensing, higher LoRa duty cycle) | ≈ 13–14 days |

*These are average-current estimates; actual runtime depends heavily on how much time is spent in deep sleep vs. active sensing/transmit bursts (LoRa TX can briefly draw 100+ mA at higher power settings).*

### 11.3 Power-Saving / Deep-Sleep Strategy
- ESP32-S3 deep sleep between sampling cycles (wake on timer, or wake-on-motion via MPU6050 interrupt for event-driven vibration capture)
- Sensors powered via a switched MOSFET rail so I2C/HX711 devices are fully powered down between samples, not just idled
- LoRa radio kept in sleep mode except during short TX/RX windows
- Target duty cycle for a "normal" monitoring mode: wake every 5–15 minutes for a routine reading, with immediate event-triggered wake on the accelerometer interrupt for anomaly capture between scheduled cycles

### 11.4 TP4056 / Solar Charging Considerations
- TP4056-based charge module (with protection circuit, not the bare TP4056 IC) handles single-cell Li-ion charging from a small solar panel or USB
- Solar panel sizing should target enough daily charge input to offset the node's daily energy draw with margin for cloudy days — a 1–2 W panel comfortably covers the low-mA duty-cycled loads above in most site conditions, but should be validated on-site
- **3-day backup strategy:** size the battery so that even with zero solar input (worst-case, e.g., monsoon cloud cover) for 3 consecutive days, the node still has enough reserve for continued moderate-duty-cycle operation — the 8 Wh usable budget comfortably supports 3 days of moderate (6 mA-class) operation with several days of margin beyond that, per the table above

---

## 12. Testing & Validation Metrics

| Metric | Target / Method |
|---|---|
| Sensor accuracy (per subsystem) | Bench comparison against a reference instrument (e.g., digital level for tilt, vernier/dial gauge for displacement, calibrated load for strain) |
| LoRa packet delivery ratio | Measured during walk-test at planned deployment distances |
| End-to-end alarm latency | Time from threshold breach at node to siren/beacon activation |
| Battery runtime validation | Bench discharge test at representative average current before field deployment |
| False-positive rate | Logged over a multi-day burn-in period under normal (non-event) conditions |
| Sensor-health reporting reliability | Deliberately disconnect a sensor and confirm the gateway correctly flags it as degraded |

---

## 13. Failure Scenarios & Mitigations

| Failure scenario | Mitigation |
|---|---|
| Node battery depletion | Low-battery status in every payload; gateway raises a maintenance alert well before full depletion |
| LoRa link loss (terrain/interference) | Missed-transmission watchdog on gateway; consider a repeater node for marginal links post-prototype |
| VL53L0X false readings from sunlight/rain | Sensor shroud/baffle; sanity-check readings against MPU6050 vibration/tilt trend before raising a crack-width alarm alone |
| Strain-gauge bond failure over time | Periodic self-test (zero-load drift check) flagged as a health-degraded condition |
| Gateway power/compute failure | Local siren/beacon relay logic kept as simple, dedicated hardware distinct from the AI stack where feasible, so basic alarm capability degrades gracefully rather than failing completely |
| Single point of failure at gateway | Documented as a known prototype limitation; redundant gateway or store-and-forward buffering flagged as future work |

---

## 14. Research-Backed Design Decisions

- MPU6050 tilt-from-accelerometer approach (rather than gyro integration) follows standard practice for long-duration inclination monitoring, per common MEMS IMU application guidance, to avoid gyro drift accumulation
- VL53L0X range and accuracy figures are drawn from ST's official VL53L0X datasheet; the sunlight-sensitivity caveat is a well-documented characteristic of ToF sensors and is reflected in the design (shrouding) rather than ignored
- SX1262 link-budget and output-power figures are drawn from Semtech's SX1262 datasheet; the decision to walk-test rather than trust vendor line-of-sight range claims follows standard LoRa deployment practice, since real terrain/vegetation loss is not captured by open-field marketing figures
- HX711 gain/ODR behavior and 2-wire interface are per the HX711 datasheet
- Raspberry Pi 4 power/thermal behavior for the gateway role is based on the Raspberry Pi Foundation's official power documentation

---

## 15. Prototype Build Sequence

1. Bench-assemble and individually test each sensor subsystem on one Heltec V3 board (I2C addresses, HX711 wiring, MPU6050 interrupt wiring)
2. Write and validate node firmware: sensor sampling, calibration storage, deep-sleep/wake cycle, LoRa payload format
3. Bench-test LoRa link between one node and the gateway at short range to validate payload parsing end-to-end
4. Assemble remaining 4 nodes; repeat calibration procedure (Section 6.2) for each
5. Deploy nodes at the test site; conduct the LoRa walk-test (Section 10) to set per-node spreading factors
6. Bring up the gateway: LoRa reception, edge-AI anomaly scoring, siren/beacon relay wiring
7. Run the multi-day burn-in / false-positive validation period (Section 12)
8. Conduct a controlled induced-event test (e.g., manually shift the VL53L0X target plate, apply a known load to the strain gauge) to confirm end-to-end alarm triggering and latency
9. Document battery runtime against the bench discharge test baseline
10. Final report-out: consolidated results against the metrics in Section 12

---

## 16. Safety & Procurement Notes

- Use only protected Li-ion cells with a proper BMS/TP4056-protection module; never deploy bare unprotected cells in the field
- Verify the Heltec board variant matches the IN865 band before ordering — some listings default to 868/915 MHz variants not compliant for Indian deployment without reconfiguration
- Strain-gauge bonding chemicals (adhesives, degreasers) should be handled per their MSDS; ensure adequate ventilation during bonding
- All enclosure IP ratings and cable glands should be verified before field deployment in monsoon-prone sites
- Component prices in this report are estimates only — obtain current quotes from at least two vendors before finalizing the procurement budget

---

## 17. Conclusion

The SIH26025 system, as specified, is a low-cost (~₹35,000–₹58,000 for a 5-node prototype), low-power (weeks-to-months of battery life depending on duty cycle), LoRa-connected monitoring network combining tilt/vibration, crack-width, and strain sensing with edge-AI correlation and GNSS/InSAR context. The design deliberately favors realistic, field-validated figures (walk-tested LoRa range, conservative usable battery energy, documented sensor limitations) over idealized datasheet numbers, so that the prototype's reported performance in the SIH evaluation reflects what the system will actually do in the field.
