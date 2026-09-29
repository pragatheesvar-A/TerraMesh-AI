# GIS SPATIAL TRIGGERS
## TerraMesh AI — Database Trigger Documentation

**Version:** Phase 2  
**Purpose:** Document spatial triggers for automatic geometry synchronization

---

## OVERVIEW

The TerraMesh AI platform uses PostgreSQL triggers to automatically synchronize PostGIS geometry columns with scalar latitude/longitude columns. This ensures that spatial queries can use optimized PostGIS geometry while maintaining simple lat/lng columns for compatibility.

---

## TRIGGER ARCHITECTURE

### Sync Function

**Name:** `terramesh_sync_point_geom()`  
**Purpose:** Synchronize PostGIS Point geometry with lat/lng columns  
**Tables:** sensors, workers

**Function Definition:**
```sql
CREATE OR REPLACE FUNCTION terramesh_sync_point_geom() RETURNS trigger AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Behavior:**
- Triggered BEFORE INSERT or UPDATE on lat/lng columns
- Automatically creates PostGIS Point geometry from lat/lng
- Uses EPSG:4326 coordinate reference system
- Handles NULL values (defaults to 0,0 if lat/lng is NULL)

---

### Sensors Table Trigger

**Name:** `trg_sensors_geom`  
**Table:** `sensors`  
**Event:** BEFORE INSERT OR UPDATE OF lat, lng  
**Function:** `terramesh_sync_point_geom()`

**Trigger Definition:**
```sql
CREATE TRIGGER trg_sensors_geom 
BEFORE INSERT OR UPDATE OF lat, lng
ON sensors 
FOR EACH ROW 
EXECUTE FUNCTION terramesh_sync_point_geom();
```

**Purpose:**
- Keep `sensors.geom` in sync with `sensors.lat` and `sensors.lng`
- Enable spatial queries on sensor locations
- Maintain dual representation (scalar + geometry)

**Use Cases:**
- Spatial KNN queries for nearest sensors
- Point-in-polygon for sensor zone assignment
- Distance calculations for sensor clustering

---

### Workers Table Trigger

**Name:** `trg_workers_geom`  
**Table:** `workers`  
**Event:** BEFORE INSERT OR UPDATE OF lat, lng  
**Function:** `terramesh_sync_point_geom()`

**Trigger Definition:**
```sql
CREATE TRIGGER trg_workers_geom 
BEFORE INSERT OR UPDATE OF lat, lng
ON workers 
FOR EACH ROW 
EXECUTE FUNCTION terramesh_sync_point_geom();
```

**Purpose:**
- Keep `workers.geom` in sync with `workers.lat` and `workers.lng`
- Enable spatial queries on worker locations
- Maintain dual representation (scalar + geometry)

**Use Cases:**
- Point-in-polygon for worker zone assignment
- Worker proximity calculations
- Evacuation route proximity

---

## TRIGGER BEHAVIOR

### Insert Operation

**Scenario:** Insert new sensor with lat/lng

**SQL:**
```sql
INSERT INTO sensors (id, name, lat, lng) 
VALUES ('NODE-099', 'New Sensor', 23.7762, 86.4148);
```

**Trigger Execution:**
1. Trigger fires BEFORE INSERT
2. Function creates geometry: `ST_SetSRID(ST_MakePoint(86.4148, 23.7762), 4326)`
3. Geometry stored in `geom` column
4. Row inserted with both lat/lng and geom

**Result:**
```sql
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'NODE-099';
-- Output: NODE-099, 23.7762, 86.4148, POINT(86.4148 23.7762)
```

---

### Update Operation

**Scenario:** Update sensor location

**SQL:**
```sql
UPDATE sensors 
SET lat = 23.7770, lng = 86.4150 
WHERE id = 'NODE-099';
```

**Trigger Execution:**
1. Trigger fires BEFORE UPDATE of lat/lng
2. Function updates geometry: `ST_SetSRID(ST_MakePoint(86.4150, 23.7770), 4326)`
3. Geometry updated in `geom` column
4. Row updated with both lat/lng and geom

**Result:**
```sql
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'NODE-099';
-- Output: NODE-099, 23.7770, 86.4150, POINT(86.4150 23.7770)
```

---

### NULL Handling

**Scenario:** Insert sensor with NULL lat/lng

**SQL:**
```sql
INSERT INTO sensors (id, name, lat, lng) 
VALUES ('NODE-100', 'No Location Sensor', NULL, NULL);
```

**Trigger Execution:**
1. Trigger fires BEFORE INSERT
2. Function creates geometry with COALESCE: `ST_SetSRID(ST_MakePoint(0, 0), 4326)`
3. Geometry stored as POINT(0 0) (null island)
4. Row inserted with NULL lat/lng but POINT(0 0) geom

**Result:**
```sql
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'NODE-100';
-- Output: NODE-100, NULL, NULL, POINT(0 0)
```

**Note:** NULL lat/lng results in POINT(0 0) geometry (null island in Atlantic Ocean). This is a known limitation of the current trigger implementation.

---

## SPATIAL INDEXES

### GiST Indexes

**Purpose:** Accelerate spatial queries using geometry columns

**Indexes:**
```sql
CREATE INDEX ix_sensors_geom ON sensors USING GIST (geom);
CREATE INDEX ix_workers_geom ON workers USING GIST (geom);
CREATE INDEX ix_risk_zones_geom ON risk_zones USING GIST (geom);
CREATE INDEX ix_evacuation_routes_geom ON evacuation_routes USING GIST (geom);
```

**Benefits:**
- Fast point-in-polygon queries (ST_Contains)
- Fast proximity queries (ST_DWithin)
- Fast KNN queries (K-Nearest Neighbor)

**Use with Triggers:**
- Triggers maintain geometry columns
- GiST indexes accelerate queries on those columns
- Together provide efficient spatial operations

---

## TRIGGER TESTING

### Test Procedure

**1. Insert Test:**
```sql
-- Insert test sensor
INSERT INTO sensors (id, name, lat, lng) 
VALUES ('TEST-001', 'Test Sensor', 23.7762, 86.4148);

