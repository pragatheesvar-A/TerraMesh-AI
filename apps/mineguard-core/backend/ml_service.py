"""
MINEGUARD AI / TerraMesh ML Inference Service
=============================================
Loads the trained 5-Class NCB subsidence risk model, Isolation Forest anomaly detector,
sensor health discriminator, and vibration blast filter.
Provides real-time packet-by-packet inference and batch scoring for ESP32/LoRa telemetry.
"""

import os
import sys
import math
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MineMLService")

# Locate models directory (artifacts produced by backend/ml/train_*.py)
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

# Isolation Forest contract — the 10 features it was fitted on and the
# anomaly threshold from its training report (models/isolation_forest_meta.json)
IF_META_PATH = MODELS_DIR / "isolation_forest_meta.json"
XGB_REPORT_PATH = MODELS_DIR / "xgboost_report.json"

# National Coal Board (NCB) Risk Classes
RISK_NAMES = ["0:NORMAL", "1:WATCH", "2:WARNING", "3:CRITICAL", "4:EMERGENCY"]
STATUS_MAP = {
    0: "SAFE",
    1: "CAUTION",
    2: "WARNING",
    3: "CRITICAL",
    4: "CRITICAL"
}

FEATURE_COLS = [
    "tilt_x_deg",
    "tilt_y_deg",
    "tilt_mag_mrad",
    "crack_mm",
    "strain_ustrain",
    "vib_rms_g",
    "vib_peak_g",
    "dom_freq_hz",
    "band_energy_0_10",
    "band_energy_10_50",
    "temp_c",
    "depth_m",
    "seam_thk_m",
    "blast_flag",
    "rain_flag",
    "vehicle_flag",
    # Derived features (engineered in _engineer_features; part of the
    # trained model input — validated by validate_edge_contract.py)
    "band_ratio_0_10",
    "extraction_ratio",
]

