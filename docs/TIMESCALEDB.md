# TimescaleDB — Telemetry Time-Series Architecture

## Status

* **Code & migration:** COMPLETE (migration `f3c9d2e7a4b1`)
* **Runtime verification:** `BLOCKED — ENVIRONMENT NOT AVAILABLE` (no Docker daemon / TimescaleDB instance was available on this machine during this work session; see `docs/MISSING_TECH_STACK_AUDIT.md`). When the Docker stack from `docker-compose.yml` (image `timescale/timescaledb-ha:pg16-latest`) is up, run `alembic upgrade head` inside the backend container to activate everything below and verify with the queries listed at the end.

## Design

### Hypertable

Table `telemetry` (models.py → `TelemetryModel`) is converted by migration
`f3c9d2e7a4b1` via:

```sql
SELECT create_hypertable('telemetry', 'ts', if_not_exists => TRUE, migrate_data => TRUE);
```

* Partitioned on the `ts` column (UTC ingestion time).
* **Composite primary key `(node_id, ts)`** — TimescaleDB-safe (every unique
  constraint includes the partitioning column) and it enforces one row per
  node per timestamp, which the ingestion pipeline guarantees via timestamp
  normalization + dedup.
* Lookup index: `ix_telemetry_node_ts (node_id, ts)`.

### Columns

| Column | Type | Notes |
|---|---|---|
| mine_id | text | e.g. `jharia_01` |
| node_id | text | sensor node identifier |
| ts | timestamptz (DateTime) | partitioning column, NOT NULL |
| tilt | double precision | degrees |
| vibration | double precision | mm/s (or g where labelled) |
| displacement | double precision | mm/day |
| crack_width | double precision | mm |
| temperature | double precision | °C |
| humidity | double precision | %RH |
| battery | double precision | volts or %, per node profile |
| signal_strength | double precision | dBm / % |
| risk_score | double precision | unified risk engine output 0–100 |
| warning_tier | text | NORMAL/WATCH/WARNING/CRITICAL/EVACUATE |
| provenance | text NOT NULL | MEASURED / SIMULATED / OPERATOR ACTION / MODEL OUTPUT |

The `provenance` column is mandatory: **no telemetry row may be stored
without an explicit origin label.**

### Compression policy (installed by the migration)

```sql
ALTER TABLE telemetry SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'node_id',
  timescaledb.compress_orderby = 'ts'
);
SELECT add_compression_policy('telemetry', INTERVAL '7 days', if_exists => TRUE);
```

Chunks older than 7 days are compressed (segmented per node, ordered by
time) — typical 90 %+ storage reduction for telemetry.

### Retention policy

```sql
SELECT add_retention_policy('telemetry', INTERVAL '180 days', if_exists => TRUE);
```

Raw chunks older than 180 days are dropped automatically. Longer-term
archival (parquet export / cold storage) remains an explicit operator action
and is NOT silently performed by the platform.

### Continuous aggregates

The intended daily aggregate (risk trend reporting) is left as an explicit
post-deployment step rather than baked into the migration, so operators can
review the exact SQL first:

```sql
CREATE MATERIALIZED VIEW telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT mine_id, node_id,
       time_bucket(INTERVAL '1 hour', ts) AS bucket,
       avg(tilt) AS tilt_avg, max(tilt) AS tilt_max,
       avg(displacement) AS displacement_avg,
       avg(crack_width) AS crack_avg,
       avg(risk_score) AS risk_avg, max(risk_score) AS risk_max
FROM telemetry
GROUP BY mine_id, node_id, bucket
WITH NO DATA;

SELECT add_continuous_aggregate_policy('telemetry_hourly',
  start_offset => INTERVAL '3 days',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');
```

## Degradation behaviour

* **PostgreSQL without TimescaleDB:** `telemetry` remains a plain table with
  the same indexes. All API features function; retention/compression are
  absent (logged at migration time). The app never claims TimescaleDB is
  active — `/health` reports `timescaledb: unavailable` in that case.
* **SQLite (local dev/tests):** the migration skips all PostGIS/TimescaleDB
  statements; `telemetry` is a plain SQLite table.

## Verification (when the environment is available)

```sql
-- hypertable?
SELECT hypertable_name FROM timescaledb_information.hypertables;      -- expect: telemetry
-- policies?
SELECT * FROM timescaledb_information.jobs;                            -- expect compression + retention jobs
-- compression working?
SELECT count(*), format_size(sum(total_bytes)) FROM _timescaledb_catalog.chunk WHERE compressed_chunk_id IS NOT NULL;
```