-- Verify geometry sync
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'TEST-001';
```

**Expected Result:** Geometry matches lat/lng

**2. Update Test:**
```sql
-- Update test sensor
UPDATE sensors 
SET lat = 23.7770, lng = 86.4150 
WHERE id = 'TEST-001';

-- Verify geometry sync
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'TEST-001';
```

**Expected Result:** Geometry updated to match new lat/lng

**3. Null Test:**
```sql
-- Insert sensor with NULL location
INSERT INTO sensors (id, name, lat, lng) 
VALUES ('TEST-002', 'Null Sensor', NULL, NULL);

-- Verify geometry behavior
SELECT id, lat, lng, ST_AsText(geom) 
FROM sensors 
WHERE id = 'TEST-002';
```

**Expected Result:** Geometry is POINT(0 0) (null island)

---

## TRIGGER MAINTENANCE

### Check Trigger Status

**SQL:**
```sql
-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%geom%';
```

**Expected Output:**
```
trigger_name           | event_manipulation | event_object_table
-----------------------+-------------------+-------------------
trg_sensors_geom       | INSERT, UPDATE    | sensors
trg_workers_geom       | INSERT, UPDATE    | workers
```

### Check Function Status

**SQL:**
```sql
-- Check if sync function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'terramesh_sync_point_geom';
```

**Expected Output:**
```
routine_name              | routine_type
--------------------------+--------------
terramesh_sync_point_geom | FUNCTION
```

### Recreate Trigger (if needed)

**SQL:**
```sql
-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_sensors_geom ON sensors;

