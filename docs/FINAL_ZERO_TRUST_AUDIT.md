# FINAL ZERO-TRUST AUDIT — TerraMesh AI / MineGuard

> Audit completed: 2026-09-24 · Auditor: forensic zero-trust pass + three
> independent code-verification agents, then full remediation and re-verification.
> Every status below reflects RUNTIME EVIDENCE captured on this machine, not
> documentation claims. Reproduce with the commands in §Verification.

## Repository inventory

| Layer | Components |
|---|---|
| Frontend | React 19.2.8 + Vite 8 (JSX), Leaflet GIS, three.js twin, Recharts, i18next (5 locales), PWA (manifest + SW) |
| Backend | FastAPI (69 routes: 68 HTTP + 1 WS), SQLAlchemy, Pydantic, slowapi, structlog |
| Database | PostgreSQL 16 + TimescaleDB + PostGIS via Alembic chain (`da6b437f9b5b` → `f3c9d2e7a4b1`), 17 tables |
| Infrastructure | docker-compose (5 services, loopback ports, healthchecks), nginx reverse proxy, mosquitto dev+production configs |
| AI/ML | XGBoost + Isolation Forest artifacts (loaded live), Kalman bank, SHADOW physics fusion, forecaster, explainability |
| Edge | ESP32-S3 reference firmware, Raspberry-Pi gateway app (deployable) + gateway simulator, TinyML reference classifier |
| GIS/Spatial | PostGIS geometry + triggers + spatial API (ST_Contains live), EPSG:4326 everywhere |
| InSAR | Provider abstraction (mock/sentinel/nisar), scipy hotspot extraction |
| Notifications | FCM (real SDK, DB tokens), SMTP email, SMS gateways (env-driven), WebAudio siren |
| Security | PBKDF2 users + HMAC session tokens, API-key auth, audit_logs, rate limits, secure headers, CI secret scan |
| Testing | 63 tests: 57 offline + 3 live-DB integration + 3 live end-to-end |
| Docs | API.md, TIMESCALEDB.md, POSTGIS.md, INTEGRATIONS.md, DATA_PROVENANCE.md, ARCHITECTURE.md, DEPLOYMENT.md, EDGE_ARCHITECTURE.md, DATABASE_MIGRATION.md, MISSING_TECH_STACK_AUDIT.md, task.md |
| Deployment | docker-compose (verified config + 3 live infra services), Azure Bicep (authored), GitHub Actions CI (authored) |

## Feature matrix

