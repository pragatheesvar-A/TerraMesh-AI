# OBSERVABILITY ARCHITECTURE

## Logs
Structured JSON logs via standard output, capturing `correlation_id`, `trace_id`, `mine_id`, `event_type`, and `provenance`. No PII or credentials.

## Metrics
- Ingestion Latency
- Active Connections
- AI Inference Times
- Risk Engine Transitions
- Notification Queues

## Health & Liveness
- `/health/live`: Fast ping.
- `/health/ready`: Deep check of DB, Redis, MQTT.
- Statuses: PASS, DEGRADED, BLOCKED.
