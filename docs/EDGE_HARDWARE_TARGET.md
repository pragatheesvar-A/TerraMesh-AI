# TARGET EDGE HARDWARE

## 1. Primary MCU Target
Based on project dependencies, edge processing needs, and the reference configuration within `platformio.ini`, the primary target for the TerraMesh Edge node is the **ESP32-S3**.

### Why ESP32-S3?
* **DSP & TinyML Capability:** Includes vector instructions (AI acceleration) ideal for fast TensorFlow Lite Micro operations (vibration FFT, feature extraction).
* **RAM & Flash:** Typically 512KB SRAM (often combined with 2MB-8MB PSRAM) and 4MB-16MB Flash, easily accommodating the OS (FreeRTOS), network stack, store-and-forward buffers, and quantized `.tflite` model.
* **Interfaces:** Ample SPI/I2C/UART buses to support external LoRa modules (e.g. SX1276/SX1262), accelerometers (MPU6050/ADXL345), displacement sensors (VL53L0X), and strain gauges (HX711).
* **Power Management:** Deep sleep modes support solar/battery architectures.
* **Cost & Availability:** Highly affordable and widely available in module (WROOM) or dev-board form factors.

### Hardware Specifications
| Component | Specification |
| --------- | ------------- |
| **MCU** | Espressif ESP32-S3 (Xtensa Dual-Core 32-bit LX7 @ 240MHz) |
| **RAM** | 512 KB Internal SRAM + optional 2MB/8MB PSRAM |
| **Flash** | 4MB / 8MB / 16MB SPI Flash |
| **Radio** | Built-in Wi-Fi/BLE (for local commissioning/debug), External SPI LoRa (e.g., SX1262) |
| **Sensor Buses** | I2C, SPI, ADC, GPIO |
| **Runtime** | FreeRTOS |
| **Compiler / Toolchain** | PlatformIO (framework-arduinoespressif32) |
| **TinyML Framework** | TensorFlow Lite for Microcontrollers (TFLM) / Edge Impulse |
| **Model Constraints** | Target < 250KB Flash, < 100KB RAM |

## 2. Status
**CLASSIFICATION: REFERENCE HARDWARE**

This hardware has been explicitly targeted in the firmware architecture (`terramesh_node.ino`) and `platformio.ini`, but **has not been physically deployed or tested in this project**. All memory targets, processing latency estimates, and battery performance numbers remain **ENGINEERING ESTIMATES** until physical hardware tests are executed.
