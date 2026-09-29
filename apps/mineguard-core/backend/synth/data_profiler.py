#!/usr/bin/env python3
"""
TerraMesh AI — Data Quality Profiler
=====================================
Run AFTER data_pipeline.py to generate a human-readable quality report
on the cleaned corpus. Prints a console table + saves profile.json.

Usage:
    python synth/data_profiler.py
"""

from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd

CLEANED = Path(r"d:\COAL MINE\terramesh-platform\data\cleaned")

RISK_LABELS = {0: "NORMAL", 1: "WATCH", 2: "WARNING", 3: "CRITICAL", 4: "EMERGENCY"}

SENSOR_COLS = [
    "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad",
    "crack_mm", "strain_ustrain",
    "vib_rms_g", "vib_peak_g", "dom_freq_hz",
    "temp_c", "batt_v", "rssi_dbm",
]


def load_split(split: str) -> pd.DataFrame:
    p = CLEANED / f"primary_{split}.parquet"
    if not p.exists():
        raise FileNotFoundError(f"Run data_pipeline.py first: {p}")
    return pd.read_parquet(p)


def print_banner(title: str) -> None:
    print(f"\n{'='*65}\n  {title}\n{'='*65}")


def profile_split(df: pd.DataFrame, name: str) -> dict:
    print_banner(f"Split: {name.upper()}  ({len(df):,} rows)")

    # --- Source breakdown ---
    print("\nData Sources:")
    for src, cnt in df["data_source"].value_counts().items():
        pct = cnt / len(df) * 100
        bar = "#" * int(pct / 2)
        print(f"  {src:40s} {cnt:>9,}  ({pct:5.1f}%)  {bar}")

    # --- Risk class distribution ---
    print("\nRisk Class Distribution:")
    for cls in range(5):
        cnt = int((df["risk_class"] == cls).sum())
        pct = cnt / len(df) * 100
        bar = "#" * int(pct / 2)
        label = RISK_LABELS[cls]
        print(f"  Class {cls} {label:12s}  {cnt:>9,}  ({pct:5.1f}%)  {bar}")

    # --- Sensor statistics ---
    print("\nSensor Statistics (non-null):")
    hdr = f"  {'Column':25s}  {'N':>9}  {'Mean':>10}  {'Std':>10}  {'Min':>10}  {'Max':>10}"
    print(hdr)
    print("  " + "-" * 78)
    stats_rows = {}
    for col in SENSOR_COLS:
        if col not in df.columns:
            continue
        s = df[col].dropna()
        if len(s) == 0:
            continue
        print(f"  {col:25s}  {len(s):>9,}  {s.mean():>10.4f}  {s.std():>10.4f}"
              f"  {s.min():>10.4f}  {s.max():>10.4f}")
        stats_rows[col] = {
            "n": int(len(s)), "mean": float(s.mean()), "std": float(s.std()),
            "min": float(s.min()), "max": float(s.max()),
            "null_pct": round(float(df[col].isnull().mean()) * 100, 2),
        }

    # --- Event flag rates ---
    print("\nEvent Flag Rates:")
    for flag in ["blast_flag", "rain_flag", "vehicle_flag", "is_subsiding"]:
        if flag in df.columns:
            rate = float(df[flag].fillna(0).mean()) * 100
            print(f"  {flag:20s}  {rate:.2f}%")

    # --- Fault type distribution ---
    if "fault_type" in df.columns:
        print("\nFault Type Distribution:")
        for ftype, cnt in df["fault_type"].value_counts().items():
            print(f"  {str(ftype):15s}  {cnt:>9,}")

    # --- Null summary ---
    null_cols = {c: round(float(df[c].isnull().mean()) * 100, 2)
                 for c in df.columns
                 if df[c].isnull().to_numpy().any()}
    if null_cols:
        print("\nNull Columns:")
        for col, pct in sorted(null_cols.items(), key=lambda x: -x[1]):
            print(f"  {col:30s}  {pct:5.1f}%")

    return {
        "split": name,
        "rows": int(len(df)),
        "sources": df["data_source"].value_counts().to_dict(),
        "risk_class_dist": {int(k): int(v)
                            for k, v in df["risk_class"].value_counts().sort_index().items()},
        "sensor_stats": stats_rows,
        "null_pct": null_cols,
    }


