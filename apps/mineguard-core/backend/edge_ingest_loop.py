"""
TerraMesh AI — Module 5.2: Telemetry Ingestion Pipeline & Scenario Playback
===========================================================================
Processes validated node packets (from the MQTT ingestion client, the HTTP
telemetry endpoints, or the clearly-labelled scenario playback), runs the
complete end-to-end safety inference pipeline, persists results, and
broadcasts live events to WebSocket dashboard listeners.

Pipeline stages (in order):
  1.  Raw persistence to the edge buffer (SQLite WAL, MEASURED DATA)
  2.  Kalman filtering (MODEL OUTPUT; raw values preserved with *_raw)
  3.  Sensor health evaluation
  4.  Vibration & blast classification
  5.  XGBoost 5-class inference (if model artifact present — see honesty note)
  6.  Short-horizon forecasting
  7.  SHADOW multi-sensor decision fusion
  8.  Unified risk engine evaluation (threshold compliance layer, with the
      pipeline-injected ML score) — CRITICAL override
  9.  Decision persistence (AFTER the override, so storage matches broadcast)
  10. PostgreSQL canonical telemetry persistence (provenance-labelled)
  11. Redis node-state cache + pub/sub event
  12. WebSocket broadcast (via the async dispatcher)

Honesty notes:
  * If the model artifact is missing the pipeline continues in DEGRADED mode:
    a UNIFORM probability vector is used (no fabricated confidence), every
    event is labelled model_loaded=false, and `stats()` reports it.
  * Scenario playback injects SIMULATION-provenance packets only. It is an
    explicitly labelled demonstration feature and never mixes with live
    telemetry state.
  * process_packet() returns the event; process_and_dispatch() additionally
    performs Redis caching and WebSocket fan-out (used by MQTT ingestion).
"""

from __future__ import annotations
import asyncio
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import numpy as np
import pandas as pd

from edge_database import store_telemetry, store_decision, get_node_history
from ml.train_final_model import TerraMeshModel, engineer_features
from ml.sensor_health import SensorHealthClassifier, HealthCheckResult
from ml.vibration_filter import VibrationFingerprinter, VibrationResult
from ml.forecaster import ShortHorizonForecaster, NodeForecastResult
from ml.shadow_engine import ShadowDecisionEngine, ShadowDecision
from ml.explainability import BilingualExplainabilityEngine, ExplanationCard
from analytics.kalman_filter import KalmanFilterBank, FilteredReading
from risk.risk_engine import risk_engine

logger = logging.getLogger("terramesh.pipeline")

MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

# Class weights mirrored from ml_service score fusion (0-100 per class)
_XGB_CLASS_WEIGHTS = np.array([10.0, 35.0, 65.0, 85.0, 98.0])


