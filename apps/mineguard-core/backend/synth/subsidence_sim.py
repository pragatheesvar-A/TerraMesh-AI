#!/usr/bin/env python3
"""
TerraMesh AI — Knothe Influence-Function Subsidence Simulator
=============================================================
Physics: Knothe / NCB influence-function subsidence theory.

    S(x,y) = (Smax/4) * [erf(sqrt(pi)*(x2-x)/r) + erf(sqrt(pi)*(x-x1)/r)]
                       * [erf(sqrt(pi)*(y2-y)/r) + erf(sqrt(pi)*(y-y1)/r)]

    r      = H / tan(beta)              radius of major influence (m)
    Smax   = a * m                      final max subsidence (m)
    S(t)   = S_inf * (1 - exp(-c*t))   Knothe time function
    Tilt   = dS/dx                      (mm/m = mrad)
    Strain = 0.35r * d²S/dx²           (mm/m)

Indian coalfield parameter ranges (validated against InSAR rates from
Jharia ≈ 22 cm cumulative over 2017-2020, Raniganj max ≈ -21 mm/yr,
Korba ≈ -21 mm/yr LOS per published DInSAR studies):
    H       : 60-300 m   (seam depth)
    m       : 1.5-6 m    (extracted seam thickness)
    a       : 0.55-0.90  (subsidence factor, caving method)
    beta    : 25°-35°    (angle of draw / major influence)
    c       : 0.3-2.0    (Knothe time factor, /month)
    advance : 1-6 m/day  (face advance rate)

Sensor corruption channels (matching hardware report):
    1. MPU6050 MEMS noise (0.03° RMS) + diurnal thermal tilt cycling ±0.3 mrad
    2. VL53L0X ToF ranging noise ±2% + outdoor ambient IR washout
    3. HX711 strain gauge zero-offset drift (slow linear)
    4. Blasting vibration spikes (10-50 Hz, up to 0.5g peak)
    5. LoRa packet loss (Poisson, IN865 865-867 MHz, 500m-1km realistic range)
"""

from __future__ import annotations

import math
import random
import numpy as np
from scipy.special import erf
from datetime import datetime, timedelta
from typing import Optional
import pyarrow as pa
import pyarrow.parquet as pq

SQPI = math.sqrt(math.pi)


# ---------------------------------------------------------------------------
# 1. SUBSIDENCE PHYSICS
# ---------------------------------------------------------------------------

def compute_smax(m: float, a: float) -> float:
    """Final maximum subsidence S_max = a * m (metres)."""
    return a * m


def compute_r(H: float, beta_deg: float) -> float:
    """Radius of major influence r = H / tan(beta)."""
    return H / math.tan(math.radians(beta_deg))


def subsidence_surface(x: np.ndarray, y: np.ndarray,
                        face_x: float, panel: dict,
                        r: float, smax: float) -> np.ndarray:
    """
    Vertical subsidence (metres) at surface grid points (x, y).
    Panel extracted from x=0 to x=face_x, y in [y1, y2].
    """
    face_x = max(face_x, 1e-6)
    x1, x2 = 0.0, face_x
    y1, y2 = panel["y1"], panel["y2"]
    fx = erf(SQPI * (x2 - x) / r) + erf(SQPI * (x - x1) / r)
    fy = erf(SQPI * (y2 - y) / r) + erf(SQPI * (y - y1) / r)
    return (smax / 4.0) * fx * fy


def tilt_and_strain(x: np.ndarray, y: np.ndarray,
                    face_x: float, panel: dict,
                    r: float, smax: float, h: float = 2.0) -> tuple:
    """
    Returns (tilt_mm_per_m, strain_mm_per_m) via central differences.
    tilt   = dS/dx  (converted m/m → mm/m)
    strain = 0.35r * d²S/dx²
    """
    S   = subsidence_surface(x,     y, face_x, panel, r, smax)
    Sxp = subsidence_surface(x + h, y, face_x, panel, r, smax)
    Sxm = subsidence_surface(x - h, y, face_x, panel, r, smax)
    Syp = subsidence_surface(x, y + h, face_x, panel, r, smax)
    Sym = subsidence_surface(x, y - h, face_x, panel, r, smax)

    tilt_x = (Sxp - Sxm) / (2 * h) * 1000   # mm/m = mrad
    tilt_y = (Syp - Sym) / (2 * h) * 1000
    tilt_mag = np.sqrt(tilt_x**2 + tilt_y**2)

    curvature = (Sxp - 2*S + Sxm) / (h**2)
    B = 0.35 * r
    strain = B * curvature * 1000            # mm/m

    return tilt_x, tilt_y, tilt_mag, strain, S * 1000  # return S in mm


