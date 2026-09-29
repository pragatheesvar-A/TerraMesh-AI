"""
TerraMesh AI — Deep Dataset Requirements Audit
================================================
Checks every column against actual hardware spec:
  - Heltec ESP32-S3 (SX1262 LoRa IN865)
  - MPU6050 (tilt/accel)
  - VL53L0X (crack gap ToF)
  - HX711 + 120-ohm strain gauge
  - ADXL345 (vibration burst 200Hz)

Validates:
  1. Physical range plausibility vs sensor datasheets
  2. Noise floor matches real sensor specs
  3. Label distribution vs NCB damage classes
  4. Feature-label correlation (sanity)
  5. Noamundi mapping validity
  6. Sensor-column coverage per data source
"""

import pandas as pd
import numpy as np
from pathlib import Path

FINAL = Path(r"d:\COAL MINE\terramesh-platform\data\cleaned\final")
train = pd.read_parquet(FINAL / "final_train.parquet")

PASS = "[PASS]"
WARN = "[WARN]"
FAIL = "[FAIL]"

results = []

def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    results.append((status, label, detail))
    print(f"  {status}  {label}")
    if detail:
        print(f"         {detail}")

def check_range(col, lo, hi, label, src_filter=None):
    df = train if src_filter is None else train[train["data_source"] == src_filter]
    if col not in df.columns:
        results.append((FAIL, label, f"{col} missing"))
        print(f"  {FAIL}  {label} — column missing")
        return
    s = df[col].dropna()
    pct_ok = ((s >= lo) & (s <= hi)).mean() * 100
    passed = pct_ok >= 99.0
    status = PASS if passed else WARN
    results.append((status, label, f"{pct_ok:.1f}% within [{lo}, {hi}]  mean={s.mean():.4f}  std={s.std():.4f}"))
    print(f"  {status}  {label}")
    print(f"         {pct_ok:.1f}% within [{lo},{hi}]  mean={s.mean():.4f}  std={s.std():.4f}")

print("=" * 70)
print("TerraMesh AI — Dataset Requirements Audit")
print("=" * 70)
print(f"\nRows: {len(train):,}  Sources: {train['data_source'].nunique()}")

# ─────────────────────────────────────────────────────────────
print("\n[1] MPU6050 Tilt Sensor (I2C, gravity-vector, ±2g)")
print("    Spec: noise ~0.03 deg RMS, range ±90 deg, diurnal drift ±0.3 mrad")
# ─────────────────────────────────────────────────────────────
check_range("tilt_x_deg", -15, 15,
    "tilt_x_deg within sensor operating range [-15,15 deg]",
    "TIER1A_TERRAMESH")

check_range("tilt_y_deg", -15, 15,
    "tilt_y_deg within sensor operating range",
    "TIER1A_TERRAMESH")

t1 = train[train["data_source"].isin(["TIER1A_TERRAMESH","TIER1B_SCENARIOS"])]
noise_std = t1[t1["risk_class"]==0]["tilt_x_deg"].std()
check(f"MPU6050 class-0 tilt_x std = {noise_std:.4f} deg  (expect ~0.03-0.15)",
      0.01 < noise_std < 0.5,
      f"Observed std={noise_std:.4f} (includes diurnal thermal)")

tilt_mag = train["tilt_mag_mrad"].dropna()
check(f"tilt_mag_mrad plausible (0–300 mrad normal, up to 2666 at extreme)",
      tilt_mag.max() < 3000 and tilt_mag.min() >= 0,
      f"range=[{tilt_mag.min():.2f}, {tilt_mag.max():.2f}]")

# ─────────────────────────────────────────────────────────────
print("\n[2] VL53L0X ToF Crack Gap Sensor (I2C, laser ranging)")
print("    Spec: range 0–1200mm, noise ±3% indoor / ±5% outdoor")
# ─────────────────────────────────────────────────────────────
check_range("crack_mm", 0, 500,
    "crack_mm within VL53L0X operating range [0,500mm]")

