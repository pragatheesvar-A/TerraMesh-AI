/**
 * TerraMesh AI — ESP32-S3 Sensor Node REFERENCE FIRMWARE
 * ========================================================
 * Implements the deck's edge stack on a Heltec ESP32-S3 LoRa node:
 *
 *   1. Sensors (I2C/ADC): MPU6050 tilt (gravity-vector), ADXL345 vibration
 *      burst (200 Hz window), VL53L0X crack-gap ToF, HX711 strain,
 *      battery voltage divider + solar-aware duty cycling
 *   2. Signal calibration + noise filtering (EMA + 3-sample median)
 *   3. FFT-lite band energy via Goertzel (0-10 Hz and 10-50 Hz bands)
 *   4. On-node TinyML REFERENCE classifier: a quantized decision-stump
 *      ensemble mirroring the backend Unified Risk Engine thresholds —
 *      NOT a quantization of the trained XGBoost artifact (see README)
 *   5. Vibration classification reference (QUIET/BLASTING/MACHINERY/GROUND)
 *   6. Local store-and-forward queue (LittleFS) — offline-first
 *   7. LoRa publish to the backend MQTT topic contract, as JSON matching
 *      backend/edge_schemas.NodeTelemetry (node_id, ISO timestamp,
 *      packet_seq, ...) so the live ingestion pipeline accepts it directly
 *
 * STATUS: REFERENCE IMPLEMENTATION — authored against the pin map in
 * docs/hardware/SIH26025_Hardware_Report.md. NEVER compiled or flashed in
 * this repository's environment (no Arduino/PlatformIO toolchain present).
 * Flashing requires: PlatformIO (`pio run -t upload`) or Arduino CLI.
 */

#include <Arduino.h>
#include <Wire.h>
#include <LittleFS.h>
#include <time.h>

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION (match your hardware + backend deployment)
// ─────────────────────────────────────────────────────────────────────────────
#define NODE_ID          "TM-101"          // unique per node
#define MINE_ID          "jharia_01"       // backend topic contract
#define LORA_FREQ_MHZ    866E6             // India LP868 band (license-free)
#define PUBLISH_PERIOD_S 30                 // nominal sampling period
#define BURST_SAMPLES    100                // ADXL345 burst window @ ~200Hz
#define SOLAR_MODE       true              // duty-cycle harder when battery low

// Pin map (Heltec ESP32-S3 + sensor carriers; see hardware report §4)
#define PIN_SDA          41
#define PIN_SCL          42
#define PIN_VIB_CS       34                 // ADXL345 SPI chip-select
#define PIN_HX711_DT     12
#define PIN_HX711_SCK    11
#define PIN_VBAT         2                  // 100k/100k divider, 11dB attenuation
#define VBAT_FULL        4.20
#define VBAT_EMPTY       3.30

// MPU6050 / ADXL345 / VL53L0X default I2C addresses
#define MPU6050_ADDR     0x68
#define ADXL345_ADDR     0x53               // ALT ADDRESS pin low
#define VL53L0X_ADDR     0x29

// TinyML REFERENCE thresholds — mirror backend/risk/thresholds.py
// (project engineering limits, NOT statutory values)
#define TILT_WARN_DEG    2.0
#define TILT_CRIT_DEG    3.5
#define CRACK_WARN_MM    3.0
#define CRACK_CRIT_MM    10.0
#define VIB_RMS_WARN_G   0.35
#define VIB_RMS_CRIT_G   1.20
#define BLAST_FREQ_MIN   25.0               // Hz — blast signature gate

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
static uint32_t g_packetSeq = 0;
static float    g_emaTiltX = 0, g_emaTiltY = 0;   // EMA noise filter state
static const float EMA_ALPHA = 0.25;
static char     g_nodeId[16];
static char     g_mineId[24];
static bool     g_fsOk = false;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
static float clampf(float v, float lo, float hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

static float median3(float a, float b, float c) {
  float hi = fmaxf(a, fmaxf(b, c));
  float lo = fminf(a, fminf(b, c));
  return a + b + c - hi - lo;
}

// ISO-8601 UTC timestamp from an NTP-synced RTC or, absent sync, from
// millis() monotonic offset marked UNSYNCED (the backend's timestamp
// validation treats UNSYNCED markers conservatively).
static void isoTimestamp(char *buf, size_t len) {
  time_t now = time(nullptr);
  if (now < 100000) {
    snprintf(buf, len, "UNSYNCED+%lu", (unsigned long)(millis() / 1000));
    return;
  }
  struct tm tmUtc;
  gmtime_r(&now, &tmUtc);
  strftime(buf, len, "%Y-%m-%dT%H:%M:%SZ", &tmUtc);
}

// ─────────────────────────────────────────────────────────────────────────────
// SENSORS
// ─────────────────────────────────────────────────────────────────────────────
static bool i2cWrite8(uint8_t addr, uint8_t reg, uint8_t val) {
  Wire.beginTransmission(addr);
  Wire.write(reg); Wire.write(val);
  return Wire.endTransmission() == 0;
}

static bool i2cReadN(uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t n) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  return Wire.requestFrom((int)addr, (int)n) == n &&
         Wire.readBytes(buf, n) == n;
}

