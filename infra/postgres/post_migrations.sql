-- TerraMesh AI — post-migration spatial hydration (PostgreSQL + PostGIS only)
--
-- Run AFTER `alembic upgrade head` AND AFTER seeding risk_zones /
-- evacuation_routes rows with polygon_json / waypoints_json (GeoJSON, EPSG:4326).
-- Idempotent. Requires the PostGIS extension (created by init.sql / migration 0002).

-- Hydrate risk_zones.geom (MultiPolygon) from polygon_json:
-- polygon_json format: [[lng, lat], [lng, lat], ...] (a single closed ring;
-- the closing point is added automatically if missing).
CREATE OR REPLACE FUNCTION hydrate_zone_geometry() RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    rec RECORD;
    ring GEOMETRY;
    poly GEOMETRY;
    first_pt JSONB;
    last_pt JSONB;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        RAISE NOTICE 'PostGIS not installed — hydrate_zone_geometry skipped.';
        RETURN 0;
    END IF;

    FOR rec IN SELECT id, polygon_json FROM risk_zones WHERE polygon_json IS NOT NULL LOOP
        BEGIN
            first_pt := rec.polygon_json::jsonb -> 0;
            last_pt   := rec.polygon_json::jsonb -> -1;
            IF (first_pt->>0) <> (last_pt->>0) OR (first_pt->>1) <> (last_pt->>1) THEN
                -- ring not closed: append the first point
                rec.polygon_json := rec.polygon_json::jsonb || to_jsonb(first_pt);
            END IF;

            SELECT ST_MakeLine(ST_SetSRID(ST_MakePoint((pt->>0)::float8, (pt->>1)::float8), 4326) ORDER BY ord)
            INTO ring
            FROM jsonb_array_elements(rec.polygon_json::jsonb) WITH ORDINALITY AS t(pt, ord);

            poly := ST_Multi(ST_MakePolygon(ring));
            UPDATE risk_zones SET geom = poly WHERE id = rec.id AND (geom IS NULL OR NOT ST_Equals(geom, poly));
            updated_count := updated_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Zone % geometry hydration failed: %', rec.id, SQLERRM;
        END;
    END LOOP;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Hydrate evacuation_routes.geom (LineString) from waypoints_json:
-- waypoints_json format: [[lng, lat], ...]
CREATE OR REPLACE FUNCTION hydrate_route_geometry() RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    rec RECORD;
    line GEOMETRY;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        RAISE NOTICE 'PostGIS not installed — hydrate_route_geometry skipped.';
        RETURN 0;
    END IF;

    FOR rec IN SELECT id, waypoints_json FROM evacuation_routes WHERE waypoints_json IS NOT NULL LOOP
        BEGIN
            SELECT ST_MakeLine(ST_SetSRID(ST_MakePoint((pt->>0)::float8, (pt->>1)::float8), 4326) ORDER BY ord)
            INTO line
            FROM jsonb_array_elements(rec.waypoints_json::jsonb) WITH ORDINALITY AS t(pt, ord);

            UPDATE evacuation_routes SET geom = line
            WHERE id = rec.id AND (geom IS NULL OR NOT ST_Equals(geom, line));
            updated_count := updated_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Route % geometry hydration failed: %', rec.id, SQLERRM;
        END;
    END LOOP;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Example spatial queries (see docs/POSTGIS.md for the full catalogue):
--   Which zone is this worker inside?
--     SELECT z.code FROM risk_zones z
--     WHERE ST_Contains(COALESCE(z.geom, ST_GeomFromText('POLYGON EMPTY', 4326)),
--                       ST_SetSRID(ST_MakePoint(:lng, :lat), 4326));
--   Nearest 5 sensors to a point:
--     SELECT id, ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AS d
--     FROM sensors ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) LIMIT 5;