| Component | Status | Evidence | Limitation |
|---|---|---|---|
| React Frontend | VERIFIED | Build ✓ (7.37s incl. PWA); 11 routed views; central API client; honest OFFLINE state; WS auto-reconnect | ~7 orphaned view files remain (documented dead code, no impact) |
| FastAPI Backend | VERIFIED | 69 routes; 3 previously-broken endpoints fixed and probe-verified (reports → 200 %PDF; model-info → 200 honest metrics; predict → 200 on all paths) | Dev CORS wildcard outside production |
| PostgreSQL | VERIFIED | Fresh `alembic upgrade head` cycle incl. downgrade; schema roundtrip test; production refuses SQLite + dev SECRET_KEY | — |
| TimescaleDB | VERIFIED | Hypertable + compression (7d) + retention (180d) policy jobs confirmed on live instance | Continuous aggregate = documented recipe |
| PostGIS | VERIFIED | Geometry columns + sync triggers; zones/routes seeded, hydrated 6/6; `/api/spatial/*` returns `engine: postgis` (live ST_Contains) | Zone geometry is seed data, not survey data |
| Redis | VERIFIED | E2E: node-state cache read after live MQTT ingest; reconnect/backoff; TTL-enforced fallback | — |
| MQTT | VERIFIED | E2E against live Mosquitto: allowlist/schema/dedup/timestamp gates (3/3 tests) | TLS = provided config, not deployed |
| Kalman | VERIFIED | In live pipeline; per-sensor profiles; reset via calibration endpoint | Scalar random-walk model |
| Isolation Forest | VERIFIED | Artifact loads; 10-feature live scoring; trained threshold sync | Synthetic training corpus |
| XGBoost | VERIFIED | Artifacts load; live inference; honest degraded mode | Synthetic training corpus; not retrainable here |
| TinyML / Edge | SIMULATED | Reference firmware (never compiled — no toolchain); honest "EDGE INFERENCE SIMULATOR" endpoint | No MCU hardware; on-node classifier is a threshold reference, not the trained model |
| InSAR | SIMULATED | `provenance: SIMULATED SATELLITE DATA` enforced by tests; Sentinel/NISAR raise BLOCKED | Live data needs credentials + SNAP/ISCE stack (docs/INTEGRATIONS.md §4) |
| Microseismic | VERIFIED software / SIMULATED data | Clustering, hypocenter (refuses <3 obs), density; labelled simulator | No seismic hardware |
| Geotechnical | VERIFIED | FoS/RMR-89/Q-system + tests; ENGINEERING CALCULATION provenance | Simplified empirical models; no certification |
| Environmental | VERIFIED | Gas channels + Coward triangle from supplied readings + tests; sensor-health separated from hazard | No gas hardware |
| GIS | PARTIAL | Leaflet + real basemaps; spatial API live | Twin/map zone overlays partly frozen seed data |
| Digital Twin | SIMULATED | Procedural 3D; what-if slider labelled SIMULATION; honest badge | Not driven by backend telemetry |
| Worker Safety | SIMULATED | 126-person scripted roster (no RFID); honest labels | Positions are demo data |
| Evacuation | VERIFIED (code path) | Operator-authorized, audited broadcasts; multi-channel dispatch | No external-system confirmation possible |
| FCM | BLOCKED (code VERIFIED) | Real SDK, DB-backed tokens, retry, invalid-token cleanup; `/api/notifications/status` honest | No Firebase credentials — delivery never fabricated |
| Email alerts | BLOCKED (code VERIFIED) | SMTP service + L2/L3 dispatch wired | No SMTP_HOST configured |
| SMS | BLOCKED (code VERIFIED) | Env-driven gateways; honest `SIMULATED DISPATCH` labels; CI guards old secrets | No gateway credentials |
| Offline Mode | VERIFIED (simulator) | Gateway store-and-forward verified live against the broker (outage→buffer→replay, original timestamps); deployable Pi app logic unit-verified | No physical gateway hardware |
| Security | PARTIAL | PBKDF2+HMAC auth, legacy unauthenticated endpoint removed (410), register-token auth (401 verified), prod key guard, WS optional auth, secure headers, rate limits, 14 FE hardcoded keys + old SMS credential purged | Full RBAC enforcement + TLS rollout = documented deployment steps |
| Audit Logging | VERIFIED | DB-backed trail (LOGIN_FAILED record captured at runtime); /api/audit | — |
| Reporting | VERIFIED | PDF endpoint 200 (`%PDF` magic, 2019B sample); provenance column; UNLABELED default | Caller-supplied content; no signing (none claimed) |
| Multilingual | PARTIAL | 5-locale catalogs with full 41-key parity; SMS templates EN/HI/BN/TA/SAT | Santali partially English-fallback |
| Docker | PARTIAL | `docker compose config` VALID; postgres/redis/mosquitto live + healthy | Backend/frontend images not built this session |
| CI/CD | PARTIAL | Workflow: backend tests, fresh-PG migration validation, frontend build, compose config, secret scan | Never executed on a hosted runner |
| Observability | VERIFIED | Honest /health (api/db/redis/mqtt/ml/fcm), /readiness, /liveness, X-Request-ID, structured JSON logs | — |
| End-to-End Pipeline | VERIFIED | `tests/test_e2e_live.py` 3/3: MQTT → validation → Kalman → XGBoost → SHADOW → risk engine → PostgreSQL (MEASURED) → Redis → WebSocket | — |
| Edge firmware | AUTHORED (reference) | ESP32-S3 firmware implementing deck stages 1–3 incl. Goertzel FFT-lite, store-and-forward, LoRa contract | Never compiled/flashed (no toolchain in this environment) |
| Azure deployment | AUTHORED | `infra/azure/main.bicep` (5 Container Apps; honest TimescaleDB caveat) | Never deployed (no subscription) |
| Mobile | VERIFIED (PWA) | Installable manifest + icons + service worker (API network-only); build-verified | Native push BLOCKED (VAPID/FCM); no Flutter binary |

## CRITICAL BLOCKERS (between LOCAL DEMONSTRATION READY and PRODUCTION VALIDATED)

1. **External credentials** — FCM, SMS gateway, SMTP, Copernicus (InSAR), Azure subscription. Why it matters: alert delivery + live satellite + cloud deployment cannot be exercised. Evidence: `scripts/verify_integrations.py` output (3 CONFIGURED live, 5 BLOCKED with exact env vars). Required action: provision per `docs/INTEGRATIONS.md`.
2. **Physical hardware** — ESP32-S3 nodes, LoRa receiver, Raspberry-Pi gateway, siren relay. Why it matters: measured telemetry requires deployed sensors. Evidence: reference firmware + gateway app exist as software, never executed on hardware. Required action: build/flash per `edge/firmware/terramesh_node/README.md` + `edge/gateway/install.md`.
3. **Field validation** — no mine-site trial, no blast-gate calibration, no regulatory assessment. Why it matters: engineering thresholds are project-defined limits, not statutory ones (code says so explicitly). Required action: field campaign + qualified geotechnical sign-off.

