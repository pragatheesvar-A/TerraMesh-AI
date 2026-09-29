#!/usr/bin/env python3
"""
TerraMesh AI — Massive Knothe Parameter Sweep Augmentation
============================================================
Generates a LARGE-SCALE synthetic dataset by exhaustively sweeping
Knothe influence function parameters across the full Indian coalfield
range. This creates geological diversity that single-panel simulation
cannot achieve.

Parameter Space (Indian coalfields — CMPDI/NCB validated ranges):
  H (seam depth)    : 50-350m   in 7 steps
  m (seam thickness): 1.0-6.0m  in 6 steps
  a (subsidence fac): 0.55-0.90 in 6 steps
  beta (angle draw) : 23°-38°   in 6 steps
  c (time factor)   : 0.3-2.5/month in 5 steps
  face advance      : 1.0-6.0 m/day in 4 steps
  node spacing      : 25/40/50/60m
  panel width       : 80-200m

Total unique parameter combinations: 7×6×6×6×5×4 = 30,240 panels
We sample 500 representative panels (covering all extremes + random interior)
and simulate each for 48h at 10-min resolution.

This yields approximately:
  500 panels × ~30 nodes × 288 time steps × 98% uplink = ~4.2M rows

Scenarios per panel (randomly sampled):
  - Pure subsidence progression (most common)
  - Subsidence + one sensor fault
  - Monsoon seasonal (high temp swing)
  - Blasting interference windows

All rows labelled with NCB damage class + hours_to_critical.

Usage:
    python synth/sweep_augmentation.py --n_panels 500 --seed 42
"""

from __future__ import annotations
import argparse
import math
import sys
from itertools import product
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from scipy.special import erf

# Add parent dir for imports
sys.path.insert(0, str(Path(__file__).parent))
from subsidence_sim import (
    compute_smax, compute_r, tilt_and_strain,
    knothe_time_factor, generate_node_grid,
    add_mpu6050_noise, add_vl53l0x_noise,
    add_hx711_noise, simulate_vibration,
    simulate_packet_loss, SQPI
)

OUT_DIR = Path(r"d:\COAL MINE\terramesh-platform\data")
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Parameter space definition (Indian coalfield validated ranges)
# ---------------------------------------------------------------------------

PARAM_GRID = {
    "H":          np.linspace(50,  350, 7).tolist(),      # seam depth (m)
    "m":          np.linspace(1.0, 6.0, 6).tolist(),      # seam thickness (m)
    "a":          np.linspace(0.55, 0.90, 6).tolist(),    # subsidence factor
    "beta_deg":   np.linspace(23,  38,   6).tolist(),     # angle of draw (°)
    "c_per_month":np.linspace(0.3, 2.5,  5).tolist(),     # Knothe time factor
    "advance_mpd":np.linspace(1.0, 6.0,  4).tolist(),     # face advance (m/day)
    "panel_width":np.linspace(80,  200,  5).tolist(),     # panel half-width (m)
    "node_spacing":np.array([25, 40, 50, 60]).tolist(),    # node grid spacing (m)
}

# Coalfield identifiers for diversity
COALFIELD_TAGS = [
    "JHARIA", "RANIGANJ", "KORBA", "SINGRAULI", "BOKARO",
    "DHANBAD", "TALCHER", "WARDHA", "SOHAGPUR", "IB_VALLEY"
]

FAULT_MODES = ["none", "none", "none", "stuck", "drift"]    # weighted toward none
SEASONAL    = ["summer", "summer", "monsoon", "winter"]