crack = train["crack_mm"].dropna()
check(f"crack_mm baseline ~5mm (mounted across crack seam)",
      crack.median() < 20,
      f"median={crack.median():.2f}mm  mean={crack.mean():.2f}mm")

# ─────────────────────────────────────────────────────────────
print("\n[3] HX711 + Strain Gauge (2-wire, 120 ohm, 24-bit ADC)")
print("    Spec: resolution ~3 microstrains, drift up to 0.1 ue/hr")
# ─────────────────────────────────────────────────────────────
strain = train["strain_ustrain"].dropna()
check(f"strain_ustrain present ({len(strain):,} non-null rows)",
      len(strain) > 0,
      f"null%={(train['strain_ustrain'].isnull().mean()*100):.1f}%")

check(f"strain_ustrain range plausible for coal measures [-50,50 ue typical]",
      strain.between(-200, 200).mean() > 0.99,
      f"range=[{strain.min():.2f},{strain.max():.2f}]  std={strain.std():.3f}")

# ─────────────────────────────────────────────────────────────
print("\n[4] ADXL345 Vibration (200Hz burst, I2C)")
print("    Spec: ±16g range, noise density ~150 ug/sqrt(Hz)")
# ─────────────────────────────────────────────────────────────
check_range("vib_rms_g", 0, 2.0,
    "vib_rms_g within ADXL345 operating range [0,2g]")

check_range("vib_peak_g", 0, 10.0,
    "vib_peak_g plausible [0,10g]")

vib = train["vib_rms_g"]
ambient = vib[train["blast_flag"] == 0].mean()
blast   = vib[train["blast_flag"] == 1].mean() if train["blast_flag"].sum() > 0 else 0
check(f"Blast vib higher than ambient (blast={blast:.4f}g > ambient={ambient:.4f}g)",
      blast > ambient or train["blast_flag"].sum() == 0,
      f"blast_rows={train['blast_flag'].sum():,}")

check_range("dom_freq_hz", 0, 50,
    "dom_freq_hz within ADXL345 Nyquist [0,50Hz] at 200Hz sampling")

# ─────────────────────────────────────────────────────────────
print("\n[5] Heltec ESP32-S3 LoRa SX1262 (IN865, 865-867 MHz)")
print("    Spec: RSSI typical -60 to -130 dBm, SNR -20 to +15 dB, batt 3.3-4.2V")
# ─────────────────────────────────────────────────────────────
check_range("rssi_dbm", -130, 0,
    "rssi_dbm within LoRa IN865 operating range [-130,0 dBm]")

batt = train["batt_v"].dropna()
check(f"batt_v within LiPo operating range [3.3,4.3V]",
      batt.between(3.3, 4.3).mean() > 0.99,
      f"range=[{batt.min():.3f},{batt.max():.3f}]  null%={(train['batt_v'].isnull().mean()*100):.1f}%")

# ─────────────────────────────────────────────────────────────
print("\n[6] Label Integrity (NCB Subsidence Engineers Handbook)")
print("    Thresholds: 0.5 / 1.5 / 3.0 / 6.0 mm/m tensile strain")
# ─────────────────────────────────────────────────────────────
rc = train["risk_class"].value_counts().sort_index()
RISK = {0:"NORMAL",1:"WATCH",2:"WARNING",3:"CRITICAL",4:"EMERGENCY"}
for cls in range(5):
    cnt = rc.get(cls, 0)
    pct = cnt / len(train) * 100
    check(f"Class {cls} ({RISK[cls]:10s}) has rows: {cnt:,} ({pct:.1f}%)",
          cnt > 1000,
          "Sufficient minority class representation")

# Correlation: higher risk class → higher |true_strain| (NCB handbook criteria: |strain| >= 0.5, 1.5, 3.0, 6.0)
corr = train["risk_class"].corr(train["true_strain_mm_per_m"].abs())
check(f"risk_class vs |true_strain| correlation = {corr:.3f} (expect >0.5)",
      corr > 0.5,
      f"Pearson r={corr:.3f} (NCB criteria uses magnitude |strain|)")