-- Recreate trigger
CREATE TRIGGER trg_sensors_geom 
BEFORE INSERT OR UPDATE OF lat, lng
ON sensors 
FOR EACH ROW 
EXECUTE FUNCTION terramesh_sync_point_geom();
```

---

## TRIGGER LIMITATIONS

### 1. NULL Handling

**Limitation:** NULL lat/lng results in POINT(0 0) geometry

**Impact:** Spatial queries may include null island in results

**Mitigation:** 
- Filter NULL lat/lng in application layer
- Add WHERE clause: `WHERE lat IS NOT NULL AND lng IS NOT NULL`

**Example:**
```sql
-- Bad: includes POINT(0 0) for NULL locations
SELECT * FROM sensors WHERE ST_DWithin(geom, ST_MakePoint(86.4120, 23.7745), 1000);

-- Good: excludes NULL locations
SELECT * FROM sensors 
WHERE lat IS NOT NULL AND lng IS NOT NULL
AND ST_DWithin(geom, ST_MakePoint(86.4120, 23.7745), 1000);
```

### 2. Coordinate Order

**Limitation:** Function assumes lat/lng order (PostGIS expects lng/lat)

**Current Implementation:**
```sql
NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
```

**Correctness:** Function correctly swaps to lng/lat order for ST_MakePoint

**Validation:** GeoJSON order is [lng, lat], PostGIS ST_MakePoint expects (lng, lat)

### 3. No Validation

**Limitation:** Trigger does not validate coordinate ranges

**Impact:** Invalid coordinates (e.g., lat=91) will create invalid geometry

**Mitigation:** 
- Application-layer validation (implemented in Phase 2)
- Database constraints (not currently implemented)

**Future Enhancement:**
```sql
-- Add check constraint (future)
ALTER TABLE sensors 
ADD CONSTRAINT chk_lat_range CHECK (lat >= -90 AND lat <= 90),
ADD CONSTRAINT chk_lng_range CHECK (lng >= -180 AND lng <= 180);
```

---

## TRIGGER PERFORMANCE

### Performance Impact

**Insert/Update Operations:**
- Minimal overhead (single geometry calculation)
- GiST index maintained automatically
- Typical latency: <1ms per operation

**Spatial Queries:**
- GiST index provides fast spatial queries
- Typical query time: <10ms for local area queries
- Scales well with data volume

### Monitoring

**Recommended:** Monitor trigger performance:

```sql
-- Check trigger execution statistics (if pg_stat_statements enabled)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%terramesh_sync_point_geom%';
```

---

## TRIGGER ALTERNATIVES

### Application-Side Sync

**Alternative:** Update geometry in application code

**Pros:**
- More control over validation
- Can add business logic

**Cons:**
- Risk of desynchronization
- More code to maintain
- Easy to forget geometry update

**Current Choice:** Database trigger (automatic sync, less code)

### View-Based Approach

**Alternative:** Use computed column or view

**Pros:**
- No storage overhead
- Always consistent

**Cons:**
- No index on computed column
- Slower query performance
- More complex query planning

**Current Choice:** Trigger + physical column (indexed, fast)

---

## TRIGGER MIGRATION

### Installation

**Migration File:** `f3c9d2e7a4b1_postgis_timescale.py`

**Steps:**
1. Check if PostgreSQL target
2. Check if PostGIS extension available
3. Create `terramesh_sync_point_geom()` function
4. Create `trg_sensors_geom` trigger
5. Create `trg_workers_geom` trigger
6. Create GiST indexes

**Guarded Execution:** Each step uses SAVEPOINT to prevent migration failure

### Removal

**Downgrade Steps:**
1. Drop triggers
2. Drop function
3. Drop geometry columns
4. Drop GiST indexes

**Safe Removal:** All steps use IF EXISTS to prevent errors

---

## TRIGGER DOCUMENTATION

### Inline Documentation

**Current:** Function has inline SQL comments

**Recommended:** Add database-level documentation:

```sql
COMMENT ON FUNCTION terramesh_sync_point_geom() IS 
'Synchronizes PostGIS Point geometry with lat/lng columns for sensors and workers tables. 
Triggered BEFORE INSERT OR UPDATE of lat, lng. 
Uses EPSG:4326 coordinate reference system. 
NULL lat/lng results in POINT(0 0) geometry (null island).';