def sample_panels(n: int, seed: int = 42) -> list[dict]:
    """Sample `n` representative panels from the parameter space."""
    rng = np.random.default_rng(seed)
    panels = []

    # Always include extreme corners first (boundary coverage)
    extremes = [
        {"H": 50,  "m": 1.0, "a": 0.55, "beta_deg": 23, "c_per_month": 0.3,
         "advance_mpd": 1.0, "panel_width": 80,  "node_spacing": 25},
        {"H": 350, "m": 6.0, "a": 0.90, "beta_deg": 38, "c_per_month": 2.5,
         "advance_mpd": 6.0, "panel_width": 200, "node_spacing": 60},
        {"H": 150, "m": 3.0, "a": 0.75, "beta_deg": 30, "c_per_month": 1.2,
         "advance_mpd": 3.0, "panel_width": 130, "node_spacing": 40},
        {"H": 200, "m": 4.5, "a": 0.85, "beta_deg": 28, "c_per_month": 0.8,
         "advance_mpd": 2.0, "panel_width": 160, "node_spacing": 50},
        {"H": 80,  "m": 2.0, "a": 0.65, "beta_deg": 33, "c_per_month": 1.8,
         "advance_mpd": 5.0, "panel_width": 100, "node_spacing": 30},
    ]
    panels.extend(extremes)

    # Random interior samples
    for _ in range(n - len(extremes)):
        panel = {
            "H":            float(rng.choice(PARAM_GRID["H"])),
            "m":            float(rng.choice(PARAM_GRID["m"])),
            "a":            float(rng.choice(PARAM_GRID["a"])),
            "beta_deg":     float(rng.choice(PARAM_GRID["beta_deg"])),
            "c_per_month":  float(rng.choice(PARAM_GRID["c_per_month"])),
            "advance_mpd":  float(rng.choice(PARAM_GRID["advance_mpd"])),
            "panel_width":  float(rng.choice(PARAM_GRID["panel_width"])),
            "node_spacing": float(rng.choice(PARAM_GRID["node_spacing"])),
        }
        panels.append(panel)

    return panels


