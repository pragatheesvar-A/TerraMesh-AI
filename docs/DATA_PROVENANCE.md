# Data Provenance Taxonomy

Every data element surfaced by the platform carries one of these labels. The
label describes where the data ACTUALLY came from — never what it would be
nice for it to be.

| Label | Meaning | Examples |
|---|---|---|
| `MEASURED DATA` | Raw physical sensor reading from a hardware node (via MQTT/HTTP ingest) | Tilt, displacement, crack, vibration, battery telemetry rows |
| `MODEL OUTPUT` | Output of a trained model or filter | XGBoost class probabilities, Isolation-Forest anomaly score, Kalman-filtered values, SHADOW fused decisions |
| `ENGINEERING CALCULATION` | Transparent physics/empirical computation | Factor of Safety, RMR-89, Q-system, Sheorey/NCB residual, gas classification, Coward triangle |
| `SIMULATION` | Hypothetical or replayed scenario, never from live measurement | What-if endpoint results, scenario playback packets, demo state machine |
| `SIMULATED SATELLITE DATA` | InSAR grids from the labelled mock provider (no satellite credentials exist) | `/api/satellite/insar/*` when `INSAR_PROVIDER=mock` |
| `LIVE SATELLITE DATA` | Real interferometric observation (reserved — requires provider credentials) | Only when a real provider integration succeeds |
| `SIMULATED SEISMIC DATA` | Microseismic simulator events (no seismic hardware deployed) | Microseismic simulator bursts |
| `SIMULATED DISPATCH` | SMS that was NOT transmitted (no gateway configured) | SMS endpoints without gateway credentials |
| `OPERATOR ACTION` | Human-initiated command | Emergency broadcasts, acknowledgements, calibration, evacuation authorization |
| `UNLABELED` | Caller supplied data without a declared origin (never assumed measured) | Default provenance for report rows without a label |

Rules enforced across the codebase:

1. Simulated data is NEVER presented as live measurement.
2. A missing/absent channel is never defaulted into existence (no fabricated
   gas readings, no invented crack widths, no fake delivery receipts).
3. `is_loaded`/health states reflect reality, and degraded operation is
   labelled in the payload (`model_loaded=false`, `inference_mode`).
4. Providers without credentials raise `BLOCKED — ENVIRONMENT NOT AVAILABLE`
   instead of fabricating observations.
