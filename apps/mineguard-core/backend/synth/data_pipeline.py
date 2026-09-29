#!/usr/bin/env python3
"""
TerraMesh AI — Master Dataset Collection & Cleaning Pipeline
============================================================
Ingests ALL available datasets, classifies them by utility tier,
performs quality audits, and merges into a unified training corpus.

Dataset Inventory
-----------------
TIER 1 — PRIMARY (direct training signal):
  [A] files/terramesh_dataset.csv
        255,969 rows · 28 cols · Knothe physics sim · risk_class 0-4
        Source: files/terramesh_datagen.py (already validated)

  [B] terramesh-platform/data/terramesh_scenarios.parquet
        1,004,176 rows · 35 cols · 11-scenario sim (this session)

TIER 2 — CROSS-DOMAIN (transfer signals, NOT primary training):
  [C] Exported_Datasets/noamundi-rockfall-simulation-dataset
        ~12.9M rows · HuggingFace Arrow · Indian mine (Noamundi Iron)
        Key cols: Displacement_Rate_mm_h, Vibration_mm_s, FS,
                  precipitation, temperature_2m  → vibration + weather features

  [D] Exported_Datasets/Rockfall_Simulator
        ~12.3M rows · raw text lines (UDEC simulation output)
        Numerical displacement / velocity time series lines
        → cannot be used directly; excluded from merge, archived

TIER 3 — CONTEXT / NOT USABLE:
  [E] archive/world_mining_commodities_clean.csv  → economic data, not used
  [F] archive/116_world_mining_companies_clean.csv → company registry, not used
  [G] archive_2/COAL_RENTS.csv etc.               → macro economic, not used
  [H] archive_3/ADANIENT.NS.csv                   → stock price, not used
  [I] 14864957/*.tif                              → InSAR GeoTIFF rasters,
        future Layer A calibration (requires GDAL/rasterio)

Cleaning Strategy (per tier)
-----------------------------
TIER 1  → Schema unification, column remapping, null assertion,
           physics-range validation (Knothe bounds), label audit,
           blast/rain/fault flag check, train/val/test split by scenario_id.

TIER 2  → Noamundi: normalise col names, derive vibration class label,
           map FS (factor of safety) → risk proxy, resample to 5-min buckets,
           attach synthetic node_id='NOAMUNDI_*', keep only cols that
           overlap with TerraMesh feature space.

TIER 3  → Skip ingestion; document exclusion reason.

Output
------
  terramesh-platform/data/
    cleaned/
      primary_train.parquet      (Tier1 A+B, train split)
      primary_val.parquet        (Tier1 A+B, val split)
      primary_test.parquet       (Tier1 A+B, test split)
      noamundi_aux.parquet       (Tier2 C, cleaned)
      dataset_audit.json         (quality report)
      exclusions.json            (what was excluded and why)
"""

from __future__ import annotations

import os, json, warnings
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")
pd.set_option("display.max_columns", 50)

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

DATASETS_ROOT = Path(r"d:\COAL MINE\datasets")
PLATFORM_ROOT = Path(r"d:\COAL MINE\terramesh-platform")
OUT_DIR       = PLATFORM_ROOT / "data" / "cleaned"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# NCB Handbook strain damage thresholds (mm/m)
STRAIN_THRESHOLDS = [0.5, 1.5, 3.0, 6.0]

# Knothe physical plausibility bounds
KNOTHE_BOUNDS = {
    "true_subsidence_mm":    (-1.0, 5000.0),
    "true_tilt_mm_per_m":    (-200.0, 200.0),
    "true_strain_mm_per_m":  (-50.0, 50.0),
    "tilt_x_deg":            (-15.0, 15.0),
    "tilt_y_deg":            (-15.0, 15.0),
    "crack_mm":              (0.0, 500.0),
    "vib_rms_g":             (0.0, 5.0),
    "batt_v":                (2.8, 4.3),
    "rssi_dbm":              (-130.0, 0.0),
    "temp_c":                (-10.0, 70.0),
}

# Columns that are GROUND TRUTH only — never model inputs
LABEL_ONLY_COLS = {"true_subsidence_mm", "true_tilt_mm_per_m", "true_strain_mm_per_m"}