def knothe_time_factor(t_hours: float, c_per_month: float) -> float:
    """
    S(t) / S_final = 1 - exp(-c * t)
    c is given per month; t is hours.
    """
    c_per_hour = c_per_month / (30 * 24)
    return 1.0 - math.exp(-c_per_hour * t_hours)


# ---------------------------------------------------------------------------
# 2. NODE LAYOUT
# ---------------------------------------------------------------------------

def generate_node_grid(panel: dict, spacing_m: float = 40.0) -> list[dict]:
    """Generate a regular grid of sensor nodes over the panel surface."""
    nodes = []
    nid   = 0
    xs    = np.arange(-spacing_m * 2, panel["x2"] + spacing_m * 3, spacing_m)
    ys    = np.arange(panel["y1"] - spacing_m, panel["y2"] + spacing_m, spacing_m)
    for nx in xs:
        for ny in ys:
            nodes.append({
                "node_id":  f"N{nid:03d}",
                "x":        float(nx),
                "y":        float(ny),
                "spacing":  spacing_m
            })
            nid += 1
    return nodes


# ---------------------------------------------------------------------------
# 3. SENSOR CORRUPTION MODELS
# ---------------------------------------------------------------------------

rng = np.random.default_rng(42)


def add_mpu6050_noise(tilt_deg: float, temp_c: float,
                      t_hours: float, fault_mode: str = "none") -> float:
    """
    Adds MPU6050-class MEMS noise (0.03° RMS), diurnal thermal cycling
    (±0.3 mrad ≈ ±0.017° over 24h), and optional fault modes.
    """
    noise_deg    = rng.normal(0, 0.03)
    diurnal_mrad = 0.3 * math.sin(2 * math.pi * t_hours / 24.0)
    diurnal_deg  = diurnal_mrad / (180 / math.pi) / 1000  # mrad → deg

    if fault_mode == "stuck":
        return 0.0              # Flatline — sensor frozen
    elif fault_mode == "drift":
        drift = 0.002 * t_hours  # Linear drift (°/hr)
        return tilt_deg + noise_deg + diurnal_deg + drift
    elif fault_mode == "spike":
        spike = rng.choice([0, 0, 0, rng.normal(0, 1.5)])
        return tilt_deg + noise_deg + diurnal_deg + spike
    else:
        return tilt_deg + noise_deg + diurnal_deg


def add_vl53l0x_noise(distance_mm: float, outdoor_ir: bool = True) -> float:
    """
    VL53L0X ToF ranging noise: ±3% under controlled, worse outdoors.
    Models ambient IR washout in direct sunlight.
    """
    noise_pct  = 0.05 if outdoor_ir else 0.03
    noise_mm   = rng.normal(0, distance_mm * noise_pct + 1.0)
    return max(0.0, distance_mm + noise_mm)


def add_hx711_noise(strain_ustrain: float, t_hours: float,
                    fault_mode: str = "none") -> float:
    """
    HX711 + 120Ω strain gauge noise model.
    Includes zero-offset drift and quantisation noise.
    """
    quant_noise = rng.normal(0, 3.0)        # ~3 µε resolution noise
    if fault_mode == "drift":
        drift = 0.1 * t_hours               # Slow DC drift (µε/hr)
        return strain_ustrain + quant_noise + drift
    return strain_ustrain + quant_noise


