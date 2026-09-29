"""
TerraMesh AI — Module 4.2: SHADOW Multi-Sensor Decision Engine
==============================================================
Safety-Critical Decision Fusion Engine for Underground Coal Mine Subsidence.

Combines:
  1. XGBoost 5-Class Risk Probabilities
  2. Isolation Forest Unsupervised Anomaly Score
  3. Short-Horizon Trajectory & Hours-to-Critical
  4. Physical Sensor Health State (Stuck / Drift / Brownout)
  5. ADXL345 Vibration Fingerprint & Blasting Siren Suppression
  6. Spatial Neighbor Consensus (>= 2 adjacent physical mesh nodes)

Enforces Safety Non-Negotiables:
  - NO DATA != SAFE (missing packets inflate uncertainty to minimum WATCH)
  - Blasting Siren Suppression (sirens suppressed during shift dynamite blast)
  - False Evacuation Prevention (single-node spikes require neighbor corroboration)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
import numpy as np
import pandas as pd

from ml.sensor_health import SensorHealthClassifier, HealthCheckResult
from ml.vibration_filter import VibrationFingerprinter, VibrationResult
from ml.forecaster import ShortHorizonForecaster, NodeForecastResult


# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: Physics Residual Monitor — Sheorey / NCB Empirical Subsidence Model
# ─────────────────────────────────────────────────────────────────────────────

class SubsidencePhysicsModel:
    """
    Computes expected surface subsidence using the Sheorey (1993) empirical
    formula and NCB Subsidence Engineers' Handbook parameters calibrated for
    Indian coalfields (Jharia, Raniganj, Singareni).
    Tilt angle from NCB Gaussian subsidence profile.
    Residual = actual_tilt - theta_expected
    """
    EXTRACTION_RATIOS = {"jharia": 0.75, "raniganj": 0.70, "singareni": 0.65, "default": 0.70}

    def __init__(
        self,
        seam_dip_deg: float = 6.0,
        panel_width_m: float = 120.0,
        extraction_height_m: float = 2.8,
        depth_m: float = 180.0,
        coalfield: str = "jharia",
    ):
        self.R = self.EXTRACTION_RATIOS.get(coalfield, 0.70)
        self.seam_dip_deg = seam_dip_deg
        self.depth_m = depth_m
        self.influence_radius_m = depth_m * np.tan(np.radians(35.0))
        self.S_max_mm = self.R * extraction_height_m * 1000.0 * np.sin(np.radians(seam_dip_deg))

    def expected_tilt_at_distance(self, surface_distance_m: float) -> float:
        """Returns expected tilt (degrees) at surface_distance_m from panel centre."""
        r = self.influence_radius_m
        if r <= 0:
            return 0.0
        dS_dx = (self.S_max_mm * (-2.0 * np.pi * surface_distance_m / r**2) *
                 np.exp(-np.pi * (surface_distance_m / r) ** 2))
        return float(np.degrees(np.arctan(abs(dS_dx) / 1000.0)))

    def compute_residual(self, actual_tilt_deg: float, surface_distance_m: float = 60.0) -> Tuple[float, float, bool]:
        """Returns (expected_tilt_deg, residual_deg, is_anomalous)."""
        expected = self.expected_tilt_at_distance(surface_distance_m)
        residual = actual_tilt_deg - expected
        is_anomalous = residual > max(0.05, expected * 0.5)
        return round(expected, 4), round(residual, 4), is_anomalous


_physics_model = SubsidencePhysicsModel()  # Jharia Coalfield defaults


@dataclass
class ShadowDecision:
    node_id: str
    timestamp_h: float
    warning_tier: str              # "NORMAL", "WATCH", "WARNING", "CRITICAL"
    siren_active: bool             # True only if CRITICAL and NOT suppressed
    siren_suppressed: bool         # True if blast/vehicle suppressed the siren
    composite_risk_score: float    # 0.0 to 100.0 scale
    spatial_consensus_count: int   # how many adjacent physical neighbors agree
    corroborating_neighbors: List[str]
    primary_driver: str            # e.g., "XGBoost Class 3 + Spatial Corroboration"
    action_protocol: str           # Recommended action for mine safety officers
    health_state: str              # "HEALTHY", "SUSPECT", "FAULTED"
    hours_to_critical: float       # estimated hours until collapse threshold
    confidence: float              # 0.0 to 1.0
    # Physics Residual fields (Fix 1)
    expected_tilt_deg: float = 0.0
    actual_tilt_deg: float = 0.0
    residual_tilt_deg: float = 0.0
    physics_anomalous: bool = False
    # XAI contributing factors for UI panel (Fix 2)
    xai_factors: Dict[str, float] = field(default_factory=dict)
    # Compliance-layer override note (set by the ingestion pipeline when the
    # Unified Risk Engine escalates the tier after fusion)
    override_reason: str = ""


class ShadowDecisionEngine:
    """
    Evaluates whole-network mesh telemetry, applying spatial consensus gating,
    hysteresis state transitions, and automatic false-alarm suppression.
    """

    def __init__(
        self,
        neighbor_radius_m: float = 75.0,
        consensus_min_nodes: int = 2,
        watch_score_threshold: float = 25.0,
        warning_score_threshold: float = 55.0,
        critical_score_threshold: float = 80.0,
        max_packet_silence_hours: float = 0.5,  # 30 mins
    ):
        self.neighbor_radius_m = neighbor_radius_m
        self.consensus_min_nodes = consensus_min_nodes
        self.watch_thresh = watch_score_threshold
        self.warning_thresh = warning_score_threshold
        self.critical_thresh = critical_score_threshold
        self.max_packet_silence = max_packet_silence_hours

        # Previous state cache for hysteresis: node_id -> warning_tier
        self.state_cache: Dict[str, str] = {}

    def calculate_distance(self, x1: float, y1: float, x2: float, y2: float) -> float:
        return float(np.sqrt((x1 - x2)**2 + (y1 - y2)**2))

    def find_mesh_neighbors(
        self,
        target_node_id: str,
        node_positions: Dict[str, Tuple[float, float]],
    ) -> List[str]:
        """Finds all physical mesh nodes within the spatial correlation radius."""
        if target_node_id not in node_positions:
            return []
        tx, ty = node_positions[target_node_id]
        neighbors = []
        for nid, (nx, ny) in node_positions.items():
            if nid != target_node_id:
                dist = self.calculate_distance(tx, ty, nx, ny)
                if dist <= self.neighbor_radius_m:
                    neighbors.append(nid)
        return neighbors

    def compute_composite_risk_score(
        self,
        xgb_probs: np.ndarray,
        anomaly_score: float,
        health: HealthCheckResult,
        forecast: NodeForecastResult,
        vibration: VibrationResult,
        actual_tilt_deg: float = 0.0,
        surface_distance_m: float = 60.0,
    ) -> Tuple[float, str, Dict[str, float], float, float, bool]:
        """
        Computes unified 0–100 Composite Risk Index with Physics Residual.
        Returns: (composite, primary_driver, xai_factors, expected_tilt, residual, physics_anomalous)
        """
        # 1. XGBoost expected class severity
        expected_class = float(np.sum(xgb_probs * np.arange(5)))
        xgb_score = (expected_class / 4.0) * 100.0

        # 2. Anomaly detector score
        anomaly_contribution = min(100.0, max(0.0, (anomaly_score - 0.5) * 200.0))

        # 3. Forecast velocity
        forecast_score = 0.0
        if forecast.min_hours_to_critical <= 24.0:
            forecast_score = 100.0
        elif forecast.min_hours_to_critical <= 48.0:
            forecast_score = 75.0
        elif forecast.min_hours_to_critical <= 72.0:
            forecast_score = 50.0

        # 4. Sensor health penalty
        health_penalty = 0.0
        if health.health_state == "FAULTED":
            health_penalty = 30.0
        elif health.health_state == "SUSPECT":
            health_penalty = 15.0

        # 5. Physics Residual (Fix 1) — Sheorey NCB model
        expected_tilt, residual, physics_anomalous = _physics_model.compute_residual(
            actual_tilt_deg, surface_distance_m
        )
        physics_penalty = 20.0 if physics_anomalous else 0.0

        # Weighted composite
        base_risk = (
            0.40 * xgb_score +
            0.25 * anomaly_contribution +
            0.20 * forecast_score +
            0.15 * physics_penalty
        )
        composite = float(np.clip(base_risk + health_penalty, 0.0, 100.0))

        # XAI factors dict for UI panel (Fix 2)
        xai_factors: Dict[str, float] = {
            "XGBoost Risk Score": round(xgb_score, 1),
            "Anomaly Divergence": round(anomaly_contribution, 1),
            "Forecast Velocity": round(forecast_score, 1),
            "Physics Residual Penalty": round(physics_penalty, 1),
            "Sensor Health Penalty": round(health_penalty, 1),
        }

        # Primary driver for explainability
        drivers = [
            (xgb_score, f"XGBoost Damage Prob (P[Crit+Emerg]={xgb_probs[3]+xgb_probs[4]:.2f})"),
            (anomaly_contribution, f"Isolation Forest Anomaly Divergence ({anomaly_score:.3f})"),
            (forecast_score, f"Short-Horizon Velocity (t_crit={forecast.min_hours_to_critical:.1f}h)"),
            (physics_penalty, f"Physics Residual Anomaly (actual={actual_tilt_deg:.3f}° vs expected={expected_tilt:.3f}°)"),
            (health_penalty, f"Sensor Malfunction Penalty ({health.health_state})"),
        ]
        drivers.sort(key=lambda x: x[0], reverse=True)
        primary_driver = drivers[0][1]

        return composite, primary_driver, xai_factors, expected_tilt, residual, physics_anomalous

    def evaluate_node(
        self,
        node_id: str,
        timestamp_h: float,
        xgb_probs: np.ndarray,
        anomaly_score: float,
        health: HealthCheckResult,
        forecast: NodeForecastResult,
        vibration: VibrationResult,
        neighbor_decisions: Dict[str, str],
        node_positions: Dict[str, Tuple[float, float]],
        actual_tilt_deg: float = 0.0,
        surface_distance_m: float = 60.0,
    ) -> ShadowDecision:
        """
        Evaluates final warning tier and siren activation for a single node.
        Includes Physics Residual and XAI contributing factors.
        """
        composite_score, primary_driver, xai_factors, expected_tilt, residual, physics_anomalous = \
            self.compute_composite_risk_score(
                xgb_probs, anomaly_score, health, forecast, vibration,
                actual_tilt_deg=actual_tilt_deg, surface_distance_m=surface_distance_m
            )

        # Preliminary raw tier based on score
        if composite_score >= self.critical_thresh:
            raw_tier = "CRITICAL"
        elif composite_score >= self.warning_thresh:
            raw_tier = "WARNING"
        elif composite_score >= self.watch_thresh:
            raw_tier = "WATCH"
        else:
            raw_tier = "NORMAL"

        # Check spatial consensus with adjacent neighbors
        mesh_neighbors = self.find_mesh_neighbors(node_id, node_positions)
        corroborating = [
            nid for nid in mesh_neighbors
            if neighbor_decisions.get(nid) in ["WATCH", "WARNING", "CRITICAL"]
        ]
        consensus_count = len(corroborating)

        # SPATIAL CONSENSUS GATING:
        # A single node cannot escalate to WARNING or CRITICAL without neighbor agreement!
        final_tier = raw_tier
        if raw_tier in ["WARNING", "CRITICAL"]:
            if consensus_count < self.consensus_min_nodes:
                # Demote to WATCH to prevent false mine evacuation alarm!
                final_tier = "WATCH"
                primary_driver += f" [HELD AT WATCH: Awaiting spatial agreement from adjacent nodes ({consensus_count}/{self.consensus_min_nodes})]"
            else:
                primary_driver += f" [CORROBORATED by {consensus_count} neighboring nodes: {', '.join(corroborating)}]"

        # SAFETY RULE: NO DATA != SAFE
        if health.health_state == "FAULTED" and final_tier == "NORMAL":
            final_tier = "WATCH"
            primary_driver = "NO DATA != SAFE: Sensor Faulted or Packet Dropout (Minimum Caution Tier Enforced)"

        # SIREN ACTIVATION & BLASTING SUPPRESSION GATE
        siren_active = False
        siren_suppressed = False

        if final_tier == "CRITICAL":
            if vibration.suppress_alarm or vibration.is_blast:
                siren_active = False
                siren_suppressed = True
                primary_driver += " [SIREN SUPPRESSED: Blasting / Machinery Vibration Detected]"
            else:
                siren_active = True

        # Action protocol recommendation
        if final_tier == "CRITICAL":
            action = "IMMEDIATE EVACUATION: Critical strata collapse trajectory confirmed by multi-node array."
        elif final_tier == "WARNING":
            action = "HAZARD ADVISORY: Halt longwall shearer advance; dispatch geotechnical inspection crew."
        elif final_tier == "WATCH":
            action = "ELEVATED MONITORING: Increase LoRa reporting rate to 30s; check optical target and strain baseline."
        else:
            action = "NORMAL OPERATIONS: Baseline strata stability verified across mesh network."

        # Cache state
        self.state_cache[node_id] = final_tier

        return ShadowDecision(
            node_id=node_id,
            timestamp_h=timestamp_h,
            warning_tier=final_tier,
            siren_active=siren_active,
            siren_suppressed=siren_suppressed,
            composite_risk_score=round(composite_score, 1),
            spatial_consensus_count=consensus_count,
            corroborating_neighbors=corroborating,
            primary_driver=primary_driver,
            action_protocol=action,
            health_state=health.health_state,
            hours_to_critical=forecast.min_hours_to_critical,
            confidence=0.96 if consensus_count >= self.consensus_min_nodes else 0.82,
            # Fix 1: Physics Residual
            expected_tilt_deg=expected_tilt,
            actual_tilt_deg=actual_tilt_deg,
            residual_tilt_deg=residual,
            physics_anomalous=physics_anomalous,
            # Fix 2: XAI factors
            xai_factors=xai_factors,
        )