def generate_panel_sweep(
    panel_idx: int,
    cfg: dict,
    duration_hours: int = 48,
    dt_minutes: int = 10,
    fault_node: str | None = None,
    fault_mode: str = "none",
    seasonal: str = "summer",
    seed: int = 0,
) -> list[dict]:
    """Generate time-series rows for one panel configuration."""
    rng = np.random.default_rng(seed)

    H            = cfg["H"]
    m            = cfg["m"]
    a            = cfg["a"]
    beta_deg     = cfg["beta_deg"]
    c_per_month  = cfg["c_per_month"]
    advance_mpd  = cfg["advance_mpd"]
    panel_width  = cfg["panel_width"]
    node_spacing = cfg["node_spacing"]
    coalfield    = COALFIELD_TAGS[panel_idx % len(COALFIELD_TAGS)]

    r    = compute_r(H, beta_deg)
    smax = compute_smax(m, a)
    panel_geom = {"y1": -panel_width, "y2": panel_width,
                  "x2": advance_mpd * duration_hours / 24 * 1.5}

    nodes  = generate_node_grid(panel_geom, node_spacing)
    nx_arr = np.array([n["x"] for n in nodes])
    ny_arr = np.array([n["y"] for n in nodes])

    # Seasonal temperature profile
    if seasonal == "monsoon":
        T_base, T_amp = 30.0, 5.0      # Narrower swing in monsoon
    elif seasonal == "winter":
        T_base, T_amp = 15.0, 8.0
    else:                               # summer
        T_base, T_amp = 32.0, 10.0

    rows  = []
    t0    = datetime(2026, 1, 1, 0, 0, 0)
    steps = duration_hours * 60 // dt_minutes

    for step in range(steps):
        t_hours = step * dt_minutes / 60.0
        t_now   = t0 + timedelta(hours=t_hours)
        temp_c  = T_base + T_amp * math.sin(2 * math.pi * t_hours / 24.0)

        face_x      = min(advance_mpd * t_hours / 24.0, panel_geom["x2"])
        time_factor = knothe_time_factor(t_hours, c_per_month)
        eff_smax    = smax * time_factor

        tx, ty, tmag, strain, sub_mm = tilt_and_strain(
            nx_arr, ny_arr, face_x, panel_geom, r, eff_smax
        )

        for i, node in enumerate(nodes):
            node_id     = f"P{panel_idx:04d}_{node['node_id']}"
            is_subsiding = bool(sub_mm[i] > 2.0)
            blast_flag  = bool(rng.random() < 0.02 and 8 <= (t_hours % 24) < 11)
            rain_flag   = bool(seasonal == "monsoon" and 14 <= (t_hours % 24) < 18)
            vehicle_flag= bool(rng.random() < 0.04)

            node_fault  = fault_mode if (node_id.endswith(fault_node or "XXXXX")) else "none"

            crack_true  = max(0, 5.0 + float(strain[i]) * 0.8)
            crack_obs   = add_vl53l0x_noise(crack_true)

            tilt_x_true = float(tx[i]) / (1000 * (180 / math.pi) / math.pi)
            tilt_y_true = float(ty[i]) / (1000 * (180 / math.pi) / math.pi)
            tilt_x_obs  = add_mpu6050_noise(tilt_x_true, temp_c, t_hours, node_fault)
            tilt_y_obs  = add_mpu6050_noise(tilt_y_true, temp_c, t_hours, "none")
            tilt_mag    = math.sqrt(
                (tilt_x_obs * 1000 * math.pi / 180)**2 +
                (tilt_y_obs * 1000 * math.pi / 180)**2
            )

            strain_obs  = add_hx711_noise(float(strain[i]), t_hours, node_fault)
            vib         = simulate_vibration(is_subsiding, blast_flag, rain_flag, vehicle_flag)

            batt_v      = max(3.3, 4.2 - 0.0003 * t_hours + rng.normal(0, 0.01))
            dist_gw     = math.sqrt(node["x"]**2 + node["y"]**2)
            rssi        = -60 - 20 * math.log10(max(dist_gw, 1) / 10) + rng.normal(0, 4)
            snr         = 10 - abs(rng.normal(0, 3))

            if simulate_packet_loss(0.025):
                continue

            # NCB risk class from true strain
            t_strain = abs(float(strain[i]))
            risk = 0 if t_strain < 0.5 else \
                   1 if t_strain < 1.5 else \
                   2 if t_strain < 3.0 else \
                   3 if t_strain < 6.0 else 4

            # Hours to critical (class 3+ threshold = 3mm/m strain)
            # Approximate from current strain rate
            strain_rate = t_strain / max(t_hours, 0.01)  # per hour
            if strain_rate > 0 and t_strain < 3.0:
                hrs_to_crit = int((3.0 - t_strain) / strain_rate)
            else:
                hrs_to_crit = 999

            rows.append({
                "scenario_id":   f"SWEEP_{coalfield}_P{panel_idx:04d}",
                "panel_id":      f"SWEEP_P{panel_idx:04d}",
                "node_id":       node_id,
                "timestamp_h":   round(t_hours, 3),
                "node_x":        round(node["x"], 2),
                "node_y":        round(node["y"], 2),
                "depth_m":       round(H, 1),
                "seam_thk_m":    round(m, 2),
                # Sensor readings
                "tilt_x_deg":    round(tilt_x_obs, 4),
                "tilt_y_deg":    round(tilt_y_obs, 4),
                "tilt_mag_mrad": round(tilt_mag, 3),
                "crack_mm":      round(crack_obs, 3),
                "strain_ustrain":round(strain_obs, 3),
                "vib_rms_g":     round(vib["vib_rms_g"], 5),
                "vib_peak_g":    round(vib["vib_peak_g"], 5),
                "dom_freq_hz":   round(vib["dom_freq_hz"], 2),
                "band_energy_0_10":  round(vib["band_energy_0_10"], 6),
                "band_energy_10_50": round(vib["band_energy_10_50"], 6),
                "temp_c":        round(temp_c, 2),
                "batt_v":        round(batt_v, 3),
                "rssi_dbm":      round(rssi, 1),
                # Flags
                "blast_flag":    int(blast_flag),
                "rain_flag":     int(rain_flag),
                "vehicle_flag":  int(vehicle_flag),
                "fault_type":    node_fault,
                # Ground truth (labels only)
                "true_subsidence_mm":   round(float(sub_mm[i]), 3),
                "true_tilt_mm_per_m":   round(float(tmag[i]), 3),
                "true_strain_mm_per_m": round(float(strain[i]), 3),
                "risk_class":           risk,
                "is_subsiding":         int(is_subsiding),
                "hours_to_critical":    min(hrs_to_crit, 999),
                # Physics params (for audit/calibration, NOT model features)
                "knothe_H":      H,
                "knothe_m":      m,
                "knothe_a":      a,
                "knothe_beta":   beta_deg,
                "coalfield":     coalfield,
                "seasonal":      seasonal,
                "data_source":   "TIER1C_SWEEP",
            })

    return rows


