# TerraMesh AI — Final Gap Closure Audit

> Date: 2026-09-25 · This audit follows the complete gap-closure pass (Phases A-T).
> Every status is evidence-backed; commands are reproducible from this document.

## Verification battery (executed, recorded)

| Check | Result |
|---|---|
| Bare pytest (all suites) | **93 passed, 6 skipped** (skips = live-DB + live-e2e, env-gated by design) |
| Live PostgreSQL/TimescaleDB/PostGIS integration (`ENVIRONMENT=test_db`) | **3 passed** |
| Live end-to-end MQTT→pipeline→PG→Redis (`ENVIRONMENT=e2e_live`) | **3 passed** |
| Frontend build (PWA) | **vite ✓ built in 1.91s** |
| Docker: build + up | **5/5 containers healthy** (backend, frontend, postgres, redis, mosquitto) — verified via `docker compose ps` + in-container `/health` HTTP 200 |
| Docker: compose config | **VALID** |
| Integration status (`scripts/verify_integrations.py`) | **4 CONFIGURED / 4 BLOCKED** (PG, Redis, MQTT, SECRET_KEY configured; FCM, SMS, SMTP, live-InSAR blocked on credentials) |
| Edge model contract validation | **35/35 checks pass** |
| i18n parity (5 locales) | **PARITY OK** (0 missing, 0 silent operational fallbacks) |
| CI workflow steps (executed locally) | all green (compileall, imports, tests, contract, i18n, migration cycle on fresh PG, FE build, secret scan, compose) — **AUTHORED, NOT RUN on a hosted runner** |
| True E2E (Phase S) | MQTT → validation → Kalman → XGBoost → SHADOW → risk engine → **PostgreSQL (MEASURED, CRITICAL)** → Redis → analytics API → replay → audit-log — **VERIFIED** |

## Phase-by-phase closure

