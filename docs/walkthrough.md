# TerraMesh AI — Operational Walkthrough

> Getting-started guide for operators, developers, and evaluators.
> Classification: **FIELD VALIDATION READY** (software complete; hardware/credentials/field-trial pending).

## What this system does

Real-time mine-subsidence monitoring for underground coal mines:
surface sensor nodes → LoRa mesh → gateway → MQTT → backend pipeline
(Kalman → XGBoost → Isolation Forest → SHADOW physics fusion → Unified Risk
Engine) → PostgreSQL/TimescaleDB/PostGIS → React dashboard with GIS map,
3D digital twin, graded alerts, evacuation authorization, and audit trail.

**Honesty contract:** every data element carries provenance (MEASURED /
SIMULATION / MODEL OUTPUT / ENGINEERING CALCULATION / OPERATOR ACTION).
Simulated data is always labelled; blocked integrations are never fabricated.

## Quick start (local development)

```powershell
# 1. Infrastructure (requires Docker Desktop)
cd "D:\COAL MINE"
$env:POSTGRES_PASSWORD='terramesh_dev_pass'
docker compose up -d postgres redis mosquitto
# Wait for healthy, then apply the schema:
cd apps\mineguard-core\backend
$env:DATABASE_URL='postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh'
alembic upgrade head
python seed_spatial.py            # zones + evacuation routes + PostGIS hydration

# 2. Backend
pip install -r requirements-dev.txt
python -m uvicorn main:app --port 8000 --reload

# 3. Frontend
cd ..\frontend
npm install
npm run dev                        # http://localhost:5173
```

## Key documentation

| Document | Purpose |
|---|---|
| `docs/FINAL_GAP_CLOSURE_AUDIT.md` | Complete gap-closure evidence + bugs found/fixed |
| `docs/FINAL_PPT_TRACEABILITY_MATRIX.md` | Every pitch-deck criterion → implementation status |
| `docs/FINAL_RELEASE_BLOCKERS.md` | What blocks production + exact provisioning steps |
| `docs/FINAL_ZERO_TRUST_AUDIT.md` | The forensic audit baseline |
| `docs/INTEGRATIONS.md` | Credential provisioning (FCM, SMS, SMTP, satellite, Azure) |
| `docs/ARCHITECTURE.md` | System architecture + data flow |
| `docs/DEPLOYMENT.md` | Docker/Azure deployment + hardening checklist |
| `docs/EDGE_ARCHITECTURE.md` | Edge firmware + gateway status |
| `docs/DATABASE_MIGRATION.md` | Alembic chain + spatial hydration |
| `docs/TIMESCALEDB.md` / `docs/POSTGIS.md` | Time-series + spatial architecture |
| `docs/DATA_PROVENANCE.md` | Provenance taxonomy + enforcement rules |
| `docs/THRESHOLD_AUDIT.md` | Every numeric threshold classified with rationale |
| `docs/FIELD_VALIDATION_PLAN.md` | Mine-site validation procedure (5 phases) |
| `docs/SENSOR_CALIBRATION_PLAN.md` | Per-sensor calibration standards |
| `docs/THRESHOLD_VALIDATION_PLAN.md` | Threshold tuning procedure |
| `docs/HARDWARE_INTEGRATION_CHECKLIST.md` | Node + gateway + broker bring-up |
| `docs/PILOT_DEPLOYMENT_CHECKLIST.md` | Pilot rollout + exit criteria |
| `docs/API.md` | Complete endpoint contract |
| `docs/MISSING_TECH_STACK_AUDIT.md` | Pre-completion audit (historical) |
| `task.md` | Implementation log (4 completion passes) |

## Verification commands

```powershell
# All offline tests (93)
cd apps\mineguard-core\backend
python -m pytest -q

# Live PostgreSQL/TimescaleDB/PostGIS (requires compose stack + seed)
$env:TEST_DATABASE_URL='postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh'
$env:ENVIRONMENT='test_db'; python -m pytest tests/test_database.py -q

# Live end-to-end MQTT→pipeline→PG→Redis→WS
$env:ENVIRONMENT='e2e_live'; $env:SECRET_KEY='terramesh_secure_key_2026'
python -m pytest tests/test_e2e_live.py -q

# Honest integration status (CONFIGURED vs BLOCKED)
python ../../scripts/verify_integrations.py

# Edge model contract validation (35 checks)
python generate_edge_contract.py; python validate_edge_contract.py

# i18n parity (5 locales, no silent fallbacks)
python ../../scripts/check_i18n_parity.py

# Frontend build
cd ..\frontend; npm run build

# Docker full stack
cd ..\..; docker compose build; docker compose up -d; docker compose ps
```

## Known limitations (honest)

1. **Hardware**: no physical sensors, LoRa, gateway, siren, or RFID exist —
   reference firmware and deployable software only
2. **Credentials**: FCM/SMS/SMTP/live-satellite delivery BLOCKED (code complete)
3. **Training data**: ML artifacts trained on synthetic corpus (no field data)
4. **Digital twin**: 3D deformation is the what-if slider (labelled), not
   backend-driven
5. **CI**: AUTHORED — every step verified locally; not yet on a hosted runner
6. **Legacy docs**: `apps/mineguard-core/README.md` and
   `MINEGUARD_AI_TECHNICAL_REPORT.md` contain outdated claims (historical records)