def ingest_seismic_bumps() -> pd.DataFrame:
    """
    Ingest UCI Seismic Bumps (real Polish coal mine rockburst data).
    Map seismic energy features to vibration proxy columns.
    2,584 shift-level records → expand to time-series via interpolation.
    """
    print("[D] Ingesting UCI Seismic Bumps (real coal mine data) ...")
    path = Path(r"d:\COAL MINE\datasets\seismic_bumps.csv")
    df   = pd.read_csv(path)
    print(f"  Raw: {df.shape}")

    # Feature mapping:
    # genergy → total geophone energy → proxy for vib_rms_g
    # gpuls   → number of pulses → proxy for dom_freq_hz
    # energy  → seismic energy of bumps → map to risk
    # maxenergy → max bump energy → proxy for vib_peak_g
    # class   → 0=no bump, 1=high-energy bump

    rng = np.random.default_rng(999)
    rows = []

    for idx, row in df.iterrows():
        # One shift = 8 hours → expand to 48 synthetic 10-min records
        for t in range(48):
            t_hours = idx * 8 + t * (8 / 48)

            # Scale genergy to vib_rms_g (10^4 J → ~0.01g typical)
            ge     = float(row["genergy"]) if pd.notna(row["genergy"]) else 0
            vib_rms= np.clip(ge / 5e6, 0.0005, 2.0)
            vib_pk = np.clip(float(row["maxenergy"]) / 1e6 if pd.notna(row["maxenergy"]) else vib_rms * 2, 0, 5)

            gpuls  = float(row["gpuls"]) if pd.notna(row["gpuls"]) else 10
            dom_f  = np.clip(gpuls / 5, 1, 40)

            # Seismic class → risk class
            seismic_class = int(row["class"]) if pd.notna(row["class"]) else 0
            nbumps_high   = sum([float(row.get(f"nbumps{n}", 0) or 0)
                                 for n in [4, 5, 6, 7, "89"]])
            if seismic_class == 1 and nbumps_high > 0:
                risk = 4
            elif seismic_class == 1:
                risk = 3
            elif nbumps_high > 0:
                risk = 2
            elif float(row.get("nbumps", 0) or 0) > 0:
                risk = 1
            else:
                risk = 0

            # Assign categorical seismic label to blast_flag
            ghaz = str(row.get("ghazard", "a"))
            blast_f = 1 if ghaz in ["b", "c"] else 0

            rows.append({
                "scenario_id":   f"SEISMIC_BUMPS_SHIFT_{idx:04d}",
                "panel_id":      "ZABRZE_BIELSZOWICE",
                "node_id":       f"SB_N{idx:04d}_{t:02d}",
                "timestamp_h":   round(t_hours, 3),
                "node_x":        rng.uniform(-100, 100),
                "node_y":        rng.uniform(-60, 60),
                "depth_m":       rng.uniform(600, 900),   # Polish deep coal mine
                "seam_thk_m":    rng.uniform(1.5, 3.5),
                "tilt_x_deg":    rng.normal(0, 0.05),
                "tilt_y_deg":    rng.normal(0, 0.03),
                "tilt_mag_mrad": abs(rng.normal(0, 0.8)),
                "crack_mm":      max(0, rng.normal(2, 1.5)),
                "strain_ustrain":rng.normal(0, 5),
                "vib_rms_g":     float(vib_rms),
                "vib_peak_g":    float(vib_pk),
                "dom_freq_hz":   float(dom_f),
                "band_energy_0_10":  float(vib_rms**2 * 0.7),
                "band_energy_10_50": float(vib_rms**2 * 0.2),
                "temp_c":        rng.uniform(20, 35),
                "batt_v":        4.0,
                "rssi_dbm":      rng.uniform(-100, -60),
                "blast_flag":    blast_f,
                "rain_flag":     0,
                "vehicle_flag":  0,
                "fault_type":    "none",
                "true_subsidence_mm":   float(risk * 15),
                "true_tilt_mm_per_m":   abs(rng.normal(0, risk * 0.8)),
                "true_strain_mm_per_m": float(risk * 0.8 + rng.normal(0, 0.2)),
                "risk_class":    risk,
                "is_subsiding":  int(risk >= 2),
                "hours_to_critical": max(0, (4 - risk) * 24),
                "knothe_H":      np.nan,
                "knothe_m":      np.nan,
                "knothe_a":      np.nan,
                "knothe_beta":   np.nan,
                "coalfield":     "POLAND_ZABRZE",
                "seasonal":      "none",
                "data_source":   "TIER3_SEISMICBUMPS",
            })

    result = pd.DataFrame(rows)
    print(f"  Expanded: {len(result):,} rows | risk dist: "
          f"{result['risk_class'].value_counts().sort_index().to_dict()}")
    return result


