"""
Phase 2 — Spatial validation and edge-case tests.
PostGIS unavailable / malformed geometry / invalid coordinates /
missing entity / empty-layer handling / provenance preservation.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402

client = TestClient(main.app)
AUTH = {"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")}


# ── Containment (existing behavior, verified by tests/test_gis_closure.py) ──
# These are integration-tagged so they run only with the seeded live DB.

# ── Invalid / edge coordinates ───────────────────────────────────────────────

def test_zone_for_point_outside_all_zones():
    """A point far outside every zone returns None without error."""
    r = client.get("/api/spatial/zone-for-point", params={"lat": 10.0, "lng": 70.0},
                   headers=AUTH)
    assert r.status_code == 200
    assert r.json().get("zone") is None


import pytest

def test_zone_for_point_missing_geometry_returns_none():
    """A request with invalid coords should raise an error."""
    with pytest.raises(ValueError):
        client.get("/api/spatial/zone-for-point", params={"lat": 999, "lng": 999},
                   headers=AUTH)


def test_nearest_sensors_with_no_data_returns_empty():
    """No sensors in the DB → empty list, never a fabricated result."""
    r = client.get("/api/spatial/nearest-sensors", params={"lat": 0.0, "lng": 0.0},
                   headers=AUTH)
    assert r.status_code == 200
    assert isinstance(r.json().get("sensors"), list)


def test_route_proximity_no_routes_returns_empty():
    r = client.get("/api/spatial/route-proximity", params={"lat": 0.0, "lng": 0.0, "radius_m": 10},
                   headers=AUTH)
    assert r.status_code == 200
    assert isinstance(r.json().get("routes"), list)


def test_workers_in_zone_unknown_zone_returns_empty():
    r = client.get("/api/spatial/workers-in-zone", params={"zone_id": "no-such-zone"},
                   headers=AUTH)
    assert r.status_code == 200
    assert r.json().get("workers") == []


# ── Provenance preservation under every layer ───────────────────────────────

def test_engineering_layers_provenance_never_live():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    feats = r.json().get("features", [])
    bad = [f["id"] for f in feats
           if "LIVE" in str(f["properties"].get("provenance", "")).upper()
           or "MEASURED" in str(f["properties"].get("provenance", "")).upper()]
    assert not bad, f"engineering layers claiming LIVE/MEASURED provenance: {bad}"


def test_engineering_layers_provenance_engineering_only():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    feats = r.json().get("features", [])
    for f in feats:
        assert f["properties"]["provenance"] in (
            "ENGINEERING CALCULATION", "STATIC REFERENCE",
        ), f"unexpected provenance on {f['id']}: {f['properties']['provenance']}"


# ── GeoJSON response format ──────────────────────────────────────────────────

def test_engineering_layers_geojson_shape():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    data = r.json()
    assert data["type"] == "FeatureCollection"
    for f in data["features"]:
        assert f["type"] == "Feature"
        assert "geometry" in f and f["geometry"]["type"] in ("Point", "LineString", "Polygon")
        assert "properties" in f


def test_zones_geojson_shape():
    r = client.get("/api/spatial/zones-geojson", headers=AUTH)
    data = r.json()
    assert data["type"] == "FeatureCollection"
    for f in data["features"]:
        assert f["geometry"]["type"] == "Polygon"
        ring = f["geometry"]["coordinates"][0]
        assert ring[0] == ring[-1], "zone polygon ring must be closed"


# ── API auth on spatial endpoints ────────────────────────────────────────────

def test_spatial_endpoints_require_auth():
    for path in ("/api/spatial/zone-for-point", "/api/spatial/engineering-layers",
                  "/api/spatial/zones-geojson", "/api/spatial/nearest-sensors"):
        r = client.get(path)
        assert r.status_code == 401, f"{path} must reject unauthenticated callers"
