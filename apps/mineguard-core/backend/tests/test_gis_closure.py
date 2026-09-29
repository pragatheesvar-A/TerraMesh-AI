"""
Phase A — GIS gap closure tests.

Verifies:
  1. /api/zones serves SEEDED DATABASE geometry (with provenance labels)
     once seed_spatial.py has run — the map overlay is API-driven, not frozen.
  2. The seeded polygon agrees with the spatial API: a point INSIDE the
     zone-b polygon is reported by ST_Contains (or the python fallback) as
     zone-b. 2D GIS and spatial API stay synchronized.
  3. Geometry provenance is never a live-survey claim.
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# These tests verify the SEEDED PostGIS geometry path. Point the app at the
# seeded database when it is reachable (compose stack + seed_spatial.py);
# otherwise skip the geometry-dependent tests honestly — the fallback path
# has no polygons by design.
_SEED_CANDIDATES = [
    "postgresql://terramesh:terramesh_dev_pass@localhost:5432/terramesh",
    os.getenv("TEST_DATABASE_URL", ""),
]


def _seeded_db_available(url: str) -> bool:
    if not url.startswith("postgresql"):
        return False
    try:
        from sqlalchemy import create_engine, text
        eng = create_engine(url, connect_args={"connect_timeout": 3})
        with eng.connect() as conn:
            n = conn.execute(text(
                "SELECT COUNT(*) FROM risk_zones WHERE polygon_json IS NOT NULL"
            )).scalar()
        return bool(n)
    except Exception:
        return False


_SEEDED_URL = next((u for u in _SEED_CANDIDATES if _seeded_db_available(u)), None)

if _SEEDED_URL and not os.getenv("DATABASE_URL", "").startswith("postgresql://terramesh"):
    os.environ["DATABASE_URL"] = _SEEDED_URL

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402

client = TestClient(main.app)
AUTH = {"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")}

requires_seeded_db = pytest.mark.skipif(
    _SEEDED_URL is None,
    reason="BLOCKED: seeded PostGIS risk_zones not reachable — start the compose stack and run backend/seed_spatial.py",
)


@requires_seeded_db
def test_zones_endpoint_returns_seeded_geometry_with_provenance():
    r = client.get("/api/zones", headers=AUTH)
    assert r.status_code == 200
    zones = r.json()
    assert len(zones) >= 4
    by_id = {z["id"]: z for z in zones}
    # Every zone carries explicit provenance — never implied live survey
    for z in zones:
        prov = z.get("provenance") or {}
        assert prov.get("geometry") in ("SEEDED DATABASE", "STATIC DESIGN DATA")
        assert prov.get("status") in ("SEEDED DATABASE", "SIMULATION")
    # Seeded geometry present for zone-b
    zb = by_id.get("zone-b")
    assert zb is not None, "zone-b missing — run backend/seed_spatial.py"
    assert zb.get("polygon") and len(zb["polygon"]) >= 3, \
        "zone-b has no polygon — run backend/seed_spatial.py"


@requires_seeded_db
def test_zone_polygon_matches_spatial_api_containment():
    """A point inside the served zone-b polygon must be classified as
    zone-b by the spatial API (2D overlay == spatial truth)."""
    zones = client.get("/api/zones", headers=AUTH).json()
    zb = next(z for z in zones if z["id"] == "zone-b")
    ring = zb["polygon"]
    # Centroid of the ring (guaranteed inside for these convex quads)
    lat = sum(p[1] for p in ring) / len(ring)
    lng = sum(p[0] for p in ring) / len(ring)

    r = client.get("/api/spatial/zone-for-point", params={"lat": lat, "lng": lng},
                   headers=AUTH)
    assert r.status_code == 200
    zone = r.json().get("zone")
    assert zone is not None, "spatial API found no zone for an in-polygon centroid"
    assert zone["code"] == "Zone B"
    assert zone["engine"] in ("postgis", "python-fallback")


@requires_seeded_db
def test_zone_outside_point_is_not_matched():
    zones = client.get("/api/zones", headers=AUTH).json()
    zb = next(z for z in zones if z["id"] == "zone-b")
    ring = zb["polygon"]
    # A point far outside every seeded polygon
    lng = min(p[0] for p in ring) - 5.0
    lat = min(p[1] for p in ring) - 5.0
    r = client.get("/api/spatial/zone-for-point", params={"lat": lat, "lng": lng},
                   headers=AUTH)
    assert r.status_code == 200
    assert r.json().get("zone") is None


@requires_seeded_db
def test_polygon_ring_order_is_geojson_lng_lat():
    """The API polygon is GeoJSON [lng, lat]; a sanity check that we never
    serve swapped coordinates (lng values ~86, lat values ~23 for Jharia)."""
    zones = client.get("/api/zones", headers=AUTH).json()
    for z in zones:
        if z.get("polygon"):
            for p in z["polygon"]:
                assert 80 < p[0] < 95, f"lng out of range: {p[0]}"      # lng
                assert 18 < p[1] < 30, f"lat out of range: {p[1]}"      # lat
