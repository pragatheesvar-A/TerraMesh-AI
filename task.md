# TerraMesh AI / MineGuard — task.md (Technology Completion Log)

Session: 2026-09-24 · Stack completion pass over `apps/mineguard-core` + `infra` + `docs`

## Executed in this session

1. **Audit** — deep read of backend/edge/infra/tests/docs/frontend-contract;
   `docs/MISSING_TECH_STACK_AUDIT.md` created as the plan of record.
2. **PostgreSQL** — regenerated the broken SQLite-era Alembic migration into a
   fresh-PG-safe full schema (17 tables); hardened `database.py`
   (pool_pre_ping, loopback-guard, honest health probe).
3. **TimescaleDB** — telemetry hypertable + compression (7d) + retention (180d)
   in migration `f3c9d2e7a4b1`; `docs/TIMESCALEDB.md`.
4. **PostGIS** — EPSG:4326 geometry columns, GiST indexes, lat/lng sync
   triggers, hydration functions, `backend/spatial.py` with pure-Python
   fallback; `docs/POSTGIS.md`.
5. **Redis** — reconnect/backoff, TTL-enforced fallback, timestamps on cached
   payloads, node-state cache wired into the pipeline, honest status.
6. **MQTT** — topic allowlist (mine-id enforced), Pydantic schema validation
   (`edge_schemas.NodeTelemetry` now enforced), packet dedup on
   (node_id, packet_seq), timestamp sanity, heartbeat/status routing, LWT
   consumer, connection state machine, honest logging.
7. **Pipeline** — events now delivered (broadcast_callback wired), PostgreSQL
   persistence with provenance, decision persistence AFTER the risk override
   (bug fix), `override_reason` field added (AttributeError fix), fabricated
   fallbacks removed ([1,0,0,0,0] → labelled uniform degraded mode;
   crack 5.0mm → 0.0).
8. **Risk engine** — all 4 channels scored, ML score injected by the pipeline,
   env-configurable thresholds, zone p90 aggregation; "DGMS" claims
   re-labelled as project engineering limits.
9. **ML service** — MODELS_DIR fixed (models now actually load), honest
   `is_loaded`, Isolation-Forest 10-feature vector + trained threshold sync,
   metadata from artifact reports, SHAP claim removed.
10. **Edge** — honest `/api/edge/status`, `/api/edge/telemetry` runs the real
    pipeline, simulator interop fixed (JSON + contract topic + packet_seq).
11. **New engines** — geotechnical (FoS/RMR-89/Q), environmental (gas +
    Coward triangle), microseismic (clustering/hypocenter/density + labelled
    simulator), each with unit tests and explicit provenance labels.
12. **InSAR** — provider abstraction; mock labelled `SIMULATED SATELLITE DATA`;
    Sentinel/NISAR raise BLOCKED without credentials; scipy hotspot polygons.
13. **FCM** — wired into alert paths; DB-backed token store; retry;
    invalid-token cleanup; honest disabled-state; dependency added.
14. **Security** — PBKDF2 users table + HMAC-signed tokens (demo login only
    outside production with empty users); `/api/settings/sync` authenticated;
    SMS credentials env-only (old hardcoded gateway + PII log purged from
    git); secure headers; rate-limited login; broker production config.
15. **Audit log** — `audit_logs` table + `audit_service` wired into login,
    acks, evacuation, broadcasts, SMS, settings, calibration, retrain, reports.
16. **Observability** — honest `/health` (api/database/redis/mqtt/ml/fcm),
    `/readiness`, `/liveness`, X-Request-ID, structured logging init.
17. **Historical analytics + replay + what-if** endpoints.
18. **Frontend contract** — ReportModal X-API-Key fix, SettingsView key fix,
    BroadcastModal pointed at the real `/api/alerts/broadcast` with a
    contract-matching payload, WebSocket auto-reconnect with backoff,
    TELEMETRY_UPDATE handling.
19. **Docker** — compose fixed (valid image tag, loopback-only infra ports,
    optional env_file, networks); frontend nginx.conf + Dockerfile ARG fix;
    valid `docker compose config`.
20. **CI** — `.github/workflows/ci.yml` (backend tests, fresh-PG migration
    validation, frontend build, compose config, secret scan).
21. **Docs** — API.md, TIMESCALEDB.md, POSTGIS.md, refreshed
    ARCHITECTURE/DEPLOYMENT/EDGE_ARCHITECTURE/FINAL_ZERO_TRUST_AUDIT.

## Runtime-verified on live infrastructure (this machine)

