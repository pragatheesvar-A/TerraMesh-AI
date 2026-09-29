# TerraMesh AI — Final PPT Traceability Matrix

> Every criterion from the SIH26025 pitch deck (TerraMesh_AI_Calyxion_v2_7.pdf) traced to its
> current implementation status with evidence. Previous status = the audit before the gap-closure pass.

| Criterion | Previous Status | Current Status | Evidence | Remaining Gap |
|---|---|---|---|---|
| **Surface mesh sensor nodes (tilt/vibration/crack/displacement)** | SIMULATED (demo data) | SIMULATED (demo data) + REFERENCE FIRMWARE | `edge/firmware/terramesh_node/` — ESP32-S3 firmware with MPU6050/ADXL345/VL53L0X/HX711, Goertzel FFT, store-and-forward, LoRa publish; never compiled (no toolchain) | Physical hardware; flashing; field calibration |
| **On-node TinyML** | SIMULATED | SIMULATED + REFERENCE CONTRACT | `edge/contracts/edge_model_contract.json` (18-feature order, checksums, quantization ranges, IO dims); `validate_edge_contract.py` 35/35; firmware on-node fixed-point classifier mirrors risk-engine limits | Trained model NOT quantized for MCU; no hardware |
| **LoRa/Zigbee mesh** | NOT IMPLEMENTED | REFERENCE (firmware radio layer) | `terramesh_node.ino` LoRa publish in backend topic contract; multi-hop relay task; store-and-forward LittleFS queue | Physical radio hardware; mesh range validation |
| **4G/Wi-Fi gateway (Raspberry Pi)** | SIMULATOR only | DEPLOYMENT-READY SOFTWARE + SIMULATOR | `edge/gateway/gateway_app.py` (serial→MQTT TLS, store-and-forward, siren relay GPIO); systemd unit; install guide; logic unit-verified 5/5; simulator verified live 9pub/10buf/8replay | No physical Pi; never run on hardware |
| **Cloud backend (FastAPI/PG+Timescale/PostGIS/Redis/MQTT)** | VERIFIED | VERIFIED | 73 routes; fresh-PG migration cycle; live e2e 3/3; compose 5/5 healthy | Azure template authored not deployed |
| **AI Analytics (Isolation Forest + XGBoost + SHADOW + fusion)** | VERIFIED | VERIFIED | Artifacts load + infer live; contract-validated; honest degraded mode | Training corpus synthetic |
| **Kalman filtering** | VERIFIED | VERIFIED | In live pipeline; contract feature order validated | — |
| **Risk engine (graded alerts, confidence + severity)** | VERIFIED | VERIFIED | 4-channel + ML max-fusion + hysteresis; every threshold classified in THRESHOLD_AUDIT.md | Field tuning pending |
| **GIS dashboard (live panel-wise risk)** | PARTIAL (frozen zones) | VERIFIED | `/api/zones` serves seeded PostGIS geometry + per-field provenance; RiskMap renders live zones with provenance labels; containment test: polygon == ST_Contains result | Zone geometry is seed, not survey |
| **3D Digital Twin (live sensor viz + explainable risk)** | SIMULATED | PARTIAL (entity sync) | Twin sensor markers now derive status from `/api/sensors` (same as 2D); `__TERRAMESH_TWIN_VERIFY()` verification mode; honest badges | Deformation visual = what-if slider, not backend data |
| **Alerts: L1 dashboard / L2 SMS+App+Email / L3 +siren+control-room** | PARTIAL | VERIFIED (code) | L1 ✓; L2: SMS (env-gateway) + FCM (code) + Email (code) wired into `dispatch_alert_channels`; L3: WebAudio siren + audited control-room flow; siren relay in gateway app | FCM/SMS/Email delivery BLOCKED (credentials) |
| **Saving & documentation (timestamped, located, severity-logged)** | PARTIAL | VERIFIED | PostgreSQL telemetry (provenance-labelled); audit_logs (verified at runtime); broadcast history + delivery receipts | — |
| **Automation: continuous sensing** | SIMULATED | SIMULATED + firmware reference | 200Hz burst + duty-cycled sampling in firmware; pipeline verified live | Physical deployment |
| **Scalable: modular nodes panel-by-panel** | SIMULATED | ARCHITECTED | Node identity in firmware + topic contract + edge contract support per-panel rollout | Field rollout |
| **Noise reduction (on-node processing)** | SIMULATED | REFERENCE (firmware) | Goertzel band-energy + blast-gate + 3-sample median + EMA in firmware | No hardware to validate |
| **Explainable (sensor trends + spatial evidence)** | VERIFIED | VERIFIED | SHADOW card: bilingual evidence per-parameter; XAI factors from actual fusion; spatial-consensus narrative | — |
| **Innovation: SHADOW residual** | VERIFIED | VERIFIED | Sheorey/NCB physics vs actual deformation; wired to pipeline + /api/ml/explain | — |
| **Innovation: self-healing sensor fusion** | FACADE (lifecycle never driven) | VERIFIED | `node_state_manager.update()` driven by pipeline; quarantined nodes excluded from fusion; 7 lifecycle-transition tests | Field validation with real faults |
| **Innovation: vibration fingerprinting** | VERIFIED (duplicate thresholds) | VERIFIED (unified) | Single shared VibrationFingerprinter; blast/machinery/rain/ground classes; suppression verified live | — |
| **Innovation: adaptive multi-sensor fusion** | VERIFIED | VERIFIED | SHADOW composite (0.40/0.25/0.20/0.15/health) + spatial consensus | — |
| **Email alerts** | NOT IMPLEMENTED | VERIFIED (code) | `notifications/email_service.py` — SMTP env-driven, retries, honest disabled state; wired into L2/L3 dispatch | SMTP credentials BLOCKED |
| **Mobile app (Flutter/worker alerts)** | NOT IMPLEMENTED | VERIFIED (PWA) | Installable manifest + icons + app-shell SW (API network-only); SMS templates EN/HI/BN/TA/SAT | Web push BLOCKED (VAPID/FCM); no native binary |
| **Azure cloud** | NOT IMPLEMENTED | AUTHORED | `infra/azure/main.bicep` (5 Container Apps; honest TimescaleDB caveat) | No subscription; never deployed |
| **Offline-first operation** | SIMULATOR only | VERIFIED (simulator + deployable gateway) | Store-and-forward verified live (9/10/8); restart-survival + FIFO + corrupted-skip + dedup tests; `edge/contracts` store-and-forward documented | No physical gateway |
| **Multilingual (EN/HI/BN/TA/SAT)** | PARTIAL (Santali stub, keys missing) | VERIFIED | 41 keys × 5 locales, full parity, protected-token safety; SMS templates all 5; `check_i18n_parity.py` automated | Longer safety copy Santali reviewed by a native speaker |
| **Certification pathway (DGMS)** | Unsupported claim | HONEST (removed) | All "DGMS/statutory" wording → "Project Standard 112" / "project-defined"; THRESHOLD_AUDIT.md classifies every number | Field validation + regulator engagement (future) |
