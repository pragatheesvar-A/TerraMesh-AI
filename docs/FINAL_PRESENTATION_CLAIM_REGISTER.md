# FINAL PRESENTATION CLAIM REGISTER

| Claim | Evidence Level | Evidence Source | Executable? | Proven? | Presentation Safe? | Limitation |
|---|---|---|---|---|---|---|
| Real-time telemetry pipeline | SOFTWARE VERIFIED | test_e2e_integration.py | YES | YES | YES | MQTT is local; not RF-transmitted |
| Kalman filtering | SOFTWARE VERIFIED | test_kalman.py | YES | YES | YES | Synthetic test signals only |
| XGBoost risk prediction | SOFTWARE VERIFIED | test_api_ml.py | YES | YES | YES | No labelled field data |
| Isolation Forest anomaly detection | SOFTWARE VERIFIED | test_api_ml.py | YES | YES | YES | Trained on synthetic data |
| SHADOW fusion | SOFTWARE VERIFIED | risk engine logic | YES | YES | YES | Simulated deformation |
| PostGIS spatial containment | SOFTWARE VERIFIED | test_gis_validation.py | YES | YES | YES | Local DB geometry |
| GIS worker danger-zone | SOFTWARE VERIFIED | test_worker_location.py | YES | YES | YES | Simulated positions |
| 3D Digital Twin sync | SOFTWARE VERIFIED | WebSocket integration | YES | PARTIAL | YES (with label) | No direct physical feed |
| Evacuation orchestration | SOFTWARE VERIFIED | test_worker_location.py | YES | YES | YES | Simulation only |
| Multi-channel notifications | SIMULATED | test_notifications.py | YES | PARTIAL | YES (blocked label) | FCM/SMS/Email credentials absent |
| RBAC mine isolation | SOFTWARE VERIFIED | test_rbac.py | YES | YES | YES | In-process only |
| InSAR deformation integration | SIMULATED | test_insar_provider.py | YES | YES (mock) | YES (SIMULATED label) | No real satellite provider |
| TinyML edge inference | REFERENCE | firmware docs | NO | NOT EXECUTED | YES (DESIGNED label) | No physical MCU |
| LoRa range | BLOCKED | N/A | NO | NOT EXECUTED | YES (BLOCKED label) | No hardware |
| AI model accuracy | NOT QUANTIFIED | N/A | NO | NOT EXECUTED | NO - must not claim % | No labelled field dataset |
| Field mine deployment | FIELD VALIDATION PENDING | N/A | NO | NOT EXECUTED | YES (PENDING label) | No mine-site access |