# ─────────────────────────────────────────────────────────────
print("\n[7] False-Alarm Sources (blast / rain / vehicle labelled)")
# ─────────────────────────────────────────────────────────────
for flag in ["blast_flag", "rain_flag", "vehicle_flag"]:
    cnt = int(train[flag].sum())
    pct = cnt / len(train) * 100
    check(f"{flag}: {cnt:,} positive rows ({pct:.2f}%)",
          cnt > 100,
          "False-alarm events present for classifier training")

# ─────────────────────────────────────────────────────────────
print("\n[8] Sensor Fault Coverage")
# ─────────────────────────────────────────────────────────────
for fault in ["none", "stuck", "drift"]:
    cnt = int((train["fault_type"] == fault).sum())
    check(f"fault_type='{fault}': {cnt:,} rows",
          cnt > 0)

# ─────────────────────────────────────────────────────────────
print("\n[9] Source Coverage — Do all sources contribute?")
# ─────────────────────────────────────────────────────────────
for src, cnt in train["data_source"].value_counts().items():
    pct = cnt / len(train) * 100
    check(f"{str(src):35s} {cnt:>8,} rows ({pct:.1f}%)",
          cnt > 1000)

# ─────────────────────────────────────────────────────────────
print("\n[10] Noamundi Mapping Validity (cross-domain)")
print("     Displacement_Rate_mm_h -> tilt_mag_mrad,  FS -> risk_class")
# ─────────────────────────────────────────────────────────────
noam = train[train["data_source"] == "TIER2_NOAMUNDI"] if "TIER2_NOAMUNDI" in train["data_source"].values else pd.DataFrame()
if len(noam) > 0:
    check(f"Noamundi tilt_mag_mrad > 0 for is_subsiding rows",
          noam[noam["is_subsiding"]==1]["tilt_mag_mrad"].dropna().mean() > 0,
          f"subsiding rows mean tilt={noam[noam['is_subsiding']==1]['tilt_mag_mrad'].dropna().mean():.4f}")
    check(f"Noamundi rain_flag tied to precipitation (expect ~2-3%)",
          0.005 < noam["rain_flag"].mean() < 0.20,
          f"rain_flag rate={noam['rain_flag'].mean()*100:.2f}%")
else:
    print("  [INFO] Noamundi not in train split (may be all in val/test)")

# ─────────────────────────────────────────────────────────────
print("\n[11] Panel-Level Leakage Check")
# ─────────────────────────────────────────────────────────────
val  = pd.read_parquet(FINAL / "final_val.parquet")
test = pd.read_parquet(FINAL / "final_test.parquet")
tv = set(train.scenario_id) & set(val.scenario_id)
tt = set(train.scenario_id) & set(test.scenario_id)
vt = set(val.scenario_id)   & set(test.scenario_id)
check("Train/Val scenario overlap = 0", len(tv) == 0, str(tv or "none"))
check("Train/Test scenario overlap = 0", len(tt) == 0, str(tt or "none"))
check("Val/Test scenario overlap = 0", len(vt) == 0, str(vt or "none"))

# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("AUDIT SUMMARY")
print("=" * 70)
passed = sum(1 for r in results if r[0] == PASS)
warned = sum(1 for r in results if r[0] == WARN)
failed = sum(1 for r in results if r[0] == FAIL)
total  = len(results)
print(f"\n  PASS: {passed}/{total}   WARN: {warned}   FAIL: {failed}")

if failed > 0:
    print("\n  FAILURES:")
    for r in results:
        if r[0] == FAIL:
            print(f"    {r[1]}  —  {r[2]}")

if warned > 0:
    print("\n  WARNINGS:")
    for r in results:
        if r[0] == WARN:
            print(f"    {r[1]}  —  {r[2]}")

verdict = "READY FOR TRAINING" if failed == 0 else "NEEDS FIXES BEFORE TRAINING"
print(f"\n  VERDICT: {verdict}")
