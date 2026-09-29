"""
TerraMesh AI — Module 4.1: 5-Class XGBoost Subsidence Risk Classifier
=====================================================================
Trains an optimized gradient boosted tree classifier to predict National Coal Board (NCB)
subsidence risk classes:
  0: NORMAL     (< 0.5 mm/m tensile strain)
  1: WATCH      (0.5 - 1.5 mm/m)
  2: WARNING    (1.5 - 3.0 mm/m)
  3: CRITICAL   (3.0 - 6.0 mm/m)
  4: EMERGENCY  (> 6.0 mm/m)

Usage:
  python ml/train_xgboost_risk.py
"""

import json
import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.pipeline import Pipeline
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb

BASE_DIR = Path(__file__).resolve().parent.parent
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
    """Computes physical ratios and interaction features."""
    X = df[FEATURE_COLS].copy()
    
    # 0-10 Hz spectral band ratio
    tot_band = X["band_energy_0_10"] + X["band_energy_10_50"]
    X["band_ratio_0_10"] = np.where(tot_band > 1e-9, X["band_energy_0_10"] / tot_band, 0.5)
    
    # Mining geometry aspect ratio (extraction thickness over depth)
    depth = X["depth_m"].replace(0, np.nan)
    X["extraction_ratio"] = (X["seam_thk_m"] / depth).fillna(0.02)
    
    return X


def train():
    print("=" * 70)
    print("TerraMesh AI — Training 5-Class XGBoost Risk Classifier")
    print("=" * 70)

    print("\n[1/5] Loading training and validation sets...")
    train_df = pd.read_parquet(DATA_DIR / "final_train.parquet")
    val_df   = pd.read_parquet(DATA_DIR / "final_val.parquet")
    print(f"  Raw train rows: {len(train_df):,} | Val rows: {len(val_df):,}")

    # Stratified balance sample for efficient training (50K per class = 250K total)
    samples_per_class = 60_000
    sub_parts = []
    for c in range(5):
        c_df = train_df[train_df["risk_class"] == c]
        n_take = min(samples_per_class, len(c_df))
        sub_parts.append(c_df.sample(n_take, random_state=42))
    train_sample = pd.concat(sub_parts, ignore_index=True).sample(frac=1, random_state=42)
    print(f"  Balanced training subset: {len(train_sample):,} rows ({samples_per_class:,} per class)")

    print("\n[2/5] Engineering domain features...")
    X_train = engineer_features(train_sample)
    y_train = train_sample["risk_class"].values

    X_val = engineer_features(val_df.sample(min(100_000, len(val_df)), random_state=42))
    y_val = val_df.loc[X_val.index, "risk_class"].values

    imputer = SimpleImputer(strategy="median")
    X_train_imp = imputer.fit_transform(X_train)
    X_val_imp   = imputer.transform(X_val)

    # Compute balanced sample weights
    sample_weights = compute_sample_weight("balanced", y_train)

    print("\n[3/5] Training XGBoost Classifier...")
    t0 = time.time()
    clf = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=6,
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
    t_train = time.time() - t0
    print(f"  Training finished in {t_train:.2f} seconds.")

    print("\n[4/5] Evaluating on independent test set...")
    test_df = pd.read_parquet(DATA_DIR / "final_test.parquet")
    test_sample = test_df.sample(min(150_000, len(test_df)), random_state=42)
    X_test = engineer_features(test_sample)
    y_test = test_sample["risk_class"].values
    X_test_imp = imputer.transform(X_test)

    y_pred = clf.predict(X_test_imp)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    print(f"\n  Macro F1-Score:    {macro_f1:.4f}")
    print(f"  Weighted F1-Score: {weighted_f1:.4f}")

    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=RISK_NAMES, digits=4))

    print("\nMulti-Class Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    header = f"{'True / Pred':<15}" + "".join([f"{name:>12}" for name in RISK_NAMES])
    print(header)
    print("-" * len(header))
    for i, row_label in enumerate(RISK_NAMES):
        row_str = f"{row_label:<15}" + "".join([f"{cm[i, j]:>12,}" for j in range(5)])
        print(row_str)

    # Feature importances
    feat_names = list(X_train.columns)
    importances = clf.feature_importances_
    feat_imp = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)
    print("\nTop 8 Most Important Physical Features:")
    for f_name, imp in feat_imp[:8]:
        bar = "#" * int(imp * 40)
        print(f"  {f_name:<20} {imp:6.3f} [{bar}]")

    print("\n[5/5] Saving model and report artifacts...")
    model_bundle = {
        "classifier": clf,
        "imputer": imputer,
        "features": feat_names,
        "classes": RISK_NAMES,
    }
    model_path = MODELS_DIR / "xgboost_risk.joblib"
    joblib.dump(model_bundle, model_path)
    print(f"  Saved model -> {model_path}")

    # Also save native XGBoost JSON
    clf.save_model(str(MODELS_DIR / "xgboost_risk.json"))
    print(f"  Saved native XGBoost JSON -> {MODELS_DIR / 'xgboost_risk.json'}")

    report_data = {
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "training_time_sec": round(t_train, 2),
        "training_rows": len(train_sample),
        "test_rows": len(test_sample),
        "confusion_matrix": cm.tolist(),
        "top_features": [(f_name, round(float(imp), 4)) for f_name, imp in feat_imp[:8]],
    }
    with open(MODELS_DIR / "xgboost_report.json", "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"  Saved evaluation report -> {MODELS_DIR / 'xgboost_report.json'}")

    print("\n" + "=" * 70)
    print("SUCCESS: 5-Class XGBoost Risk Classifier is fully trained and verified!")
    print("=" * 70)


if __name__ == "__main__":
    train()
