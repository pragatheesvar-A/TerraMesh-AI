# RESILIENCE REPORT

- **PostgreSQL**: Recovers via standard ORM reconnect.
- **Redis**: Drops to DB safely upon connection loss.
- **MQTT**: QoS 1 deduplication buffers spikes.
- **AI**: Fails safely to explicit threshold overrides.
