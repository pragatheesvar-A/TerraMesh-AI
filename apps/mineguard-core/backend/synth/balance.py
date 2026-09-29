#!/usr/bin/env python3
"""
TerraMesh AI — Class Imbalance Corrector
==========================================
Addresses the 95.9% / 4.1% class imbalance in the merged corpus.

Strategy (defence-grade, justifiable to SIH judges):
-----------------------------------------------------
1. UNDERSAMPLE Class 0 (NORMAL) in Tier 2 Noamundi rows only.
   Rationale: Noamundi has 6.24M class-0 rows that are structurally
   identical (low-displacement ambient periods). Keeping them all
   doesn't improve generalisation — it just overwhelms the minority.
   Tier 1 class-0 rows are kept in FULL (they encode real sensor
   noise + fault modes + thermal cycling).

2. OVERSAMPLE minority classes (2, 3, 4) from Tier 1 only, using
   Gaussian noise jitter on sensor columns (not label interpolation).
   This is NOT SMOTE-on-raw-readings — it is physics-aware:
   we jitter within the instrument noise envelope (MPU6050 ±0.03°,
   HX711 ±3 µε) so no generated sample violates the physical model.

3. RESULT TARGET distribution (approximate):
   Class 0: ~40%  (reduced from 95.9%)
   Class 1: ~15%
   Class 2: ~15%
   Class 3: ~15%
   Class 4: ~15%

4. The BALANCED corpus is saved separately as:
   data/cleaned/balanced_train.parquet
   The original primary_train.parquet is PRESERVED for reference
   and for any model that handles imbalance internally (XGBoost scale_pos_weight).

Usage:
    python synth/balance.py
"""

from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd

CLEANED  = Path(r"d:\COAL MINE\terramesh-platform\data\cleaned")
RNG      = np.random.default_rng(42)

# Instrument noise envelope (1-sigma) for physics-aware jitter
JITTER_SIGMA = {
    "tilt_x_deg":        0.03,      # MPU6050 MEMS noise
    "tilt_y_deg":        0.03,
    "tilt_mag_mrad":     0.05,
    "crack_mm":          0.50,      # VL53L0X ±2% on 25mm typical
    "strain_ustrain":    3.00,      # HX711 quantisation
    "vib_rms_g":         0.002,
    "vib_peak_g":        0.005,
    "temp_c":            0.50,      # Ambient temperature variation
    "batt_v":            0.010,
    "rssi_dbm":          2.00,
}

# Target counts per class in the balanced training set
TARGET_COUNTS = {
    0: 220_000,   # Keep generous class-0 (real faults hide here)
    1: 110_000,
    2: 110_000,
    3: 110_000,
    4: 110_000,
}


def physics_aware_jitter(df: pd.DataFrame, n: int) -> pd.DataFrame:
    """
    Oversample `df` to `n` rows using Gaussian jitter within
    instrument noise bounds. Labels are preserved exactly.
    """
    if len(df) >= n:
        return df.sample(n, random_state=42, replace=False)

    # Sample with replacement, then add instrument noise
    sampled = df.sample(n, random_state=42, replace=True).copy()
    idx = sampled.index

    for col, sigma in JITTER_SIGMA.items():
        if col in sampled.columns:
            noise = RNG.normal(0, sigma, size=len(sampled))
            sampled[col] = sampled[col].to_numpy() + noise

    # Clip to physics bounds after jitter
    bounds = {
        "tilt_x_deg":   (-15.0, 15.0),
        "tilt_y_deg":   (-15.0, 15.0),
        "crack_mm":     (0.0, 500.0),
        "vib_rms_g":    (0.0, 5.0),
        "vib_peak_g":   (0.0, 10.0),
        "batt_v":       (2.8, 4.3),
        "rssi_dbm":     (-130.0, 0.0),
    }
    for col, (lo, hi) in bounds.items():
        if col in sampled.columns:
            sampled[col] = sampled[col].clip(lower=lo, upper=hi)

    # Reset index cleanly
    sampled = sampled.reset_index(drop=True)
    return sampled


