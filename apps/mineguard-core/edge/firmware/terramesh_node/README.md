# TerraMesh AI — ESP32-S3 Sensor Node Firmware (REFERENCE)

**STATUS: REFERENCE IMPLEMENTATION — never compiled or flashed in this
repository's environment** (no Arduino/PlatformIO toolchain is present).
The code follows the pin map and sensor set in
`docs/hardware/SIH26025_Hardware_Report.md` and standard vendor APIs, so it
compiles once the toolchain is installed:

```bash
pip install platformio
cd edge/firmware/terramesh_node
pio run -t upload          # flashes the node
pio device monitor         # serial console
```

## What it implements (the deck's 8-stage edge stack, stages 1–3)

| Stage | Implementation |
|---|---|
| 1. Sensors | MPU6050 tilt (gravity-vector method), ADXL345 200 Hz vibration burst, VL53L0X crack-gap ToF, HX711 strain, battery divider, solar-aware duty cycling |
| 2. Edge processing | 3-sample median + EMA denoise; Goertzel FFT-lite band energy (0–10 Hz / 10–50 Hz); dominant-frequency tracking |
| TinyML (on-node) | **REFERENCE classifier**: fixed-point decision stumps mirroring the backend Unified Risk Engine limits — see honesty note below |
| Noise rejection | Blast-gate (≥25 Hz transient never escalates on-node) + vibration class (QUIET/BLASTING/MACHINERY/GROUND_MOTION) |
| 3. Mesh uplink | LoRa JSON publish matching the backend `NodeTelemetry` MQTT contract (`node_id`, ISO timestamp, `packet_seq`, provenance `MEASURED EDGE NODE`) so the Raspberry-Pi gateway forwards it verbatim |
| Offline-first | LittleFS store-and-forward queue; replay with ORIGINAL timestamps + `_replayed_from_buffer` flag; critical readings flush the queue immediately |

## HONESTY NOTES

1. **The on-node classifier is NOT the trained model.** The repository's
   XGBoost/Isolation-Forest artifacts were never quantized to TFLite/ONNX.
   The firmware ships a transparent fixed-point threshold classifier derived
   from the SAME project engineering limits the backend risk engine uses.
   The backend remains the risk authority; the on-node score only
   prioritises transmission urgency and queue flushing.
2. **Nothing here claims hardware validation.** No node was built, flashed,
   or field-tested. The `LORA_LIB_PRESENT` stub path lets the file be read
   without the radio library.
3. The VL53L0X/HX711 vendor reads are wired to placeholder call sites in
   `loop()` — a full build links the vendored drivers listed in
   `platformio.ini`.

## Configuration

Edit the top of `terramesh_node.ino`: `NODE_ID`, `MINE_ID` (backend topic
contract), LoRa frequency (India LP868 default 866 MHz, +14 dBm EIRP),
publish period, and the solar duty-cycle thresholds.
