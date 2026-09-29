# TerraMesh AI / MineGuard — API Contract

Base URL: `http://<host>:8000` (dev) — behind the frontend nginx proxy at `/api/` in deployment.
Interactive docs: FastAPI Swagger UI at `/docs`.

## Authentication

| Mechanism | Header | Notes |
|---|---|---|
| Service API key | `X-API-Key: <SECRET_KEY>` | Env-configured (`SECRET_KEY`). Full access. |
| Session token | `X-API-Key: JWT_TERRAMESH_<signed-payload>` | Issued by `POST /api/login`. HMAC-SHA256 signed, 12h expiry. |
| Legacy demo token | `X-API-Key: JWT_TERRAMESH_<hash>` | **NON-PRODUCTION ONLY** — accepted when `ENVIRONMENT != production` and no users are configured. |

Roles (`GET /api/roles`): `ADMIN, CONTROL_ROOM_OPERATOR, SAFETY_OFFICER, ENGINEER, SUPERVISOR, VIEWER`.

Rate limits (slowapi): login `10/min`, reports `5/min`, SMS `10/min`.

**Provenance labels** used throughout: `MEASURED DATA`, `MODEL OUTPUT`, `SIMULATION`, `SIMULATED SATELLITE DATA`, `SIMULATED SEISMIC DATA`, `ENGINEERING CALCULATION`, `OPERATOR ACTION`, `UNLABELED`.

---

## System

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | — | Honest per-service status: `api, database (postgis/timescaledb availability), redis, mqtt, ml_pipeline, fcm`. 503 when degraded. |
| `/readiness` | GET | — | Readiness = database reachable. 200/503. |
| `/liveness` | GET | — | Process-alive probe. Always 200. |
| `/api/roles` | GET | key | RBAC role list. |
| `/api/audit` | GET | key | Immutable audit trail (limit, action filter). |

## Authentication

| Endpoint | Method | Auth | Request | Response |
|---|---|---|---|---|
| `/api/login` | POST | — | `{email, password}` | `{token, user{name,role,email}, auth_mode}` — users-table (PBKDF2) or demo mode (only when users table empty AND not production; logged as `LOGIN` audit with "DEMO LOGIN"). 401 → `LOGIN_FAILED` audited. |

## Dashboard / Operations (simulation-labelled demo data source)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/dashboard/overview` | GET | — | Full overview (KPIs, risk intelligence, evacuation, infrastructure, system status). Redis-cached 2s. |
| `/api/sensors` · `/api/sensors/{id}` | GET | — | Sensor nodes (demo/sim state + live-ingest updates). |
| `/api/workers` | GET | — | Worker roster (SIMULATED personnel positions — no RFID hardware). |
| `/api/zones` | GET | — | Zone summaries. |
| `/api/alerts` | GET | — | Alert list. |
| `/api/alerts/{id}/acknowledge` | POST | — | Acknowledge (audited). |
| `/api/risk` | GET | — | AI risk intelligence (model output, labelled). |
| `/api/evacuation` | GET | — | Evacuation status + routes. |
| `/api/infrastructure` | GET | — | At-risk surface assets. |
| `/api/system-health` | GET | — | Sensor health categories. |
| `/api/demo/step/{n}` | POST | — | Demo scenario state machine (SIMULATION-labelled). |

## Telemetry Ingestion (MEASURED path)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/telemetry/ingest` | POST | key | Hardware/LoRa HTTP ingest → ML inference → WebSocket broadcast → PostgreSQL persistence (`provenance=MEASURED`). Schema: `TelemetryIngestSchema`. |
| `/api/ingest/telemetry` | POST | — | Legacy edge-gateway HTTP ingest. |
| `/api/edge/telemetry` | POST | key | Edge HTTP fallback: runs the FULL pipeline (validate → Kalman → health → vibration → XGBoost → SHADOW → risk engine), persists, broadcasts. Returns `warning_tier, risk_score, model_loaded, provenance`. |
| `/api/edge/status` | GET | key | **Honest** edge status: MQTT ingest state+metrics, pipeline model availability, artifact inventory. No fabricated node fleets. |
| `/api/kalman/node/{id}` | GET | key | Kalman filter diagnostics (`provenance: MODEL OUTPUT`). |

## Machine Learning

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/ml/predict` | POST | — | Packet inference. Response includes `inference_mode` (`ml_model`/`physics_fallback`), `anomaly_score`, `anomaly_threshold`, `provenance`, `class_probabilities`. |
| `/api/ml/model-info` | GET | — | Model metadata; metrics from artifact training reports; `is_loaded` reflects REAL load state. |
| `/api/ml/explain/{node}` | GET | key | XAI card + Sheorey/NCB physics residual. |
| `/api/ml/sensor-health/network` | GET | key | Sensor lifecycle states. |
| `/api/ml/retrain` | POST | key | Isolation-Forest retraining (audited). Fails honestly when the training corpus is absent. |

## Analytics (Phase 14)

| Endpoint | Method | Auth | Query | Description |
|---|---|---|---|---|
| `/api/analytics/telemetry` | GET | key | `node_id, mine_id, hours, minimum_risk, limit` | Historical telemetry from the canonical store (PG/TimescaleDB; honest `source` field; falls back to the edge buffer with a note). |
| `/api/analytics/replay/{node_id}` | GET | key | `hours` | Incident-replay timeline (telemetry→risk→tier per record, provenance preserved). |

## Simulation

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/simulation/what-if` | POST | key | Hypothetical risk evaluation through an ISOLATED risk-engine instance + geotechnical model. Always labelled `provenance: SIMULATION`; never touches live state. |