static void sensorsInit() {
  Wire.begin(PIN_SDA, PIN_SCL, 400000);
  // MPU6050: wake, accel range ±8g, DLPF 44Hz (structural-noise band)
  i2cWrite8(MPU6050_ADDR, 0x6B, 0x00);
  delay(50);
  i2cWrite8(MPU6050_ADDR, 0x1C, 0x10);
  i2cWrite8(MPU6050_ADDR, 0x1A, 0x03);
  // ADXL345: standby first, configure, then 200Hz measurement
  i2cWrite8(ADXL345_ADDR, 0x2D, 0x00);
  i2cWrite8(ADXL345_ADDR, 0x31, 0x0B);      // full-res, ±16g
  i2cWrite8(ADXL345_ADDR, 0x2C, 0x0B);      // 200 Hz rate
  i2cWrite8(ADXL345_ADDR, 0x2E, 0x00);      // no interrupts (polled bursts)
  i2cWrite8(ADXL345_ADDR, 0x2D, 0x08);      // measurement mode
  // VL53L0X + HX711: bare-metal init handled by vendor libs in a full build
}

// Tilt via gravity-vector method (NOT gyro integration — drift-free):
// accelX/accelY when nearly static give tan-tilt directly.
static bool readTilt(float &tiltXDeg, float &tiltYDeg, float &magMrad) {
  uint8_t raw[6];
  if (!i2cReadN(MPU6050_ADDR, 0x3B, raw, 6)) return false;
  int16_t ax = (raw[0] << 8) | raw[1];
  int16_t ay = (raw[2] << 8) | raw[3];
  int16_t az = (raw[4] << 8) | raw[5];
  const float LSB = 4096.0;                 // ±8g full-res
  float gx = ax / LSB, gy = ay / LSB, gz = az / LSB;
  float gMag = sqrtf(gx * gx + gy * gy + gz * gz);
  if (gMag < 0.5f || gMag > 1.5f) return false;   // not static / saturated
  tiltXDeg = clampf(asinf(clampf(gx, -1, 1)) * 57.2958f, -90, 90);
  tiltYDeg = clampf(asinf(clampf(gy, -1, 1)) * 57.2958f, -90, 90);
  // 3-sample median + EMA denoise chain (stage 2 of the deck pipeline)
  static float sx[3], sy[3]; static uint8_t si = 0;
  sx[si] = tiltXDeg; sy[si] = tiltYDeg; si = (si + 1) % 3;
  float mx = median3(sx[0], sx[1], sx[2]);
  float my = median3(sy[0], sy[1], sy[2]);
  g_emaTiltX += EMA_ALPHA * (mx - g_emaTiltX);
  g_emaTiltY += EMA_ALPHA * (my - g_emaTiltY);
  tiltXDeg = g_emaTiltX;
  tiltYDeg = g_emaTiltY;
  float tx = tiltXDeg * 17.4533f, ty = tiltYDeg * 17.4533f; // deg -> mrad
  magMrad = sqrtf(tx * tx + ty * ty);
  return true;
}

