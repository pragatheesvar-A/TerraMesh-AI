# TerraMesh AI / MineGuard — Missing Technology Stack Audit

> Generated: 2026-09-23 (pre-implementation) · **Final statuses appended: 2026-09-24 (post-implementation)**
> Auditor: automated deep audit (all backend, edge, infra, tests, docs, frontend-contract files read in full)
>
> The matrix below records the state FOUND during the audit. The
> **FINAL STATUS** table at the end records the state AFTER the
> technology-completion pass, with runtime verification evidence.
> Classification rules used throughout:
> `VERIFIED` = executed successfully at runtime on this machine.
> `BLOCKED — ENVIRONMENT NOT AVAILABLE` = integration implemented correctly but the required external service is not available for runtime proof.
> `SIMULATOR` = deliberately simulated component, clearly labelled, never presented as production.

## Legend

| Status | Meaning |
|---|---|
| COMPLETE | Code + integration present; runtime verified |
| COMPLETE (BLOCKED) | Code + integration present; runtime verification blocked by missing service/credentials |
| PARTIAL | Working core exists; material gaps remain (listed) |
| SIMULATOR | Intentional simulation, honestly labelled |
| MOCK (MISLABELED) | Simulation presented with stronger claims than reality — must be fixed |
| NOT IMPLEMENTED | Missing |

---

## Matrix

