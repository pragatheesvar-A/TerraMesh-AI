# PHASE 4 SENSOR INPUT CONTRACT

This document defines the canonical edge sensor inputs strictly based on the reference firmware implementation (`terramesh_node.ino`) and existing hardware architecture design.

## 1. General Telemetry Properties

All sensor readings generated at the edge MUST adhere to the following baseline fields before multiplexing into the gateway packet:

```ts
interface EdgeSensorReading {
  device_id: string;      // Canonical Node ID (e.g. NODE-017)
  timestamp: string;      // ISO-8601 UTC (from RTC or gateway timestamp if UNSYNCED)
  sequence: number;       // Monotonically increasing packet sequence
  sensor_type: string;    // Enum of supported sensor types (TILT, VIBRATION, CRACK, STRAIN)
  value: number | object; // Sensor specific payload
  unit: string;           // Canonical engineering unit
  quality: string;        // "VALID", "STALE", "MISSING", "SATURATED", "OUT_OF_RANGE"
}
```

## 2. Sensor Type Specifications

### A. Tilt (Inclinometer)
* **Hardware:** MPU6050 (3-axis Accelerometer configured for gravity vectoring)
* **Sampling:** Low-pass filtered (DLPF 44Hz) 
* **Signal Processing:** Gravity vector extraction → 3-sample median → Exponential Moving Average (EMA, alpha=0.25)
* **Contract Outputs:**
    * `tilt_x` (Unit: `deg`, Range: -90 to +90)
    * `tilt_y` (Unit: `deg`, Range: -90 to +90)
    * `mag_mrad` (Unit: `mrad`, Range: 0 to 1570)

### B. Vibration
* **Hardware:** ADXL345 (Digital Accelerometer)
* **Sampling:** 200 Hz burst window (100 samples / ~500ms)
* **Signal Processing:** Vector magnitude (`|a| = sqrt(x^2 + y^2 + z^2)`) → Goertzel FFT-lite
* **Contract Outputs:**
    * `rms_g` (Unit: `g`)
    * `peak_g` (Unit: `g`)
    * `band_lo_energy` (Unit: `g^2`, 0-10 Hz structural band)
    * `band_hi_energy` (Unit: `g^2`, 10-50 Hz high-frequency band)
    * `dom_freq` (Unit: `Hz`, Range: 2-50)

### C. Crack / Displacement
* **Hardware:** VL53L0X (Time-of-Flight laser-ranging)
* **Sampling:** Point measurement
* **Contract Outputs:**
    * `crack_mm` (Unit: `mm`, Resolution: 1mm)

### D. Strain
* **Hardware:** HX711 (24-bit ADC with load cell/strain gauge)
* **Contract Outputs:**
    * `microstrain` (Unit: `µε`)

### E. Health & Power (Node Diagnostic)
* **Hardware:** Internal ESP32-S3 ADC with 100k/100k voltage divider
* **Contract Outputs:**
    * `vbat_v` (Unit: `V`, Range: 3.30V - 4.20V)
    * `battery_pct` (Unit: `%`, Range: 0-100)
    * `firmware_version` (String)

## 3. Calibration Status
**CLASSIFICATION: NOT FIELD VERIFIED**
The firmware requires specific zero-offsets and scale factors (especially for the HX711 strain gauge and MPU6050 level-zeroing) which can only be determined post-installation. Currently, all values are treated as relative engineering estimates.
