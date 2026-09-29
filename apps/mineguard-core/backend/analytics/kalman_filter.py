"""
TerraMesh AI — Analytics Module: Discrete Kalman Filter
========================================================
Provides sensor-fusion noise reduction for mine subsidence monitoring.

The Kalman filter is the industry standard for sequential state estimation
under Gaussian process and measurement noise. Applied here to:
  1. Tilt (mrad)      — MEMS gyro / tiltmeter noise profile
  2. Displacement (mm)— GNSS-based surface movement, high drift noise
  3. Crack width (mm) — LVDT transducer, low-frequency noise

Architecture:
  - DiscreteKalmanFilter  : Single measurement type, single node
  - KalmanFilterBank      : Manages one filter per (node_id, measurement_type) pair

Label: All outputs of this module are MODEL OUTPUT (Kalman-filtered estimate).
       Raw sensor inputs are MEASURED DATA.

References:
  - Welch & Bishop (2006) "An Introduction to the Kalman Filter" — UNC TR95-041
  - NCB Subsidence Engineers' Handbook — sensor noise profiles for coal mines
"""

from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple


# ─── Sensor-specific noise profiles ───────────────────────────────────────────
# Q = process noise covariance (how much the true state can change per step)
# R = measurement noise covariance (how noisy the sensor is)
# Tuned empirically for MEMS-class sensors in underground coal mine conditions.

SENSOR_PROFILES: Dict[str, Dict[str, float]] = {
    "tilt": {
        "Q": 1e-4,   # Tilt changes slowly — low process noise
        "R": 0.05,   # MEMS tiltmeter: ±0.05° RMS noise
        "x0": 0.0,   # Initial state estimate
        "P0": 1.0,   # Initial error covariance (uncertain at start)
    },
    "displacement": {
        "Q": 1e-3,   # Surface displacement can shift meaningfully between readings
        "R": 0.5,    # GNSS/tape extensometer: ±0.5mm RMS noise
        "x0": 0.0,
        "P0": 2.0,
    },
    "crack_width": {
        "Q": 5e-5,   # Crack width changes very slowly
        "R": 0.02,   # LVDT: ±0.02mm RMS noise
        "x0": 0.0,
        "P0": 0.5,
    },
    "vibration": {
        "Q": 1e-2,   # Vibration can spike rapidly
        "R": 0.3,    # Accelerometer: moderate noise
        "x0": 0.0,
        "P0": 1.0,
    },
}


@dataclass
class KalmanState:
    """Encapsulates Kalman filter state for a single measurement stream."""
    x: float        # State estimate (filtered value)
    P: float        # Error covariance
    Q: float        # Process noise covariance (tunable)
    R: float        # Measurement noise covariance (sensor spec)
    K: float = 0.0  # Last Kalman gain (for diagnostics)
    innovation: float = 0.0  # Last innovation (measurement - prediction)
    n_updates: int = 0       # Total number of updates processed


class DiscreteKalmanFilter:
    """
    1D scalar Discrete Kalman Filter.

    State model (constant velocity / random walk):
        x(k) = x(k-1) + w(k)     [process model, w ~ N(0, Q)]
        z(k) = x(k) + v(k)       [measurement model, v ~ N(0, R)]

    This is the simplest valid model. For subsidence monitoring,
    ground movement is treated as a slow random walk — appropriate for
    mm-scale deformation over hours/days.
    """

    def __init__(self, Q: float, R: float, x0: float = 0.0, P0: float = 1.0):
        self.state = KalmanState(x=x0, P=P0, Q=Q, R=R)

    def predict(self) -> float:
        """
        Time update (predict step).
        Projects the state estimate ahead by one time step.
        Returns the predicted state estimate.
        """
        # State prediction: x̂(k|k-1) = x̂(k-1|k-1)
        # (constant model — no control input)
        # Error covariance prediction: P(k|k-1) = P(k-1|k-1) + Q
        self.state.P = self.state.P + self.state.Q
        return self.state.x

    def update(self, measurement: float) -> float:
        """
        Measurement update (correct step).
        Incorporates new sensor reading and returns the corrected estimate.

        Args:
            measurement: Raw sensor reading (MEASURED DATA)

        Returns:
            Filtered state estimate (MODEL OUTPUT — Kalman)
        """
        P = self.state.P
        R = self.state.R
        x = self.state.x

        # Kalman gain: K = P / (P + R)
        K = P / (P + R)

        # Innovation: y = z - x̂ (measurement residual)
        innovation = measurement - x

        # State update: x̂ = x̂ + K * y
        x_updated = x + K * innovation

        # Covariance update: P = (1 - K) * P
        P_updated = (1.0 - K) * P

        # Store updated state
        self.state.x = x_updated
        self.state.P = P_updated
        self.state.K = K
        self.state.innovation = innovation
        self.state.n_updates += 1

        return x_updated

    def filter(self, measurement: float) -> Tuple[float, KalmanState]:
        """
        Combined predict + update step. Call this for each new sensor reading.

        Args:
            measurement: Raw sensor reading

        Returns:
            (filtered_value, state) — state contains diagnostics
        """
        self.predict()
        filtered = self.update(measurement)
        return filtered, self.state

    def reset(self, x0: Optional[float] = None, P0: Optional[float] = None):
        """Reset filter state (e.g., after sensor replacement or calibration)."""
        if x0 is not None:
            self.state.x = x0
        if P0 is not None:
            self.state.P = P0
        self.state.n_updates = 0