| # | TECHNOLOGY | CURRENT IMPLEMENTATION | MISSING COMPONENT | IMPLEMENTATION STATUS | BLOCKER | FILES INVOLVED | NEXT ACTION |
|---|---|---|---|---|---|---|---|
| 1 | **PostgreSQL** | SQLAlchemy engine via `DATABASE_URL` (prod refuses SQLite, dev fallback); pool_size=20; tables created via `create_all` at import | Migration correctness; `pool_pre_ping`; health-check helper; telemetry/alerts never persisted to PG (sim_engine is primary API source) | PARTIAL | Runtime proof needs a live PG (Docker daemon down at audit time) | `backend/database.py`, `backend/models.py`, `backend/main.py:43`, `alembic/` | Regenerate PostgreSQL-safe Alembic migration covering the full schema; persist telemetry; add ping/retry |
| 2 | **TimescaleDB** | Extension created in `init.sql`; hypertable creation is a commented-out example | Hypertable on telemetry; time index; compression policy; retention policy; continuous aggregates | NOT IMPLEMENTED (design exists only) | No live TimescaleDB instance | `infra/postgres/init.sql` | Add hypertable-ready schema + policy SQL + post-migration setup; document in `docs/TIMESCALEDB.md` |
| 3 | **PostGIS** | Extension created in `init.sql`; `GeoAlchemy2` in requirements but unused; models store raw lat/lng floats | Geometry(Point/Polygon) columns; spatial queries (point-in-polygon, nearest, containment); SRID documentation | NOT IMPLEMENTED | No live PostGIS instance | `backend/models.py`, `infra/postgres/init.sql` | Add geometry columns via migration, spatial query helpers, CRS doc (EPSG:4326) |
| 4 | **Redis** | Async client with silent in-memory fallback; dashboard cache (TTL 2s) is the only live consumer | Node-state cache usage; pub/sub wiring; reconnection; TTLs in fallback; non-sticky availability | PARTIAL | No local Redis (port 6379 closed) | `backend/cache/redis_client.py`, `backend/main.py` | Reconnect logic; wire node cache into pipeline; honest per-key timestamps; honest degraded status |
| 5 | **MQTT Ingestion** | paho subscriber; QoS 1; LWT set (unconsumed); optional TLS/auth | Payload schema validation (`edge_schemas` is dead code); dedup; timestamp validation; topic allowlist/mine-id check; heartbeat/status handling; LWT consumer; honest logging (current log claims a "simulation loop" that does not exist) | PARTIAL | No local broker (port 1883 closed) | `backend/mqtt/mqtt_client.py`, `backend/edge_schemas.py`, `infra/mosquitto/mosquitto.conf` | Full validator/dedup/timestamp pipeline; topic allowlist; LWT consumer; fix simulator interop (JSON + topic) |
| 6 | **Telemetry Pipeline** | `edge_ingest_loop.process_packet` runs validation→Kalman→health→vibration→XGBoost→forecast→SHADOW fusion→risk-engine override; writes SQLite | Event delivery (broadcast_callback never wired — events discarded); PostgreSQL persistence; store-after-override ordering bug; fabricated fallbacks (`xgb_probs=[1,0,0,0,0]`, `crack 5.0mm` default); `decision.reasoning` AttributeError latent crash | PARTIAL | — | `backend/edge_ingest_loop.py`, `backend/edge_database.py`, `backend/main.py:125` | Wire events to WebSocket + Redis; persist to PG; fix ordering + crash + fallbacks |
| 7 | **Kalman Filtering** | Real scalar Kalman with per-sensor noise profiles; wired into pipeline; API diagnostics | Innovation gating; vibration profile unused; reset never called; missing-data feeds 0.0 | COMPLETE (core) / PARTIAL (robustness) | — | `backend/analytics/kalman_filter.py`, `backend/edge_ingest_loop.py:119-141` | Add innovation gate + reset endpoint + None passthrough; document profiles |
| 8 | **Unified Risk Engine** | Thresholds (tilt/vibration/convergence), hysteresis, max-fusion with optional ML score; CRITICAL override in pipeline | Only 2 of 4 channels scored; ML score never injected by pipeline; zone aggregation dead; override persists after store; InSAR claim in docstring is false | PARTIAL | — | `backend/risk/*`, `backend/edge_ingest_loop.py:199-205` | Score displacement/crack; inject ML score; configurable weights; fix docstring + ordering |
| 9 | **Anomaly Detection (Isolation Forest)** | Trained artifact `backend/models/isolation_forest.joblib` + meta (threshold 0.504, AUC 0.99 on synthetic holdout) | `ml_service` never loads it (wrong MODELS_DIR); runtime call passes 4 features to a 10-feature model; hardcoded 0.65 threshold conflicts with trained 0.504; not used in edge pipeline (proxy score instead) | PARTIAL | Training corpus absent locally (can retrain-verify only) | `backend/ml_service.py:24,137,324`, `backend/ml/train_isolation_forest.py` | Fix load path + feature vector + threshold sync; distinguish sensor-fault vs physical anomaly |
| 10 | **XGBoost Risk Model (API path)** | Real artifacts exist (`xgboost_risk.joblib`, `terramesh_final_model.joblib`); edge pipeline loads the final model | `ml_service.MODELS_DIR` points at nonexistent `COAL MINE/terramesh-platform/models` → API serves rule-based fallback while reporting `is_loaded=True`; fabricated default probability vector; unverifiable accuracy metadata | PARTIAL (misreporting) | — | `backend/ml_service.py`, `backend/models/` | Fix path; make `is_loaded` honest; correct metadata from artifact reports; label fallback predictions |
| 11 | **TinyML / Edge Computing** | Honest doc (`EDGE_ARCHITECTURE.md` says simulator); mock ONNX wrapper; node simulator | `/api/edge/status` fabricates `active_edge_nodes: 4` + fake ONNX names; `/api/edge/telemetry` claims processing but does nothing; simulator publishes non-JSON to wrong topic | MOCK (endpoints mislabeled) | No MCU hardware; no ONNX artifacts | `backend/main.py:269-284`, `edge/**` | Honest status from real pipeline state; route edge telemetry through pipeline; fix simulator interop; keep EDGE INFERENCE SIMULATOR label |
| 12 | **InSAR** | Providers are `random.uniform` grids; service composites them | Honest provenance (currently labeled `"SATELLITE"` on random data); real provider abstraction (`SentinelProvider` real-API stub, `MockInSARProvider` labelled); polygon extraction is a stub | MOCK (MISLABELED) | No CopHub/API credentials | `backend/remote_sensing/*`, `frontend DataBadge.jsx` | Label as `SIMULATED SATELLITE DATA`; add real Sentinel integration marked BLOCKED; proper connected-component polygons |
| 13 | **Microseismic Analytics** | Nothing | Event ingestion, clustering, hypocenter estimation (when data suffices), density visualization, clearly labelled simulator | NOT IMPLEMENTED | No seismic hardware | — (new module) | Create `backend/microseismic/` service + simulator + tests |
| 14 | **Geotechnical Engine** | Sheorey (1993) NCB empirical subsidence physics in `shadow_engine` | Factor of Safety; RMR-89; Q-system; cohesion/friction/UCS inputs; explicit ENGINEERING CALCULATION output separate from ML | PARTIAL | — | `backend/ml/shadow_engine.py` | Create `backend/geotechnical/` module + tests; wire into risk engine as configurable input |
| 15 | **Environmental Safety** | `ch4_pct` fields in ingest schema only | Methane/CO/CO2/O2/temp/humidity model; explosibility analysis (documented Coward-triangle logic); sensor-health vs hazard separation | NOT IMPLEMENTED | No gas hardware | `backend/schemas.py` | Create `backend/environmental/` module + tests; never fabricate live gas readings |
| 16 | **FCM Push** | Real firebase-admin SDK code; severity config map; graceful disable without creds | Never invoked from any alert path; tokens in RAM (DB model `FCMTokenModel` unused); `firebase-admin` missing from requirements; no retry; no invalid-token cleanup; disabled path returns `success=True` | PARTIAL (unwired) | No Firebase credentials; no device farm | `backend/notifications/*`, `backend/requirements.txt` | Add dep; DB-backed token store; wire into alerts; retry + cleanup; report `fcm: disabled/blocked` honestly |
| 17 | **Historical Analytics** | SQLite edge DB stores telemetry + decisions (real writes from pipeline) | Query API (time-range/sensor/panel/risk filters); incident replay (telemetry→risk→alerts→actions timeline); TimescaleDB-backed history when available | PARTIAL | — | `backend/edge_database.py` | Add history/replay endpoints over stored data; PG/Timescale path where configured |
| 18 | **What-If Simulation** | Frontend-only slider (local state) | Server-side hypothetical-parameter evaluation through the unified risk engine; `SIMULATION` labelling; isolation from live state | NOT IMPLEMENTED (server-side) | — | — | Add `/api/simulation/what-if` running the risk engine on hypothetical inputs, labelled SIMULATION |
| 19 | **Worker Safety** | sim_engine serves 126 in-memory workers; WorkerModel exists but is never populated; SMS delivery receipts fabricated with `random.random()` | Honest delivery receipts; DB-backed worker registry option; explicit SIMULATED labelling of worker positions | PARTIAL/SIMULATED | No RFID hardware; no SMS gateway | `backend/simulation.py`, `backend/main.py:1056-1245` | Label simulated rosters; stop fabricating delivery statuses (mark `SIMULATED DISPATCH` when no gateway configured) |
| 20 | **Evacuation Engine** | Endpoints + demo flow; operator authorization step exists in UI modal | Server-side authorization record + audit trail; honest status (never claim executed without external confirmation) | PARTIAL | No external evacuation systems | `backend/main.py:653-668` | Persist authorization events to audit log; keep explicit human-in-the-loop |
| 21 | **Authentication / Security** | X-API-Key from env (dev default committed in examples); login accepts 5 hardcoded passwords and issues non-verifiable `JWT_TERRAMESH_*` tokens (all accepted by API key check) | Real auth (hashed credentials, JWT with expiry/roles); roles (ADMIN/OPERATOR/SAFETY OFFICER/ENGINEER/SUPERVISOR/VIEWER); secure headers; rate limits on sensitive routes; remove hardcoded SMS gateway credentials + LAN IP from source; `/api/settings/sync` is unauthenticated (mutates ML safety thresholds) | PARTIAL (demo-grade) | — | `backend/main.py:82-89,344-353,594-610,293`, `infra/mosquitto/mosquitto.conf` | Env-driven secrets only; secure-headers middleware; rate-limited login; protect settings sync (and fix frontend to send the key); broker auth config example |
| 22 | **Audit Logging** | Python logger lines (`terramesh.audit`) to stdout only | DB-backed immutable-style records (timestamp/user/role/action/resource/prev→new); coverage of login, config change, alert ack, evacuation authorization, report generation, user management | NOT IMPLEMENTED | — | `backend/main.py:17,240` | Add `AuditLogModel` + `audit_service`; wire into all critical actions |
| 23 | **PDF Reporting** | fpdf2 generator with provenance statement + provenance column | `report_service.py` still says "Strata Control Dossier"; unlabeled rows default to `MEASURED`; no digital signing (correctly none claimed) | PARTIAL | — | `backend/reports/*` | Fix wording; require explicit provenance per row; keep "no signing" honest |
| 24 | **Multilingual** | Frontend i18n (en/hi/bn/ta/sat) with English fallback; backend explainability EN/HI | Safety-critical string consistency audit | PARTIAL (functional) | — | `frontend/src/i18n/*`, `backend/ml/explainability.py` | Verify fallback chain; no unit translation |
| 25 | **Observability** | `/health` checks DB + optional Redis + ML pipeline flag | MQTT/FCM state in health; `/readiness` vs `/liveness`; request/correlation IDs; structured logging is configured but `configure_logging()` is never called; `system_status` in overview always says ONLINE (false) | PARTIAL | — | `backend/main.py:134-174,453-461`, `backend/logging_config.py` | Honest per-service health (`api/database/redis/mqtt/fcm`); wire logging init; request-ID middleware |
| 26 | **Docker** | Compose with postgres(timescale-ha pg16)/redis/mosquitto/backend/frontend; healthchecks | Frontend build broken (`COPY nginx.conf` — file not in build context); nginx reverse-proxy config exists but is mounted nowhere; `env_file` points at git-ignored `.env` (fresh clone fails); containerized frontend hardcodes `localhost:8000` | PARTIAL | Docker daemon not running at audit time (Docker Desktop installed; launch attempted) | `docker-compose.yml`, `infra/nginx/nginx.conf`, `frontend/Dockerfile` | Add frontend nginx.conf to build context; wire nginx service; `.env.example`-based compose; verify with `docker compose config` |
| 27 | **CI/CD** | None (no workflows, no test deps in requirements) | Install/lint/test/build pipeline | NOT IMPLEMENTED | — | — | Add `.github/workflows/ci.yml` + `requirements-dev.txt` |
| 28 | **DB Migrations** | Single Alembic migration generated against SQLite-era state; `upgrade()` fails on fresh PostgreSQL (ALTERs `broadcast_history` before it is created); runtime uses `create_all` + ad-hoc ALTERs | Fresh-PG-safe full-schema migration chain; migration docs accuracy | PARTIAL | Live PG for proof | `backend/alembic/versions/da6b437f9b5b_initial_schema.py`, `docs/DATABASE_MIGRATION.md` | Regenerate migration(s) covering full schema (incl. new tables); validate on PG when available |
| 29 | **API Contract Docs** | FastAPI auto-docs only | `docs/API.md` with endpoint/auth/schema/errors/provenance/rate-limits | NOT IMPLEMENTED | — | — | Write from actual route inventory |
| 30 | **Tests** | 17 tests: health/auth-stub, edge heuristics, InSAR mock shape, Kalman, risk engine (16 pass / 1 infra-skipped); `test_ml_integration.py` has zero assertions; `test_database.py` has a `SensorModel`/`SensorNodeModel` NameError if ever unskipped; no pipeline/ML/broadcast/WS coverage; pytest/pytest-asyncio/httpx not in requirements | Unit tests for geotechnical/environmental/telemetry-validation; integration tests marked as infra-requiring; honest ML tests (assert fallback labeling); fix NameError | PARTIAL | — | `backend/tests/*`, `backend/requirements.txt` | Expand suite; add dev requirements; fix broken test; mark infra tests explicitly |
| 31 | **Frontend↔Backend Contract** | 28 fetch sites; WS `/ws/live-monitoring` | `ReportModal` sends `Authorization: Bearer <terramesh_api_key>` (never stored; backend wants `X-API-Key`) → 401; `SettingsView` uses key `cm_live_sec_99a8f4c281e0` (rejected) for calibrate/retrain; `BroadcastModal` calls nonexistent `/api/emergency/broadcast` → 404; `MineDataContext` WS has no reconnect; URLs hardcoded (VITE_API_URL unused); `request_debug_log.txt` with PII is committed | PARTIAL (3 broken calls, 1 hygiene) | — | `frontend/src/components/modals/ReportModal.jsx`, `SettingsView.jsx`, `BroadcastModal.jsx`, `context/MineDataContext.jsx`, `backend/main.py` | Fix auth header + key, point to real endpoint, add WS reconnect, honor `VITE_API_URL` with localhost default, purge PII log |
| 32 | **SMS Gateway** | SMSGate HTTP call with hardcoded credentials `sms:CVgiuSQZ` + LAN IP `192.168.137.89:8080` in source; dead Fast2SMS branch; delivery receipts fabricated via `random.random()` | Env-driven gateway URL/credentials; honest status (no fake "Delivered"); PII debug log removal | PARTIAL (insecure + dishonest receipts) | No reachable gateway | `backend/main.py:574-651,1212-1245` | Env-only secrets; status `SIMULATED DISPATCH` when gateway unconfigured; delete committed log |

