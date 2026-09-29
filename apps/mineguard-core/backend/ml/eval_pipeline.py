"""
TerraMesh AI — Unified Pipeline Evaluator & Scorecard
=====================================================
Tests all safety-critical layers on the 1.68M-row holdout test set (final_test.parquet):
  1. Sensor Health Discrimination (Stuck / Drift / Brownout vs Real Movement)
  2. Vibration Fingerprinting (Blast False-Alarm Suppression)
  3. Isolation Forest Anomaly Detector (Unsupervised strata divergence)
  4. 5-Class XGBoost Risk Classifier (NCB damage classes)

Usage:
  python ml/eval_pipeline.py
"""

import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, f1_score, roc_auc_score

from ml.sensor_health import SensorHealthClassifier, generate_confusion_matrix_report
from ml.vibration_filter import VibrationFingerprinter
from ml.train_xgboost_risk import engineer_features, RISK_NAMES
DATA_DIR = BASE_DIR / "data" / "cleaned" / "final"
MODELS_DIR = BASE_DIR / "models"


def run_evaluation():
    print("=" * 75)
    print("TerraMesh AI — Unified ML Performance Evaluation")
    print("Holdout Test Set: data/cleaned/final/final_test.parquet (1.68M rows)")
    print("=" * 75)

    print("\n[LOADING] Holdout test sample...")
    test_df = pd.read_parquet(DATA_DIR / "final_test.parquet")
    sample = test_df.sample(min(120_000, len(test_df)), random_state=42).copy()
    print(f"  Loaded {len(sample):,} holdout test rows for comprehensive evaluation.")

    # -------------------------------------------------------------
    # 1. SENSOR HEALTH DISCRIMINATION EVALUATION
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("[LAYER 1] Sensor Health Discrimination (ml/sensor_health.py)")
    print("-" * 75)
    health_clf = SensorHealthClassifier()
    eval_df = health_clf.evaluate_batch(sample)
    
    true_faults = sample["fault_type"].fillna("none").values
    pred_faults = eval_df["pred_fault_type"].values
    
    # Map into binary fault detection (HEALTHY vs FAULTED)
    true_is_fault = (true_faults != "none").astype(int)
    pred_is_fault = eval_df["is_faulted"].values
    
    print("\nBinary Sensor Fault Isolation Performance:")
    print(classification_report(true_is_fault, pred_is_fault, target_names=["HEALTHY", "FAULTED"], digits=4))

    # -------------------------------------------------------------
    # 2. VIBRATION FINGERPRINTING & BLAST SUPPRESSION EVALUATION
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("[LAYER 2] Vibration Fingerprinting & Blasting Suppression (ml/vibration_filter.py)")
    print("-" * 75)
    vib_filter = VibrationFingerprinter()
    vib_res = vib_filter.classify_batch(sample)
    
    true_blast = sample["blast_flag"].fillna(0).astype(int).values
    pred_blast = vib_res["is_blast"].values
    
    print(f"\nTotal blast events in evaluation sample: {true_blast.sum():,}")
    print(f"Correctly suppressed blast alarms:      {(true_blast & pred_blast).sum():,}")
    blast_recall = (true_blast & pred_blast).sum() / max(1, true_blast.sum()) * 100
    print(f"Blast Siren Suppression Accuracy:        {blast_recall:.2f}%")
    print(classification_report(true_blast, pred_blast, target_names=["NON_BLAST", "BLAST_EVENT"], digits=4))

    # -------------------------------------------------------------
    # 3. ISOLATION FOREST ANOMALY DETECTOR
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("[LAYER 3] Isolation Forest Anomaly Detection (models/isolation_forest.joblib)")
    print("-" * 75)
    if_path = MODELS_DIR / "isolation_forest.joblib"
    if if_path.exists():
        iforest_pipe = joblib.load(if_path)
        from ml.train_isolation_forest import FEATURES as IF_FEATS
        X_if = sample[IF_FEATS]
        scores = -iforest_pipe.named_steps["iforest"].score_samples(
            iforest_pipe.named_steps["imputer"].transform(X_if)
        )
        y_anomaly = (sample["risk_class"] > 0).astype(int)
        auc = roc_auc_score(y_anomaly, scores)
        print(f"  Isolation Forest ROC-AUC on holdout test set: {auc:.4f}")
    else:
        print("  [INFO] Isolation Forest model not trained yet. Run 'python ml/train_isolation_forest.py' first.")

    # -------------------------------------------------------------
    # 4. 5-CLASS XGBOOST RISK CLASSIFIER
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("[LAYER 4] 5-Class XGBoost Subsidence Risk Classifier (models/xgboost_risk.joblib)")
    print("-" * 75)
    xgb_path = MODELS_DIR / "xgboost_risk.joblib"
    if xgb_path.exists():
        bundle = joblib.load(xgb_path)
        clf = bundle["classifier"]
        imputer = bundle["imputer"]
        
        X_xgb = engineer_features(sample)
        X_xgb_imp = imputer.transform(X_xgb)
        y_true = sample["risk_class"].values
        y_pred = clf.predict(X_xgb_imp)
        
        macro_f1 = f1_score(y_true, y_pred, average="macro")
        print(f"  XGBoost Macro F1-Score: {macro_f1:.4f}")
        print("\nFull 5-Class Performance vs NCB Thresholds:")
        print(classification_report(y_true, y_pred, target_names=RISK_NAMES, digits=4))
    else:
        print("  [INFO] XGBoost model not trained yet. Run 'python ml/train_xgboost_risk.py' first.")

    print("\n" + "=" * 75)
    print("EVALUATION COMPLETE")
    print("=" * 75)


if __name__ == "__main__":
    run_evaluation()