def simulate_vibration(true_ground_motion: bool,
                       blast_scheduled: bool,
                       rain_flag: bool,
                       vehicle_flag: bool) -> dict:
    """
    Generates ADXL345-class vibration features.
    Returns spectral features used by the vibration fingerprinter.
    """
    if blast_scheduled:
        # High RMS, dominant high-frequency (10-50 Hz)
        rms     = rng.uniform(0.15, 0.50)
        peak    = rms * rng.uniform(3, 6)
        dom_f   = rng.uniform(12, 45)
        e_lo    = rng.uniform(0.0005, 0.003)
        e_hi    = rms**2 * rng.uniform(0.6, 0.9)
        flag    = "BLASTING"
    elif rain_flag:
        rms     = rng.uniform(0.002, 0.015)
        peak    = rms * rng.uniform(2, 4)
        dom_f   = rng.uniform(1, 5)
        e_lo    = rms**2 * 0.7
        e_hi    = rms**2 * 0.1
        flag    = "RAIN_WIND"
    elif vehicle_flag:
        rms     = rng.uniform(0.02, 0.08)
        peak    = rms * rng.uniform(2, 5)
        dom_f   = rng.uniform(8, 25)
        e_lo    = rms**2 * 0.3
        e_hi    = rms**2 * 0.6
        flag    = "MACHINERY"
    elif true_ground_motion:
        # Micro-seismic / strata movement: low frequency
        rms     = rng.uniform(0.005, 0.04)
        peak    = rms * rng.uniform(2, 3)
        dom_f   = rng.uniform(0.5, 8)
        e_lo    = rms**2 * 0.85
        e_hi    = rms**2 * 0.1
        flag    = "GROUND_MOTION"
    else:
        # Background ambient
        rms     = rng.uniform(0.001, 0.006)
        peak    = rms * rng.uniform(1.5, 2.5)
        dom_f   = rng.uniform(0.2, 4)
        e_lo    = rms**2 * 0.6
        e_hi    = rms**2 * 0.05
        flag    = "GROUND_MOTION"

    return {
        "vib_rms_g":         float(rms),
        "vib_peak_g":        float(peak),
        "dom_freq_hz":       float(dom_f),
        "band_energy_0_10":  float(e_lo),
        "band_energy_10_50": float(e_hi),
        "_true_vib_class":   flag,
    }


def simulate_packet_loss(packet_loss_prob: float = 0.03) -> bool:
    """Returns True if the packet is LOST (simulate LoRa dropout)."""
    return rng.random() < packet_loss_prob


# ---------------------------------------------------------------------------
# 4. SCENARIO CONFIGURATION
# ---------------------------------------------------------------------------

PANEL_CONFIGS = {
    "PANEL_A": {
        "H": 150, "m": 3.0, "a": 0.75, "beta_deg": 30, "c_per_month": 1.2,
        "advance_m_per_day": 3.0, "y1": -80.0, "y2": 80.0, "x2": 300.0,
        "node_spacing": 40.0, "label": "Jharia Longwall Panel A"
    },
    "PANEL_B": {
        "H": 200, "m": 4.5, "a": 0.85, "beta_deg": 28, "c_per_month": 0.8,
        "advance_m_per_day": 2.0, "y1": -120.0, "y2": 120.0, "x2": 400.0,
        "node_spacing": 50.0, "label": "Raniganj Deep Panel B"
    },
    "PANEL_C": {
        "H": 80,  "m": 2.0, "a": 0.65, "beta_deg": 33, "c_per_month": 1.8,
        "advance_m_per_day": 5.0, "y1": -60.0, "y2": 60.0, "x2": 200.0,
        "node_spacing": 30.0, "label": "Korba Shallow Panel C"
    },
}


# ---------------------------------------------------------------------------
# 5. MAIN GENERATOR
# ---------------------------------------------------------------------------