- Fresh `alembic upgrade head` on PostgreSQL 16 (TimescaleDB-ha image)
- Hypertable + compression + retention policy jobs present
- PostGIS geometry columns + `ST_Contains` query executed
- **End-to-end**: MQTT publish → validation → dedup → Kalman → XGBoost →
  SHADOW → risk engine → PostgreSQL row (MEASURED) → Redis node cache →
  rejection counters — via `tests/test_e2e_live.py` (3/3 PASS)

## Test totals

62 tests all passing across configurations:
- 59 passed, 3 skipped (offline+e2e mode)
- 3 passed (live-DB mode; the same 3 skip in the other mode)

## Completion pass 3 (2026-09-24, post-audit implementation)

- Fixed 3 runtime-broken endpoints: /api/reports/generate (NameError + bytearray->bytes),
  /api/ml/model-info (response-model mismatch), /api/ml/predict (fault/blast paths)
- Self-healing lifecycle now DRIVEN by the pipeline (NodeStateManager.update + fusion gating)
- Security: legacy unauthenticated /api/ingest/telemetry removed (410); register-token
  authenticated; production refuses the default SECRET_KEY; WS optional auth (WS_REQUIRE_AUTH)
- Blast suppression unified to the shared VibrationFingerprinter
- Email alerts (env-driven SMTP, honest disabled state) wired into L2/L3 multi-channel dispatch
- SIMULATION scenario corpus (5 scenarios x 900 rows, labelled) + /api/scenario/inject|stop|list
- PostGIS in the LIVE data path: seed_spatial.py seeded zones/routes (geometry hydrated 6/6)
  + /api/spatial/* endpoints (zone containment via ST_Contains verified: engine=postgis)
- Edge gateway store-and-forward SIMULATOR verified against live Mosquitto
  (outage -> buffer -> replay with original timestamps); edge packages fixed (init files, imports)
- Frontend: central services/api.js (VITE_API_BASE + session-token auth); stripped 14 hardcoded
  API keys, the old SMSGate credential + LAN IP, and hardcoded personal phone numbers
- Frontend honesty: honest OFFLINE/dataQuality state; alert-ack now hits the backend;
  real telemetry column in alerts table; SIMULATED labels on twin/InSAR; honest footer state;
  KPICard no longer fabricates exception rows; timestamp-derived alert IDs
- public/edge demo page: WS path + INITIAL_STATE + scenario endpoints contract fixed;
  DGMS-statutory claims reworded to project-defined
- i18n: 5-locale catalogs rewritten with the USED key set (41 keys x 5, verified parity);
  SMS templates now EN/HI/BN/TA/SAT

## Completion pass 4 — remaining non-matches closed honestly (2026-09-24)

Everything from the audit's 'only non-matches' list that is implementable
as software, with zero fabrication:

- ESP32-S3 REFERENCE FIRMWARE (edge/firmware/terramesh_node/): MPU6050 tilt
  (gravity-vector), ADXL345 200Hz burst, Goertzel FFT-lite band energies,
  on-node TinyML REFERENCE classifier (fixed-point stumps mirroring the
  risk-engine limits — NOT a quantization of the trained artifact),
  blast-gate noise rejection, LittleFS store-and-forward, LoRa publish in
  the backend NodeTelemetry contract, solar duty cycling. Clearly labelled:
  never compiled/flashed here (no toolchain) — platformio.ini provided.
- Raspberry-Pi GATEWAY APPLICATION (edge/gateway/gateway_app.py): real
  serial-LoRa -> validated -> MQTT-over-TLS forwarding, SQLite
  store-and-forward, siren relay GPIO, systemd unit + install.md.
  Frame-validation + buffer logic unit-VERIFIED (1 accept / 4 rejects;
  FIFO round-trip). Never executed on hardware (none exists).
- MOBILE criterion: the dashboard is now an installable PWA
  (manifest + generated icons + app-shell service worker; API/WS
  network-only so safety data is never cached). Web push remains BLOCKED
  with the FCM/VAPID provisioning steps documented.
- AZURE deployment: infra/azure/main.bicep (Container Apps for all five
  services; honest note that Azure managed PG lacks TimescaleDB).
  AUTHORED, never deployed (no subscription).
- docs/INTEGRATIONS.md: exact provisioning steps for FCM, SMS gateways,
  SMTP, Sentinel-1 (credentials + the SNAP/ISCE processing-stack reality),
  broker TLS, siren relay, Azure, web push.
- scripts/verify_integrations.py: honest CONFIGURED/BLOCKED reporter for
  every integration — run output recorded in the audit evidence.

Still honestly BLOCKED/impossible in-repo: physical hardware itself,
on-node execution of the TRAINED model (no quantization performed),
Flutter-native app (PWA provided instead), Next.js/TS/Cesium migration
(forbidden by project rules), and all external-credential deliveries.