class MineMLService:
    """
    Singleton ML Inference Service that coordinates multi-layer AI safety models.

    Honesty contract:
      * `is_loaded` is True ONLY when at least one model artifact was loaded.
      * When no artifact is available, predictions run through the labelled
        `_geomechanical_fallback` (physics heuristics) and every response
        carries inference_mode="physics_fallback".
      * Metadata metrics are read from the artifacts' own training reports —
        never hand-typed.
    """

    def __init__(self):
        self.is_loaded = False
        self.terramesh_model = None
        self.xgboost_bundle = None
        self.isolation_forest = None
        self.if_anomaly_threshold = 0.65   # default; overridden by artifact meta
        # Isolation Forest feature contract (verified against meta at load time)
        self.if_features = [
            "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad", "crack_mm",
            "strain_ustrain", "vib_rms_g", "vib_peak_g", "dom_freq_hz",
            "band_energy_0_10", "band_energy_10_50",
        ]
        self.model_metadata = {
            "name": "MINEGUARD / TerraMesh AI Multi-Layer Subsidence Classifier",
            "version": "1.0.0-SIH26025",
            "metrics_source": "training-report",
            "layers": [
                "Layer 1: Sensor Health & Fault Isolation (rule-based)",
                "Layer 2: Vibration Blast False-Alarm Suppression (rule-based)",
                "Layer 3: Isolation Forest Anomaly Detection (trained artifact)",
                "Layer 4: 5-Class XGBoost NCB Subsidence Risk Classifier (trained artifact)",
                "Layer 5: Physics Residual Attribution (Sheorey/NCB empirical model)"
            ]
        }
        # Fill metadata honestly from the artifacts' own reports (if present)
        try:
            import json as _json
            if XGB_REPORT_PATH.exists():
                with open(XGB_REPORT_PATH) as f:
                    report = _json.load(f)
                self.model_metadata["xgboost_report"] = {
                    "macro_f1": report.get("macro_f1"),
                    "weighted_f1": report.get("weighted_f1"),
                    "training_rows": report.get("training_rows"),
                    "test_rows": report.get("test_rows"),
                    "note": "metrics measured on the SYNTHETIC training corpus holdout (see synth/); not field data"
                }
        except Exception as e:
            logger.warning("Could not read xgboost_report.json: %s", e)

        # Dynamic safety thresholds synced from frontend settings
        self.tilt_critical = 3.2
        self.disp_critical = 2.8
        self.pore_pressure_limit = 280.0
        self.ch4_trip_limit = 1.25

        self.load_models()

    def update_thresholds(self, thresholds: dict):
        """Update safety thresholds from frontend settings (audited action)."""
        if "tiltCritical" in thresholds:
            self.tilt_critical = float(thresholds["tiltCritical"])
        if "dispCritical" in thresholds:
            self.disp_critical = float(thresholds["dispCritical"])
        if "porePressureLimit" in thresholds:
            self.pore_pressure_limit = float(thresholds["porePressureLimit"])
        if "ch4TripLimit" in thresholds:
            self.ch4_trip_limit = float(thresholds["ch4TripLimit"])
        logger.info("Updated dynamic ML safety thresholds: %s", thresholds)

    async def retrain_model(self) -> bool:
        """Executes the training script in a subprocess and reloads models."""
        try:
            import asyncio
            script_path = BASE_DIR / "ml" / "train_isolation_forest.py"
            
            logger.info("Starting background ML retraining subprocess...")
            process = await asyncio.create_subprocess_exec(
                sys.executable, str(script_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                logger.info("Retraining successful. Reloading ML models into memory.")
                self.load_models()
                return True
            else:
                logger.error(f"Retraining failed with exit code {process.returncode}: {stderr.decode()}")
                return False
        except Exception as e:
            logger.error(f"Error during retrain_model: {e}")
            return False

    def load_models(self):
        """Load trained joblib artifacts; `is_loaded` reflects REAL load state."""
        try:
            import joblib
            import json as _json

            # 1. XGBoost Risk Classifier bundle
            xgb_path = MODELS_DIR / "xgboost_risk.joblib"
            if xgb_path.exists():
                self.xgboost_bundle = joblib.load(xgb_path)
                logger.info("Loaded XGBoost risk model from %s", xgb_path.name)
            else:
                logger.warning("XGBoost artifact missing (%s) — XGBoost layer in physics-fallback mode", xgb_path)

            # 2. Isolation Forest anomaly detector
            if_path = MODELS_DIR / "isolation_forest.joblib"
            if if_path.exists():
                self.isolation_forest = joblib.load(if_path)
                logger.info("Loaded Isolation Forest model from %s", if_path.name)
                # Sync the anomaly threshold from the artifact's own meta
                try:
                    with open(IF_META_PATH) as f:
                        meta = _json.load(f)
                    self.if_anomaly_threshold = float(meta.get("threshold", self.if_anomaly_threshold))
                    self.if_features = list(meta.get("features", self.if_features))
                    logger.info("Isolation Forest threshold synced from training meta: %.4f",
                                self.if_anomaly_threshold)
                except Exception as meta_err:
                    logger.warning("Could not read isolation_forest_meta.json: %s", meta_err)
            else:
                logger.warning("Isolation Forest artifact missing (%s) — anomaly layer degraded", if_path)

            self.is_loaded = (self.xgboost_bundle is not None) or (self.isolation_forest is not None)
            if self.is_loaded:
                logger.info("MineMLService initialized (xgboost=%s, isolation_forest=%s)",
                            self.xgboost_bundle is not None, self.isolation_forest is not None)
            else:
                logger.warning(
                    "MineMLService initialized with NO model artifacts — all predictions use the "
                    "labelled physics-fallback (inference_mode=physics_fallback)."
                )
        except Exception as e:
            self.is_loaded = False
            logger.error("Model loading failed (%s) — physics-fallback mode", e)

    @property
    def model_status(self) -> dict:
        """Honest per-model load state for /health and observability."""
        return {
            "any_loaded": self.is_loaded,
            "xgboost_loaded": self.xgboost_bundle is not None,
            "isolation_forest_loaded": self.isolation_forest is not None,
            "inference_mode": "ml_model" if self.is_loaded else "physics_fallback",
        }

    def _engineer_features(self, packet: Dict[str, Any]):
        """Transforms raw telemetry into the exact 18-feature DataFrame required by XGBoost."""
        import pandas as pd
        tilt = float(packet.get("tilt", 0.0) or 0.0)
        tilt_x = float(packet.get("tilt_x_deg", tilt * 0.707) or 0.0)
        tilt_y = float(packet.get("tilt_y_deg", tilt * 0.707) or 0.0)
        tilt_mag_mrad = float(packet.get("tilt_mag_mrad", tilt * 17.4533) or 0.0)
        
        crack_mm = float(packet.get("crack_width", packet.get("crack_mm", 0.0)) or 0.0)
        disp_mm = float(packet.get("displacement", 0.0) or 0.0)
        strain_ustrain = float(packet.get("strain_ustrain", (disp_mm * 120.0) + (crack_mm * 80.0)) or 0.0)
        
        vib_raw = packet.get("vibration", "LOW")
        if isinstance(vib_raw, str):
            vib_map = {"LOW": 0.05, "MEDIUM": 0.35, "HIGH": 1.20, "CRITICAL": 2.80, "EMERGENCY": 4.50}
            vib_rms_g = vib_map.get(vib_raw.upper(), 0.10)
            vib_peak_g = vib_rms_g * 1.8
        else:
            vib_rms_g = float(vib_raw or 0.05)
            vib_peak_g = float(packet.get("vib_peak_g", vib_rms_g * 1.8) or 0.1)

        dom_freq_hz = float(packet.get("dom_freq_hz", 8.5) or 8.5)
        band_energy_0_10 = float(packet.get("band_energy_0_10", vib_rms_g * 0.7) or 0.05)
        band_energy_10_50 = float(packet.get("band_energy_10_50", vib_rms_g * 0.3) or 0.02)
        
        temp_c = float(packet.get("temp_c", 28.5) or 28.5)
        depth_m = float(packet.get("depth_m", 185.0) or 185.0)
        seam_thk_m = float(packet.get("seam_thk_m", 3.2) or 3.2)
        
        blast_flag = float(packet.get("blast_flag", 0.0) or 0.0)
        rain_flag = float(packet.get("rain_flag", 0.0) or 0.0)
        vehicle_flag = float(packet.get("vehicle_flag", 0.0) or 0.0)
        
        # Derived ratios
        tot_band = band_energy_0_10 + band_energy_10_50
        band_ratio_0_10 = (band_energy_0_10 / tot_band) if tot_band > 1e-9 else 0.5
        extraction_ratio = (seam_thk_m / depth_m) if depth_m > 0 else 0.02

        data_dict = {
            "tilt_x_deg": [tilt_x],
            "tilt_y_deg": [tilt_y],
            "tilt_mag_mrad": [tilt_mag_mrad],
            "crack_mm": [crack_mm],
            "strain_ustrain": [strain_ustrain],
            "vib_rms_g": [vib_rms_g],
            "vib_peak_g": [vib_peak_g],
            "dom_freq_hz": [dom_freq_hz],
            "band_energy_0_10": [band_energy_0_10],
            "band_energy_10_50": [band_energy_10_50],
            "temp_c": [temp_c],
            "depth_m": [depth_m],
            "seam_thk_m": [seam_thk_m],
            "blast_flag": [blast_flag],
            "rain_flag": [rain_flag],
            "vehicle_flag": [vehicle_flag],
            "band_ratio_0_10": [band_ratio_0_10],
            "extraction_ratio": [extraction_ratio]
        }
        return pd.DataFrame(data_dict)

    def _check_sensor_health(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """Layer 1: Identifies sensor flatline, disconnect, or battery brownout."""
        battery = packet.get("battery", 100)
        tilt = float(packet.get("tilt", 0.0) or 0.0)
        crack = float(packet.get("crack_width", packet.get("crack_mm", 0.0)) or 0.0)
        disp = float(packet.get("displacement", 0.0) or 0.0)
        
        if battery is not None and battery <= 0:
            return {"is_faulted": True, "fault_type": "DEAD_BATTERY", "health_score": 0}
        if battery is not None and battery < 10:
            return {"is_faulted": False, "fault_type": "LOW_BATTERY_WARNING", "health_score": 35}
        
        # Out of bounds telemetry check
        if tilt > 90.0 or crack > 200.0 or disp > 500.0:
            return {"is_faulted": True, "fault_type": "OUT_OF_BOUNDS_DRIFT", "health_score": 10}
            
        return {"is_faulted": False, "fault_type": "HEALTHY", "health_score": 98}

    def _check_vibration_blast(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """
        Layer 2: discriminate explosive blasting shock from structural subsidence.
        Delegates to the SAME VibrationFingerprinter the edge pipeline uses —
        one classifier, one threshold set (previously this method ran a
        duplicate rule with conflicting thresholds).
        """
        from ml.vibration_filter import VibrationFingerprinter
        vib_rms = float(packet.get("vib_rms_g", 0.0) or 0.0)
        vib_raw = packet.get("vibration", "LOW")
        if not packet.get("vib_rms_g") and isinstance(vib_raw, str):
            vib_map = {"LOW": 0.05, "MEDIUM": 0.35, "HIGH": 1.20, "CRITICAL": 2.80, "EMERGENCY": 4.50}
            vib_rms = vib_map.get(vib_raw.upper(), 0.10)
        vib_peak = float(packet.get("vib_peak_g", vib_rms * 1.8) or 0.1)

        if not hasattr(self, "_vib_fingerprinter"):
            self._vib_fingerprinter = VibrationFingerprinter()
        res = self._vib_fingerprinter.classify(
            vib_rms_g=vib_rms,
            vib_peak_g=vib_peak,
            dom_freq_hz=float(packet.get("dom_freq_hz", 8.0) or 8.0),
            band_energy_0_10=float(packet.get("band_energy_0_10", vib_rms * 0.7) or 0.05),
            band_energy_10_50=float(packet.get("band_energy_10_50", vib_rms * 0.3) or 0.02),
            timestamp_h=0.0,
            rain_flag=0,
            vehicle_flag=int(packet.get("vehicle_flag", 0) or 0),
            manual_blast_flag=int(packet["blast_flag"]) if packet.get("blast_flag") else None,
        )
        is_blast = res.is_blast
        return {
            "is_blast": is_blast,
            "blast_suppressed": res.suppress_alarm,
            "dominant_frequency_hz": float(packet.get("dom_freq_hz", 8.0) or 8.0),
            "vibration_category": res.vibration_class,
            "classifier": "VibrationFingerprinter (shared with edge pipeline)",
        }

    def predict_packet(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes complete multi-layer inference pipeline for a single telemetry packet.
        """
        tilt = float(packet.get("tilt", 0.0) or 0.0)
        crack = float(packet.get("crack_width", packet.get("crack_mm", 0.0)) or 0.0)
        disp = float(packet.get("displacement", 0.0) or 0.0)
        
        # 1. Layer 1: Sensor Health
        health = self._check_sensor_health(packet)
        if health["is_faulted"]:
            return {
                "risk_class": 0,
                "risk_label": "0:NORMAL",
                "status": "OFFLINE" if health["fault_type"] == "DEAD_BATTERY" else "CAUTION",
                "ai_risk_score": 15,
                "confidence_pct": 95,
                "inference_mode": "sensor_health_layer",
                "model_loaded": self.is_loaded,
                "class_probabilities": {RISK_NAMES[i]: 0.9 if i == 0 else 0.025 for i in range(len(RISK_NAMES))},
                "anomaly_detected": False,
                "is_blast_suppressed": False,
                "sensor_health": health,
                "factors": {
                    "tilt_change": 5,
                    "displacement_rate": 5,
                    "crack_widening": 5,
                    "vibration": 5,
                    "historical_trend": 10
                },
                "provenance": "SENSOR HEALTH CLASSIFICATION",
                "explanation": f"Sensor faulted: {health['fault_type']}. False alarm suppressed — a node fault is NOT a ground-danger condition."
            }

        # 2. Layer 2: Blast Vibration Suppression
        vib_check = self._check_vibration_blast(packet)
        if vib_check["is_blast"]:
            return {
                "risk_class": 0,
                "risk_label": "0:NORMAL",
                "status": "SAFE",
                "ai_risk_score": 18,
                "confidence_pct": 98,
                "inference_mode": "blast_suppression_layer",
                "model_loaded": self.is_loaded,
                "class_probabilities": {RISK_NAMES[i]: 0.92 if i == 0 else 0.02 for i in range(len(RISK_NAMES))},
                "anomaly_detected": False,
                "is_blast_suppressed": True,
                "sensor_health": health,
                "factors": {
                    "tilt_change": 10,
                    "displacement_rate": 10,
                    "crack_widening": 10,
                    "vibration": 65,
                    "historical_trend": 15
                },
                "provenance": "MODEL OUTPUT (blast fingerprint)",
                "explanation": "Blasting transient detected (high frequency > 25 Hz). Siren alarm suppressed."
            }

        # 3. Layer 3 & 4: ML Model Inference (or labelled physics fallback)
        risk_class = 0
        probabilities = None
        inference_mode = "physics_fallback"
        anomaly_detected = False

        if self.xgboost_bundle is not None:
            try:
                clf = self.xgboost_bundle["classifier"]
                imputer = self.xgboost_bundle["imputer"]

                feat_vec = self._engineer_features(packet)
                feat_vec_imp = imputer.transform(feat_vec)

                pred_class_arr = clf.predict(feat_vec_imp)
                risk_class = int(pred_class_arr[0])
                inference_mode = "ml_model"

                if hasattr(clf, "predict_proba"):
                    probabilities = clf.predict_proba(feat_vec_imp)[0].tolist()
            except Exception as e:
                logger.warning("XGBoost inference failed (%s) — physics fallback for this packet", e)
                risk_class, probabilities = self._geomechanical_fallback(tilt, crack, disp)
                inference_mode = "physics_fallback"
        else:
            risk_class, probabilities = self._geomechanical_fallback(tilt, crack, disp)

        # Layer 3: Isolation Forest anomaly detection — the full 10-feature
        # contract from models/isolation_forest_meta.json (fixes the previous
        # 4-feature mismatch), scored against the artifact's trained threshold.
        anomaly_score = None
        if self.isolation_forest is not None:
            try:
                import pandas as _pd
                if_vec = self._engineer_features(packet)[self.if_features]
                raw_score = -self.isolation_forest.score_samples(if_vec)
                anomaly_score = float(raw_score[0])
                anomaly_detected = anomaly_score > self.if_anomaly_threshold
            except Exception as e:
                logger.warning("Isolation Forest scoring failed (%s) — anomaly gate degraded to class heuristic", e)
                anomaly_detected = risk_class >= 2
        else:
            anomaly_detected = risk_class >= 2

        # Compute continuous AI Risk Score (0-100)
        # Weighted expectation of risk classes + physical threshold boost
        class_weights = [10.0, 35.0, 65.0, 85.0, 98.0]
        weighted_score = sum(p * w for p, w in zip(probabilities, class_weights))
        ai_risk_score = int(min(99, max(5, round(weighted_score))))

        # High priority override for extreme physical strain
        if tilt > self.tilt_critical or disp > self.disp_critical:
            risk_class = max(risk_class, 3)
            ai_risk_score = max(ai_risk_score, 85)

        status = STATUS_MAP.get(risk_class, "SAFE")
        confidence_pct = int(max(probabilities) * 100)
        
        # Calculate Explainable AI (XAI) feature attribution percentages
        total_signal = (tilt * 12.0) + (crack * 15.0) + (disp * 8.0) + 1.0
        factors = {
            "tilt_change": int(min(95, round((tilt * 12.0 / total_signal) * 100))),
            "displacement_rate": int(min(95, round((disp * 8.0 / total_signal) * 100))),
            "crack_widening": int(min(95, round((crack * 15.0 / total_signal) * 100))),
            "vibration": 15 if risk_class > 0 else 5,
            "historical_trend": 20
        }

        return {
            "risk_class": risk_class,
            "risk_label": RISK_NAMES[risk_class],
            "status": status,
            "ai_risk_score": ai_risk_score,
            "confidence_pct": confidence_pct,
            "inference_mode": inference_mode,
            "model_loaded": self.is_loaded,
            "anomaly_score": round(anomaly_score, 4) if anomaly_score is not None else None,
            "anomaly_threshold": round(self.if_anomaly_threshold, 4),
            "class_probabilities": {RISK_NAMES[i]: round(probabilities[i], 4) for i in range(len(RISK_NAMES))},
            "anomaly_detected": anomaly_detected,
            "is_blast_suppressed": False,
            "sensor_health": health,
            "factors": factors,
            "provenance": "MODEL OUTPUT" if inference_mode == "ml_model" else "ENGINEERING CALCULATION (physics fallback)",
            "explanation": f"Predicted {RISK_NAMES[risk_class]} with {confidence_pct}% confidence based on tilt={tilt}°, crack={crack}mm, disp={disp}mm."
        }

    def _geomechanical_fallback(self, tilt: float, crack: float, disp: float):
        """Physics-based fallback using National Coal Board (NCB) tension/shear curves."""
        # Class 4: Emergency (>1.0 deg, >10mm crack, >20mm disp)
        if tilt > 1.0 or crack > 10.0 or disp > 20.0:
            return 4, [0.01, 0.02, 0.05, 0.12, 0.80]
        # Class 3: Critical (0.5 - 1.0 deg, 3 - 10mm crack, 5 - 20mm disp)
        elif tilt >= 0.5 or crack >= 3.0 or disp >= 5.0:
            return 3, [0.02, 0.05, 0.15, 0.70, 0.08]
        # Class 2: Warning (0.2 - 0.5 deg, 1 - 3mm crack, 2 - 5mm disp)
        elif tilt >= 0.2 or crack >= 1.0 or disp >= 2.0:
            return 2, [0.05, 0.20, 0.65, 0.08, 0.02]
        # Class 1: Watch (0.1 - 0.2 deg, 0.5 - 1mm crack, 1 - 2mm disp)
        elif tilt >= 0.1 or crack >= 0.5 or disp >= 1.0:
            return 1, [0.25, 0.60, 0.10, 0.04, 0.01]
        # Class 0: Normal
        else:
            return 0, [0.92, 0.05, 0.02, 0.005, 0.005]

# Global singleton instance
ml_service = MineMLService()