## Infrastructure Availability Snapshot (audit time, this machine)

| Service | Available | Note |
|---|---|---|
| Docker CLI + Compose v5.5.1 | YES (client 29.8.0) | Daemon was down; Docker Desktop launch attempted for runtime verification |
| PostgreSQL :5432 | NO | Awaiting Docker |
| Redis :6379 | NO | Awaiting Docker |
| Mosquitto :1883 | NO | Awaiting Docker |
| Python backend deps | YES | fastapi, sqlalchemy, redis, paho-mqtt, fpdf2, xgboost, sklearn installed |
| Frontend node_modules | YES | build verified (vite) |
| ML artifacts | YES (4 joblib + reports) | Training corpus NOT on machine (artifacts unreproducible here) |
| Firebase credentials | NO | FCM must report disabled/blocked |
| Sentinel/CopHub credentials | NO | InSAR must stay SIMULATED |

---

## FINAL STATUS (post-implementation, 2026-09-24)

| Technology | Implementation | Runtime Verification |
|---|---|---|
| PostgreSQL 16 | COMPLETE | VERIFIED (fresh `alembic upgrade head`; schema roundtrip test) |
| TimescaleDB | COMPLETE | VERIFIED (hypertable + compression/retention policy jobs) |
| PostGIS | COMPLETE | VERIFIED (geometry columns + ST_Contains test) |
| Redis | COMPLETE | VERIFIED (e2e node-cache read after MQTT ingest) |
| MQTT ingestion | COMPLETE | VERIFIED (e2e accept/dedup/rejection counters) |
| Kalman | COMPLETE | VERIFIED (unit + in-pipeline metrics) |
| Risk Engine | COMPLETE | VERIFIED (test suite, live pipeline) |
| Anomaly Detection (IF) | COMPLETE | VERIFIED (10-feature live scoring) |
| XGBoost API path | COMPLETE | VERIFIED (artifacts load; live inference) |
| TinyML / Edge | SIMULATOR | VERIFIED honest labelling (no hardware: by design) |
| InSAR | MOCK (SIMULATED) | VERIFIED honesty; live data BLOCKED (no credentials) |
| Microseismic | COMPLETE (software) + SIMULATOR data | Unit VERIFIED; hardware BLOCKED |
| Geotechnical | COMPLETE | Unit VERIFIED (5 tests) |
| Environmental | COMPLETE | Unit VERIFIED (9 tests) |
| FCM | COMPLETE (code) | BLOCKED (no Firebase credentials; never fabricated) |
| Offline Edge states | COMPLETE | VERIFIED states exercised |
| Worker Safety | SIMULATED data plane | Honest labels (no RFID hardware) |
| Evacuation | COMPLETE (audited operator flow) | VERIFIED code path |
| Historical Analytics | COMPLETE | VERIFIED (rows queried from live PG) |
| What-If Simulation | COMPLETE | VERIFIED (endpoint, isolated + labelled) |
| Audit Logging | COMPLETE | VERIFIED (records written during e2e) |
| Security | PARTIAL (fundamentals complete; full RBAC/TLS documented next steps) | VERIFIED auth/401/secure-header tests |
| Observability | COMPLETE | VERIFIED (/health reflects live infra truth) |
| Docker | COMPLETE (config + infra services) | VERIFIED for postgres/redis/mosquitto; app image builds documented |
| CI/CD | COMPLETE (workflow file) | Config present; not yet run on a hosted runner |
| Migrations | COMPLETE | VERIFIED (fresh-PG cycle incl. downgrade) |
| API Docs | COMPLETE (docs/API.md) | Written from actual route inventory |
| Tests | COMPLETE (62 tests) | ALL PASSING across env modes |
| Frontend Contract | COMPLETE | VERIFIED (npm build; auth/endpoint fixes) |
| SMS Gateway | INTEGRATED (env-driven) | BLOCKED (no gateway); SIMULATED DISPATCH labelled |
| Multilingual | COMPLETE (existing) | VERIFIED |

Test totals: **62 tests, all passing** (56 unit/honesty + 3 live-PG integration + 3 live end-to-end).

### Pass-4 additions (2026-09-24) — closing the 'non-matches' honestly

| Item | Status |
|---|---|
| ESP32-S3 reference firmware (deck stages 1-3) | AUTHORED, never compiled/flashed (no toolchain) |
| Raspberry-Pi gateway application + install guide | AUTHORED + logic unit-verified, never run on hardware |
| Mobile app criterion | VERIFIED as installable PWA (web push BLOCKED: VAPID/FCM) |
| Azure deployment template (Bicep) | AUTHORED, never deployed (no subscription) |
| Credential provisioning | docs/INTEGRATIONS.md + scripts/verify_integrations.py (3 CONFIGURED live / 5 BLOCKED, honest per-run output) |
