"""
Phase 2 — GIS: spatial layer endpoint tests.
Verifies the canonical PostGIS-backed spatial API endpoints return usable
GeoJSON with honest provenance labels.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402

client = TestClient(main.app)
AUTH = {"X-API-Key": os.getenv("SECRET_KEY", "terramesh_secure_key_2026")}


def test_engineering_layers_endpoint_returns_geojson():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    assert r.status_code == 200
    data = r.json()
    assert data.get("type") == "FeatureCollection"
    feats = data.get("features", [])
    assert len(feats) >= 10, f"Expected >= 10 engineered features, got {len(feats)}"
    # Every feature has provenance
    for f in feats:
        props = f.get("properties", {})
        assert props.get("provenance"), f"Feature {f.get('id')} missing provenance"
        assert props["provenance"] in ("ENGINEERING CALCULATION", "STATIC REFERENCE")
        assert f.get("geometry", {}).get("type") in ("Point", "LineString", "Polygon")


def test_engineering_layers_layers_present():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    layers = {f["properties"]["layer"] for f in r.json()["features"]}
    for expected in ("mine_boundary", "pit_benches", "faults", "drifts", "infrastructure"):
        assert expected in layers, f"missing layer: {expected}"


def test_zones_geojson_postgis_backed():
    r = client.get("/api/spatial/zones-geojson", headers=AUTH)
    assert r.status_code == 200
    data = r.json()
    assert data.get("type") == "FeatureCollection"
    feats = data.get("features", [])
    assert len(feats) == 4, f"Expected 4 zones, got {len(feats)}"
    for f in feats:
        props = f["properties"]
        assert props.get("geometry_provenance") == "SEEDED DATABASE"
        assert props.get("status_provenance") == "SIMULATION"
        assert props.get("layer") == "zones"


def test_zones_geojson_geometry_valid():
    r = client.get("/api/spatial/zones-geojson", headers=AUTH)
    data = r.json()
    for f in data["features"]:
        geom = f["geometry"]
        assert geom["type"] == "Polygon"
        coords = geom["coordinates"][0]
        # Valid GeoJSON [lng, lat] for Jharia region
        for c in coords:
            assert 80 < c[0] < 95, f"Invalid lng: {c[0]}"  # lng
            assert 18 < c[1] < 30, f"Invalid lat: {c[1]}"  # lat


def test_zones_geojson_has_provenance():
    r = client.get("/api/spatial/zones-geojson", headers=AUTH)
    for f in r.json()["features"]:
        assert f["properties"].get("geometry_provenance") == "SEEDED DATABASE"


def test_engineering_layers_crs():
    r = client.get("/api/spatial/engineering-layers", headers=AUTH)
    assert r.json().get("crs", {}).get("properties", {}).get("name") == "urn:ogc:def:crs:OGC:1.3:CRS84"
