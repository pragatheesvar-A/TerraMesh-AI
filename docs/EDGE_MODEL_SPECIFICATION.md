# EDGE MODEL SPECIFICATION

## 1. Model Status
**CLASSIFICATION: REFERENCE ONLY (NOT DEPLOYED)**

The current "TinyML" model running on the reference ESP32-S3 firmware is a **Hardcoded Decision Stump Classifier**. It mirrors the backend safety threshold logic, mapping directly to integer values for fixed-point execution. 

### Why is this not a real trained model?
* The trained artifacts (`models/xgboost_risk.joblib` and `models/isolation_forest.joblib`) are Python-based and use 18 features (some of which are spatially derived at the server, like `depth_m` or `band_ratio_0_10`).
* No quantized `.tflite` model artifact has been exported from the trained models.
* No data exists to train a standalone edge model (currently the models are trained on synthetic data `trained_note: "SYNTHETIC corpus holdout"`).

## 2. On-Node Threshold Classifier (Reference)
The firmware (`terramesh_node.ino`) uses an engineering fallback:
* **Inputs:** `tilt_mag_deg`, `crack_mm`, `vib_rms_g`, `dom_freq_hz`
* **Outputs:** Local Risk Class (`NORMAL`, `WATCH`, `WARNING`, `CRITICAL`)
* **Logic:** Applies simple fixed-point `>=` thresholds based on the project's physical safety specifications (e.g., Tilt CRITICAL at >= 3.5 deg, Vibration CRITICAL at >= 1.20 g).
* **Blast Suppression:** If `dom_freq_hz >= 25.0`, vibration risk is suppressed to `NORMAL`.

## 3. Inference Result Schema
Any model deployed to the edge (when built) must output according to this schema, returning the result in the telemetry packet:
* `risk_class`: int 0-4 (0=NORMAL, 4=EMERGENCY)
* `confidence`: float
* `anomaly_score`: float
* `inference_mode`: `ml_model` | `physics_fallback`
* `provenance`: `MODEL OUTPUT` (must be `SIMULATED` or `REFERENCE` if not physically evaluated).

## 4. Model Registry & Verification
The `edge_model_contract.json` acts as the edge model registry.
It tracks the SHA-256 checksum, exact 18-feature input schema `[1, 18]`, the output tensor `[1, 5]`, and limits for hardware envelope (e.g., Latency Budget: 5000ms).

## 5. Required Actions for Full TinyML 
To convert this to a **DEPLOYED** TinyML system:
1. Gather measured field data (not synthetic).
2. Train a subset model (e.g., using only the 11 on-node features).
3. Export to TFLite and quantize to INT8 using the min/max ranges in the contract.
4. Integrate TensorFlow Lite Micro into the firmware (`terramesh_node.ino`).
5. Validate inference latency and accuracy on the ESP32-S3.