def generate_scenario(
    scenario_type: str = "QUIET_BASELINE",
    panel_name: str = "PANEL_A",
    duration_hours: int = 168,          # 1 week default
    dt_minutes: int = 5,                # Sample every 5 min
    fault_node: Optional[str] = None,   # Node ID to inject fault into
    fault_mode: str = "none",           # 'stuck' | 'drift' | 'none'
    seed: int = 42,
) -> list[dict]:
    """
    Generate a complete labelled multi-node time-series dataset for
    one scenario. Returns a list of row dicts compatible with schemas.NodeTelemetry.
    """
    global rng
    rng = np.random.default_rng(seed)
    random.seed(seed)

    cfg    = PANEL_CONFIGS[panel_name]
    r      = compute_r(cfg["H"], cfg["beta_deg"])
    smax   = compute_smax(cfg["m"], cfg["a"])
    panel  = {"y1": cfg["y1"], "y2": cfg["y2"], "x2": cfg["x2"]}
    nodes  = generate_node_grid(panel, cfg["node_spacing"])
    nx_arr = np.array([n["x"] for n in nodes])
    ny_arr = np.array([n["y"] for n in nodes])

    rows   = []
    t0     = datetime(2026, 1, 1, 0, 0, 0)
    steps  = duration_hours * 60 // dt_minutes

    for step in range(steps):
        t_hours    = step * dt_minutes / 60.0
        t_now      = t0 + timedelta(hours=t_hours)
        temp_c     = 28.0 + 8.0 * math.sin(2 * math.pi * t_hours / 24.0)

        # --- Panel face position ---
        if scenario_type in ("QUIET_BASELINE", "SENSOR_FAULT",
                             "BLASTING_VIBRATION", "COMM_OUTAGE",
                             "MONSOON_THERMAL"):
            face_x = 0.0          # No active mining movement
        elif scenario_type == "LOCALIZED_SUBSIDENCE":
            face_x = min(t_hours * cfg["advance_m_per_day"] / 24, cfg["x2"] * 0.5)
        else:
            face_x = min(t_hours * cfg["advance_m_per_day"] / 24, cfg["x2"])

        time_factor = knothe_time_factor(t_hours, cfg["c_per_month"])
        eff_smax    = smax * time_factor

        # --- Compute physics at all node positions ---
        tx, ty, tmag, strain, sub_mm = tilt_and_strain(
            nx_arr, ny_arr, face_x, panel, r, eff_smax
        )

        # --- Per-node row generation ---
        for i, node in enumerate(nodes):
            node_id = node["node_id"]

            # Scenario-level flags
            is_subsiding   = bool(sub_mm[i] > 2.0)
            blast_flag     = (scenario_type == "BLASTING_VIBRATION"
                              and 10 <= (t_hours % 24) < 11)
            rain_flag      = (scenario_type == "MONSOON_THERMAL"
                              and 14 <= (t_hours % 24) < 18)
            vehicle_flag   = bool(rng.random() < 0.05)  # 5% chance background

            # Sensor fault injection
            node_fault = fault_mode if (node_id == fault_node) else "none"

            # Crack gap: starts at 5mm baseline, opens with tensile strain
            crack_true_mm = max(0, 5.0 + strain[i] * 0.8)
            crack_obs_mm  = add_vl53l0x_noise(crack_true_mm)

            # Tilt (degrees from mrad)
            tilt_x_true_deg = float(tx[i]) / (1000 * (180 / math.pi) / math.pi)
            tilt_y_true_deg = float(ty[i]) / (1000 * (180 / math.pi) / math.pi)
            tilt_x_obs      = add_mpu6050_noise(tilt_x_true_deg, temp_c,
                                                 t_hours, node_fault)
            tilt_y_obs      = add_mpu6050_noise(tilt_y_true_deg, temp_c,
                                                 t_hours, "none")
            tilt_mag_obs    = math.sqrt(
                (tilt_x_obs * 1000 * math.pi / 180)**2 +
                (tilt_y_obs * 1000 * math.pi / 180)**2
            )

            # Strain
            strain_obs = add_hx711_noise(float(strain[i]), t_hours, node_fault)

            # Vibration
            vib = simulate_vibration(is_subsiding, blast_flag, rain_flag, vehicle_flag)

            # Battery: degrades slowly from 4.2V over deployment
            batt_v = max(3.3, 4.2 - 0.0002 * t_hours + rng.normal(0, 0.01))

            # RSSI: IN865 realistic range (noisier at greater distances)
            dist_to_gw = math.sqrt((node["x"] - 0)**2 + (node["y"] - 0)**2)
            rssi       = -60 - 20 * math.log10(max(dist_to_gw, 1) / 10) + rng.normal(0, 4)
            snr        = 10 - rng.exponential(2)

            # Packet loss (LoRa dropout simulation)
            if simulate_packet_loss(0.02):
                continue   # Packet lost — node goes silent this cycle

            # Risk class (ground truth for validation only)
            t_strain = abs(float(strain[i]))
            if t_strain < 0.5:
                risk_class = 0
            elif t_strain < 1.5:
                risk_class = 1
            elif t_strain < 3.0:
                risk_class = 2
            elif t_strain < 6.0:
                risk_class = 3
            else:
                risk_class = 4

            rows.append({
                # Identity
                "scenario":          scenario_type,
                "panel_id":          panel_name,
                "node_id":           node_id,
                "timestamp":         t_now.isoformat(),
                "node_x":            round(node["x"], 2),
                "node_y":            round(node["y"], 2),
                # Tilt
                "tilt_x_deg":        round(tilt_x_obs, 4),
                "tilt_y_deg":        round(tilt_y_obs, 4),
                "tilt_mag_mrad":     round(tilt_mag_obs, 3),
                # Crack
                "crack_gap_mm":      round(crack_obs_mm, 3),
                # Strain
                "strain_ustrain":    round(strain_obs, 3),
                # Vibration
                "vib_rms_g":         round(vib["vib_rms_g"], 5),
                "vib_peak_g":        round(vib["vib_peak_g"], 5),
                "dom_freq_hz":       round(vib["dom_freq_hz"], 2),
                "band_energy_0_10":  round(vib["band_energy_0_10"], 6),
                "band_energy_10_50": round(vib["band_energy_10_50"], 6),
                # Environment & power
                "temp_c":            round(temp_c, 2),
                "battery_v":         round(batt_v, 3),
                "rssi_dbm":          round(rssi, 1),
                "snr_db":            round(snr, 1),
                # Health flags
                "mpu6050_ok":        node_fault != "stuck",
                "vl53l0x_ok":        True,
                "hx711_ok":          node_fault != "stuck",
                # Event flags
                "blast_flag":        int(blast_flag),
                "rain_flag":         int(rain_flag),
                "vehicle_flag":      int(vehicle_flag),
                "fault_mode":        node_fault,
                # Ground truth labels (NEVER used as model inputs)
                "true_subsidence_mm":  round(float(sub_mm[i]), 3),
                "true_tilt_mm_per_m":  round(float(tmag[i]), 3),
                "true_strain_mm_per_m":round(float(strain[i]), 3),
                "risk_class":          risk_class,
                "is_subsiding":        int(is_subsiding),
            })

    return rows


