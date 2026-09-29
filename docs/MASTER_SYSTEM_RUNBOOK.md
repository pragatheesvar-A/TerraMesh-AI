# MASTER SYSTEM RUNBOOK

1. **Startup:** `docker compose up -d`
2. **Health Verification:** `python scripts/system_health_check.py`
3. **Database:** Wait for PostgreSQL/Timescale. Run Alembic migrations.
4. **Troubleshooting / Recovery:** Check Docker logs. Verify Redis connectivity.
