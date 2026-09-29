# TerraMesh AI — Threshold Audit

> Every numeric safety threshold in the codebase, its classification, and
> where it is configured. **No threshold in this repository is a statutory
> DGMS value.** Classifications used:

- `PROJECT STANDARD` — project-defined engineering limit
- `ENGINEERING CALCULATION` — derived from a documented empirical method
- `MODEL THRESHOLD` — learned from the (synthetic) training corpus
- `SIMULATION PARAMETER` — drives demonstration behaviour only

| Engine | Parameter | Value | Unit | Class | Rationale | Config location |
|---|---|---|---|---|---|---|
| risk/thresholds.py | tilt warn/crit | 2.0 / 3.5 | deg | PROJECT STANDARD | Literature-informed strata-warning limits for shallow panels | `PROJECT_DEFINED_THRESHOLDS` / `RISK_THRESHOLDS_OVERRIDE` env |
| risk/thresholds.py | displacement warn/crit | 5 / 10 | mm/day | PROJECT STANDARD | Roof-to-floor closure convergence guidance | same |
| risk/thresholds.py | vibration warn/crit | 4 / 7.5 | mm/s PPV | PROJECT STANDARD | Structural vibration annoyance/damage band | same |
| risk/thresholds.py | crack warn/crit | 3 / 10 | mm | PROJECT STANDARD | Fissure-width escalation band | same |
| risk/hysteresis.py | severity deadband | 15% | ratio | PROJECT STANDARD | Anti-flap clearing margin below each threshold | `HysteresisFilter(deadband=0.15)` |
| ml_service | tilt/displacement physical override | 3.2 / 2.8 | deg / mm | MODEL THRESHOLD | Trained-classifier escalation bound (synthetic corpus) | `/api/settings/sync` safety_thresholds (audited) |
| ml_service | IF anomaly threshold | 0.504 | score | MODEL THRESHOLD | Trained 95th-percentile from `isolation_forest_meta.json` — synced, not hardcoded | `models/isolation_forest_meta.json` |
| ml/vibration_filter.py | blast signature | ≥25 Hz & ≥1.5 g peak (with schedule/manual flags) | Hz, g | PROJECT STANDARD | Blasting vs. ground-motion discrimination | `VibrationFingerprinter.classify` |
| ml/forecaster.py | hours-to-critical NCB limits | tilt 8 mrad / crack 20 mm / strain 50 µε | mixed | ENGINEERING CALCULATION | NCB empirical subsidence guidance | `NCB_LIMITS` dict |
| ml/shadow_engine.py | composite weights | 0.40 XGB / 0.25 anomaly / 0.20 forecast / 0.15 physics | weights | MODEL THRESHOLD | Fusion emphasis from training-validation | `evaluate_node` constants |
| environmental/atmosphere.py | CH4 warn/evac/LEL | 0.5 / 1.0 / 5.0 | % v/v | PROJECT STANDARD (LEL: literature) | Action levels far below the 5–15% explosible band | `EnvironmentalSafetyEngine` constants |
| environmental/atmosphere.py | CO warn/evac | 24 / 50 | ppm | PROJECT STANDARD | Exposure-band action levels | same |
| environmental/atmosphere.py | O2 deficient/crit | 19.5 / 18.0 | % | PROJECT STANDARD | Oxygen-deficiency thresholds | same |
| environmental/atmosphere.py | Coward triangle | nose (5.9,12.1), LEL(5,20.93), UEL(15,17.79) | %, % | ENGINEERING CALCULATION | Coward method literature values | `explosibility_analysis` |
| geotechnical/geotech_engine.py | FoS interpretation bands | ≥2.0 / 1.4–2.0 / 1.0–1.4 / <1.0 | ratio | ENGINEERING CALCULATION | Standard slope/roof stability practice | `factor_of_safety` note |
| edge firmware reference | on-node fixed-point stumps | mirrors the four risk-engine channels | mixed | PROJECT STANDARD | Same project limits, quantized ×100/×10 | `terramesh_node.ino` constants |
| simulation.py | demo-zone scripted risk | 87, trend 18, workers-at-risk 7 | — | SIMULATION PARAMETER | Demo dataset — never presented as measurement | `simulation.py` |
| mqtt_client | future-timestamp reject / stale flag | 300 s / 600 s | s | PROJECT STANDARD | Telemetry sanity gates | `MAX_FUTURE_SKEW_S`, `STALE_AFTER_S` |
| edge contracts | quantization ranges | per-feature envelopes | mixed | PROJECT STANDARD | Observed physical envelopes for edge clamping | `edge/contracts/edge_model_contract.json` |

**Versioning:** threshold sets change via env overrides or the audited
settings API; both record the change in `audit_logs` with the operator
identity and previous/new state — that audit row is the threshold version
record. No separate version file is introduced until field tuning exists.