def generate_all_scenarios(out_dir: str = "data") -> None:
    """
    Generate the complete 11-scenario benchmark dataset and save as Parquet.
    Also generates a quick CSV summary for verification.
    """
    import os
    os.makedirs(out_dir, exist_ok=True)

    scenarios = [
        ("QUIET_BASELINE",             "PANEL_A", 72,  5,  None,    "none",  10),
        ("GRADUAL_SUBSIDENCE",          "PANEL_A", 168, 5,  None,    "none",  20),
        ("LOCALIZED_SUBSIDENCE",        "PANEL_A", 168, 5,  None,    "none",  30),
        ("DIFFERENTIAL_MOVEMENT",       "PANEL_B", 168, 5,  None,    "none",  40),
        ("CRACK_INITIATION",            "PANEL_C", 120, 5,  None,    "none",  50),
        ("BLASTING_VIBRATION",          "PANEL_A", 48,  5,  None,    "none",  60),
        ("SENSOR_FAULT",                "PANEL_A", 72,  5,  "N005",  "stuck", 70),
        ("COMM_OUTAGE",                 "PANEL_A", 24,  5,  None,    "none",  80),
        ("REAL_SUBSIDENCE_PLUS_FAULT",  "PANEL_B", 120, 5,  "N003",  "drift", 90),
        ("INTERNET_DISCONNECT",         "PANEL_A", 24,  5,  None,    "none",  100),
        ("MONSOON_THERMAL",             "PANEL_A", 72,  5,  None,    "none",  110),
    ]

    all_rows = []
    for (stype, panel, hours, dt, fault_node, fault_mode, seed) in scenarios:
        print(f"  Generating {stype} ({panel}, {hours}h) ...")
        rows = generate_scenario(stype, panel, hours, dt, fault_node, fault_mode, seed)
        all_rows.extend(rows)
        print(f"    >> {len(rows):,} rows")

    print(f"\nTotal rows generated: {len(all_rows):,}")

    # Save Parquet
    import pandas as pd
    df = pd.DataFrame(all_rows)
    parquet_path = os.path.join(out_dir, "terramesh_scenarios.parquet")
    df.to_parquet(parquet_path, index=False)
    print(f"Saved Parquet: {parquet_path}")

    # Save quick CSV summary
    summary = df.groupby("scenario").agg(
        rows=("node_id", "count"),
        nodes=("node_id", "nunique"),
        is_subsiding_pct=("is_subsiding", "mean"),
        blast_pct=("blast_flag", "mean"),
        max_risk_class=("risk_class", "max"),
    ).reset_index()
    csv_path = os.path.join(out_dir, "scenario_summary.csv")
    summary.to_csv(csv_path, index=False)
    print(f"Saved summary: {csv_path}")
    print("\nScenario breakdown:")
    print(summary.to_string(index=False))

    return df


if __name__ == "__main__":
    print("TerraMesh AI — Knothe Physics Generator")
    print("=" * 55)
    generate_all_scenarios(out_dir="data")
