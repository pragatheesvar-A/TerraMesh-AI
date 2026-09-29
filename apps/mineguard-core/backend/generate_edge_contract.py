#!/usr/bin/env python3
"""
TerraMesh AI — Edge Model Contract GENERATOR
=============================================
Generates `edge/contracts/edge_model_contract.json` — the deterministic,
versioned contract between the trained server-side artifacts and any edge
inference target (reference firmware, future quantized TinyML builds):

  * model identity: name, version, artifact, sha256 checksum, size
  * deterministic FEATURE_ORDER (exact inference input order)
  * per-feature quantization ranges (observed training envelope)
  * input/output tensor shapes and class labels
  * inference-result schema (risk classes, confidence, threshold)
  * CPU/RAM envelope assumptions for MCU targets
  * fallback inference definition (when the model is unavailable)
  * telemetry-compatibility note (backend/edge_schemas.NodeTelemetry)

Run from backend/:  python generate_edge_contract.py
"""
from __future__ import annotations
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))

CONTRACT_PATH = BACKEND.parent / "edge" / "contracts" / "edge_model_contract.json"

# Deterministic feature order — the server-side inference contract used by
# ml_service._engineer_features and the edge telemetry schema. An edge build
# MUST produce features in exactly this order.
FEATURE_ORDER = [
    "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad", "crack_mm",
    "strain_ustrain", "vib_rms_g", "vib_peak_g", "dom_freq_hz",
    "band_energy_0_10", "band_energy_10_50", "temp_c",
    "depth_m", "seam_thk_m", "blast_flag", "rain_flag", "vehicle_flag",
    "band_ratio_0_10", "extraction_ratio",
]

# Observed physical envelope (project engineering limits — NOT statutory).
# Quantized edge builds clamp/scale features to these ranges.
QUANTIZATION_RANGES = {
    "tilt_x_deg":        [-10.0, 10.0],
    "tilt_y_deg":        [-10.0, 10.0],
    "tilt_mag_mrad":     [0.0, 174.5],
    "crack_mm":          [0.0, 200.0],
    "strain_ustrain":    [0.0, 5000.0],
    "vib_rms_g":         [0.0, 8.0],
    "vib_peak_g":        [0.0, 16.0],
    "dom_freq_hz":       [0.0, 120.0],
    "band_energy_0_10":  [0.0, 1.0],
    "band_energy_10_50": [0.0, 1.0],
    "temp_c":            [-10.0, 85.0],
    "depth_m":           [0.0, 600.0],
    "seam_thk_m":        [0.5, 10.0],
    "blast_flag":        [0, 1],
    "rain_flag":         [0, 1],
    "vehicle_flag":      [0, 1],
    "band_ratio_0_10":   [0.0, 1.0],
    "extraction_ratio":  [0.0, 1.0],
}