@dataclass
class FilteredReading:
    """Output of KalmanFilterBank for a single node packet."""
    node_id: str
    raw_tilt: float
    filtered_tilt: float
    raw_displacement: float
    filtered_displacement: float
    raw_crack_width: float
    filtered_crack_width: float
    tilt_innovation: float          # Prediction error for tilt
    displacement_innovation: float  # Prediction error for displacement
    kalman_gain_tilt: float         # Diagnostic: how much we trusted the measurement


class KalmanFilterBank:
    """
    Manages a pool of DiscreteKalmanFilters — one per (node_id, measurement_type).

    Usage:
        bank = KalmanFilterBank()
        result = bank.process(node_id="NODE-017", tilt=4.8, displacement=12.4, crack_width=7.2)
        # result.filtered_tilt is the Kalman-smoothed estimate
    """

    def __init__(self):
        # filter_pool[node_id][measurement_type] = DiscreteKalmanFilter
        self._pool: Dict[str, Dict[str, DiscreteKalmanFilter]] = {}
        self._profiles = SENSOR_PROFILES

    def _get_or_create(self, node_id: str, mtype: str) -> DiscreteKalmanFilter:
        """Lazily initialise a filter for a new (node, measurement_type) pair."""
        if node_id not in self._pool:
            self._pool[node_id] = {}
        if mtype not in self._pool[node_id]:
            p = self._profiles.get(mtype, self._profiles["tilt"])
            self._pool[node_id][mtype] = DiscreteKalmanFilter(
                Q=p["Q"], R=p["R"], x0=p["x0"], P0=p["P0"]
            )
        return self._pool[node_id][mtype]

    def process(
        self,
        node_id: str,
        tilt: float,
        displacement: float,
        crack_width: float,
    ) -> FilteredReading:
        """
        Run Kalman filters for a node's latest sensor packet.

        Args:
            node_id:      Sensor node identifier
            tilt:         Raw tilt in degrees (MEASURED DATA)
            displacement: Raw displacement in mm (MEASURED DATA)
            crack_width:  Raw crack width in mm (MEASURED DATA)

        Returns:
            FilteredReading with both raw and filtered values (MODEL OUTPUT)
        """
        f_tilt, s_tilt = self._get_or_create(node_id, "tilt").filter(tilt)
        f_disp, s_disp = self._get_or_create(node_id, "displacement").filter(displacement)
        f_crack, _     = self._get_or_create(node_id, "crack_width").filter(crack_width)

        return FilteredReading(
            node_id=node_id,
            raw_tilt=tilt,
            filtered_tilt=round(f_tilt, 4),
            raw_displacement=displacement,
            filtered_displacement=round(f_disp, 4),
            raw_crack_width=crack_width,
            filtered_crack_width=round(f_crack, 4),
            tilt_innovation=round(s_tilt.innovation, 4),
            displacement_innovation=round(s_disp.innovation, 4),
            kalman_gain_tilt=round(s_tilt.K, 4),
        )

    def reset_node(self, node_id: str):
        """Reset all filters for a node (e.g., after sensor replacement)."""
        if node_id in self._pool:
            del self._pool[node_id]

    def get_node_stats(self, node_id: str) -> Dict[str, Dict]:
        """Return diagnostic statistics for a node's filters."""
        stats = {}
        if node_id in self._pool:
            for mtype, f in self._pool[node_id].items():
                stats[mtype] = {
                    "filtered_value": round(f.state.x, 4),
                    "error_covariance": round(f.state.P, 6),
                    "kalman_gain": round(f.state.K, 4),
                    "last_innovation": round(f.state.innovation, 4),
                    "n_updates": f.state.n_updates,
                }
        return stats

    @property
    def active_node_count(self) -> int:
        return len(self._pool)


# Module-level singleton — import and use directly
kalman_bank = KalmanFilterBank()