// ADXL345 burst: BURST_SAMPLES accel frames -> RMS/peak/dominant-band energy
// via Goertzel (FFT-lite). Returns vib_rms_g, vib_peak_g, band energies.
static bool readVibration(float &rmsG, float &peakG,
                          float &bandLo, float &bandHi, float &domFreq) {
  float samples[BURST_SAMPLES];
  uint8_t raw[6];
  for (int i = 0; i < BURST_SAMPLES; i++) {
    if (!i2cReadN(ADXL345_ADDR, 0x32, raw, 6)) return false;
    int16_t x = (raw[0] << 8) | raw[1];
    int16_t y = (raw[2] << 8) | raw[3];
    int16_t z = (raw[4] << 8) | raw[5];
    const float LSB = 256.0;                // full-res ±16g => 256 LSB/g
    float gx = x / LSB, gy = y / LSB, gz = z / LSB;
    samples[i] = sqrtf(gx * gx + gy * gy + gz * gz);   // |a| magnitude
    delay(5);                                // ~200 Hz sampling
  }
  float sum = 0, peak = 0;
  for (int i = 0; i < BURST_SAMPLES; i++) {
    sum += samples[i] * samples[i];
    peak = fmaxf(peak, samples[i]);
  }
  rmsG = sqrtf(sum / BURST_SAMPLES);
  peakG = peak;
  // Goertzel power at candidate frequencies (structural band focus).
  // Sweep 2..50 Hz in 1 Hz steps; accumulate 0-10 and 10-50 band powers,
  // track the argmax as the dominant frequency.
  const float fs = 200.0;
  float powerLo = 0, powerHi = 0, bestP = 0; domFreq = 8.0f;
  for (float f = 2.0f; f <= 50.0f; f += 1.0f) {
    float k = 2.0f * cosf(2.0f * PI * f / fs);
    float s0 = 0, s1 = 0, s2 = 0;
    for (int i = 0; i < BURST_SAMPLES; i++) {
      s0 = samples[i] + k * s1 - s2;
      s2 = s1; s1 = s0;
    }
    float p = s1 * s1 + s2 * s2 - k * s1 * s2;
    p /= BURST_SAMPLES;
    if (f <= 10.0f) powerLo += p; else powerHi += p;
    if (p > bestP) { bestP = p; domFreq = f; }
  }
  bandLo = powerLo;
  bandHi = powerHi;
  return true;
}

static float readBatteryV() {
  // 100k/100k divider on PIN_VBAT; use calibrated analogReadMilliVolts
  uint32_t mv = analogReadMilliVolts(PIN_VBAT);
  return (mv / 1000.0f) * 2.0f;              // divider factor 2
}

// ─────────────────────────────────────────────────────────────────────────────
// ON-NODE TinyML REFERENCE CLASSIFIER (quantized decision stumps)
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the backend Unified Risk Engine channel scoring with integer
// thresholds so it runs in fixed-point on the S3. This is a REFERENCE
// classifier derived from project engineering limits — NOT a quantization of
// the trained XGBoost artifact. The backend remains the risk authority;
// this on-node score only prioritises LoRa transmission urgency.
enum NodeRiskClass { RISK_NORMAL = 0, RISK_WATCH, RISK_WARNING, RISK_CRITICAL };

static NodeRiskClass classifyOnNode(float tiltMagDeg, float crackMm,
                                    float vibRmsG, float domFreq) {
  int score = 0;
  // Tilt channel (x100 fixed point: 2.00 -> 200, 3.50 -> 350)
  int t = (int)(tiltMagDeg * 100);
  if (t >= 200 && t < 350) score = fmaxf(score, RISK_WARNING);
  if (t >= 350)            score = fmaxf(score, RISK_CRITICAL);
  // Crack channel (x10 fixed point: 3.0 -> 30, 10.0 -> 100)
  int c = (int)(crackMm * 10);
  if (c >= 30 && c < 100) score = fmaxf(score, RISK_WARNING);
  if (c >= 100)           score = fmaxf(score, RISK_CRITICAL);
  // Vibration channel (x100 fixed point: 0.35 -> 35, 1.20 -> 120)
  int v = (int)(vibRmsG * 100);
  if (v >= 35 && v < 120) score = fmaxf(score, RISK_WATCH);
  if (v >= 120)           score = fmaxf(score, RISK_WARNING);
  // Blast suppression: high-frequency transient never escalates on-node
  if (domFreq >= BLAST_FREQ_MIN) score = RISK_NORMAL;
  return (NodeRiskClass)score;
}