| Phase | Gap closed | Evidence |
|---|---|---|
| A — GIS | `/api/zones` serves seeded PostGIS geometry with per-field provenance (geometry: SEEDED DATABASE; status: SIMULATION); RiskMap renders LIVE BACKEND zones with provenance labels in the tooltip; containment tests | tests/test_gis_closure.py 4/4 |
| B — Digital Twin | 3D sensor markers derive status from the same `/api/sensors` the 2D map uses; `window.__TERRAMESH_TWIN_LEDGER` + `__TERRAMESH_TWIN_VERIFY()` verification mode; honest "SIMULATED VISUALIZATION" / "LIVE SENSOR SYNC" badges | build ✓; ledger in Mine3DScene |
| C — TinyML | `edge/contracts/edge_model_contract.json`: 18-feature deterministic order, sha256 checksums, quantization ranges, IO tensor dims, inference-result schema, fallback definition, CPU/RAM envelope; `generate_edge_contract.py` + `validate_edge_contract.py` (35 checks) | validator 35/35 |
| D — InSAR | Provider states (LIVE/MOCK/UNAVAILABLE/CONFIGURATION_REQUIRED), acquisition metadata (scene ID, CRS, units, nodata, extent), `/api/satellite/insar-status`; Sentinel raises honest errors; provenance test-enforced | tests/test_insar.py 8/8 |
| E — Worker location | Canonical `WorkerLocationFix` schema (x/y/z, panel_id, zone_id, location_source SIMULATOR|RFID|RTLS|UWB|OTHER, accuracy, battery, signal, status, provenance); 3 API endpoints; server-derived provenance (client can never self-declare); evacuation payload declares personnel provenance | tests/test_worker_location.py 9/9 |
| F — Multilingual | 5-locale catalogs (41 keys × 5, full parity); protected-token safety (CH4/CO/O2/EVACUATE survive translation); SMS templates EN/HI/BN/TA/SAT; `scripts/check_i18n_parity.py` automated enforcement | checker: PARITY OK |
| G — Security/RBAC | Backend-enforced role sets on 14 sensitive endpoints (engineering/emergency/audit/SMS/operations); 7 RBAC tests; FCM `tokens=` kwarg bug found & fixed | tests/test_rbac.py 7/7 |
| H — Docker | Built and running ALL 5 services; 5 real deployment bugs found+fixed: nginx `limit_req_zone` placement, `EDGE_DB_PATH` writable path, Python-3.11 f-string backslashes in 4 ml modules, production SECRET_KEY guard, IPv6 healthcheck | `docker compose ps`: all healthy |
| I — CI/CD | Workflow expanded: contract validation, i18n parity, RBAC + failure-matrix suites, PG service container, secret scan, compileall; every step executed locally | AUTHORED — NOT RUN |
| K — Offline hardening | Gateway app: PacketBuffer with restart-survival, FIFO ordered replay, corrupted-packet skip, QoS-1 dedup on replay; 13 failure-matrix tests | tests/test_failure_matrix.py 13/13 |
| L — Microseismic | Provenance enforced: simulator events carry `provenANCE_SIMULATED` through the entire pipeline (ingestion → service → density/clusters) | existing tests + provenance audit |
| M — Field validation | 5 documents: FIELD_VALIDATION_PLAN, SENSOR_CALIBRATION_PLAN, THRESHOLD_VALIDATION_PLAN, HARDWARE_INTEGRATION_CHECKLIST, PILOT_DEPLOYMENT_CHECKLIST — all marked FUTURE PROCEDURE | docs/ |
| N — Threshold audit | `docs/THRESHOLD_AUDIT.md` — every threshold classified (PROJECT STANDARD / ENGINEERING CALCULATION / MODEL THRESHOLD / SIMULATION PARAMETER) with value, unit, rationale, config location | docs/THRESHOLD_AUDIT.md |
| O — Provenance | Fresh scan: only honest occurrences remain in live code; "REAL-TIME PRODUCTION LOG STREAM" → "SYSTEM EVENT LOG STREAM"; one SystemHealthView string fixed | scan output |
| P — Explainable alerts | Verified: XAI factors + physics residual + gas classification all derive from actual packet values; `primary_driver` reflects real fusion result; found+fixed the XGBoost context-flags bug (`blast_flag`/`rain_flag`/`vehicle_flag` defaults) and the epoch-float timestamp bug (pd.to_datetime misreads as ns) | Phase P verification output |
| Q — Frontend polish | Build clean; central API client; honest OFFLINE/SIMULATED states; provenance labels in map tooltips; no new design regressions | npm build ✓ |
| R — Full battery | 93 offline + 3 live-DB + 3 live-e2e = **99 tests, all passing** | pytest output |
| S — True E2E | MQTT → validation → Kalman → XGBoost → SHADOW → risk → PostgreSQL (MEASURED, CRITICAL) → Redis → analytics → replay → audit-log | Phase S output |
| T — Failure matrix | All 12 rows executed as tests: MQTT-down, Redis-down, PG-down, malformed, duplicate, stale, freeze, unrealistic, FCM-absent, satellite-unavailable, outage+replay, corrupted-restart | tests/test_failure_matrix.py 13/13 |

## Bugs found & fixed during this pass

1. **FCM `tokens=` kwarg** — dispatch called `send_alert(tokens=...)` but the signature is `token_list=`; silently swallowed by try/except
2. **XGBoost context-flags crash** — packets without `blast_flag`/`rain_flag`/`vehicle_flag` crashed inference ("not in index"); now default to 0 per the edge contract
3. **Epoch-float timestamp bug** — `pd.to_datetime(float)` interprets epoch seconds as nanoseconds → 1970 rows invisible to time-filtered analytics; now detected by range and converted as seconds
4. **Python 3.11 f-string backslash** — 4 ml modules used `\\` in f-strings (3.12-legal, 3.11 container = SyntaxError)
5. **nginx `limit_req_zone` placement** — declared inside `server{}` (http-context only); container crashed on start
6. **EDGE_DB_PATH** — hardcoded `../data` unwritable in the container; now env-configurable
7. **Frontend healthcheck IPv6** — `localhost` resolved to ::1; nginx binds IPv4 → permanent unhealthy; now 127.0.0.1
8. **Production SECRET_KEY guard fired** — compose env now requires it (the guard works as designed)
