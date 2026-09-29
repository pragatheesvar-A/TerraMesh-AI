# RASPBERRY PI GATEWAY

## 1. Overview
The Gateway operates as the bridge between the disconnected LPWAN (LoRa) mesh and the central TerraMesh MQTT broker. 
**CLASSIFICATION: REFERENCE SOFTWARE (NOT DEPLOYED ON HARDWARE)**

## 2. Gateway Architecture
The Python application `gateway_app.py` runs as a systemd service (`terramesh-gateway.service`).

**Pipeline:**
1. **LoRa Receiver:** Reads serial frames from a USB-attached LoRa transceiver (e.g., ESP32 acting as a serial bridge).
2. **Packet Decoder & Validation:** Uses `validate_frame` to reject malformed packets immediately.
3. **Local Queue (Offline Buffer):** If MQTT is down, the packet is persisted to a local SQLite database (`PacketBuffer`).
4. **MQTT Forwarding:** Uses `paho-mqtt` to publish to the backend.

## 3. Store-and-Forward Implementation
The system guarantees offline survival. 
* **Database:** SQLite (`/var/lib/terramesh/gateway.db` or local during dev).
* **Operation:** 
  * If `uplink.publish()` fails, `buffer.push()` writes the packet to SQLite.
  * When `uplink.connected` becomes true, it drains the buffer (FIFO via `buffer.peek_batch()`), publishing each and then issuing `buffer.drop(row_id)`.
* **Replay Safety:** The timestamp of the reading remains the node's original RTC timestamp. Replayed packets simply arrive late at the backend, which processes them using sequence numbers to prevent state regression.

## 4. Local Siren Control
The gateway can drive a local hardware relay for physical alerting (`drive_siren` using `gpiozero`). This triggers an audible siren if a critical safety payload demands it (e.g., `siren_active` flag).

## 5. Security & MQTT
* MQTT traffic expects TLS if `MQTT_TLS=True` is provided in the gateway environment.
* The Gateway does NOT store PostgreSQL credentials; it only needs MQTT credentials restricted to the `mines/+/nodes/#` topic space.

## 6. Simulator
Because physical LoRa hardware is not deployed, the repository uses `gateway_simulator.py`. This script mimics the entire sequence (generating telemetry packets, simulating loss, simulating store-and-forward) directly to MQTT. Data from this simulator carries the `provenance: "SIMULATED EDGE ML"` label.