## Environmental Safety

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/environmental/classify` | POST | key | Gas/atmosphere classification from SUPPLIED readings (CH4/CO/CO2/O2/temp/humidity). Coward-triangle explosibility. Absent channels are never fabricated; input provenance echoed. |

## Microseismic

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/microseismic/summary` | GET | key | Event counts by provenance (all events SIMULATED in this deployment). |
| `/api/microseismic/clusters` | GET | key | Space-time-energy swarms. |
| `/api/microseismic/density` | GET | key | Event-density map. |
| `/api/microseismic/hypocenter` | POST | key | Hypocenter from ≥3 observations (refuses to fabricate below that). |
| `/api/microseismic/simulate-burst` | POST | key | Injects `SIMULATED SEISMIC DATA` events (labelled). |

## Remote Sensing (InSAR)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/satellite/insar/{mine_id}` | GET | key | Deformation grid + hotspots. Provider from `INSAR_PROVIDER` (default `mock` → `provenance: SIMULATED SATELLITE DATA, is_simulated: true`). `sentinel`/`nisar` raise BLOCKED without credentials — never fabricate. |

## Notifications (FCM)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/notifications/register-token` | POST | — | Register worker device token (DB-backed). |
| `/api/notifications/deregister-token/{worker}` | DELETE | key | Remove token. |
| `/api/notifications/status` | GET | key | FCM enabled/disabled state + counts. Disabled (no credentials) is reported honestly — sends return `success=false`, never fabricated. |

## Broadcasts & SMS

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/broadcasts` | GET/POST | key | List/create broadcast groups (PostgreSQL-backed). |
| `/api/broadcasts/{id}` | GET/DELETE | key | Fetch / archive group. |
| `/api/broadcasts/{id}/recipients` | GET | key | Recipient roster with SMS eligibility. |
| `/api/broadcasts/history` | GET | key | Dispatch history. |
| `/api/broadcasts/history/{id}/deliveries` | GET | key | Per-recipient receipts. |
| `/api/alerts/broadcast` | POST | key | Automated group alert (audited). |
| `/api/evacuation/broadcast` | POST | key | Operator emergency broadcast (audited; FCM attempted when enabled; `provenance: OPERATOR ACTION`). |
| `/api/sms/broadcast` | POST | key | Manual SMS broadcast. Receipts are ACTUAL gateway outcomes, or explicitly `SIMULATED` when no gateway configured — never fabricated `Delivered`. |
| `/api/alerts/send-sms` | POST | key | Single SMS via env-configured gateway (`SMS_GATEWAY_URL`/`FAST2SMS_API_KEY`); `SIMULATED DISPATCH` label without gateway. |

## Settings & Reports

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/settings/sync` | POST | key | Archive/retention + ML safety thresholds (audited with prev→new state). |
| `/api/settings/calibrate` | POST | key | Zero tilt sensors + reset Kalman state (audited). |
| `/api/reports/generate` | POST | key | fpdf2 report from caller-supplied data (audited; NOT digitally signed; provenance column defaults to `UNLABELED`, never `MEASURED`). 5/min. |

## WebSocket

| Endpoint | Auth | Messages |
|---|---|---|
| `/ws/live-monitoring` | — | Server → client: `CONNECTED`, `STATE_UPDATE`, `SENSOR_UPDATE`, `ALERT_NEW`, `TELEMETRY_UPDATE` (real pipeline events: decision, model_loaded, provenance), `MANUAL_SMS_DISPATCHED`. Client → server: `{"action":"PING"}` → `PONG`. Frontend auto-reconnects with exponential backoff. |

## Error semantics

- `401` — missing/invalid API key or credentials
- `400` — validation / duplicate-dispatch prevention
- `404` — unknown entity
- `429` — rate limit exceeded (slowapi)
- `503` — `/health`, `/readiness` only: a required dependency is genuinely unavailable
- `500` — honest failure detail (e.g. retraining without corpus)
## Scenario Playback (SIMULATION)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/scenario/inject | POST | key | Replay a labelled SIMULATION scenario through the full pipeline (body: {scenario_name, speed, max_cycles}). |
| /api/scenario/stop | POST | key | Stop the running playback. |
| /api/scenario/list | GET | key | Available scenario names in the SIMULATION corpus. |

## Spatial (PostGIS)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/spatial/zone-for-point | GET | key | Zone containing a point (lat,lng,mine_id). PostGIS ST_Contains when available; engine reported per result. |
| /api/spatial/nearest-sensors | GET | key | K nearest sensor nodes (KNN on PostGIS; haversine fallback). |
| /api/spatial/route-proximity | GET | key | Evacuation routes within radius_m of a point. |
| /api/spatial/workers-in-zone | GET | key | Workers inside a risk-zone polygon. |

## Email Alerts (L2/L3 channel)

Email dispatch is wired into dispatch_alert_channels for WARNING/CRITICAL/EVACUATE
severities. Configuration: SMTP_HOST/PORT/USERNAME/PASSWORD/FROM/USE_TLS +
ALERT_EMAIL_TO. Without SMTP_HOST the channel reports enabled: false and
nothing is sent - delivery is never fabricated.