def check_leakage(train: pd.DataFrame, val: pd.DataFrame, test: pd.DataFrame) -> None:
    """Verify panel-level split integrity — no scenario_id leakage."""
    print_banner("Data Leakage Check")
    train_sc = set(train["scenario_id"].unique())
    val_sc   = set(val["scenario_id"].unique())
    test_sc  = set(test["scenario_id"].unique())

    tv_leak  = train_sc & val_sc
    tt_leak  = train_sc & test_sc
    vt_leak  = val_sc   & test_sc

    print(f"  Train scenarios:   {len(train_sc):,}")
    print(f"  Val scenarios:     {len(val_sc):,}")
    print(f"  Test scenarios:    {len(test_sc):,}")
    print(f"  Train/Val overlap: {len(tv_leak)} {'OK' if not tv_leak else 'LEAK! '+str(tv_leak)}")
    print(f"  Train/Test overlap:{len(tt_leak)} {'OK' if not tt_leak else 'LEAK! '+str(tt_leak)}")
    print(f"  Val/Test overlap:  {len(vt_leak)} {'OK' if not vt_leak else 'LEAK! '+str(vt_leak)}")


def check_class_imbalance(train: pd.DataFrame) -> None:
    """Report and flag severe class imbalance for training."""
    print_banner("Class Imbalance Report (Train)")
    counts = train["risk_class"].value_counts().sort_index()
    total  = len(train)
    majority = counts.max()
    print("  Recommendation: Apply class_weight='balanced' to XGBoost / SMOTE for minority classes\n")
    for cls, cnt in counts.items():
        ratio = majority / cnt
        flag  = " << SEVERE" if ratio > 10 else (" << MILD" if ratio > 3 else "")
        print(f"  Class {cls} ({RISK_LABELS[cls]:12s}): {cnt:>9,}  imbalance_ratio={ratio:6.1f}x{flag}")


def main() -> None:
    print_banner("TerraMesh AI — Data Quality Profiler")

    # Load splits
    print("Loading cleaned splits ...")
    train = load_split("train")
    val   = load_split("val")
    test  = load_split("test")

    # Optional: Noamundi aux
    aux_path = CLEANED / "noamundi_aux.parquet"
    noamundi = pd.read_parquet(aux_path) if aux_path.exists() else pd.DataFrame()

    # Profile each split
    profile = {}
    profile["train"] = profile_split(train, "train")
    profile["val"]   = profile_split(val,   "val")
    profile["test"]  = profile_split(test,  "test")
    if len(noamundi) > 0:
        profile["noamundi_aux"] = profile_split(noamundi, "noamundi_aux")

    # Integrity checks
    check_leakage(train, val, test)
    check_class_imbalance(train)

    # Overall corpus summary
    print_banner("Corpus Summary")
    total = len(train) + len(val) + len(test)
    print(f"  Total training corpus:   {total:,} rows")
    print(f"  Train / Val / Test:      {len(train):,} / {len(val):,} / {len(test):,}")
    if len(noamundi) > 0:
        print(f"  Noamundi aux (separate): {len(noamundi):,} rows")
    print(f"\n  Feature columns:         {len([c for c in train.columns if c not in ['scenario_id','node_id','timestamp_h','data_source','panel_id','risk_class','is_subsiding','hours_to_critical','true_subsidence_mm','true_tilt_mm_per_m','true_strain_mm_per_m']])}")

    # Save profile
    out_path = CLEANED / "data_profile.json"
    with open(out_path, "w") as f:
        json.dump(profile, f, indent=2, default=str)
    print(f"\n  Profile saved: {out_path}")
    print("  DONE.")


if __name__ == "__main__":
    main()
