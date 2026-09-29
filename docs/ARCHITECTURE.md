# TerraMesh AI — Architecture

## Modules & status (post technology-completion)

| Module | Status | Notes |
|---|---|---|
| FastAPI backend (`apps/mineguard-core/backend`) | COMPLETE | 69 routes (68 HTTP + 1 WS); honest per-service health; structured logging; request IDs |
| PostgreSQL + Alembic | COMPLETE — RUNTIME VERIFIED | Full migration chain (`da6b437f9b5b` → `f3c9d2e7a4b1`); production refuses SQLite |
| TimescaleDB telemetry | COMPLETE — RUNTIME VERIFIED | Hypertable on `telemetry(ts)`; compression 7d; retention 180d (docs/TIMESCALEDB.md) |
| PostGIS spatial layer | COMPLETE — RUNTIME VERIFIED | EPSG:4326 geometry columns + triggers + `spatial.py` helpers (docs/POSTGIS.md) |
| Redis cache/pubsub | COMPLETE — RUNTIME VERIFIED | Reconnect/backoff; TTL-enforced fallback; node-state cache in pipeline |
| MQTT ingestion | COMPLETE — RUNTIME VERIFIED | Topic allowlist, schema validation, dedup, timestamp checks, LWT consumer |
| Telemetry pipeline | COMPLETE — RUNTIME VERIFIED | validate → Kalman → health → vibration → XGBoost → SHADOW → risk engine → PG → Redis → WebSocket |
| Kalman filtering | COMPLETE | Per-sensor noise profiles; part of the live pipeline (not an isolated API) |
| Unified Risk Engine | COMPLETE | 4 channels + ML max-fusion + hysteresis; configurable thresholds |
| ML (XGBoost + Isolation Forest) | COMPLETE | Artifacts load from `backend/models/`; honest degraded mode with labels |
| Geotechnical engine | COMPLETE | FoS / RMR-89 / Q-system — `ENGINEERING CALCULATION` provenance |
| Environmental safety | COMPLETE | Gas classification + Coward triangle from SUPPLIED readings only |
| Microseismic | COMPLETE (software) | Service + clustering + hypocenter estimator + labelled simulator |
| InSAR | MOCK PROVIDER (SIMULATED) | Provider abstraction; Sentinel/NISAR raise BLOCKED without credentials |
| FCM push | COMPLETE (code) — BLOCKED (credentials) | DB-backed tokens, retry, invalid-token cleanup |
| Edge computing | REFERENCE FIRMWARE + GATEWAY APP + SIMULATOR | docs/EDGE_ARCHITECTURE.md — software complete, no hardware deployed |
| Historical analytics | COMPLETE | Time-range/filters + replay endpoints over canonical store |
| What-if simulation | COMPLETE | `/api/simulation/what-if` — isolated, SIMULATION-labelled |
| Worker safety / evacuation | SIMULATED data plane | Operator-authorized, audited; no fabricated confirmations |
| Audit log | COMPLETE | Append-only `audit_logs` table + stdout structured stream |
| Frontend (React/Vite) | COMPLETE | Provenance badges; WS auto-reconnect; builds clean |

## Data flow (verified path)

```
Edge node (MQTT, MEASURED)
   -> Mosquitto (topic contract, QoS 1)
   -> MQTT client: allowlist -> schema -> dedup -> timestamp checks
   -> IngestPipeline:
         raw edge-buffer store (SQLite WAL)
         -> Kalman (MODEL OUTPUT; *_raw preserved)
         -> sensor health / vibration classification
         -> XGBoost 5-class (artifact) or labelled degraded mode
         -> SHADOW fusion (spatial consensus, blast suppression)
         -> Unified Risk Engine (thresholds + ML max-fusion, CRITICAL override)
         -> decision persistence (post-override)
         -> PostgreSQL telemetry row (provenance-labelled) [TimescaleDB hypertable]
         -> Redis node-state cache (TTL 10s, timestamped)
         -> WebSocket TELEMETRY_UPDATE
Dashboard (React) <- REST + /ws/live-monitoring (auto-reconnect)
```

Demo/simulation data (sim_engine, demo steps, scenario playback, InSAR mock,
seismic simulator, SMS without gateway) is always labelled SIMULATED and never
presented as live measurement. See docs/DATA_PROVENANCE.md for the label taxonomy.