class IngestPipeline:
    """End-to-end inference and ingestion pipeline."""

    def __init__(self):
        logger.info("Initializing TerraMesh AI telemetry pipeline...")
        # 1. Load trained model artifact (real file or degraded mode)
        model_path = MODELS_DIR / "terramesh_final_model.joblib"
        self.model: Optional[TerraMeshModel] = None
        if model_path.exists():
            # Compatibility hook for joblib unpickling across entrypoints
            if "__main__" in sys.modules:
                setattr(sys.modules["__main__"], "TerraMeshModel", TerraMeshModel)
                setattr(sys.modules["__main__"], "engineer_features", engineer_features)
            try:
                self.model = joblib.load(model_path)
                logger.info("Loaded model artifact: %s", model_path.name)
            except Exception as e:
                logger.error("Failed to load model artifact %s (%s) — degraded mode", model_path.name, e)
        else:
            logger.warning(
                "Model artifact not found at %s — pipeline runs in DEGRADED mode "
                "(uniform class probabilities, events labelled model_loaded=false).",
                model_path,
            )

        # 2. Initialize AI engines
        self.health_clf = SensorHealthClassifier()
        self.vib_filter = VibrationFingerprinter()
        self.forecaster = ShortHorizonForecaster()
        self.shadow_engine = ShadowDecisionEngine()
        self.xai_engine = BilingualExplainabilityEngine()
        self.kalman_bank = KalmanFilterBank()

        # In-memory caches
        self.node_positions: Dict[str, Tuple[float, float]] = {}
        self.node_decisions: Dict[str, str] = {}
        self.node_history_cache: Dict[str, List[Dict[str, Any]]] = {}
        self.last_health_transitions: Dict[str, Dict[str, Any]] = {}

        # Async event sinks (set by main.py at startup)
        self.broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self.redis_cache = None  # injected to avoid import cycle; see main.py

        # Scenario playback state
        self.is_playing_scenario: bool = False
        self.current_scenario: Optional[str] = None
        self.current_scenario_task: Optional[asyncio.Task] = None

        # Pipeline metrics (observability)
        self._metrics = {
            "packets_processed": 0,
            "pg_writes": 0,
            "pg_write_errors": 0,
            "sqlite_writes": 0,
            "risk_overrides": 0,
            "degraded_predictions": 0,
            "broadcasts": 0,
        }

    # ── Canonical PostgreSQL persistence ─────────────────────────────────────

    def _persist_postgres(self, packet: Dict[str, Any], node_id: str,
                           t_h: float, decision: ShadowDecision,
                           unified_risk: Dict[str, Any]) -> None:
        """Append the filtered, scored packet to the canonical telemetry store.
        Failures never break the pipeline — they are counted and logged."""
        try:
            import database  # local import to avoid cycles
            from models import TelemetryModel
            from sqlalchemy.exc import IntegrityError

            row = TelemetryModel(
                mine_id=str(packet.get("mine_id", "jharia_01")),
                node_id=node_id,
                ts=datetime.fromtimestamp(t_h * 3600.0, tz=None).replace(tzinfo=None),
                tilt=float(packet.get("tilt_change", 0.0) or 0.0),
                vibration=float(packet.get("vib_rms_g", 0.0) or 0.0),
                displacement=float(packet.get("displacement_rate", 0.0) or 0.0),
                crack_width=float(packet.get("crack_mm", 0.0) or 0.0),
                temperature=packet.get("temp_c"),
                humidity=packet.get("humidity_pct"),
                battery=packet.get("batt_v", packet.get("battery_v")),
                signal_strength=packet.get("rssi_dbm"),
                risk_score=float(decision.composite_risk_score),
                warning_tier=str(decision.warning_tier),
                provenance=str(packet.get("_provenance", "MEASURED")).upper(),
            )
            db = database.SessionLocal()
            try:
                db.add(row)
                db.commit()
                self._metrics["pg_writes"] += 1
            except IntegrityError:
                # Same (node_id, ts) already stored (QoS-1 duplicate that passed
                # the client dedup window) — skip, matching dedup semantics.
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            self._metrics["pg_write_errors"] += 1
            logger.warning("PostgreSQL telemetry persistence failed: %s", e)

    # ── Core pipeline ────────────────────────────────────────────────────────

    def process_packet(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the complete safety inference pipeline on one packet."""
        node_id = str(packet.get("node_id") or "UNKNOWN")
        if node_id == "UNKNOWN":
            logger.warning("Packet without node_id — processed as UNKNOWN (schema should prevent this)")
        pos_x = float(packet.get("node_x", 0.0) or 0.0)
        pos_y = float(packet.get("node_y", 0.0) or 0.0)

        # Normalize timestamps (t_h = epoch hours)
        t_h = self._normalize_timestamp(packet)

        # Normalize crack_mm alias
        if "crack_mm" not in packet and "crack_gap_mm" in packet:
            try:
                packet["crack_mm"] = float(packet["crack_gap_mm"])
            except (TypeError, ValueError):
                pass

        self.node_positions[node_id] = (pos_x, pos_y)

        # 1. Raw persistence to the edge buffer (MEASURED DATA)
        try:
            store_telemetry(packet)
            self._metrics["sqlite_writes"] += 1
        except Exception as e:
            logger.warning("Edge-buffer telemetry store failed for %s: %s", node_id, e)

        # 2. Kalman filtering (MODEL OUTPUT; raw preserved under *_raw)
        raw_tilt = float(packet.get("tilt_change", packet.get("tilt", 0.0)) or 0.0)
        raw_disp = float(packet.get("displacement_rate", packet.get("displacement", 0.0)) or 0.0)
        raw_crack = float(packet.get("crack_mm", packet.get("crack_width", 0.0)) or 0.0)
        try:
            kalman_result: FilteredReading = self.kalman_bank.process(
                node_id=node_id,
                tilt=raw_tilt,
                displacement=raw_disp,
                crack_width=raw_crack,
            )
            packet["tilt_raw"] = raw_tilt
            packet["displacement_raw"] = raw_disp
            packet["crack_mm_raw"] = raw_crack
            packet["tilt_change"] = kalman_result.filtered_tilt
            packet["displacement_rate"] = kalman_result.filtered_displacement
            packet["crack_mm"] = kalman_result.filtered_crack_width
            packet["kalman_gain_tilt"] = kalman_result.kalman_gain_tilt
            packet["kalman_innovation_tilt"] = kalman_result.tilt_innovation
        except Exception as ke:
            logger.warning("Kalman filter error for %s (%s) — using raw values", node_id, ke)

        # Rolling history window for temporal features
        if node_id not in self.node_history_cache:
            self.node_history_cache[node_id] = []
        self.node_history_cache[node_id].append(packet)
        if len(self.node_history_cache[node_id]) > 40:
            self.node_history_cache[node_id].pop(0)
        history_df = pd.DataFrame(self.node_history_cache[node_id])

        # 3. Sensor health evaluation
        health_res = self.health_clf.evaluate_node(history_df)

        # 3b. Self-healing lifecycle: drive the NodeStateManager with the
        # latest health result so HEALTHY -> SUSPECT -> QUARANTINED ->
        # PENDING_VALIDATION -> HEALTHY transitions actually occur, and
        # quarantined nodes are excluded from fusion.
        try:
            from ml.sensor_health import node_state_manager
            transition = node_state_manager.update(node_id, health_res, timestamp_h=t_h)
            self.last_health_transitions[node_id] = transition
            if transition.get("transition"):
                logger.warning("Self-healing transition for %s: %s", node_id, transition)
        except Exception as she:
            logger.warning("Sensor-health lifecycle update failed for %s: %s", node_id, she)

        # 4. Vibration & blast classification
        vib_res = self.vib_filter.classify(
            vib_rms_g=float(packet.get("vib_rms_g", 0.0) or 0.0),
            vib_peak_g=float(packet.get("vib_peak_g", 0.0) or 0.0),
            dom_freq_hz=float(packet.get("dom_freq_hz", 0.0) or 0.0),
            band_energy_0_10=float(packet.get("band_energy_0_10", 0.0) or 0.0),
            band_energy_10_50=float(packet.get("band_energy_10_50", 0.0) or 0.0),
            timestamp_h=t_h,
            rain_flag=int(packet.get("rain_flag", 0) or 0),
            vehicle_flag=int(packet.get("vehicle_flag", 0) or 0),
            manual_blast_flag=int(packet["blast_flag"]) if "blast_flag" in packet else None,
        )

        # 5. XGBoost 5-class inference — or honest degraded mode
        model_loaded = self.model is not None
        if model_loaded:
            try:
                # The 18-feature contract requires the three context flags —
                # absent packets default to 0 (documented in the edge contract)
                for _flag in ("blast_flag", "rain_flag", "vehicle_flag"):
                    packet.setdefault(_flag, 0)
                df_single = pd.DataFrame([packet])
                xgb_probs = np.asarray(self.model.predict_proba(df_single)[0], dtype=float)
            except Exception as e:
                logger.warning("XGBoost inference failed for %s (%s) — degraded prediction", node_id, e)
                xgb_probs = np.full(5, 0.2)
                model_loaded = False
                self._metrics["degraded_predictions"] += 1
        else:
            # DEGRADED MODE: uniform probabilities — explicitly NOT a fabricated
            # "all normal" vector. Downstream events carry model_loaded=false.
            xgb_probs = np.full(5, 0.2)
            self._metrics["degraded_predictions"] += 1

        # 6. Short-horizon forecasting
        forecast_res = self.forecaster.forecast_node(history_df, time_col="timestamp_h")

        # 7. SHADOW multi-sensor decision fusion (quarantined nodes are
        # excluded from fusion: their health is reported as FAULTED so they
        # cannot corroborate a NORMAL decision while under suspicion)
        try:
            from ml.sensor_health import node_state_manager
            if not node_state_manager.is_active(node_id):
                from dataclasses import replace as _dc_replace
                health_res = _dc_replace(health_res, health_state="FAULTED")
        except Exception:
            pass
        decision = self.shadow_engine.evaluate_node(
            node_id=node_id,
            timestamp_h=t_h,
            xgb_probs=xgb_probs,
            anomaly_score=float(1.0 - xgb_probs[0]),
            health=health_res,
            forecast=forecast_res,
            vibration=vib_res,
            neighbor_decisions=self.node_decisions,
            node_positions=self.node_positions,
        )
        self.node_decisions[node_id] = decision.warning_tier

        # 8. Unified risk engine — with the pipeline-injected ML score so the
        #    compliance layer fuses model output with threshold checks.
        packet["local_ml_score"] = float(
            np.dot(xgb_probs, _XGB_CLASS_WEIGHTS) / 100.0
        ) if model_loaded else 0.0
        unified_risk = risk_engine.evaluate_node(node_id, packet)

        # CRITICAL override (statutory compliance layer)
        if unified_risk.get("status") == "CRITICAL" and decision.warning_tier != "CRITICAL":
            decision.warning_tier = "CRITICAL"
            decision.override_reason = (
                "OVERRIDE: Project-defined safety thresholds exceeded "
                "(Unified Risk Engine — risk/risk_engine.py; thresholds are project "
                "engineering limits, not statutory claims)"
            )
            self._metrics["risk_overrides"] += 1

        # 9. Bilingual explainability card — AFTER the override so the stored
        #    card matches the broadcast tier (fixes store-before-override bug)
        card = self.xai_engine.generate_card(decision, telemetry=pd.Series(packet))
        card_json = card.to_json()

        # Decision persistence (post-override: storage == broadcast)
        try:
            store_decision(decision, card_json)
        except Exception as e:
            logger.warning("Edge-buffer decision store failed for %s: %s", node_id, e)

        # 10. Canonical PostgreSQL persistence (provenance-labelled)
        self._persist_postgres(packet, node_id, t_h, decision, unified_risk)

        # 11. Event payload
        self._metrics["packets_processed"] += 1
        output_event = {
            "type": "TELEMETRY_UPDATE",
            "node_id": node_id,
            "timestamp_h": t_h,
            "pos_x": pos_x,
            "pos_y": pos_y,
            "model_loaded": model_loaded,
            "provenance": str(packet.get("_provenance", "MEASURED")).upper(),
            "telemetry": {
                "tilt_x_deg": packet.get("tilt_x_deg", 0.0),
                "tilt_y_deg": packet.get("tilt_y_deg", 0.0),
                "tilt_mag_mrad": packet.get("tilt_mag_mrad", 0.0),
                "crack_mm": packet.get("crack_mm", packet.get("crack_gap_mm", 0.0)),
                "strain_ustrain": packet.get("strain_ustrain", 0.0),
                "vib_rms_g": packet.get("vib_rms_g", 0.0),
                "batt_v": packet.get("batt_v", packet.get("battery_v", 0.0)),
            },
            "decision": {
                "warning_tier": decision.warning_tier,
                "composite_risk_score": decision.composite_risk_score,
                "siren_active": decision.siren_active,
                "siren_suppressed": decision.siren_suppressed,
                "hours_to_critical": decision.hours_to_critical,
                "primary_driver": decision.primary_driver,
                "override_reason": getattr(decision, "override_reason", "") or "",
                "unified_risk_status": unified_risk.get("status"),
                "unified_risk_score": unified_risk.get("fused_risk_score"),
            },
            "card": json.loads(card_json),
        }
        return output_event

    def _normalize_timestamp(self, packet: Dict[str, Any]) -> float:
        """Coerce packet timestamps to epoch-hours. Unparseable/absent values
        are stamped NOW (documented behaviour; MQTT layer already validated).
        Handles: epoch-seconds (float/int), ISO-8601 strings, epoch-hours."""
        if "timestamp_h" in packet:
            try:
                return float(packet["timestamp_h"])
            except (TypeError, ValueError):
                pass
        if "timestamp" in packet:
            raw = packet["timestamp"]
            # Raw epoch SECONDS (float/int, or numeric string): treat as
            # seconds — pd.to_datetime() would misread these as nanoseconds.
            try:
                val = float(raw)
                if 1e8 < val < 1e12:      # plausible epoch-seconds range
                    return val / 3600.0
            except (TypeError, ValueError):
                pass
            try:
                return float(pd.to_datetime(raw).timestamp() / 3600.0)
            except Exception:
                try:
                    return float(raw)
                except (TypeError, ValueError):
                    pass
        return time.time() / 3600.0

    # ── Async dispatch (used by MQTT ingestion) ──────────────────────────────

    async def process_and_dispatch(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """Run the pipeline off the event loop, then cache in Redis and
        broadcast to WebSocket listeners."""
        loop = asyncio.get_running_loop()
        event = await loop.run_in_executor(None, self.process_packet, packet)

        # Redis node-state cache (graceful when unavailable)
        if self.redis_cache is not None:
            try:
                await self.redis_cache.set_node(event["node_id"], {
                    "warning_tier": event["decision"]["warning_tier"],
                    "risk_score": event["decision"]["composite_risk_score"],
                    "timestamp_h": event["timestamp_h"],
                    "provenance": event["provenance"],
                })
                await self.redis_cache.publish_event({
                    "kind": "TELEMETRY_UPDATE",
                    "node_id": event["node_id"],
                    "warning_tier": event["decision"]["warning_tier"],
                })
            except Exception as e:
                logger.debug("Redis node-cache write skipped: %s", e)

        if self.broadcast_callback is not None:
            try:
                result = self.broadcast_callback(event)
                if asyncio.iscoroutine(result):
                    await result
                self._metrics["broadcasts"] += 1
            except Exception as e:
                logger.warning("WebSocket broadcast failed: %s", e)
        return event

    # ── Scenario playback (explicitly labelled SIMULATION) ───────────────────

    async def play_scenario(
        self,
        scenario_name: str,
        playback_speed: float = 5.0,
        max_cycles: int = 60,
    ) -> None:
        """
        Replays a recorded scenario for demonstration. Every injected packet is
        labelled _provenance=SIMULATION end-to-end (edge buffer, PostgreSQL,
        WebSocket events). This is the ONLY synthetic data path and it is
        always labelled.
        """
        scenarios_path = DATA_DIR / "terramesh_scenarios.parquet"
        if not scenarios_path.exists():
            logger.warning(
                "Scenario playback requested but %s not found. "
                "No scenario corpus is shipped in this deployment — playback is unavailable.",
                scenarios_path,
            )
            return

        df = pd.read_parquet(scenarios_path)
        sub = df[df["scenario"] == scenario_name].sort_values("timestamp")
        if sub.empty:
            logger.warning("Scenario %r not found in %s", scenario_name, scenarios_path.name)
            return

        logger.info("SIMULATION playback starting: %s (%s rows) — provenance=SIMULATION",
                    scenario_name, f"{len(sub):,}")
        self.is_playing_scenario = True

        grouped = sub.groupby("timestamp")
        cycle = 0
        for _, cycle_df in grouped:
            if not self.is_playing_scenario or cycle >= max_cycles:
                break
            for _, row in cycle_df.iterrows():
                packet = row.to_dict()
                packet["_provenance"] = "SIMULATION"
                tx_mrad = float(packet.get("tilt_x_deg", 0) or 0) * (np.pi / 180.0) * 1000.0
                ty_mrad = float(packet.get("tilt_y_deg", 0) or 0) * (np.pi / 180.0) * 1000.0
                packet["tilt_mag_mrad"] = float(np.sqrt(tx_mrad ** 2 + ty_mrad ** 2))
                await self.process_and_dispatch(packet)
            cycle += 1
            await asyncio.sleep(max(0.05, 1.0 / playback_speed))

        logger.info("SIMULATION playback completed: %s", scenario_name)
        self.is_playing_scenario = False

    # ── Introspection ─────────────────────────────────────────────────────────

    def stats(self) -> Dict[str, Any]:
        lifecycle = {}
        try:
            from ml.sensor_health import node_state_manager
            lifecycle = node_state_manager.get_network_summary()
        except Exception:
            pass
        return {
            "model_loaded": self.model is not None,
            "playing_scenario": self.is_playing_scenario,
            "nodes_tracked": len(self.node_decisions),
            "sensor_lifecycle": lifecycle,
            "metrics": dict(self._metrics),
        }


# Singleton edge pipeline instance
pipeline_instance = IngestPipeline()