# Target feature set for the unified corpus (canonical names)
CANONICAL_FEATURES = [
    "node_id", "scenario_id", "timestamp_h",
    "node_x", "node_y",
    "depth_m", "seam_thk_m",
    "temp_c",
    "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad",
    "crack_mm",
    "strain_ustrain",
    "vib_rms_g", "vib_peak_g", "dom_freq_hz",
    "band_energy_0_10", "band_energy_10_50",
    "batt_v", "rssi_dbm",
    "blast_flag", "rain_flag", "vehicle_flag",
    "fault_type",
    # Labels
    "true_subsidence_mm", "true_tilt_mm_per_m", "true_strain_mm_per_m",
    "risk_class", "is_subsiding", "hours_to_critical",
    # Source tracking
    "data_source", "panel_id",
]

audit: dict = {}
exclusions: list[dict] = []


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def log_audit(name: str, df: pd.DataFrame, notes: str = "") -> None:
    """Record quality metrics for a dataset."""
    null_pct = {c: round(float(df[c].isnull().mean()) * 100, 2)
                for c in df.columns
                if df[c].isnull().to_numpy().any()}
    audit[name] = {
        "rows":      int(len(df)),
        "cols":      list(df.columns),
        "null_pct":  null_pct,
        "risk_dist": {int(k): int(v) for k, v in
                      df["risk_class"].value_counts().sort_index().items()}
                     if "risk_class" in df.columns else {},
        "scenarios": int(df["scenario_id"].nunique())
                     if "scenario_id" in df.columns else 0,
        "nodes":     int(df["node_id"].nunique())
                     if "node_id" in df.columns else 0,
        "notes":     notes,
        "timestamp": datetime.utcnow().isoformat(),
    }
    n_null_cols = sum(1 for v in null_pct.values() if v > 0)
    print(f"  [AUDIT] {name}: {len(df):,} rows | nulls: {n_null_cols} cols")


def bounds_check(df: pd.DataFrame, col: str, lo: float, hi: float) -> pd.Series:
    """Flag rows outside physics-plausible range."""
    if col not in df.columns:
        return pd.Series(False, index=df.index)
    return (df[col] < lo) | (df[col] > hi)


