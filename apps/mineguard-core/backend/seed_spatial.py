"""
TerraMesh AI — Spatial Seed Script
====================================
Seeds the `risk_zones` and `evacuation_routes` tables (PostgreSQL) with the
project's zone geometry (GeoJSON [lng, lat] rings, EPSG:4326) so the
spatial API (/api/spatial/*) and PostGIS queries operate on real rows.

After seeding, geometry columns are hydrated with the same SQL used by
infra/postgres/post_migrations.sql when PostGIS is available (inline
fallback so the script also works on SQLite, storing polygon_json only).

Run (against the live PostgreSQL):
    $env:DATABASE_URL='postgresql://terramesh:<pw>@localhost:5432/terramesh'
    python seed_spatial.py
"""

from __future__ import annotations
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import database  # noqa: E402
from models import ZoneModel, EvacuationRouteModel  # noqa: E402
from sqlalchemy import text  # noqa: E402

logger = logging.getLogger("terramesh.seed_spatial")

MINE_ID = "jharia_01"

ZONES = [
    {
        "id": "zone-a", "code": "Zone A", "name": "North Longwall Panel 01",
        "status": "SAFE", "risk_score": 18.0, "subsidence_rate": 0.4,
        "active_workers": 42, "active_sensors": 14,
        "polygon": [[86.4050, 23.7780], [86.4110, 23.7830], [86.4160, 23.7800], [86.4100, 23.7750]],
    },
    {
        "id": "zone-b", "code": "Zone B", "name": "Central Depillaring Section",
        "status": "CRITICAL", "risk_score": 87.0, "subsidence_rate": 4.2,
        "active_workers": 7, "active_sensors": 8,
        "polygon": [[86.4100, 23.7750], [86.4160, 23.7800], [86.4210, 23.7760], [86.4150, 23.7710]],
    },
    {
        "id": "zone-c", "code": "Zone C", "name": "South Drift Panel 03",
        "status": "CAUTION", "risk_score": 46.0, "subsidence_rate": 1.4,
        "active_workers": 48, "active_sensors": 16,
        "polygon": [[86.4150, 23.7710], [86.4210, 23.7760], [86.4250, 23.7720], [86.4190, 23.7670]],
    },
    {
        "id": "zone-d", "code": "Zone D", "name": "West Main Haulage Roadway",
        "status": "SAFE", "risk_score": 12.0, "subsidence_rate": 0.2,
        "active_workers": 29, "active_sensors": 10,
        "polygon": [[86.4000, 23.7700], [86.4050, 23.7740], [86.4090, 23.7710], [86.4040, 23.7670]],
    },
]

ROUTES = [
    {
        "id": "route-east", "zone_id": "zone-b", "name": "Route B (East Airway Drift)",
        "status": "SAFE", "eta_minutes": 4.2,
        "waypoints": [[86.4150, 23.7710], [86.4185, 23.7680], [86.4220, 23.7645], [86.4260, 23.7610]],
    },
    {
        "id": "route-north", "zone_id": "zone-b", "name": "Route A (North Intake)",
        "status": "BLOCKED", "eta_minutes": None,
        "waypoints": [[86.4100, 23.7750], [86.4130, 23.7790], [86.4160, 23.7830]],
    },
]


def hydrate_geometry(zone_id: str, ring) -> bool:
    """Hydrate risk_zones.geom via PostGIS when available (inline version of
    infra/postgres/post_migrations.sql hydrate_zone_geometry for one row)."""
    if database.IS_SQLITE:
        return False
    try:
        first, last = ring[0], ring[-1]
        if first != last:
            ring = ring + [first]
        pts = ", ".join(f"ST_SetSRID(ST_MakePoint({p[0]}, {p[1]}), 4326)" for p in ring)
        line = f"ST_MakeLine(ARRAY[{pts}])"
        # Parameter binding of geometry expressions is awkward; values are
        # sanitized numeric literals from this script's own constants.
        sql = (f"UPDATE risk_zones SET geom = ST_Multi(ST_MakePolygon({line})) "
               f"WHERE id = '{zone_id}' AND geom IS NULL")
        with database.engine.begin() as conn:
            conn.execute(text(sql))
        return True
    except Exception as e:
        logger.warning("PostGIS hydration skipped for %s (%s)", zone_id, e)
        return False


def hydrate_route_geometry(route_id: str, pts_list) -> bool:
    if database.IS_SQLITE:
        return False
    try:
        pts = ", ".join(f"ST_SetSRID(ST_MakePoint({p[0]}, {p[1]}), 4326)" for p in pts_list)
        sql = (f"UPDATE evacuation_routes SET geom = ST_MakeLine(ARRAY[{pts}]) "
               f"WHERE id = '{route_id}' AND geom IS NULL")
        with database.engine.begin() as conn:
            conn.execute(text(sql))
        return True
    except Exception as e:
        logger.warning("PostGIS route hydration skipped for %s (%s)", route_id, e)
        return False


def main() -> None:
    db = database.SessionLocal()
    try:
        for z in ZONES:
            ring = z["polygon"]
            if ring[0] != ring[-1]:
                ring = ring + [ring[0]]
            row = db.get(ZoneModel, z["id"])
            if row:
                row.status = z["status"]; row.risk_score = z["risk_score"]
                row.name = z["name"]; row.subsidence_rate = z["subsidence_rate"]
                row.active_workers = z["active_workers"]; row.active_sensors = z["active_sensors"]
                row.polygon_json = json.dumps(ring)
            else:
                db.add(ZoneModel(
                    id=z["id"], mine_id=MINE_ID, code=z["code"], name=z["name"],
                    status=z["status"], risk_score=z["risk_score"],
                    subsidence_rate=z["subsidence_rate"], active_workers=z["active_workers"],
                    active_sensors=z["active_sensors"], polygon_json=json.dumps(ring),
                ))
        for r in ROUTES:
            row = db.get(EvacuationRouteModel, r["id"])
            if row:
                row.status = r["status"]; row.name = r["name"]
                row.waypoints_json = json.dumps(r["waypoints"])
            else:
                db.add(EvacuationRouteModel(
                    id=r["id"], zone_id=r["zone_id"], name=r["name"],
                    status=r["status"], eta_minutes=r["eta_minutes"],
                    waypoints_json=json.dumps(r["waypoints"]),
                ))
        db.commit()
        logger.info("Seeded %d zones and %d routes", len(ZONES), len(ROUTES))
        print(f"Seeded {len(ZONES)} risk zones + {len(ROUTES)} evacuation routes "
              f"into {database.engine.url}")
    finally:
        db.close()

    # PostGIS hydration (PostgreSQL only)
    hydrated = 0
    for z in ZONES:
        ring = z["polygon"]
        if ring[0] != ring[-1]:
            ring = ring + [ring[0]]
        if hydrate_geometry(z["id"], ring):
            hydrated += 1
    for r in ROUTES:
        if hydrate_route_geometry(r["id"], r["waypoints"]):
            hydrated += 1
    if database.IS_SQLITE:
        print("SQLite dev database: polygon_json stored; PostGIS hydration skipped")
    else:
        print(f"PostGIS geometry hydrated for {hydrated}/{len(ZONES) + len(ROUTES)} rows")


if __name__ == "__main__":
    main()
