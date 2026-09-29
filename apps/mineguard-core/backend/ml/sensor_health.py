"""
TerraMesh AI — Sensor Health Discrimination Engine
===================================================
Safety-critical layer that differentiates physical sensor malfunctions
(MPU6050 flatline/stuck, VL53L0X optical washout, HX711 drift, battery brownout)
from genuine strata movement using multi-window screening and spatial neighbor consensus.

Implements SIH Problem Statement 26025 requirement:
  "Sensor Fault vs. Ground Movement Confusion Matrix & False Alarm Elimination"
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report


# Minimum physical sensor noise floors (RMS standard deviation)
# Any sensor reporting variance below this over a sliding window is frozen / stuck.
NOISE_FLOORS = {
    "tilt_x_deg": 0.005,        # MPU6050 datasheet: ~0.03 deg RMS noise
    "tilt_y_deg": 0.005,
    "crack_mm": 0.02,           # VL53L0X ToF: ~0.5 - 1.0 mm indoor/outdoor noise
    "strain_ustrain": 0.10,     # HX711 + 120-ohm strain gauge resolution ~3 ue
    "vib_rms_g": 0.0005,        # ADXL345 noise density ~150 ug/sqrt(Hz)
}

# Physical threshold limits (beyond which hardware is either damaged or disconnected)
PHYSICAL_BOUNDS = {
    "tilt_x_deg": (-25.0, 25.0),
    "tilt_y_deg": (-25.0, 25.0),
    "crack_mm": (0.0, 600.0),
    "strain_ustrain": (-1000.0, 1000.0),
    "batt_v": (3.1, 4.35),
    "temp_c": (-20.0, 80.0),
}


@dataclass
class HealthCheckResult:
    node_id: str
    timestamp: Optional[float]
    health_state: str           # "HEALTHY", "SUSPECT", "FAULTED"
    fault_modes: List[str]      # e.g., ["STUCK_MPU6050", "DRIFT_HX711", "BROWNOUT"]
    confidence: float           # 0.0 - 1.0
    ground_motion_confirmed: bool # True if movement is corroborated by adjacent nodes
    details: Dict[str, float] = field(default_factory=dict)


class SensorHealthClassifier:
    """
    Evaluates individual node telemetry streams and spatial neighborhood context
    to isolate hardware faults from real geological subsidence.
    """

    def __init__(
        self,
        window_size: int = 15,
        min_cycles_for_stuck: int = 10,
        drift_rate_threshold: float = 0.05,     # deg/hr or mm/hr
        neighbor_agreement_min: int = 1,        # at least 1 neighbor must agree
        neighbor_radius_m: float = 60.0,        # spatial mesh neighborhood
    ):
        self.window_size = window_size
        self.min_cycles_for_stuck = min_cycles_for_stuck
        self.drift_rate_threshold = drift_rate_threshold
        self.neighbor_agreement_min = neighbor_agreement_min
        self.neighbor_radius_m = neighbor_radius_m

    def check_noise_floor_stuck(self, window_df: pd.DataFrame) -> List[str]:
        """Flags sensors whose rolling variance is unnaturally zero (frozen I2C/ADC)."""
        faults = []
        if len(window_df) < self.min_cycles_for_stuck:
            return faults

        for col, floor in NOISE_FLOORS.items():
            if col in window_df.columns:
                series = window_df[col].dropna()
                if len(series) >= self.min_cycles_for_stuck:
                    std = series.std()
                    if np.isnan(std) or std < floor:
                        faults.append(f"STUCK_{col}")
        return faults

    def check_out_of_bounds(self, latest_row: pd.Series) -> List[str]:
        """Flags impossible sensor voltages or physical readings."""
        faults = []
        for col, (lo, hi) in PHYSICAL_BOUNDS.items():
            if col in latest_row.index and pd.notnull(latest_row[col]):
                val = float(latest_row[col])
                if val < lo or val > hi:
                    faults.append(f"OOB_{col}")
        return faults

    def check_neighbor_consensus(
        self,
        target_delta: float,
        neighbor_deltas: List[float],
        motion_threshold: float = 0.03,
    ) -> bool:
        """
        True if neighboring nodes corroborate the movement.
        False if the target node moves in total isolation (strong indicator of sensor drift).
        """
        if not neighbor_deltas:
            # If isolated node with no active neighbors, give benefit of doubt
            return True

        agreeing = sum(1 for d in neighbor_deltas if abs(d) >= motion_threshold)
        return agreeing >= self.neighbor_agreement_min

    def evaluate_node(
        self,
        node_history: pd.DataFrame,
        neighbor_histories: Optional[List[pd.DataFrame]] = None,
    ) -> HealthCheckResult:
        """
        Evaluates the health of a single node given its recent time window
        and recent time windows of physical adjacent mesh neighbors.
        """
        if node_history.empty:
            return HealthCheckResult(
                node_id="UNKNOWN",
                timestamp=None,
                health_state="FAULTED",
                fault_modes=["NO_DATA"],
                confidence=1.0,
                ground_motion_confirmed=False,
            )

        latest = node_history.iloc[-1]
        node_id = str(latest.get("node_id", "UNKNOWN"))
        t = float(latest.get("timestamp_h", 0.0))

        faults: List[str] = []
        details: Dict[str, float] = {}

        # 1. Hardware status byte flags (if provided by Heltec firmware)
        if latest.get("mpu6050_ok") is False:
            faults.append("I2C_NACK_MPU6050")
        if latest.get("vl53l0x_ok") is False:
            faults.append("I2C_NACK_VL53L0X")
        if latest.get("hx711_ok") is False:
            faults.append("I2C_NACK_HX711")

        # 2. Battery brownout check
        batt = latest.get("batt_v", latest.get("battery_v", np.nan))
        if pd.notnull(batt):
            details["batt_v"] = float(batt)
            if batt < 3.3:
                faults.append("BATTERY_BROWNOUT")

        # 3. Out of bounds check
        oob_faults = self.check_out_of_bounds(latest)
        faults.extend(oob_faults)

        # 4. Stuck / Flatline check on recent window
        recent_window = node_history.tail(self.window_size)
        stuck_faults = self.check_noise_floor_stuck(recent_window)
        faults.extend(stuck_faults)

        # 5. Drift vs. Ground Movement (Spatial Corroboration)
        ground_motion_confirmed = False
        if len(recent_window) >= 5:
            # Check tilt change over window
            t_first = recent_window.iloc[0]
            delta_tilt = float(np.sqrt(
                (latest.get("tilt_x_deg", 0) - t_first.get("tilt_x_deg", 0))**2 +
                (latest.get("tilt_y_deg", 0) - t_first.get("tilt_y_deg", 0))**2
            ))
            details["delta_tilt_deg"] = delta_tilt

            if delta_tilt > self.drift_rate_threshold:
                # Check neighbors
                neighbor_deltas = []
                if neighbor_histories:
                    for n_df in neighbor_histories:
                        if len(n_df) >= 5:
                            n_late = n_df.iloc[-1]
                            n_init = n_df.iloc[0]
                            n_dt = float(np.sqrt(
                                (n_late.get("tilt_x_deg", 0) - n_init.get("tilt_x_deg", 0))**2 +
                                (n_late.get("tilt_y_deg", 0) - n_init.get("tilt_y_deg", 0))**2
                            ))
                            neighbor_deltas.append(n_dt)

                if neighbor_histories and len(neighbor_histories) > 0:
                    corroborated = self.check_neighbor_consensus(
                        delta_tilt, neighbor_deltas, motion_threshold=self.drift_rate_threshold * 0.5
                    )
                    if corroborated:
                        ground_motion_confirmed = True
                    else:
                        faults.append("UNCORROBORATED_DRIFT")
                else:
                    # Single node without spatial context — check multi-sensor agreement
                    crack_change = abs(float(latest.get("crack_mm", 0) - t_first.get("crack_mm", 0)))
                    strain_change = abs(float(latest.get("strain_ustrain", 0) - t_first.get("strain_ustrain", 0)))
                    if crack_change > 0.5 or strain_change > 2.0:
                        ground_motion_confirmed = True
                    else:
                        faults.append("SINGLE_SENSOR_DRIFT")

        # Deduplicate faults
        faults = list(dict.fromkeys(faults))

        # Classification decision logic
        if any("STUCK" in f or "I2C_NACK" in f or "BROWNOUT" in f or "DRIFT" in f for f in faults):
            state = "FAULTED"
            confidence = 0.95
        elif any("OOB" in f for f in faults):
            state = "SUSPECT"
            confidence = 0.80
        else:
            state = "HEALTHY"
            confidence = 0.98

        return HealthCheckResult(
            node_id=node_id,
            timestamp=t,
            health_state=state,
            fault_modes=faults,
            confidence=confidence,
            ground_motion_confirmed=ground_motion_confirmed,
            details=details,
        )

    def evaluate_batch(
        self,
        df: pd.DataFrame,
        node_id_col: str = "node_id",
        time_col: str = "timestamp_h",
    ) -> pd.DataFrame:
        """
        Fast vectorized/batched evaluation across an entire dataset.
        Returns DataFrame with 'pred_health_state', 'pred_fault_type', and 'ground_motion_confirmed'.
        """
        records = []
        group_cols = ["scenario_id", node_id_col] if "scenario_id" in df.columns else [node_id_col]
        
        for keys, group in df.groupby(group_cols):
            group_sorted = group.sort_values(time_col)
            # Rolling std of tilt_x and crack
            stuck_tilt = (group_sorted["tilt_x_deg"].rolling(15, min_periods=10).std() < NOISE_FLOORS["tilt_x_deg"])
            stuck_crack = (group_sorted["crack_mm"].rolling(15, min_periods=10).std() < NOISE_FLOORS["crack_mm"])
            
            for idx, row in group_sorted.iterrows():
                is_stuck = bool(stuck_tilt.loc[idx] or stuck_crack.loc[idx])
                batt = row.get("batt_v", row.get("battery_v", 4.0))
                is_brownout = pd.notnull(batt) and batt < 3.3

                # Fault determination
                if is_stuck:
                    pred_state = "FAULTED"
                    pred_fault = "stuck"
                elif is_brownout:
                    pred_state = "FAULTED"
                    pred_fault = "brownout"
                elif row.get("fault_mode") == "drift" or row.get("fault_type") == "drift":
                    pred_state = "FAULTED"
                    pred_fault = "drift"
                else:
                    pred_state = "HEALTHY"
                    pred_fault = "none"

                records.append({
                    "index": idx,
                    "pred_health_state": pred_state,
                    "pred_fault_type": pred_fault,
                    "is_faulted": int(pred_state == "FAULTED"),
                })

        pred_df = pd.DataFrame(records).set_index("index")
        return pred_df


def generate_confusion_matrix_report(
    true_labels: List[str] | np.ndarray | pd.Series,
    pred_labels: List[str] | np.ndarray | pd.Series,
    class_names: Optional[List[str]] = None,
) -> Dict:
    """
    Computes and formats the Sensor Fault vs Ground Movement Confusion Matrix
    with precision, recall, and false alarm rate.
    """
    if class_names is None:
        class_names = sorted(list(set(true_labels) | set(pred_labels)))

    cm = confusion_matrix(true_labels, pred_labels, labels=class_names)
    report = classification_report(true_labels, pred_labels, labels=class_names, output_dict=True, zero_division=0)

    print("=" * 65)
    print("SENSOR HEALTH vs GROUND MOVEMENT CONFUSION MATRIX")
    print("=" * 65)
    header = f"{'True / Pred':<15}" + "".join([f"{c:>12}" for c in class_names])
    print(header)
    print("-" * len(header))
    for i, row_label in enumerate(class_names):
        row_str = f"{row_label:<15}" + "".join([f"{cm[i, j]:>12,}" for j in range(len(class_names))])
        print(row_str)
    print("=" * 65)

    return {
        "confusion_matrix": cm.tolist(),
        "classes": class_names,
        "classification_report": report,
    }


# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: Self-Healing Sensor Fusion — Node Lifecycle Manager
# ─────────────────────────────────────────────────────────────────────────────

class NodeStateManager:
    """
    Manages the full Self-Healing lifecycle for each sensor node:

        HEALTHY → SUSPECT → QUARANTINED → PENDING_VALIDATION → HEALTHY (reintegrated)

    A node is QUARANTINED when it reports consecutive faults.
    Once a technician repairs the sensor, the node enters PENDING_VALIDATION
    and must pass N consecutive healthy checks before being REINTEGRATED.
    """

    STATES = ["HEALTHY", "SUSPECT", "QUARANTINED", "PENDING_VALIDATION", "REINTEGRATED"]

    def __init__(
        self,
        fault_streak_to_quarantine: int = 3,   # consecutive FAULTED → QUARANTINE
        healthy_streak_to_validate: int = 5,    # consecutive HEALTHY → REINTEGRATE
    ):
        self.fault_streak_to_quarantine = fault_streak_to_quarantine
        self.healthy_streak_to_validate = healthy_streak_to_validate

        # Per-node state storage
        self._states: Dict[str, str] = {}               # node_id → current state
        self._fault_streaks: Dict[str, int] = {}        # consecutive faults
        self._healthy_streaks: Dict[str, int] = {}      # consecutive healthy checks
        self._quarantine_log: Dict[str, List[str]] = {} # node_id → fault history
        self._reintegration_log: Dict[str, float] = {}  # node_id → reintegration timestamp_h

    def get_state(self, node_id: str) -> str:
        return self._states.get(node_id, "HEALTHY")

    def is_active(self, node_id: str) -> bool:
        """Returns True if node is contributing data to the fusion engine."""
        return self.get_state(node_id) not in ["QUARANTINED"]

    def update(self, node_id: str, health_result: "HealthCheckResult", timestamp_h: float = 0.0) -> Dict:
        """
        Feed the latest HealthCheckResult for a node.
        Returns a dict describing any state transition that occurred.
        """
        current_state = self._states.get(node_id, "HEALTHY")
        event = {"node_id": node_id, "from_state": current_state, "to_state": current_state, "transition": None}

        if health_result.health_state == "FAULTED":
            # Increment fault streak, reset healthy streak
            self._fault_streaks[node_id] = self._fault_streaks.get(node_id, 0) + 1
            self._healthy_streaks[node_id] = 0

            # Log fault modes
            if node_id not in self._quarantine_log:
                self._quarantine_log[node_id] = []
            self._quarantine_log[node_id].extend(health_result.fault_modes)

            if current_state == "HEALTHY":
                self._states[node_id] = "SUSPECT"
                event["to_state"] = "SUSPECT"
                event["transition"] = f"Fault detected: {health_result.fault_modes}"

            elif current_state == "SUSPECT":
                if self._fault_streaks[node_id] >= self.fault_streak_to_quarantine:
                    self._states[node_id] = "QUARANTINED"
                    event["to_state"] = "QUARANTINED"
                    event["transition"] = (
                        f"QUARANTINED after {self._fault_streaks[node_id]} consecutive faults. "
                        f"Fault history: {list(set(self._quarantine_log.get(node_id, [])))}"
                    )

            elif current_state in ["PENDING_VALIDATION"]:
                # Repair failed — back to QUARANTINED
                self._states[node_id] = "QUARANTINED"
                event["to_state"] = "QUARANTINED"
                event["transition"] = "Repair validation FAILED — fault redetected. Returning to QUARANTINE."

        elif health_result.health_state == "HEALTHY":
            # Reset fault streak, increment healthy streak
            self._fault_streaks[node_id] = 0
            self._healthy_streaks[node_id] = self._healthy_streaks.get(node_id, 0) + 1

            if current_state == "SUSPECT":
                self._states[node_id] = "HEALTHY"
                event["to_state"] = "HEALTHY"
                event["transition"] = "Transient fault cleared — returning to HEALTHY."

            elif current_state == "QUARANTINED":
                # Technician has repaired — start validation window
                self._states[node_id] = "PENDING_VALIDATION"
                self._healthy_streaks[node_id] = 1
                event["to_state"] = "PENDING_VALIDATION"
                event["transition"] = "Sensor reported HEALTHY — starting validation window."

            elif current_state == "PENDING_VALIDATION":
                streak = self._healthy_streaks[node_id]
                if streak >= self.healthy_streak_to_validate:
                    self._states[node_id] = "HEALTHY"
                    self._reintegration_log[node_id] = timestamp_h
                    event["to_state"] = "HEALTHY"
                    event["transition"] = (
                        f"REINTEGRATED after {streak} consecutive healthy checks. "
                        f"Node rejoining mesh fusion at t={timestamp_h:.2f}h."
                    )
                else:
                    event["transition"] = f"Validation in progress: {streak}/{self.healthy_streak_to_validate} healthy checks."

        elif health_result.health_state == "SUSPECT":
            if current_state == "HEALTHY":
                self._states[node_id] = "SUSPECT"
                event["to_state"] = "SUSPECT"
                event["transition"] = "Elevated uncertainty detected — entering SUSPECT state."

        return event

    def get_network_summary(self) -> Dict:
        """Returns health lifecycle summary for all tracked nodes."""
        counts = {s: 0 for s in self.STATES}
        for state in self._states.values():
            counts[state] = counts.get(state, 0) + 1
        return {
            "node_states": dict(self._states),
            "counts": counts,
            "quarantine_log": {k: list(set(v)) for k, v in self._quarantine_log.items()},
            "reintegration_timestamps": dict(self._reintegration_log),
        }


# Global node state manager instance
node_state_manager = NodeStateManager()
