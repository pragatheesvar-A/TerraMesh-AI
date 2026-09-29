#!/usr/bin/env python3
"""
TerraMesh AI — Final Corpus Assembler
======================================
Merges ALL data sources into the final mega training corpus:

  Source                    Rows (approx)   Type
  ─────────────────────────────────────────────────────
  TIER1A  terramesh_dataset     255,969     Knothe sim (original)
  TIER1B  terramesh_scenarios 1,004,176     Knothe sim (11 scenarios)
  TIER1C  sweep_augmentation ~4,200,000     Knothe sweep (500 panels × 10 coalfields)
  TIER2   noamundi aux        6,418,729     Indian mine real displacement
  TIER3   seismic_bumps         123,000     Real Polish coal mine rockburst

  TOTAL                     ~12,000,000+   rows

Then:
  1. Re-balance using physics-aware jitter (updated targets)
  2. Panel-level split (70/15/15)
  3. Save final_train.parquet, final_val.parquet, final_test.parquet

Usage:
    python synth/assemble_corpus.py
"""

from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
import warnings; warnings.filterwarnings("ignore")

CLEANED   = Path(r"d:\COAL MINE\terramesh-platform\data\cleaned")
DATA_DIR  = Path(r"d:\COAL MINE\terramesh-platform\data")
OUT_DIR   = CLEANED / "final"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CANONICAL = [
    "node_id", "scenario_id", "timestamp_h",
    "node_x", "node_y", "depth_m", "seam_thk_m",
    "temp_c",
    "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad",
    "crack_mm", "strain_ustrain",
    "vib_rms_g", "vib_peak_g", "dom_freq_hz",
    "band_energy_0_10", "band_energy_10_50",
    "batt_v", "rssi_dbm",
    "blast_flag", "rain_flag", "vehicle_flag", "fault_type",
    "true_subsidence_mm", "true_tilt_mm_per_m", "true_strain_mm_per_m",
    "risk_class", "is_subsiding", "hours_to_critical",
    "data_source", "panel_id",
]

JITTER = {
    "tilt_x_deg": 0.03, "tilt_y_deg": 0.03, "tilt_mag_mrad": 0.05,
    "crack_mm": 0.50, "strain_ustrain": 3.0,
    "vib_rms_g": 0.002, "vib_peak_g": 0.005,
    "temp_c": 0.5, "batt_v": 0.01, "rssi_dbm": 2.0,
}

BOUNDS = {
    "tilt_x_deg": (-15, 15), "tilt_y_deg": (-15, 15),
    "tilt_mag_mrad": (0.0, 500.0),
    "crack_mm": (0, 500), "strain_ustrain": (-200, 200),
    "vib_rms_g": (0, 5), "vib_peak_g": (0, 10), "dom_freq_hz": (0, 50),
    "temp_c": (-20, 70), "batt_v": (2.8, 4.3),
    "rssi_dbm": (-130, 0),
}

# Target per class for balanced corpus
BALANCE_TARGETS = {0: 500_000, 1: 250_000, 2: 250_000, 3: 250_000, 4: 250_000}


