# TerraMesh AI — Sensor Calibration Plan

> **STATUS: FUTURE PROCEDURE — NOT EXECUTED.** No physical sensor has been
> calibrated in this project (no hardware exists). This is the required
> procedure for the field campaign.

## Per-sensor calibration (before deployment)

| Sensor | Calibration method | Reference standard | Success criterion |
|---|---|---|---|
| MPU6050 tilt (X/Y) | 2-point gravity flip (0°/180°) + precision levelling comparison at deployment site | Surveyor's level ±0.01° | Node reading within ±0.05° of reference at 3 orientations |
| VL53L0X crack-gap ToF | Gauge-block set (1/5/10/20/50 mm) across the fixture | Machined gauge blocks | Linear within ±0.3 mm over 0–50 mm; documented offset stored in firmware |
| HX711 strain (µε) | Shunt-calibration resistor + known-load cantilever | Precision weights (Class F1) | Within ±2% FS after firmware tare |
| ADXL345 vibration | On-site ambient window + controlled shaker table if available | Established per-site baseline, not a lab standard | RMS noise floor recorded; burst sampling at 200 Hz confirmed stable |
| Battery voltage divider | Digital multimeter comparison across 3.3–4.2 V | Calibrated DMM ±1 mV | Within ±20 mV after `analogReadMilliVolts` calibration |

## Software calibration records

- `/api/settings/calibrate` zeroes tilt + resets Kalman state — every use is
  audit-logged with operator identity; the log is part of the calibration
  record (see `audit_logs` table, action `SENSOR_CALIBRATION`)
- Firmware `buildTemplate` carries the on-node calibration identity so every
  telemetry packet remains attributable to a calibration epoch

## Environmental conditions to record per calibration

- Temperature, humidity, rain state (these drive `rain_flag` semantics)
- Panel/extraction state at the deployment face
- Blast schedule (drives `blast_flag` semantics)

## Drift management

- Weekly cross-check against the reference instrument during Phase V1
- Any node drifting beyond criterion → `NodeStateManager` lifecycle should
  transition it to SUSPECT/QUARANTINED organically; verify the lifecycle
  fires on real drift (this validates the self-healing claim with hardware)