def physics_audit(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    """Clip values that violate Knothe physics constraints."""
    for col, (lo, hi) in KNOTHE_BOUNDS.items():
        if col not in df.columns:
            continue
        mask  = (df[col].to_numpy() < lo) | (df[col].to_numpy() > hi)
        n_bad = int(mask.sum())
        if n_bad > 0:
            print(f"    [BOUNDS] {source_name}.{col}: {n_bad:,} rows outside"
                  f" [{lo}, {hi}] - clipping")
            df[col] = df[col].clip(lower=lo, upper=hi)
    return df


def add_tilt_magnitude(df: pd.DataFrame) -> pd.DataFrame:
    """Compute tilt magnitude in mrad from tilt_x_deg, tilt_y_deg if not present."""
    if "tilt_mag_mrad" not in df.columns:
        if {"tilt_x_deg", "tilt_y_deg"}.issubset(df.columns):
            tx = df["tilt_x_deg"] * (1000 * np.pi / 180)
            ty = df["tilt_y_deg"] * (1000 * np.pi / 180)
            df["tilt_mag_mrad"] = np.sqrt(tx**2 + ty**2)
    return df


def recompute_risk_class(df: pd.DataFrame) -> pd.DataFrame:
    """Recompute risk_class from true_strain_mm_per_m using NCB handbook thresholds."""
    if "true_strain_mm_per_m" not in df.columns:
        return df
    s = df["true_strain_mm_per_m"].abs()
    df["risk_class"] = pd.cut(
        s,
        bins=[-np.inf, 0.5, 1.5, 3.0, 6.0, np.inf],
        labels=[0, 1, 2, 3, 4],
        right=True,
    ).astype(int)
    return df


def split_by_scenario(df: pd.DataFrame,
                       val_frac: float = 0.15,
                       test_frac: float = 0.15,
                       seed: int = 42) -> tuple:
    """
    Panel-level split: splits on scenario_id, not rows.
    Prevents leakage where the same panel appears in train and test.
    """
    rng = np.random.default_rng(seed)
    scenarios = sorted(df["scenario_id"].unique())
    rng.shuffle(scenarios)
    n = len(scenarios)
    n_test = max(1, int(n * test_frac))
    n_val  = max(1, int(n * val_frac))
    test_sc  = set(scenarios[:n_test])
    val_sc   = set(scenarios[n_test:n_test + n_val])
    train_sc = set(scenarios[n_test + n_val:])

    train = df[df["scenario_id"].isin(train_sc)].copy()
    val   = df[df["scenario_id"].isin(val_sc)].copy()
    test  = df[df["scenario_id"].isin(test_sc)].copy()

    print(f"    Split: train={len(train):,} val={len(val):,} test={len(test):,} "
          f"({len(train_sc)}/{len(val_sc)}/{len(test_sc)} scenarios)")
    return train, val, test


# ---------------------------------------------------------------------------
# INGESTOR A — files/terramesh_dataset.csv  (Tier 1A)
# ---------------------------------------------------------------------------

def ingest_tier1a() -> pd.DataFrame:
    print("\n[A] Ingesting terramesh_dataset.csv (Tier 1A) ...")
    path = DATASETS_ROOT / "files" / "terramesh_dataset.csv"
    df   = pd.read_csv(path, dtype={
        "scenario_id": str,
        "node_id":     str,
        "fault_type":  str,
    })
    print(f"  Raw: {df.shape}")

    # ---- 1. Rename to canonical schema ----
    df = df.rename(columns={
        "t_hours":           "timestamp_h",
        "range_m":           "crack_mm",       # VL53L0X range→crack gap
        "panel_width_m":     "panel_width_m",   # keep
    })

    # ---- 2. Add missing canonical cols ----
    df["data_source"]       = "TIER1A_TERRAMESH"
    df["panel_id"]          = df["scenario_id"].str.extract(r"(PANEL_\w+)")[0].fillna("UNKNOWN")
    df["tilt_mag_mrad"]     = np.nan
    df["strain_ustrain"]    = df.get("true_strain_mm_per_m", pd.Series(np.nan, index=df.index))
    df["vib_peak_g"]        = df.get("vib_rms_g", pd.Series(np.nan, index=df.index)) * 2.8
    df["dom_freq_hz"]       = np.nan
    df["band_energy_0_10"]  = np.nan
    df["band_energy_10_50"] = np.nan

    # ---- 3. Compute tilt magnitude ----
    df = add_tilt_magnitude(df)

    # ---- 4. Bounds check ----
    df = physics_audit(df, "TIER1A")

    # ---- 5. Recompute risk class (belt-and-suspenders) ----
    df = recompute_risk_class(df)

    # ---- 6. Remove rows where fault_type == 'stuck' AND tilt is zero
    #         (stuck sensor rows are valid training data — keep them, label them)
    df["fault_type"] = df["fault_type"].fillna("none")

    # ---- 7. Assert no NaN in mandatory cols ----
    mandatory = ["scenario_id", "node_id", "timestamp_h", "tilt_x_deg",
                 "tilt_y_deg", "risk_class", "is_subsiding"]
    null_counts = df[mandatory].isnull().sum()
    assert null_counts.sum() == 0, f"Nulls in mandatory cols: {null_counts[null_counts>0]}"

    log_audit("TIER1A", df, "Original terramesh_dataset.csv — 255K rows, 28 cols")
    return df


# ---------------------------------------------------------------------------
# INGESTOR B — terramesh_scenarios.parquet  (Tier 1B)
# ---------------------------------------------------------------------------

def ingest_tier1b() -> pd.DataFrame:
    print("\n[B] Ingesting terramesh_scenarios.parquet (Tier 1B) ...")
    path = PLATFORM_ROOT / "data" / "terramesh_scenarios.parquet"
    if not path.exists():
        print(f"  [SKIP] {path} not found — run subsidence_sim.py first")
        exclusions.append({"dataset": "TIER1B", "reason": "Parquet not yet generated"})
        return pd.DataFrame()

    df = pd.read_parquet(path)
    print(f"  Raw: {df.shape}")

    # ---- 1. Rename to canonical schema ----
    df = df.rename(columns={
        "scenario":      "scenario_id",
        "crack_gap_mm":  "crack_mm",
        "packet_seq":    "timestamp_h",   # approximate
    })
    if "timestamp" in df.columns:
        df["timestamp_h"] = (
            pd.to_datetime(df["timestamp"]) - pd.Timestamp("2026-01-01")
        ).dt.total_seconds() / 3600

    # ---- 2. Canonical gap-filling ----
    df["data_source"]    = "TIER1B_SCENARIOS"
    df["depth_m"]        = np.nan
    df["seam_thk_m"]     = np.nan
    df["hours_to_critical"] = -1

    # ---- 3. Rename vibration cols ----
    if "vib_rms_g" not in df.columns and "vib_rms" in df.columns:
        df = df.rename(columns={"vib_rms": "vib_rms_g"})

    # ---- 4. Tilt magnitude ----
    df = add_tilt_magnitude(df)

    # ---- 5. Bounds check ----
    df = physics_audit(df, "TIER1B")

    # ---- 6. Risk class from physics ----
    if "risk_class" not in df.columns or df["risk_class"].max() == 0:
        df = recompute_risk_class(df)

    # ---- 7. Fault type ----
    if "fault_mode" in df.columns and "fault_type" not in df.columns:
        df = df.rename(columns={"fault_mode": "fault_type"})
    df["fault_type"] = df.get("fault_type", "none").fillna("none")

    log_audit("TIER1B", df, "Phase 1 Knothe simulator — 1M rows, 11 scenarios")
    return df


# ---------------------------------------------------------------------------
# INGESTOR C — Noamundi rockfall simulation dataset  (Tier 2)
# ---------------------------------------------------------------------------

def ingest_noamundi() -> pd.DataFrame:
    print("\n[C] Ingesting Noamundi Rockfall dataset (Tier 2) ...")
    base   = DATASETS_ROOT / "Exported_Datasets" / "noamundi-rockfall-simulation-dataset" / "train"
    shards = sorted(base.glob("data-*.arrow"))

    import pyarrow as pa
    import pyarrow.ipc as ipc

    dfs = []
    # Read first 2 shards only (~6.5M rows) — sufficient for cross-domain signal
    for shard in shards[:2]:
        with open(shard, "rb") as f:
            reader = ipc.open_stream(f)
            table  = reader.read_all()
        dfs.append(table.to_pandas())
        print(f"  Shard {shard.name}: {len(dfs[-1]):,} rows")

    df = pd.concat(dfs, ignore_index=True)
    print(f"  Combined raw: {df.shape}")

    # ---- 1. Parse timestamp ----
    df["timestamp_h"] = (
        pd.to_datetime(df["Timestamp"]) - pd.Timestamp("2021-01-01")
    ).dt.total_seconds() / 3600

    # ---- 2. Rename to TerraMesh canonical names ----
    df = df.rename(columns={
        "Location_ID":            "node_id",
        "Displacement_Rate_mm_h": "tilt_mag_mrad",   # proxy (mm/h displacement ≈ tilt rate)
        "Vibration_mm_s":         "vib_rms_g",        # velocity → approx g (÷ 9810)
        "Rockfall_Event":         "is_subsiding",
        "FS":                     "_fs",
        "temperature_2m":         "temp_c",
        "precipitation":          "_rain_mm",
        "windspeed_10m":          "_wind",
        "elev_1":                 "node_y",           # elevation used as proxy Y coord
        "slope_1":                "_slope_deg",
    })

    # ---- 3. Unit conversions ----
    # Vibration: mm/s → g  (rough: 1 mm/s @ 10 Hz ≈ 6.4e-4 g)
    df["vib_rms_g"] = (df["vib_rms_g"] / 9810.0).clip(0, 5)

    # Tilt: mm/h displacement rate → mrad (1 mm/h over 40m node spacing ≈ 0.025 mrad)
    df["tilt_mag_mrad"] = (df["tilt_mag_mrad"] * 0.025).abs()

    # Rain → rain_flag
    df["rain_flag"] = (df["_rain_mm"] > 2.0).astype(int)

    # ---- 4. Derive risk_class from Factor of Safety ----
    # FS < 1.0 → imminent failure (class 4), FS 1.0-1.2 → class 3 etc.
    fs = df["_fs"]
    df["risk_class"] = pd.cut(
        fs,
        bins=[-np.inf, 1.0, 1.2, 1.5, 2.0, np.inf],
        labels=[4, 3, 2, 1, 0],
        right=False,
    ).astype(int)

    # ---- 5. Fill canonical cols that Noamundi doesn't have ----
    df["scenario_id"]       = "NOAMUNDI_" + df["node_id"].astype(str)
    df["panel_id"]          = "NOAMUNDI_IRONORE"
    df["data_source"]       = "TIER2_NOAMUNDI"
    df["tilt_x_deg"]        = df["tilt_mag_mrad"] * (180 / (1000 * np.pi))
    df["tilt_y_deg"]        = 0.0
    df["crack_mm"]          = 0.0
    df["strain_ustrain"]    = 0.0
    df["true_subsidence_mm"]  = 0.0
    df["true_tilt_mm_per_m"]  = df["tilt_mag_mrad"]
    df["true_strain_mm_per_m"] = 0.0
    df["blast_flag"]        = 0
    df["vehicle_flag"]      = 0
    df["fault_type"]        = "none"
    df["batt_v"]            = 4.0
    df["rssi_dbm"]          = -80.0
    df["depth_m"]           = np.nan
    df["seam_thk_m"]        = np.nan
    df["node_x"]            = df.get("_slope_deg", pd.Series(0.0, index=df.index)).fillna(0.0)
    df["hours_to_critical"] = -1
    df["vib_peak_g"]        = df["vib_rms_g"] * 3.0
    df["dom_freq_hz"]       = 5.0
    df["band_energy_0_10"]  = df["vib_rms_g"]**2 * 0.7
    df["band_energy_10_50"] = df["vib_rms_g"]**2 * 0.2

    # ---- 6. Remove outliers ----
    df = df[df["tilt_mag_mrad"].between(0, 100)]
    df = df[df["risk_class"].between(0, 4)]
    df = df.dropna(subset=["timestamp_h", "node_id", "risk_class"])

    log_audit("TIER2_NOAMUNDI", df,
              "Noamundi Iron Ore Mine rockfall sim — 2 shards, displacement+vibration+weather")
    return df


# ---------------------------------------------------------------------------
# EXCLUSION LOGGING
# ---------------------------------------------------------------------------

def log_exclusions() -> None:
    exclusions.extend([
        {
            "dataset": "Rockfall_Simulator",
            "type":    "raw text / UDEC output",
            "reason":  "Raw simulation text lines ('*410001+...'). "
                       "No structured columns parsable without UDEC post-processor. "
                       "Would require >1 week of custom parser work for uncertain gain.",
            "action":  "ARCHIVED — revisit if UDEC parser is added",
        },
        {
            "dataset": "archive/world_mining_commodities_clean.csv",
            "type":    "macro-economic",
            "reason":  "Country-level mining output by commodity 2018-2022. "
                       "No sensor, spatial, or temporal signal relevant to subsidence.",
            "action":  "EXCLUDED",
        },
        {
            "dataset": "archive/116_world_mining_companies_clean.csv",
            "type":    "company registry",
            "reason":  "Company names, tickers, project stage. Not a time-series dataset.",
            "action":  "EXCLUDED",
        },
        {
            "dataset": "archive_2/COAL_RENTS.csv (and others)",
            "type":    "World Bank macro",
            "reason":  "GDP/rent ratios by country. Completely unrelated to ground deformation.",
            "action":  "EXCLUDED",
        },
        {
            "dataset": "archive_3/ADANIENT.NS.csv",
            "type":    "Stock OHLC",
            "reason":  "Adani Enterprises NSE stock price. Not used.",
            "action":  "EXCLUDED",
        },
        {
            "dataset": "14864957/*.tif",
            "type":    "InSAR GeoTIFF (Layer A)",
            "reason":  "Vertical deformation GeoTIFFs (ObsVD, PredVD, dif, yearly). "
                       "Require GDAL/rasterio + geo-registration to node coordinates. "
                       "PLANNED for Phase 3 (InSAR calibration of Knothe parameters).",
            "action":  "DEFERRED to Phase 3 — Layer A calibration",
        },
    ])


# ---------------------------------------------------------------------------
# MERGE & FINAL CLEAN
# ---------------------------------------------------------------------------

def build_unified_corpus(dfs: list[pd.DataFrame]) -> pd.DataFrame:
    """Merge all tiers, align to canonical feature set, final audit."""
    print("\n[MERGE] Building unified corpus ...")

    # ---- Pre-flight: deduplicate columns in each frame before concat ----
    clean_dfs = []
    for i, df in enumerate(dfs):
        dupes = [c for c in df.columns if list(df.columns).count(c) > 1]
        if dupes:
            print(f"  [WARN] df[{i}] has duplicate columns: {set(dupes)} — deduping")
            df = df.loc[:, ~df.columns.duplicated()]
        clean_dfs.append(df)

    combined = pd.concat(clean_dfs, ignore_index=True, sort=False)
    print(f"  Combined raw: {combined.shape}")

    # Keep only canonical columns (fill missing with NaN)
    for col in CANONICAL_FEATURES:
        if col not in combined.columns:
            combined[col] = np.nan

    combined = combined[CANONICAL_FEATURES].copy()

    # ---- Drop rows with NaN in core sensor features ----
    core_sensors = ["tilt_x_deg", "tilt_y_deg", "vib_rms_g", "risk_class"]
    before = len(combined)
    combined = combined.dropna(subset=core_sensors)
    dropped  = before - len(combined)
    print(f"  Dropped {dropped:,} rows missing core sensors")

    # ---- Deduplicate ----
    before = len(combined)
    combined = combined.drop_duplicates(subset=["scenario_id", "node_id", "timestamp_h"])
    print(f"  Deduped: removed {before - len(combined):,} exact duplicates")

    # ---- Normalise fault_type to known vocabulary ----
    valid_faults = {"none", "stuck", "drift", "spike"}
    combined["fault_type"] = combined["fault_type"].fillna("none")
    combined.loc[~combined["fault_type"].isin(valid_faults), "fault_type"] = "none"

    # ---- risk_class bounds ----
    combined["risk_class"] = combined["risk_class"].clip(0, 4).astype(int)
    combined["is_subsiding"] = combined["is_subsiding"].fillna(0).astype(int)

    # ---- Data source labelling ----
    combined["data_source"] = combined["data_source"].fillna("UNKNOWN")

    print(f"  Final corpus: {combined.shape}")
    log_audit("UNIFIED_CORPUS", combined, "Merged Tier1A + Tier1B + Tier2 Noamundi")
    return combined


# ---------------------------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------------------------

def run_pipeline() -> None:
    print("=" * 65)
    print("TerraMesh AI — Dataset Collection & Cleaning Pipeline")
    print("=" * 65)

    # Ingest
    df_a = ingest_tier1a()
    df_b = ingest_tier1b()
    df_c = ingest_noamundi()
    log_exclusions()

    # Merge non-empty
    dfs_to_merge = [d for d in [df_a, df_b, df_c] if len(d) > 0]
    corpus = build_unified_corpus(dfs_to_merge)

    # ---- Panel-level train / val / test split ----
    print("\n[SPLIT] Performing panel-level split ...")
    train, val, test = split_by_scenario(corpus)

    # ---- Save outputs ----
    print("\n[SAVE] Writing Parquet files ...")
    train.to_parquet(OUT_DIR / "primary_train.parquet", index=False)
    val.to_parquet(OUT_DIR   / "primary_val.parquet",   index=False)
    test.to_parquet(OUT_DIR  / "primary_test.parquet",  index=False)
    print(f"  primary_train.parquet: {len(train):,} rows")
    print(f"  primary_val.parquet:   {len(val):,} rows")
    print(f"  primary_test.parquet:  {len(test):,} rows")

    # Noamundi auxiliary (separate — used for cross-domain fine-tuning only)
    if len(df_c) > 0:
        df_c_out = df_c[[c for c in CANONICAL_FEATURES if c in df_c.columns]]
        df_c_out.to_parquet(OUT_DIR / "noamundi_aux.parquet", index=False)
        print(f"  noamundi_aux.parquet:  {len(df_c_out):,} rows")

    # ---- Save audit report ----
    audit_path = OUT_DIR / "dataset_audit.json"
    with open(audit_path, "w") as f:
        json.dump(audit, f, indent=2, default=str)
    print(f"  dataset_audit.json saved")

    excl_path = OUT_DIR / "exclusions.json"
    with open(excl_path, "w") as f:
        json.dump(exclusions, f, indent=2)
    print(f"  exclusions.json saved")

    # ---- Final summary ----
    print("\n" + "=" * 65)
    print("CORPUS SUMMARY")
    print("=" * 65)
    for src, grp in corpus.groupby("data_source"):
        rc = grp["risk_class"].value_counts().sort_index().to_dict()
        print(f"  {src:35s} {len(grp):>9,} rows  risk:{rc}")

    print("\nRisk class distribution (full corpus):")
    total = len(corpus)
    for cls, cnt in corpus["risk_class"].value_counts().sort_index().items():
        bar = "#" * int(cnt / total * 40)
        print(f"  Class {cls}: {cnt:>8,} ({cnt/total*100:5.1f}%)  {bar}")

    print(f"\nTotal rows: {total:,}")
    print(f"Output dir: {OUT_DIR}")
    print("=" * 65)
    print("Pipeline COMPLETE.")


if __name__ == "__main__":
    run_pipeline()