def load_all_sources() -> pd.DataFrame:
    dfs = []

    # TIER 1A — original
    p = Path(r"d:\COAL MINE\datasets\files\terramesh_dataset.csv")
    if p.exists():
        d = pd.read_csv(p)
        d["data_source"] = "TIER1A_TERRAMESH"
        d["panel_id"] = d.get("scenario_id", "UNKNOWN")
        d = d.rename(columns={"t_hours": "timestamp_h", "range_m": "crack_mm"})
        dfs.append(d); print(f"  TIER1A: {len(d):,}")

    # TIER 1B — 11-scenario sim
    p = DATA_DIR / "terramesh_scenarios.parquet"
    if p.exists():
        d = pd.read_parquet(p)
        d["data_source"] = "TIER1B_SCENARIOS"
        d = d.rename(columns={"scenario": "scenario_id", "crack_gap_mm": "crack_mm"})
        if "timestamp" in d.columns:
            d["timestamp_h"] = (
                pd.to_datetime(d["timestamp"]) - pd.Timestamp("2026-01-01")
            ).dt.total_seconds() / 3600
        dfs.append(d); print(f"  TIER1B: {len(d):,}")

    # TIER 1C — parameter sweep
    p = DATA_DIR / "sweep_augmentation.parquet"
    if p.exists():
        d = pd.read_parquet(p)
        dfs.append(d); print(f"  TIER1C: {len(d):,}")
    else:
        print("  TIER1C: NOT FOUND — run sweep_augmentation.py first")

    # TIER 2 — Noamundi (existing cleaned)
    p = CLEANED / "noamundi_aux.parquet"
    if p.exists():
        d = pd.read_parquet(p)
        dfs.append(d); print(f"  TIER2 : {len(d):,}")

    # Deduplicate columns in every frame before concat (pandas 3 requirement)
    clean = []
    for i, df in enumerate(dfs):
        dupes = [c for c in df.columns if list(df.columns).count(c) > 1]
        if dupes:
            print(f"  [WARN] source[{i}] dupe cols: {set(dupes)} — deduping")
            df = df.loc[:, ~df.columns.duplicated()]
        clean.append(df)
    return pd.concat(clean, ignore_index=True, sort=False)


def align_to_canonical(df: pd.DataFrame) -> pd.DataFrame:
    """Add missing canonical columns as NaN, select only canonical set."""
    # Deduplicate columns first
    df = df.loc[:, ~df.columns.duplicated()]
    for col in CANONICAL:
        if col not in df.columns:
            df[col] = np.nan
    df = df[CANONICAL].copy()
    # Compute physically accurate tilt_mag_mrad (in mrad = deg * 1000 * pi / 180)
    has_tilt = df["tilt_x_deg"].notnull() & df["tilt_y_deg"].notnull()
    tx_mrad = df.loc[has_tilt, "tilt_x_deg"] * (np.pi / 180.0) * 1000.0
    ty_mrad = df.loc[has_tilt, "tilt_y_deg"] * (np.pi / 180.0) * 1000.0
    df.loc[has_tilt, "tilt_mag_mrad"] = np.sqrt(tx_mrad**2 + ty_mrad**2)
    df["tilt_mag_mrad"] = df["tilt_mag_mrad"].clip(lower=0.0, upper=500.0)

    df["fault_type"]  = df["fault_type"].fillna("none")
    df["risk_class"]  = df["risk_class"].fillna(0).clip(0, 4).astype(int)
    df["is_subsiding"]= df["is_subsiding"].fillna(0).astype(int)
    return df