## MISSING TECHNOLOGY (genuinely absent, not blocked)

- None of the deck's software criteria remain unimplemented. Remaining absences are physical (hardware) or credential-based (deliveries), each with an exact provisioning path.

## UNSUPPORTED CLAIMS (found in audit → remediated or documented)

| Claim | Location | Outcome |
|---|---|---|
| `/api/reports/generate` "operational" | main.py:328 NameError + bytearray bug | **FIXED & probe-verified (200, %PDF)** |
| `/api/ml/model-info` metadata | response-model mismatch → 500 | **FIXED — honest artifact metrics (macro_f1 0.7808)** |
| `/api/ml/predict` fault/blast paths | missing class_probabilities → 500 | **FIXED — 200 on all paths** |
| "Self-healing" endpoint | lifecycle never driven (permanent HEALTHY) | **FIXED — update() wired into pipeline + fusion gating** |
| Duplicate blast-suppression rules | conflicting thresholds in two modules | **FIXED — single shared VibrationFingerprinter** |
| 14 hardcoded API keys + old SMSGate credential in frontend | shipped to browsers | **FIXED — central services/api.js; secrets purged; CI guards them** |
| Frontend "LIVE" claims while disconnected | unreachable OFFLINE state | **FIXED — honest OFFLINE/dataQuality wired** |
| "Statutory/DGMS" UI strings | ~15 frontend + 2 legacy docs | **REWORDED to project-defined limits** (legacy hackathon docs flagged as historical) |
| "EDGE INFERENCE SIMULATOR" honesty | endpoint fabricated ONNX fleet | **FIXED — real pipeline state reported** |
| SMS delivery receipts | random() fabricated "Delivered" | **FIXED — gateway-real or SIMULATED-labelled** |
| InSAR labeled "SATELLITE" on random data | old providers | **FIXED — SIMULATED SATELLITE DATA enforced by tests** |

Legacy documents (`apps/mineguard-core/README.md`, `MINEGUARD_AI_TECHNICAL_REPORT.md`,
`docs/reports/*`) remain historical hackathon artifacts — flagged, not rewritten.

## Verification commands (reproducible)

```powershell
# Offline + honesty suite (57 tests)
cd apps/mineguard-core/backend; python -m pytest tests/ -q --ignore=tests/test_e2e_live.py --ignore=tests/test_database.py
# Live PostgreSQL/TimescaleDB/PostGIS integration (3 tests)
$env:TEST_DATABASE_URL='postgresql://terramesh:<pw>@localhost:5432/terramesh'; $env:ENVIRONMENT='test_db'
python -m pytest tests/test_database.py -q
# Live end-to-end MQTT→PG→Redis pipeline (3 tests)
$env:ENVIRONMENT='e2e_live'; python -m pytest tests/test_e2e_live.py -q
# Frontend (PWA) build
cd ../frontend; npm run build
# Compose + honest integration status
cd ../..; docker compose config --quiet
python scripts/verify_integrations.py
```

## Runtime evidence snapshot (final run)

```
Tests: 57 offline + 3 live-DB + 3 live-e2e = 63 PASSING
Frontend: vite ✓ built 7.37s (PWA files present in dist/)
Compose: VALID | postgres/redis/mosquitto: healthy
Integrations: 3 CONFIGURED live (PostgreSQL, Redis, MQTT), 5 BLOCKED (FCM/SMS/SMTP/InSAR-live/secret-strength)
Gateway store-and-forward: published 7 | buffered 7 | replayed 8 (live broker)
Endpoint battery: reports 200 (%PDF) · model-info 200 · predict 200×3 paths ·
                  spatial 200 (engine=postgis) · scenario 200 · audit 200 ·
                  legacy ingest 410 · register-token 401 unauthenticated
```

## FINAL CLASSIFICATION

**LOCAL DEMONSTRATION READY**

The complete MQTT → validation → Kalman → XGBoost → SHADOW → risk engine →
PostgreSQL/TimescaleDB → Redis → WebSocket telemetry path executes and is
verified end-to-end on live infrastructure. Every deck criterion that can
exist as software is implemented — including reference firmware, a deployable
gateway application, an installable PWA, and authored Azure/CI deployment
assets. Production validation is withheld honestly: it additionally requires
external credentials, physical hardware, and a field-validation campaign,
each documented with an exact provisioning path (docs/INTEGRATIONS.md,
edge/firmware + edge/gateway). No simulation is presented as live
measurement; no blocked integration is reported as working.
