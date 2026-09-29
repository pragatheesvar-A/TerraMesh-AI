from pydantic import BaseModel


class SensorThresholds(BaseModel):
    warning_low: float
    warning_high: float
    critical_low: float
    critical_high: float


# PROJECT-DEFINED ENGINEERING LIMITS — not statutory/regulatory thresholds.
#
# These defaults are project engineering assumptions used by the Unified Risk
# Engine's compliance layer. They are intentionally configurable at runtime
# (UnifiedRiskEngine.configure / RISK_THRESHOLDS_OVERRIDE env JSON) because
# different panels, depths and strata demand different limits. Presenting them
# as a statutory standard would be dishonest — they are a safety-conservative
# starting point defined by this project.
PROJECT_DEFINED_THRESHOLDS = {
    "tilt": SensorThresholds(
        warning_low=-2.0, warning_high=2.0,   # degrees
        critical_low=-3.5, critical_high=3.5
    ),
    # Displacement / convergence rate of the roof-to-floor closure
    "displacement": SensorThresholds(
        warning_low=0.0, warning_high=5.0,    # mm/day
        critical_low=0.0, critical_high=10.0
    ),
    # Historical alias kept for backwards compatibility with stored configs
    "convergence": SensorThresholds(
        warning_low=0.0, warning_high=5.0,
        critical_low=0.0, critical_high=10.0
    ),
    "vibration": SensorThresholds(
        warning_low=0.0, warning_high=4.0,    # mm/s (PPV)
        critical_low=0.0, critical_high=7.5
    ),
    # Surface fissure width (crack gauge)
    "crack": SensorThresholds(
        warning_low=0.0, warning_high=3.0,   # mm
        critical_low=0.0, critical_high=10.0
    ),
}
