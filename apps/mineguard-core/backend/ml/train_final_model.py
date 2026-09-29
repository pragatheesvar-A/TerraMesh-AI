"""
TerraMesh AI — Full & Final Production Risk Classifier (7 Million Rows)
=======================================================================
Trains the definitive production model on the ENTIRE 7,012,645-row training corpus.
No sub-sampling. Full gradient boosting with balanced class weights across:
  - 6,291,777 Class 0 (NORMAL)
  -   186,464 Class 1 (WATCH)
  -   197,447 Class 2 (WARNING)
  -   184,429 Class 3 (CRITICAL)
  -   152,528 Class 4 (EMERGENCY)

Validated on 1,339,818 holdout validation rows.
Tested on 1,681,129 holdout testing rows.

Usage:
  python ml/train_final_model.py
"""

import json
import sys
import time
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb

DATA_DIR = BASE_DIR / "data" / "cleaned" / "final"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

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
]

RISK_NAMES = ["0:NORMAL", "1:WATCH", "2:WARNING", "3:CRITICAL", "4:EMERGENCY"]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes physics ratios and spectral interaction features."""
    X = pd.DataFrame(index=df.index)
    for col in FEATURE_COLS:
        if col in df.columns:
            X[col] = df[col]
        elif col == "crack_mm" and "crack_gap_mm" in df.columns:
            X[col] = df["crack_gap_mm"]
        elif col == "depth_m":
            X[col] = df.get("H", 150.0)
        elif col == "seam_thk_m":
            X[col] = df.get("m", 3.0)
    # Recalculate physically accurate tilt_mag_mrad from primary MPU6050 axes
    if "tilt_x_deg" in df.columns and "tilt_y_deg" in df.columns:
        tx_mrad = df["tilt_x_deg"] * (np.pi / 180.0) * 1000.0
        ty_mrad = df["tilt_y_deg"] * (np.pi / 180.0) * 1000.0
        X["tilt_mag_mrad"] = np.sqrt(tx_mrad**2 + ty_mrad**2).clip(0.0, 500.0)
    
    # Low frequency strata energy ratio: E(0-10) / (E(0-10) + E(10-50))
    tot_band = X["band_energy_0_10"].fillna(0) + X["band_energy_10_50"].fillna(0)
    X["band_ratio_0_10"] = np.where(tot_band > 1e-9, X["band_energy_0_10"] / tot_band, 0.5)
    
    # Geotechnical extraction aspect ratio (m / H)
    depth = X["depth_m"].replace(0, np.nan).fillna(150.0)
    seam = X["seam_thk_m"].fillna(3.0)
    X["extraction_ratio"] = (seam / depth).fillna(0.02)
    
    return X


class TerraMeshModel:
    """Production Inference Wrapper for Edge Gateway Deployment."""
    def __init__(self, clf: xgb.XGBClassifier, imputer: SimpleImputer, features: list):
        self.clf = clf
        self.imputer = imputer
        self.features = features
        self.risk_names = RISK_NAMES

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        X = engineer_features(df)
        X_imp = self.imputer.transform(X[self.features])
        return self.clf.predict(X_imp)

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        X = engineer_features(df)
        X_imp = self.imputer.transform(X[self.features])
        return self.clf.predict_proba(X_imp)


def train_full_production_model():
    print("=" * 75)
    print("TerraMesh AI — FULL & FINAL PRODUCTION MODEL TRAINING")
    print("Training on the ENTIRE 7,012,645-Row Corpus")
    print("=" * 75)

    # 1. LOAD FULL DATASETS
    t0 = time.time()
    print("\n[1/5] Loading 100% of Training and Validation Datasets...")
    train_df = pd.read_parquet(DATA_DIR / "final_train.parquet")
    val_df   = pd.read_parquet(DATA_DIR / "final_val.parquet")
    print(f"  Loaded {len(train_df):,} training rows in {time.time() - t0:.2f}s")
    print(f"  Loaded {len(val_df):,} validation rows")

    print("\n  Class Distribution in Full Training Set:")
    for c, cnt in train_df["risk_class"].value_counts().sort_index().items():
        pct = cnt / len(train_df) * 100
        print(f"    Class {c} ({RISK_NAMES[c]:<12}): {cnt:>10,} rows ({pct:5.2f}%)")

    # 2. FEATURE ENGINEERING & IMPUTATION
    print("\n[2/5] Engineering Domain Features & Computing Balanced Weights...")
    t_feat = time.time()
    X_train = engineer_features(train_df)
    y_train = train_df["risk_class"].values.astype(np.int32)

    X_val = engineer_features(val_df)
    y_val = val_df["risk_class"].values.astype(np.int32)

    imputer = SimpleImputer(strategy="median")
    X_train_imp = imputer.fit_transform(X_train).astype(np.float32)
    X_val_imp   = imputer.transform(X_val).astype(np.float32)
    feature_names = list(X_train.columns)

    # Balanced sample weights across all 7M rows
    sample_weights = compute_sample_weight("balanced", y_train).astype(np.float32)
    print(f"  Features prepared in {time.time() - t_feat:.2f}s across {len(feature_names)} features.")

    # 3. FULL MODEL TRAINING
    print("\n[3/5] Fitting Full XGBoost Multi-Class Classifier (Histogram Mode, Multi-Threaded)...")
    t_train = time.time()
    clf = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=7,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        num_class=5,
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(
        X_train_imp,
        y_train,
        sample_weight=sample_weights,
        eval_set=[(X_val_imp, y_val)],
        verbose=50,
    )
    train_duration = time.time() - t_train
    print(f"\n  Full 7M Training Complete in: {train_duration:.2f} seconds ({train_duration/60:.2f} minutes)!")

    # 4. EVALUATION ON FULL HOLDOUT TEST SET
    print("\n[4/5] Evaluating on Complete Independent Holdout Test Set...")
    test_df = pd.read_parquet(DATA_DIR / "final_test.parquet")
    print(f"  Holdout test rows: {len(test_df):,}")

    X_test = engineer_features(test_df)
    y_test = test_df["risk_class"].values.astype(np.int32)
    X_test_imp = imputer.transform(X_test).astype(np.float32)

    y_pred = clf.predict(X_test_imp)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    accuracy = float((y_test == y_pred).mean() * 100)

    print("\n" + "=" * 75)
    print("FINAL PRODUCTION MODEL TEST SCORECARD")
    print("=" * 75)
    print(f"  Overall Accuracy:    {accuracy:.2f}%")
    print(f"  Macro F1-Score:      {macro_f1:.4f}")
    print(f"  Weighted F1-Score:   {weighted_f1:.4f}")

    print("\nFull 5-Class Performance vs NCB Subsidence Standards:")
    print(classification_report(y_test, y_pred, target_names=RISK_NAMES, digits=4))

    print("Multi-Class Confusion Matrix (1.68 Million Test Rows):")
    cm = confusion_matrix(y_test, y_pred)
    header = f"{'True / Pred':<15}" + "".join([f"{name:>12}" for name in RISK_NAMES])
    print(header)
    print("-" * len(header))
    for i, row_label in enumerate(RISK_NAMES):
        row_str = f"{row_label:<15}" + "".join([f"{cm[i, j]:>12,}" for j in range(5)])
        print(row_str)

    # Top Feature Importances
    importances = clf.feature_importances_
    feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    print("\nTop 10 Most Critical Physical Ground Movement Predictors:")
    for rank, (f_name, imp) in enumerate(feat_imp[:10], 1):
        bar = "#" * int(imp * 35)
        print(f"  {rank:>2}. {f_name:<22} {imp:6.4f} [{bar}]")

    # 5. SAVE FINAL PRODUCTION ARTIFACTS
    print("\n[5/5] Saving Final Production Model Artifacts...")
    
    # 1. Complete inference bundle
    prod_bundle = TerraMeshModel(clf, imputer, feature_names)
    bundle_path = MODELS_DIR / "terramesh_final_model.joblib"
    joblib.dump(prod_bundle, bundle_path)
    print(f"  [SAVED] Full Production Bundle -> {bundle_path}")

    # 2. Standalone native XGBoost JSON (for ultra-fast edge gateway execution)
    json_path = MODELS_DIR / "terramesh_final_model.json"
    clf.save_model(str(json_path))
    print(f"  [SAVED] Native Edge JSON Model -> {json_path}")

    # 3. Final scorecard summary
    summary = {
        "model_name": "TerraMesh_XGBoost_Full_Production_V1",
        "training_rows": int(len(train_df)),
        "validation_rows": int(len(val_df)),
        "test_rows": int(len(test_df)),
        "training_time_seconds": round(float(train_duration), 2),
        "test_accuracy_pct": round(float(accuracy), 2),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "features": feature_names,
        "top_features": [(f_name, round(float(imp), 4)) for f_name, imp in feat_imp[:10]],
        "confusion_matrix": cm.tolist(),
    }
    summary_path = MODELS_DIR / "terramesh_final_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  [SAVED] Final Summary & Audit Scorecard -> {summary_path}")

    print("\n" + "=" * 75)
    print("SUCCESS: Full & Final TerraMesh AI Production Model is Trained and Exported!")
    print("=" * 75)


if __name__ == "__main__":
    train_full_production_model()