COMMENT ON TRIGGER trg_sensors_geom ON sensors IS 
'Automatically updates sensors.geom from sensors.lat and sensors.lng via terramesh_sync_point_geom().';

COMMENT ON TRIGGER trg_workers_geom ON workers IS 
'Automatically updates workers.geom from workers.lat and workers.lng via terramesh_sync_point_geom().';
```

---

## TRIGGER TESTING COVERAGE

### Existing Tests

**Current:** No specific trigger tests in test suite

**Recommended:** Add trigger tests:

```python
def test_sensor_geom_sync_on_insert():
    """Verify trigger creates geometry on insert."""
    # Insert sensor with lat/lng
    # Query geom column
    # Assert geom matches lat/lng

def test_sensor_geom_sync_on_update():
    """Verify trigger updates geometry on update."""
    # Insert sensor
    # Update lat/lng
    # Query geom column
    # Assert geom updated

def test_worker_geom_sync_on_insert():
    """Verify trigger creates geometry on insert for workers."""
    # Similar to sensor test

def test_null_handling():
    """Verify NULL lat/lng results in POINT(0 0)."""
    # Insert with NULL lat/lng
    # Assert geom is POINT(0 0)
```

---

## TRIGGER FUTURE ENHANCEMENTS

### 1. Add Validation

**Enhancement:** Add coordinate range validation in trigger

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION terramesh_sync_point_geom() RETURNS trigger AS $$
BEGIN
    -- Validate coordinate ranges
    IF NEW.lat IS NOT NULL AND (NEW.lat < -90 OR NEW.lat > 90) THEN
        RAISE EXCEPTION 'Latitude out of range [-90, 90]: %', NEW.lat;
    END IF;
    
    IF NEW.lng IS NOT NULL AND (NEW.lng < -180 OR NEW.lng > 180) THEN
        RAISE EXCEPTION 'Longitude out of range [-180, 180]: %', NEW.lng;
    END IF;
    
    -- Create geometry
    NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Add Geometry Validation

**Enhancement:** Validate created geometry

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION terramesh_sync_point_geom() RETURNS trigger AS $$
BEGIN
    -- Create geometry
    NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
    
    -- Validate geometry
    IF NOT ST_IsValid(NEW.geom) THEN
        RAISE EXCEPTION 'Invalid geometry created from lat=%s, lng=%s', NEW.lat, NEW.lng;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Add Audit Logging

**Enhancement:** Log geometry sync events

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION terramesh_sync_point_geom() RETURNS trigger AS $$
BEGIN
    -- Create geometry
    NEW.geom := ST_SetSRID(ST_MakePoint(COALESCE(NEW.lng, 0), COALESCE(NEW.lat, 0)), 4326);
    
    -- Log to audit table
    INSERT INTO audit_logs (action, resource, detail)
    VALUES ('GEOMETRY_SYNC', TG_TABLE_NAME || '.' || NEW.id, 
            'lat=' || COALESCE(NEW.lat::text, 'NULL') || ', lng=' || COALESCE(NEW.lng::text, 'NULL'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## REFERENCES

- **PostgreSQL Triggers:** https://www.postgresql.org/docs/current/sql-createtrigger.html
- **PostGIS ST_MakePoint:** https://postgis.net/docs/ST_MakePoint.html
- **PostGIS ST_SetSRID:** https://postgis.net/docs/ST_SetSRID.html
- **GiST Index:** https://www.postgresql.org/docs/current/gin.html

---

**Document Status:** Phase 2 Complete  
**Last Updated:** 2026-09-25  
**Maintainer:** TerraMesh AI Team
