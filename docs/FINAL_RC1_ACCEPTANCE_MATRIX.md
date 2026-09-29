# FINAL RC-1 ACCEPTANCE MATRIX

| Area | Implementation | Automated Test | Runtime Evidence | Physical Evidence | Field Evidence | External Evidence | Status | Limitation |
|---|---|---|---|---|---|---|---|---|
| Backend API | FastAPI | test_api.py | Docker | None | None | None | VERIFIED | Local only |
| Frontend | React/Vite | npm run build | Browser | None | None | None | VERIFIED | Local only |
| Mobile | React Native | Typecheck | APK build | None | None | None | VERIFIED | Not device-runtime tested |
| PostgreSQL / Timescale | Alembic | test_database.py | Docker | None | None | None | VERIFIED | Local DB |
| PostGIS Spatial | spatial.py | test_gis_validation.py | Local | None | None | None | VERIFIED | Demo geometry |
| 3D Digital Twin | Cesium/Three.js | Integration test | Browser | None | None | None | PARTIAL | Visual only |
| AI XGBoost | ml_service.py | test_api_ml.py | Local | None | None | None | VERIFIED | No field accuracy |
| AI Isolation Forest | ml_service.py | test_api_ml.py | Local | None | None | None | VERIFIED | Synthetic data |
| AI Governance | model_registry.py | test_ai_governance.py | Local | None | None | None | VERIFIED | No drift data |
| Kalman Filter | kalman.py | test_kalman.py | Local | None | None | None | VERIFIED | Synthetic signals |
| SHADOW Engine | shadow.py | Risk engine tests | Local | None | None | None | VERIFIED | Simulated deformation |
| Worker Safety | worker_safety.py | test_worker_location.py | Local | None | None | None | VERIFIED | Simulated positions |
| Evacuation | evacuation.py | test_worker_location.py | Local | None | None | None | VERIFIED | Simulation only |
| MQTT Ingestion | mqtt_service.py | test_mqtt_validation.py | Local | None | None | None | VERIFIED | Local broker |
| Notifications | notification_service.py | test_notifications.py | Local | None | None | None | SIMULATED | Credentials absent |
| Security / RBAC | auth.py | test_rbac.py, test_security.py | Local | None | None | None | VERIFIED | Not pen-tested |
| Observability | health.py | test_failure_matrix.py | Local | None | None | None | VERIFIED | Local metrics |
| InSAR / Satellite | remote_sensing/ | test_insar_provider.py | Local | None | None | None | SIMULATED | Mock provider |
| TinyML / Edge | Firmware docs | None | None | None | None | None | DESIGNED | No MCU hardware |
| LoRa / RF | Docs only | None | None | None | None | None | BLOCKED | No hardware |
| Azure / Cloud | docker-compose | None | None | None | None | None | REFERENCE | Not provisioned |
| Field Validation | None | None | None | None | None | None | FIELD VALIDATION PENDING | No mine-site access |
