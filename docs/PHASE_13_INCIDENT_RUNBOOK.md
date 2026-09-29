# INCIDENT RUNBOOK

## DB Outage
- **Detect**: Error logs, `503 Service Unavailable`
- **Confirm**: Health check endpoint
- **Contain**: Halt ingress workers
- **Recover**: Restart PG service / Restore from Timescale backup

## AI Outage
- **Detect**: XGBoost timeout logs
- **Contain**: System auto-drops to Rules Engine
- **Recover**: Restart model worker
