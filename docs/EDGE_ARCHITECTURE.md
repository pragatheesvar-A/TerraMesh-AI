# TerraMesh AI — Edge Architecture

## Current implementation status

**EDGE INFERENCE SIMULATOR** — this is the honest status. No quantized `.onnx`
model is deployed on physical MCU hardware, and the platform never claims
otherwise (including via `/api/edge/status`, which reports the real
pipeline state instead of a fabricated fleet).

## What exists

### `edge/simulator/edge_node_simulator.py`
Simulates ESP32-class nodes: high-frequency sampling → DSP feature extraction →
local (mock) inference → **JSON** summary telemetry published to the backend's
**real topic contract** (`mines/{mine_id}/nodes/{node_id}/telemetry`) with ISO
timestamps and `packet_seq` (interop with the live ingestion pipeline,
including its dedup — previously it published Python-dict reprs to a
non-contract topic and could never be ingested).

### `edge/inference/feature_extractor.py`
Rolling-window DSP: mean / std / peak + FFT energy (numpy). Real math; the
production intent (CMSIS-DSP on Cortex-M) is documented in-file.

### `edge/inference/edge_model.py`
Self-declared **mock ONNX wrapper** (the real `onnxruntime` session is a
commented line). Heuristic scoring only. Kept as simulator; never reported
as a deployed model.

### Server-side edge support (backend)
- `POST /api/edge/telemetry` — HTTP fallback that runs the FULL server pipeline
  (validation → Kalman → health → vibration → XGBoost → SHADOW → risk engine)
  and persists + broadcasts the result.
- `GET /api/edge/status` — honest status: MQTT state/metrics, pipeline model
  availability, artifact inventory.

## Target production architecture (when hardware exists)

```
Sensor -> Edge preprocessing -> Filtering -> Feature extraction
       -> Quantized inference (.onnx / TFLite-micro on ESP32-S3 / STM32 / RPi)
       -> MQTT telemetry (JSON, signed node identity)
```

Required for real deployment: MCU firmware, a quantized model artifact
exported from the trained classifier, node identity/authentication on the
broker (see `infra/mosquitto/acl_file`), and TLS. Until then, all
edge-originated data is clearly labelled and the simulator interop is
verified against the real ingestion path.
