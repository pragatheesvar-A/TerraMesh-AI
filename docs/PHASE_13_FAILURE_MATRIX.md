# FAILURE MATRIX

| Component | Failure | Detection | Recovery | User Impact |
|---|---|---|---|---|
| MQTT | Network loss | Ping timeout | Auto-reconnect | Delayed telemetry |
| Database | Lock timeout | Exception | Rollback/Retry | Request fail, UI warn |
| WebSocket | Network loss | Keepalive | Expo Backoff | Re-sync on reconnect |
