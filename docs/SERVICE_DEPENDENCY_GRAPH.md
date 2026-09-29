# SERVICE DEPENDENCY GRAPH

| Service | Dependency | Type | Degraded Mode |
|---|---|---|---|
| Backend | PostgreSQL | Mandatory | BLOCKED |
| Backend | Redis | Optional | Disables rapid cache, relies on DB |
| Backend | MQTT | Mandatory (Telemetry) | API Fallback |
| Backend | AI/ML | Optional | Falls back to engineering limits |
| Web | WebSocket | Optional | Poll REST API |
| Mobile | WebSocket | Optional | Poll REST API |
| Edge | Backend | Optional (Offline) | Store and forward |