RISK_CLASSES = ["0:NORMAL", "1:WATCH", "2:WARNING", "3:CRITICAL", "4:EMERGENCY"]


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    import joblib
    models_dir = BACKEND / "models"

    contract = {
        "contract_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "honest_status": "REFERENCE CONTRACT for edge deployment readiness. "
                         "The trained artifacts are NOT quantized for MCU "
                         "deployment; a production TinyML build must be "
                         "exported FROM this contract and re-validated.",
        "models": {},
        "feature_order": FEATURE_ORDER,
        "quantization_ranges": QUANTIZATION_RANGES,
        "input_tensor": {"shape": [1, len(FEATURE_ORDER)], "dtype": "float32",
                          "features": FEATURE_ORDER},
        "output_tensor": {"shape": [1, len(RISK_CLASSES)],
                           "dtype": "float32",
                           "labels": RISK_CLASSES,
                           "semantics": "softmax class probabilities; index "
                                        "0..4 = NORMAL..EMERGENCY"},
        "isolation_forest": {
            "features": None,  # filled from meta
            "anomaly_threshold": None,  # filled from meta
            "score_semantics": "higher = more anomalous; compare against "
                                "anomaly_threshold",
        },
        "inference_result_schema": {
            "risk_class": "int 0-4",
            "risk_label": f"one of {RISK_CLASSES}",
            "class_probabilities": "float[5] summing to ~1.0",
            "confidence": "max(class_probabilities)",
            "anomaly_score": "float or null when the anomaly model is absent",
            "inference_mode": "ml_model | physics_fallback",
            "provenance": "MODEL OUTPUT",
        },
        "fallback_inference": {
            "definition": "Uniform probability vector [0.2]*5 — explicitly "
                          "NOT a fabricated 'all normal' vector; every result "
                          "is labelled model_loaded=false / inference_mode="
                          "physics_fallback",
            "reference": "backend/edge_ingest_loop.py (degraded mode)",
        },
        "target_envelope": {
            "cpu": "dual-core 240 MHz (ESP32-S3 class) — full classifier is "
                   "SERVER-SIDE; on-node runs the fixed-point threshold "
                   "reference (see edge/firmware)",
            "ram": ">= 512 KB SRAM for feature window buffers",
            "sampling": "200 Hz burst x 0.5 s window for vibration; 1 Hz "
                        "for tilt/crack/strain; duty-cycled by solar state",
            "latency_budget_ms": 5000,
        },
        "telemetry_compatibility": {
            "wire_schema": "backend/edge_schemas.NodeTelemetry",
            "mqtt_payload": "JSON matching NodeTelemetry; packet_seq enables "
                            "QoS-1 dedup; timestamp ISO-8601",
            "superset_fields_covering_features": [
                "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad", "crack_gap_mm",
                "strain_ustrain", "vib_rms_g", "vib_peak_g", "dom_freq_hz",
                "band_energy_0_10", "band_energy_10_50", "temp_c",
                "blast_flag", "rain_flag", "vehicle_flag",
            ],
            "wire_to_model_aliases": {
                "crack_mm": "crack_gap_mm",   # model feature name -> wire name
            },
            "derived_features_required_on_gateway_or_server": [
                "band_ratio_0_10", "extraction_ratio", "depth_m", "seam_thk_m",
            ],
        },
    }

    # Model artifacts with checksums + metadata
    for name, fname in (("xgboost_risk", "xgboost_risk.joblib"),
                        ("isolation_forest", "isolation_forest.joblib"),
                        ("terramesh_final", "terramesh_final_model.joblib")):
        p = models_dir / fname
        if not p.exists():
            continue
        entry = {
            "artifact": str(p.relative_to(BACKEND)),
            "sha256": sha256_of(p),
            "size_bytes": p.stat().st_size,
        }
        contract["models"][name] = entry

    meta_path = models_dir / "isolation_forest_meta.json"
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
        contract["isolation_forest"]["features"] = meta.get("features")
        contract["isolation_forest"]["anomaly_threshold"] = meta.get("threshold")
        contract["isolation_forest"]["trained_note"] = (
            f"contamination={meta.get('contamination')}, "
            f"roc_auc={meta.get('roc_auc')} (SYNTHETIC corpus holdout)")

    report_path = models_dir / "xgboost_report.json"
    if report_path.exists():
        with open(report_path) as f:
            rep = json.load(f)
        contract["models"]["xgboost_risk"]["training_metrics"] = {
            "macro_f1": rep.get("macro_f1"),
            "weighted_f1": rep.get("weighted_f1"),
            "note": "SYNTHETIC training-corpus holdout (see synth/); no field "
                    "data was used",
        }
        top = rep.get("top_features") or []
        contract["xgboost_top_features"] = [[f, w] for f, w in top[:8]]

    CONTRACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONTRACT_PATH, "w") as f:
        json.dump(contract, f, indent=2)
    print(f"contract written: {CONTRACT_PATH}")
    print(f"  feature_order: {len(FEATURE_ORDER)} features")
    print(f"  models: {', '.join(contract['models'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