def balance_training_set() -> pd.DataFrame:
    print("=" * 65)
    print("TerraMesh AI -- Class Imbalance Corrector")
    print("=" * 65)

    print("\nLoading primary_train.parquet ...")
    train = pd.read_parquet(CLEANED / "primary_train.parquet")
    print(f"  Loaded: {len(train):,} rows")

    # Show current distribution
    print("\nCurrent distribution:")
    for cls in range(5):
        cnt = int((train["risk_class"] == cls).sum())
        pct = cnt / len(train) * 100
        print(f"  Class {cls}: {cnt:>9,}  ({pct:5.1f}%)")

    # Separate by source × class
    tier1   = train[train["data_source"].isin(["TIER1A_TERRAMESH", "TIER1B_SCENARIOS"])]
    tier2   = train[train["data_source"] == "TIER2_NOAMUNDI"]
    print(f"\n  Tier1 rows: {len(tier1):,}")
    print(f"  Tier2 rows: {len(tier2):,}")

    balanced_parts = []

    for cls in range(5):
        target = TARGET_COUNTS[cls]
        print(f"\nClass {cls} (target={target:,}):")

        t1_cls = tier1[tier1["risk_class"] == cls]
        t2_cls = tier2[tier2["risk_class"] == cls]
        available = len(t1_cls) + len(t2_cls)

        print(f"  Available: Tier1={len(t1_cls):,}  Tier2={len(t2_cls):,}  Total={available:,}")

        if cls == 0:
            # Class 0: Keep ALL Tier1 class-0, undersample Tier2 class-0
            t2_need = max(0, target - len(t1_cls))
            t2_sampled = t2_cls.sample(
                min(t2_need, len(t2_cls)), random_state=42, replace=False
            ) if len(t2_cls) > 0 else pd.DataFrame()
            combined_cls = pd.concat([t1_cls, t2_sampled], ignore_index=True)
            print(f"  Strategy: keep all Tier1 ({len(t1_cls):,}) + "
                  f"undersample Tier2 ({len(t2_sampled):,})")
        else:
            # Classes 1-4: Prefer Tier1 (physics labels), oversample if needed
            if len(t1_cls) >= target:
                combined_cls = t1_cls.sample(target, random_state=42, replace=False)
                print(f"  Strategy: undersample Tier1 to {target:,}")
            elif len(t1_cls) > 0:
                combined_cls = physics_aware_jitter(t1_cls, target)
                print(f"  Strategy: jitter-oversample Tier1 {len(t1_cls):,} -> {target:,}")
            elif len(t2_cls) > 0:
                combined_cls = physics_aware_jitter(t2_cls, target)
                print(f"  Strategy: jitter-oversample Tier2 {len(t2_cls):,} -> {target:,}")
            else:
                print(f"  Strategy: SKIP (no samples available)")
                continue

        print(f"  Final: {len(combined_cls):,} rows")
        balanced_parts.append(combined_cls)

    balanced = pd.concat(balanced_parts, ignore_index=True)

    # Shuffle
    balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

    print("\n" + "=" * 65)
    print("BALANCED DISTRIBUTION")
    print("=" * 65)
    total = len(balanced)
    for cls in range(5):
        cnt = int((balanced["risk_class"] == cls).sum())
        pct = cnt / total * 100
        bar = "#" * int(pct / 2)
        print(f"  Class {cls}: {cnt:>9,}  ({pct:5.1f}%)  {bar}")
    print(f"\n  Total: {total:,} rows")

    # Save
    out_path = CLEANED / "balanced_train.parquet"
    balanced.to_parquet(out_path, index=False)
    print(f"\nSaved: {out_path}")

    # Save balance report
    report = {
        "strategy": "Tier1-preserve + Tier2-undersample class0 + physics-jitter oversample classes 1-4",
        "target_per_class": TARGET_COUNTS,
        "actual_distribution": {
            int(cls): int((balanced["risk_class"] == cls).sum())
            for cls in range(5)
        },
        "total_rows": int(total),
        "jitter_sigma": JITTER_SIGMA,
        "note": "true_* ground truth columns are NOT jittered — labels are preserved exactly",
    }
    with open(CLEANED / "balance_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("Saved: balance_report.json")
    print("\nDONE.")
    return balanced


if __name__ == "__main__":
    balance_training_set()
