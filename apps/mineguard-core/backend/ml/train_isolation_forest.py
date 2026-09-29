"""
TerraMesh AI — Module 3.1: Anomaly Detector Training (Isolation Forest)
======================================================================
Trains an unsupervised Isolation Forest on normal baseline strata behavior (Class 0: NORMAL).
At inference time, it flags any unusual multi-sensor divergence before explicit damage occurs.

Usage:
  python ml/train_isolation_forest.py
"""

import json
import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "cleaned" / "final"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

FEATURES = [
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
]


def train():
    print("=" * 65)
    print("TerraMesh AI — Training Isolation Forest Anomaly Detector")
    print("=" * 65)

    print("\n[1/4] Loading training dataset...")
    train_df = pd.read_parquet(DATA_DIR / "final_train.parquet")
    print(f"  Loaded {len(train_df):,} total training rows")

    # Filter strictly Class 0 (NORMAL) for unsupervised baseline training
    normal_df = train_df[train_df["risk_class"] == 0]
    sample_size = min(200_000, len(normal_df))
    print(f"  Sampling {sample_size:,} normal baseline rows for fitting...")
    X_normal = normal_df[FEATURES].sample(sample_size, random_state=42)

    print("\n[2/4] Fitting IsolationForest pipeline...")
    t0 = time.time()
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("iforest", IsolationForest(
            n_estimators=150,
            max_samples=1024,
            contamination=0.03,  # expected false positive baseline
            random_state=42,
            n_jobs=-1,
        )),
    ])
    pipeline.fit(X_normal)
    t_fit = time.time() - t0
    print(f"  Fit complete in {t_fit:.2f} seconds.")

    print("\n[3/4] Evaluating on holdout test set...")
    test_df = pd.read_parquet(DATA_DIR / "final_test.parquet")
    test_sample = test_df.sample(min(100_000, len(test_df)), random_state=42)
    X_test = test_sample[FEATURES]
    y_test_anomaly = (test_sample["risk_class"] > 0).astype(int)  # 1 = anomaly, 0 = normal

    # Invert score so higher = more anomalous
    scores = -pipeline.named_steps["iforest"].score_samples(
        pipeline.named_steps["imputer"].transform(X_test)
    )
    # Threshold at 95th percentile of normal scores
    normal_scores = scores[y_test_anomaly == 0]
    threshold = float(np.percentile(normal_scores, 95))
    preds = (scores >= threshold).astype(int)

    auc = roc_auc_score(y_test_anomaly, scores)
    print(f"  ROC-AUC Score: {auc:.4f}")
    print(f"  Anomaly Decision Threshold (95th pct): {threshold:.4f}")
    print("\nClassification Report (0 = Normal, 1 = Ground Deformation Anomaly):")
    print(classification_report(y_test_anomaly, preds, digits=4))

    print("\n[4/4] Saving model artifacts...")
    model_path = MODELS_DIR / "isolation_forest.joblib"
    joblib.dump(pipeline, model_path)
    print(f"  Saved model -> {model_path}")

    meta = {
        "model_type": "IsolationForest",
        "features": FEATURES,
        "sample_size": sample_size,
        "contamination": 0.03,
        "threshold": threshold,
        "roc_auc": round(float(auc), 4),
        "train_time_sec": round(t_fit, 2),
    }
    meta_path = MODELS_DIR / "isolation_forest_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Saved metadata -> {meta_path}")

    print("\n" + "=" * 65)
    print("SUCCESS: Isolation Forest Anomaly Detector is trained and ready!")
    print("=" * 65)


if __name__ == "__main__":
    train()
