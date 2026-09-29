import pandas as pd
from pathlib import Path

final = Path(r"d:\COAL MINE\terramesh-platform\data\cleaned\final")
RISK = {0:"NORMAL", 1:"WATCH", 2:"WARNING", 3:"CRITICAL", 4:"EMERGENCY"}

for split in ["train", "val", "test"]:
    df = pd.read_parquet(final / f"final_{split}.parquet")
    print(f"=== final_{split}.parquet ===")
    print(f"  Rows   : {len(df):,}")
    print(f"  Cols   : {len(df.columns)}")
    src = df["data_source"].value_counts().to_dict()
    for s, c in src.items():
        print(f"  Source : {s} = {c:,}")
    rc = df["risk_class"].value_counts().sort_index()
    for cls, cnt in rc.items():
        bar = "#" * int(cnt / len(df) * 40)
        label = RISK.get(int(cls), "?")
        print(f"  Class {cls} {label:10s}: {cnt:>8,} ({cnt/len(df)*100:5.1f}%)  {bar}")
    print(f"  Scenarios: {df['scenario_id'].nunique():,}")
    print()

# Leakage check
train = pd.read_parquet(final / "final_train.parquet")
val   = pd.read_parquet(final / "final_val.parquet")
test  = pd.read_parquet(final / "final_test.parquet")
tv = set(train.scenario_id) & set(val.scenario_id)
tt = set(train.scenario_id) & set(test.scenario_id)
vt = set(val.scenario_id)   & set(test.scenario_id)
status = "OK" if not (tv | tt | vt) else "LEAK!"
print(f"Leakage train/val={len(tv)}  train/test={len(tt)}  val/test={len(vt)}  -> {status}")

# Feature null check on train
sensor_cols = [
    "tilt_x_deg", "tilt_y_deg", "tilt_mag_mrad", "crack_mm",
    "strain_ustrain", "vib_rms_g", "vib_peak_g", "dom_freq_hz",
    "temp_c", "batt_v", "rssi_dbm", "blast_flag", "rain_flag", "vehicle_flag"
]
print("\n=== Feature Null % in final_train ===")
for c in sensor_cols:
    if c in train.columns:
        pct = float(train[c].isnull().mean()) * 100
        s = "OK" if pct < 5 else ("WARN" if pct < 30 else "HIGH")
        print(f"  {c:25s} {pct:5.1f}%  [{s}]")

# File sizes
print("\n=== Output file sizes ===")
for f in sorted(final.glob("*.parquet")):
    print(f"  {f.name:35s} {f.stat().st_size/1e6:7.1f} MB")

total_mb = sum(f.stat().st_size for f in final.glob("*.parquet")) / 1e6
print(f"\n  Total: {total_mb:.1f} MB")