def run_sweep(n_panels: int = 500, seed: int = 42) -> None:
    print("=" * 65)
    print(f"TerraMesh AI -- Knothe Parameter Sweep  (n={n_panels})")
    print("=" * 65)

    panels = sample_panels(n_panels, seed=seed)
    rng    = np.random.default_rng(seed)

    all_rows  = []
    for i, cfg in enumerate(panels):
        fault_mode = rng.choice(FAULT_MODES)
        seasonal   = rng.choice(SEASONAL)
        fault_node = "N003" if fault_mode != "none" else None

        rows = generate_panel_sweep(
            panel_idx     = i,
            cfg           = cfg,
            duration_hours= 48,
            dt_minutes    = 10,
            fault_node    = fault_node,
            fault_mode    = fault_mode,
            seasonal      = seasonal,
            seed          = seed + i,
        )
        all_rows.extend(rows)

        if (i + 1) % 50 == 0:
            pct = (i + 1) / n_panels * 100
            print(f"  [{i+1:>4d}/{n_panels}] {pct:5.1f}% | "
                  f"rows so far: {len(all_rows):,}")

    print(f"\nTotal sweep rows: {len(all_rows):,}")

    # Also ingest Seismic Bumps real data
    df_seismic = ingest_seismic_bumps()

    # Merge
    df_sweep   = pd.DataFrame(all_rows)
    df_combined = pd.concat([df_sweep, df_seismic], ignore_index=True)
    print(f"\nCombined (sweep + seismic bumps): {len(df_combined):,} rows")

    # Risk class breakdown
    print("\nRisk class distribution:")
    total = len(df_combined)
    for cls in range(5):
        cnt = int((df_combined["risk_class"] == cls).sum())
        bar = "#" * int(cnt / total * 50)
        print(f"  Class {cls}: {cnt:>8,} ({cnt/total*100:5.1f}%)  {bar}")

    # Save
    out_path = OUT_DIR / "sweep_augmentation.parquet"
    df_combined.to_parquet(out_path, index=False)
    print(f"\nSaved: {out_path}  ({out_path.stat().st_size/1e6:.1f} MB)")

    # Summary CSV
    summary = df_combined.groupby(["coalfield", "risk_class"]).size().reset_index(name="rows")
    summary.to_csv(OUT_DIR / "sweep_summary.csv", index=False)
    print(f"Saved: sweep_summary.csv")
    print("\nSWEEP COMPLETE.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n_panels", type=int, default=500)
    parser.add_argument("--seed",     type=int, default=42)
    args = parser.parse_args()
    run_sweep(args.n_panels, args.seed)
