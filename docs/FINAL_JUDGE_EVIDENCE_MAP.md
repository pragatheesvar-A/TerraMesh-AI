# FINAL JUDGE EVIDENCE MAP

| PPT Claim | Feature | Code File | Test | Demo Step | Limitation |
|---|---|---|---|---|---|
| Real-time AI risk engine | Unified Risk Engine | risk_engine.py | test_risk_engine.py | Step 8 | Simulated telemetry |
| Kalman denoising | Kalman filter | kalman.py | test_kalman.py | Step 5 | Synthetic signal |
| PostGIS spatial analysis | Spatial helpers | spatial.py | test_gis_validation.py | Step 9 | Local DB geometry |
| GIS dashboard | Leaflet/Cesium | RiskMap.jsx | test_gis_closure.py | Step 9 | Simulated panels |
| Worker danger-zone alert | Worker safety | worker_safety.py | test_worker_location.py | Step 11 | Simulated positions |
| Evacuation pipeline | Evacuation logic | evacuation.py | test_worker_location.py | Step 12 | Simulation only |
| Multi-channel notifications | Notification router | notification_service.py | test_notifications.py | Step 13 | Local mock adapter |
| AI governance / model versioning | Model registry | model_registry.py | test_ai_governance.py | Step 7 | No field drift data |
| Security / RBAC | Auth middleware | auth.py | test_rbac.py, test_security.py | Step 16 | Local test clients |
| InSAR integration | InSAR provider | remote_sensing/ | test_insar_provider.py | Step 6 | Mock provider only |
| MQTT telemetry ingestion | MQTT listener | mqtt_service.py | test_mqtt_validation.py | Step 3 | Local broker |
| Offline resilience | Failure isolation | middleware.py | test_failure_matrix.py | Step 15 | Process-level simulation |
