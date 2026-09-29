# TERRAMESH AI — FINAL RC-1 DEMO RUNBOOK

ALL DEMO DATA IS SIMULATION. No real notifications, sensors, or workers.

## Pre-Demo Safety Check
- [ ] FCM_KEY not set (or set to DEMO_BLOCKED)
- [ ] TWILIO_SID not set (or set to DEMO_BLOCKED)
- [ ] SMTP credentials not set
- [ ] DEMO_MODE=true in environment

## Infrastructure Start
```bash
docker compose up -d
# Wait ~30 seconds
docker compose ps    # All must show healthy
```

## Step 1 — System Health
- Navigate to: http://localhost:3000/health
- Expected: postgres=PASS, timescale=PASS, redis=PASS/DEGRADED, mqtt=PASS
- SIMULATION ENVIRONMENT banner must be visible

## Step 2 — Dashboard
- Mine: Jharia Coalfield (Demo)
- Provenance badge: DATA SOURCE: SIMULATION

## Step 3 — MQTT Telemetry Injection
```bash
python scripts/simulate_telemetry.py --mine jharia_01 --mode normal --count 20
```
- Confirm panels update on GIS map
- Risk engine shows NORMAL

## Step 4 — Normal Risk Cycle
- Observe Kalman-filtered readings
- Model version badge: xgboost_base_v1 / feature_v1

## Step 5 — Risk Escalation (Controlled)
```bash
python scripts/simulate_telemetry.py --mine jharia_01 --mode anomaly --panel PANEL-A
```
- Observe: NORMAL -> WARNING -> ELEVATED -> CRITICAL
- Alert created, audit log entry created

## Step 6 — GIS Overlay
- Risk overlay on GIS map (green/amber/red)
- Sensor markers, panel drill-down

## Step 7 — 3D Digital Twin
- Panels, sensors, risk states sync with GIS
- SIMULATION banner visible

## Step 8 — Worker Safety
- Simulated worker positions on mine map
- Worker enters danger zone -> status change

## Step 9 — Evacuation
- From CRITICAL state: initiate evacuation review
- Affected workers list generated
- Authorize -> audit trail: EVACUATION_DISPATCHED

## Step 10 — Notification Status
- Show: CREATED -> QUEUED -> LOCAL_DELIVERED
- External FCM: BLOCKED (credentials absent) — do NOT fabricate delivery

## Step 11 — InSAR Panel
- Provider state: MOCK - SIMULATED SATELLITE DATA
- Deformation overlay labelled SIMULATION

## Step 12 — AI Governance
- Model Registry: model_id, model_version, feature_version, threshold_version
- Inference provenance shown in last prediction

## Step 13 — Audit Trail
- Complete chain: telemetry -> risk -> alert -> evacuation -> notification
- Each event: event_id, mine_id, provenance, model_version, timestamp

## Step 14 — Reports
- Risk report: timestamp, provenance=SIMULATION, model_version, no signing claim

## Step 15 — Controlled Failure Demo
```bash
docker compose stop redis
```
- Dashboard: REDIS: DEGRADED — system continues on PostgreSQL
```bash
docker compose start redis
```
- Show recovery without data loss

## Step 16 — Provenance Check
- SIMULATION data carries provenance=SIMULATION end-to-end
- No SIMULATION event labelled MEASURED or LIVE

## Step 17 — Limitations (Always state explicitly)
- No physical hardware connected
- Satellite data mocked
- Notifications require live credentials
- Field validation pending hardware provisioning

## Demo Reset
```bash
python scripts/demo_reset.py
```

## Offline Fallback
Core demo runs fully locally. External providers show BLOCKED — correct and expected.
