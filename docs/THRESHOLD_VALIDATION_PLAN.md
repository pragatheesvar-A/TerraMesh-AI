# TerraMesh AI — Threshold Validation Plan

> **STATUS: FUTURE PROCEDURE — NOT EXECUTED.** All current thresholds are
> PROJECT-DEFINED ENGINEERING LIMITS (see docs/THRESHOLD_AUDIT.md). They are
> NOT statutory DGMS values and must NOT be presented as such. This plan
> defines how they would be tuned against real data.

## Current thresholds under validation

| Engine | Parameter | Current (project) limit | Unit | Configurable via |
|---|---|---|---|---|
| Unified Risk Engine | tilt | warn 2.0 / crit 3.5 | degrees | `risk/thresholds.py` / `RISK_THRESHOLDS_OVERRIDE` env |
| Unified Risk Engine | displacement rate | warn 5 / crit 10 | mm/day | same |
| Unified Risk Engine | vibration (PPV) | warn 4 / crit 7.5 | mm/s | same |
| Unified Risk Engine | crack width | warn 3 / crit 10 | mm | same |
| ML service (layer-2 override) | tilt critical | 3.2 | degrees | `/api/settings/sync` safety_thresholds |
| ML service (layer-2 override) | displacement critical | 2.8 | mm | same |
| Environmental engine | CH4 | warn 0.5% / evac 1.0% / LEL 5% | % v/v | `environmental/atmosphere.py` constants |
| Environmental engine | CO | warn 24 / evac 50 | ppm | same |
| Environmental engine | O2 deficient | 19.5 / crit 18 | % | same |
| Forecaster (hours-to-critical) | NCB limits | tilt 8 mrad, crack 20 mm, strain 50 µε | mixed | `ml/forecaster.py` |
| Blast suppression | dom freq | ≥ 25 Hz + peak ≥ 1.5 g | Hz + g | `ml/vibration_filter.py` |

## Validation procedure

1. **Correlation study (Phase V1 data):** regress reference-instrument
   movement against node readings per channel; confirm the engineering limits
   sit at the intended percentiles of the on-site noise distribution.
2. **ROC tuning:** using labelled events (real movement vs. ambient), sweep
   each threshold; record TPR/FPR; select operating points with FN = 0 and
   document the accepted FP rate.
3. **Override governance:** any tuned value lands via
   `RISK_THRESHOLDS_OVERRIDE` (env) or the settings sync API — both
   audit-logged; version the override JSON alongside the validation report.
4. **Re-classification:** thresholds remain PROJECT STANDARD values until a
   regulator or mine engineer formally adopts them — only then may any
   compliance wording be attached (and only with the adopting authority's
   documentation on file).

## Explicit non-claims

- The current numbers derive from literature-informed engineering judgement
  and the synthetic training corpus — no field calibration exists.
- No DGMS/CIMFR endorsement has been sought or received.