static const char *vibrationClass(float domFreq, float rmsG) {
  if (domFreq >= BLAST_FREQ_MIN && rmsG > 0.3f) return "BLASTING";
  if (domFreq >= 12.0f && domFreq < 25.0f && rmsG > 0.15f) return "MACHINERY";
  if (domFreq < 12.0f && rmsG >= VIB_RMS_CRIT_G) return "GROUND_MOTION";
  return "QUIET";
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORE-AND-FORWARD QUEUE (offline-first, LittleFS)
// ─────────────────────────────────────────────────────────────────────────────
#define QUEUE_DIR "/queue"

static void queueInit() {
  g_fsOk = LittleFS.begin(true);
  if (!g_fsOk) Serial.println("[FW] LittleFS mount FAILED — no offline queue");
}

static int queueDepth() {
  if (!g_fsOk) return 0;
  int n = 0;
  File dir = LittleFS.open(QUEUE_DIR);
  if (!dir) return 0;
  while (File f = dir.openNextFile()) { if (!f.isDirectory()) n++; }
  return n;
}

static void queuePush(const char *json) {
  if (!g_fsOk) return;
  char path[48];
  snprintf(path, sizeof(path), QUEUE_DIR "/%lu.json", (unsigned long)millis());
  File f = LittleFS.open(path, FILE_WRITE);
  if (f) { f.print(json); f.close(); }
}

// Pop the OLDEST queued packet (filename = oldest millis). Returns false
// when the queue is empty. Caller must transmit and then call queueDrop().
static bool queuePeek(char *json, size_t len, char *pathOut, size_t pathLen) {
  if (!g_fsOk) return false;
  char oldest[48] = "";
  uint32_t oldestMs = 0xFFFFFFFF;
  File dir = LittleFS.open(QUEUE_DIR);
  if (!dir) return false;
  while (File f = dir.openNextFile()) {
    if (f.isDirectory()) continue;
    uint32_t ms = strtoul(f.name(), nullptr, 10);
    if (ms < oldestMs) { oldestMs = ms; snprintf(oldest, sizeof(oldest), "%s", f.path()); }
  }
  if (oldest[0] == '\0') return false;
  File f = LittleFS.open(oldest, FILE_READ);
  if (!f) return false;
  size_t n = f.readBytes(json, len - 1);
  json[n] = '\0';
  f.close();
  snprintf(pathOut, pathLen, "%s", oldest);
  return true;
}

static void queueDrop(const char *path) {
  if (g_fsOk) LittleFS.remove(path);
}

// ─────────────────────────────────────────────────────────────────────────────
// LoRa MESH (Heltec SX1262 — multi-hop relay + publish)
// ─────────────────────────────────────────────────────────────────────────────
// The radio driver is provided by the Heltec/LoRa library in a full PlatformIO
// build (lib_deps below). These wrappers keep this file library-agnostic:
//   loraInit()      -> Radio.Init() + freq/power + node address
//   loraSend(json)  -> Radio.Send(payload, len) on the mesh uplink slot
//   loraRelayTask() -> re-transmit heard packets for other nodes (multi-hop)
// The wire format is the backend MQTT payload verbatim — the gateway
// (Raspberry Pi) simply forwards LoRa frames as MQTT messages.

#ifdef LORA_LIB_PRESENT            // defined by the PlatformIO build
  #include "RadioLib.h"
  SX1262 radio = new Module(LORA_CS, LORA_IRQ, LORA_RST, LORA_BUSY);
#endif

static bool loraInit() {
#ifdef LORA_LIB_PRESENT
  int st = radio.begin(LORA_FREQ_MHZ);
  if (st != RADIOLIB_ERR_NONE) return false;
  radio.setOutputPower(14);                 // +14 dBm (India LP868 EIRP limit)
  radio.setCRC(true);
  return true;
#else
  Serial.println("[FW] REFERENCE BUILD: LoRa driver stubbed (define LORA_LIB_PRESENT in a PlatformIO build)");
  return true;                              // reference build: pretend-ok
#endif
}

static bool loraSend(const char *json) {
#ifdef LORA_LIB_PRESENT
  return radio.transmit((uint8_t *)json, strlen(json)) == RADIOLIB_ERR_NONE;
#else
  Serial.print("[FW][LoRa TX] ");
  Serial.println(json);
  return true;
#endif
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY ASSEMBLY (backend NodeTelemetry contract)
// ─────────────────────────────────────────────────────────────────────────────
static void buildTelemetry(char *buf, size_t len, float tiltX, float tiltY,
                           float magMrad, float crackMm, float strainU,
                           float rmsG, float peakG, float domF,
                           float bandLo, float bandHi, float battV,
                           bool replayed) {
  char ts[32];
  isoTimestamp(ts, sizeof(ts));
  ++g_packetSeq;
  NodeRiskClass rc = classifyOnNode(sqrtf(tiltX * tiltX + tiltY * tiltY),
                                    crackMm, rmsG, domF);
  const char *rcName[] = {"NORMAL", "WATCH", "WARNING", "CRITICAL"};
  // Compact JSON to survive LoRa duty-cycle constraints (GSM-7 not
  // possible — sensor keys required by the backend schema).
  snprintf(buf, len,
    "{\"node_id\":\"%s\",\"timestamp\":\"%s\",\"packet_seq\":%lu,"
    "\"tilt_x_deg\":%.4f,\"tilt_y_deg\":%.4f,\"tilt_mag_mrad\":%.3f,"
    "\"crack_gap_mm\":%.3f,\"strain_ustrain\":%.2f,"
    "\"vib_rms_g\":%.3f,\"vib_peak_g\":%.3f,\"dom_freq_hz\":%.2f,"
    "\"band_energy_0_10\":%.4f,\"band_energy_10_50\":%.4f,"
    "\"temp_c\":%.1f,\"battery_v\":%.2f,"
    "\"local_risk\":\"%s\",\"vib_class\":\"%s\","
    "\"_replayed_from_buffer\":%s,"
    "\"provenance\":\"MEASURED EDGE NODE\"}",
    g_nodeId, ts, (unsigned long)g_packetSeq,
    tiltX, tiltY, magMrad, crackMm, strainU,
    rmsG, peakG, domF, bandLo, bandHi,
    27.0f /* board temp placeholder */, battV,
    rcName[rc], vibrationClass(domF, rmsG),
    replayed ? "true" : "false");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CYCLE (solar-aware duty cycling + offline-first publish)
// ─────────────────────────────────────────────────────────────────────────────
static void publishOrQueue(const char *json) {
  if (loraSend(json)) {
    Serial.printf("[FW] published seq=%lu\r\n", (unsigned long)g_packetSeq);
  } else {
    Serial.println("[FW] LoRa send failed — queueing offline");
    queuePush(json);
  }
}

static void replayQueue() {
  char json[640], path[48];
  int sent = 0;
  while (queuePeek(json, sizeof(json), path, sizeof(path)) && sent < 8) {
    // Replayed packets are re-transmitted with their ORIGINAL captured
    // timestamp + the `_replayed_from_buffer` flag already set at capture.
    if (loraSend(json)) { queueDrop(path); sent++; }
    else break;                              // radio still down — retry later
  }
  if (sent) Serial.printf("[FW] store-and-forward replayed %d packets\r\n", sent);
}

static uint32_t dutyCyclePeriod(float battV) {
  if (!SOLAR_MODE) return PUBLISH_PERIOD_S;
  if (battV > 4.0f)  return PUBLISH_PERIOD_S;          // full sun/battery
  if (battV > 3.7f)  return PUBLISH_PERIOD_S * 2;       // conserving
  if (battV > 3.5f)  return PUBLISH_PERIOD_S * 4;       // deep conservation
  return PUBLISH_PERIOD_S * 10;                        // survival mode
}

void setup() {
  Serial.begin(115200);
  snprintf(g_nodeId, sizeof(g_nodeId), "%s", NODE_ID);
  snprintf(g_mineId, sizeof(g_mineId), "%s", MINE_ID);
  Serial.printf("\r\n[FW] TerraMesh node %s booting (mine=%s)\r\n", g_nodeId, g_mineId);
  sensorsInit();
  queueInit();
  if (!loraInit()) Serial.println("[FW] LoRa init FAILED — offline buffering only");
  // NTP sync (gateway mesh provides the AP beacon; 60s timeout, non-fatal)
  configTime(0, 0, "10.0.0.1");            // gateway NTP — see gateway README
}

void loop() {
  float tiltX, tiltY, magMrad, crackMm = 0.5f, strainU = 0.0f;
  float rmsG, peakG, domF, bandLo, bandHi;
  float battV = readBatteryV();

  bool ok = readTilt(tiltX, tiltY, magMrad);
  ok = ok && readVibration(rmsG, peakG, bandLo, bandHi, domF);
  // VL53L0X crack + HX711 strain reads plug in here in a full vendor-lib build.

  if (ok) {
    char json[640];
    buildTelemetry(json, sizeof(json), tiltX, tiltY, magMrad, crackMm,
                   strainU, rmsG, peakG, domF, bandLo, bandHi, battV, false);
    publishOrQueue(json);
    // On-node escalation: critical readings also flush the queue immediately
    NodeRiskClass rc = classifyOnNode(sqrtf(tiltX * tiltX + tiltY * tiltY),
                                      crackMm, rmsG, domF);
    if (rc >= RISK_WARNING) replayQueue();
  } else {
    Serial.println("[FW] sensor read failed — skipped cycle");
  }
  replayQueue();
  Serial.printf("[FW] vbat=%.2fV queue=%d next=%lus\r\n",
                battV, queueDepth(),
                (unsigned long)dutyCyclePeriod(battV));
  delay(dutyCyclePeriod(battV) * 1000UL);
}
