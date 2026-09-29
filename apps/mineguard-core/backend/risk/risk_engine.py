"""
Unified Risk Engine — the central risk authority.

Inputs (all optional except node identity):
  * Threshold-checked telemetry channels: tilt, displacement/convergence
    rate, vibration, crack width  -> base threshold score
  * Edge/ML model output (`local_ml_score`, 0.0-1.0)   -> ML score
  * Project-defined engineering thresholds (configurable — see thresholds.py)

Fusion rule (explicit and safety-conservative):
    fused = max(threshold_score, ml_score * 100)
  The MAX rule means either the engineering limits OR the model can escalate
  on their own; neither can de-escalate the other.

Severity mapping (with hysteresis to prevent flapping):
    fused >= 75  -> CRITICAL   (clears below 75 * (1 - 0.15) = 63.75)
    fused >= 50  -> WARNING    (clears below 42.5)
    otherwise    -> NORMAL

The engine is wired into the telemetry pipeline (edge_ingest_loop stage 8)
as the compliance layer: it can only ESCALATE the fused SHADOW decision to
CRITICAL, never demote it.

This engine does NOT ingest InSAR data; satellite-derived deformation is a
separate, clearly-labelled information source (see remote_sensing/).
"""

import json
import logging
import os
from collections import OrderedDict

from .thresholds import PROJECT_DEFINED_THRESHOLDS
from .hysteresis import HysteresisFilter
from .risk_score import calculate_node_risk, aggregate_zone_risk

logger = logging.getLogger("terramesh.risk")

# Bounded state cache (observability only) — evicts oldest beyond this size
_MAX_NODE_STATE_CACHE = 1024


class UnifiedRiskEngine:
    """Central risk evaluation authority (thresholds + ML fusion + hysteresis)."""

    CRITICAL_THRESHOLD = 75.0
    WARNING_THRESHOLD = 50.0

    def __init__(self):
        self.thresholds = dict(PROJECT_DEFINED_THRESHOLDS)
        self.hysteresis = HysteresisFilter(deadband=0.15)
        self.node_states: "OrderedDict[str, dict]" = OrderedDict()
        self._apply_env_override()

    def _apply_env_override(self) -> None:
        """RISK_THRESHOLDS_OVERRIDE (JSON) lets deployments tune engineering
        limits without code changes. Example:
        RISK_THRESHOLDS_OVERRIDE={"tilt":{"warning_high":1.5,"critical_high":3.0,...}}
        """
        raw = os.getenv("RISK_THRESHOLDS_OVERRIDE", "")
        if not raw:
            return
        try:
            override = json.loads(raw)
            from .thresholds import SensorThresholds
            for channel, fields in override.items():
                if channel in self.thresholds and isinstance(fields, dict):
                    merged = self.thresholds[channel].model_dump()
                    merged.update(fields)
                    self.thresholds[channel] = SensorThresholds(**merged)
            logger.info("Risk thresholds overridden from RISK_THRESHOLDS_OVERRIDE: %s",
                        list(override.keys()))
        except Exception as e:
            logger.warning("Invalid RISK_THRESHOLDS_OVERRIDE ignored: %s", e)

    def configure(self, thresholds: dict) -> None:
        """Runtime reconfiguration (used by the settings API — audited)."""
        from .thresholds import SensorThresholds
        for channel, fields in (thresholds or {}).items():
            if channel in self.thresholds and isinstance(fields, dict):
                merged = self.thresholds[channel].model_dump()
                merged.update(fields)
                self.thresholds[channel] = SensorThresholds(**merged)
                logger.info("Risk threshold reconfigured: %s -> %s", channel, fields)

    def evaluate_node(self, node_id: str, telemetry: dict) -> dict:
        """Evaluate one node; returns the fused risk state."""
        # 1. Threshold-checked channel scores (all configured channels)
        base = calculate_node_risk(telemetry, self.thresholds)
        base_score = base["score"]

        # 2. ML score fusion (model output, 0.0-1.0 -> 0-100)
        ml_score = float(telemetry.get("local_ml_score", 0.0) or 0.0) * 100.0

        # 3. MAX fusion — either authority can escalate, neither can demote
        fused_score = max(base_score, ml_score)

        # 4. Hysteresis severity mapping (anti-flapping deadband)
        is_critical = self.hysteresis.evaluate(f"{node_id}_crit", fused_score, self.CRITICAL_THRESHOLD, True)
        is_warning = self.hysteresis.evaluate(f"{node_id}_warn", fused_score, self.WARNING_THRESHOLD, True)

        status = "NORMAL"
        if is_critical:
            status = "CRITICAL"
        elif is_warning:
            status = "WARNING"

        result = {
            "node_id": node_id,
            "fused_risk_score": fused_score,
            "threshold_score": base_score,
            "ml_score": ml_score,
            "channel_scores": base["channels"],
            "fusion_rule": "max(threshold, ml)",
            "status": status,
            "timestamp": telemetry.get("timestamp"),
        }
        # Bounded state cache
        self.node_states[node_id] = result
        self.node_states.move_to_end(node_id)
        while len(self.node_states) > _MAX_NODE_STATE_CACHE:
            self.node_states.popitem(last=False)
        return result

    def evaluate_zone(self, node_results: list) -> dict:
        """Zone-level risk via 90th-percentile aggregation of node states."""
        scores = [r.get("fused_risk_score", 0.0) for r in node_results]
        zone_score = aggregate_zone_risk(scores)
        status = "CRITICAL" if zone_score >= self.CRITICAL_THRESHOLD else (
            "WARNING" if zone_score >= self.WARNING_THRESHOLD else "NORMAL")
        return {
            "zone_risk_score": zone_score,
            "status": status,
            "aggregation": "p90 of node fused scores",
            "nodes_evaluated": len(scores),
        }


risk_engine = UnifiedRiskEngine()
