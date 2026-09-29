# TerraMesh AI — Deployment

## Stack (docker-compose.yml)

| Service | Image | Ports (host binding) | Notes |
|---|---|---|---|
| postgres | `timescale/timescaledb-ha:pg16` | `127.0.0.1:5432` | TimescaleDB + PostGIS included; init.sql enables extensions |
| redis | `redis:7-alpine` | `127.0.0.1:6379` | 256MB LRU |
| mosquitto | `eclipse-mosquitto:2` | `127.0.0.1:1883` | Dev config: anonymous, loopback-only. Production: `infra/mosquitto/mosquitto.conf.production` + `acl_file` |
| backend | built from `backend/Dockerfile` | `127.0.0.1:8000` | Depends on all three; healthcheck `/health` |
| frontend | built from `frontend/Dockerfile` | `80` (public entry) | nginx SPA + reverse proxy (`/api/`, `/ws/`) |

Infrastructure ports are bound to the loopback interface only — the frontend
container is the single public entrypoint.

## First deployment

```powershell
# 1. Secrets
cp apps/mineguard-core/backend/.env.example apps/mineguard-core/backend/.env
notepad apps/mineguard-core/backend/.env      # set SECRET_KEY etc. (openssl rand -hex 32)
# repo-root .env (git-ignored) supplies POSTGRES_PASSWORD for compose

# 2. Infrastructure
$env:POSTGRES_PASSWORD='<your-password>'
docker compose up -d postgres redis mosquitto

# 3. Schema (creates 17 tables + PostGIS columns + TimescaleDB hypertable/policies)
docker compose run --rm backend alembic upgrade head

# 4. Application
docker compose up -d backend frontend
```

## Local development (no Docker)

Backend falls back to SQLite ONLY outside production (logged loudly):
```powershell
cd apps/mineguard-core/backend
pip install -r requirements-dev.txt
uvicorn main:app --port 8000 --reload
# frontend:
cd ../frontend && npm install && npm run dev
```

## Verification status

| Step | Status |
|---|---|
| `docker compose config` | **VALID** (verified) |
| postgres/redis/mosquitto healthy | **VERIFIED** on this machine |
| `alembic upgrade head` on fresh PG | **VERIFIED** (downgrade→upgrade cycle clean) |
| Hypertable + compression + retention policies | **VERIFIED** (policy jobs present) |
| PostGIS columns + `ST_Contains` | **VERIFIED** |
| End-to-end MQTT→PG→Redis pipeline | **VERIFIED** (`ENVIRONMENT=e2e_live` pytest) |
| Backend/frontend image builds | Documented; not executed this session |
| FCM | **BLOCKED** — needs `FIREBASE_CREDENTIALS_PATH` |
| SMS gateway | **BLOCKED** — needs `SMS_GATEWAY_URL`/`FAST2SMS_API_KEY`; dispatches labelled SIMULATED until set |
| Sentinel-1/NISAR | **BLOCKED** — needs credentials; InSAR stays on the labelled mock provider |

## Production hardening checklist

- [ ] Generate a strong `SECRET_KEY` (never the dev default)
- [ ] `ENVIRONMENT=production` (disables demo passwords + legacy tokens + wildcard CORS)
- [ ] Provision users in the `users` table (PBKDF2) — demo login is disabled automatically
- [ ] Broker: `mosquitto.conf.production` + password file + ACL + TLS
- [ ] MQTT client TLS: `MQTT_USE_TLS=true` + `MQTT_CA_CERT`
- [ ] Restrict `ALLOWED_ORIGINS` to the operator-console origin
- [ ] Configure FCM credentials + test device tokens
- [ ] Configure the SMS gateway
- [ ] Review `RISK_THRESHOLDS_OVERRIDE` engineering limits for the specific panel

## Azure (alternative cloud deployment)

infra/azure/main.bicep deploys the full stack as Azure Container Apps
(AUTHORED, never deployed in this project — no subscription). Note that
Azure managed PostgreSQL does NOT include TimescaleDB, so the template
runs the timescaledb-ha container; see docs/INTEGRATIONS.md §7 for the
exact az CLI sequence and the image build/push prerequisite.
