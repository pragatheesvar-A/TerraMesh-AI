# DEPENDENCY HEALTH MATRIX

| Dependency | Startup | Readiness | Runtime Optional | Degraded Mode |
|---|---|---|---|---|
| PostgreSQL | YES | YES | NO | BLOCKED |
| Redis | NO | YES | YES | Fallback to PostgreSQL |
| MQTT | NO | YES | YES | Polling Fallback |
| AI / ML | NO | YES | YES | Rules-based Engineering Fallback |
| FCM / SMS | NO | NO | YES | Buffered Queueing |