def jitter_oversample(df: pd.DataFrame, n: int, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    if len(df) >= n:
        return df.sample(n, random_state=seed, replace=False)
    sampled = df.sample(n, random_state=seed, replace=True).copy()
    for col, sigma in JITTER.items():
        if col in sampled.columns:
            sampled[col] = sampled[col].to_numpy() + rng.normal(0, sigma, n)
    for col, (lo, hi) in BOUNDS.items():
        if col in sampled.columns:
            sampled[col] = sampled[col].clip(lower=lo, upper=hi)
    return sampled.reset_index(drop=True)


def balance_corpus(df: pd.DataFrame) -> pd.DataFrame:
    print("\n[BALANCE]")
    tier1_sources = {"TIER1A_TERRAMESH", "TIER1B_SCENARIOS", "TIER1C_SWEEP", "TIER3_SEISMICBUMPS"}
    tier1 = df[df["data_source"].isin(tier1_sources)]
    tier2 = df[~df["data_source"].isin(tier1_sources)]

    parts = []
    for cls in range(5):
        target = BALANCE_TARGETS[cls]
        t1_cls = tier1[tier1["risk_class"] == cls]
        t2_cls = tier2[tier2["risk_class"] == cls]
        avail  = len(t1_cls) + len(t2_cls)

        if cls == 0:
            # Keep all Tier1 class-0, undersample Tier2
            t2_need    = max(0, target - len(t1_cls))
            t2_sampled = t2_cls.sample(min(t2_need, len(t2_cls)),
                                        random_state=42, replace=False) if len(t2_cls) else pd.DataFrame()
            combined   = pd.concat([t1_cls, t2_sampled], ignore_index=True)
        else:
            # Prefer Tier1, jitter-oversample if needed
            src = t1_cls if len(t1_cls) > 0 else t2_cls
            combined = jitter_oversample(src, target, seed=42 + cls) if len(src) > 0 else pd.DataFrame()

        parts.append(combined)
        print(f"  Class {cls}: avail={avail:>7,} | target={target:>7,} | final={len(combined):>7,}")

    balanced = pd.concat(parts, ignore_index=True).sample(frac=1, random_state=42)
    return balanced.reset_index(drop=True)


def panel_split(df: pd.DataFrame) -> tuple:
    rng    = np.random.default_rng(42)
    scens  = sorted(df["scenario_id"].dropna().unique())
    rng.shuffle(scens)
    n      = len(scens)
    n_test = max(1, int(n * 0.15))
    n_val  = max(1, int(n * 0.15))
    test_sc= set(scens[:n_test])
    val_sc = set(scens[n_test:n_test + n_val])
    train_sc=set(scens[n_test + n_val:])
    return (df[df["scenario_id"].isin(train_sc)],
            df[df["scenario_id"].isin(val_sc)],
            df[df["scenario_id"].isin(test_sc)])


def run() -> None:
    print("=" * 65)
    print("TerraMesh AI -- Final Corpus Assembler")
    print("=" * 65)

    print("\n[LOAD] All sources ...")
    raw = load_all_sources()
    print(f"  Raw combined: {len(raw):,} rows")

    print("\n[ALIGN] Canonicalising columns ...")
    corpus = align_to_canonical(raw)
    core = ["tilt_x_deg", "tilt_y_deg", "vib_rms_g", "risk_class"]
    corpus = corpus.dropna(subset=core)
    print(f"  After null drop: {len(corpus):,} rows")

    # Dedup
    before = len(corpus)
    corpus = corpus.drop_duplicates(subset=["scenario_id", "node_id", "timestamp_h"])
    print(f"  After dedup: removed {before - len(corpus):,}")

    print("\n[BALANCE] Resampling to target distribution ...")
    balanced = balance_corpus(corpus)
    total    = len(balanced)
    print(f"\n  Balanced total: {total:,}")

    print("\n[SPLIT] Panel-level 70/15/15 ...")
    train, val, test = panel_split(balanced)
    print(f"  Train: {len(train):,} | Val: {len(val):,} | Test: {len(test):,}")

    # Leakage check
    assert not (set(train["scenario_id"]) & set(val["scenario_id"])), "LEAK train/val!"
    assert not (set(train["scenario_id"]) & set(test["scenario_id"])), "LEAK train/test!"
    print("  Leakage check: OK")

    print("\n[SAVE] Writing final corpus ...")
    train.to_parquet(OUT_DIR / "final_train.parquet", index=False)
    val.to_parquet(  OUT_DIR / "final_val.parquet",   index=False)
    test.to_parquet( OUT_DIR / "final_test.parquet",  index=False)

    summary = {
        "total_balanced": int(total),
        "train": int(len(train)), "val": int(len(val)), "test": int(len(test)),
        "class_dist": {int(k): int(v)
                       for k, v in balanced["risk_class"].value_counts().sort_index().items()},
        "sources": balanced["data_source"].value_counts().to_dict(),
        "leakage": "NONE",
    }
    with open(OUT_DIR / "final_corpus_summary.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)

    print("\n" + "=" * 65)
    print("FINAL CORPUS SUMMARY")
    print("=" * 65)
    for src, cnt in balanced["data_source"].value_counts().items():
        print(f"  {str(src):40s} {cnt:>9,}")
    print(f"\n  final_train.parquet : {len(train):,}")
    print(f"  final_val.parquet   : {len(val):,}")
    print(f"  final_test.parquet  : {len(test):,}")
    print(f"\n  Output: {OUT_DIR}")
    print("  DONE.")


if __name__ == "__main__":
    run()
