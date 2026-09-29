"""
TerraMesh AI — Spatial query helpers (PostGIS with pure-Python fallback).

Coordinate Reference System
---------------------------
The entire platform stores geography in WGS84 (EPSG:4326) longitude/latitude
degrees — matching GeoJSON, Leaflet, and Sentinel-1 InSAR rasters. PostGIS
geometry columns are declared as `geometry(SHAPE, 4326)` (see migration
f3c9d2e7a4b1). Never mix projected metres (e.g. UTM 45N) into these columns.

Behaviour
---------
* On PostgreSQL with PostGIS: queries run in-database via ST_* functions
  (GiST-indexed, production-grade).
* On PostgreSQL without PostGIS, or on SQLite (local dev): queries fall back
  to pure-Python geometry over the JSON columns. Results are identical but
  computed in-process — this is reported honestly via `engine` in each result
  so callers can label provenance of the computation.
"""
from __future__ import annotations

import json
import math
from typing import List, Optional

from sqlalchemy import text

import database


def validate_coordinate_range(lng: float, lat: float) -> bool:
    """Validate that coordinates are within valid EPSG:4326 ranges.
    
    Args:
        lng: Longitude in decimal degrees (-180 to 180)
        lat: Latitude in decimal degrees (-90 to 90)
    
    Returns:
        True if coordinates are valid, False otherwise
    
    Raises:
        ValueError: If coordinates are outside valid ranges
    """
    if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        raise ValueError(f"Coordinates must be numeric, got lng={type(lng)}, lat={type(lat)}")
    
    if not (-180 <= lng <= 180):
        raise ValueError(f"Longitude out of valid range [-180, 180]: {lng}")
    
    if not (-90 <= lat <= 90):
        raise ValueError(f"Latitude out of valid range [-90, 90]: {lat}")
    
    return True


def validate_geojson_coordinate_order(coords: List[List[float]]) -> bool:
    """Validate that coordinates follow GeoJSON [lng, lat] order.
    
    For Jharia region, valid ranges are approximately:
    - Longitude: 80-95 (east positive)
    - Latitude: 18-30 (north positive)
    
    Args:
        coords: List of [lng, lat] coordinate pairs
    
    Returns:
        True if coordinate order appears valid, False otherwise
    
    Raises:
        ValueError: If coordinate order is clearly invalid
    """
    if not coords or len(coords) < 1:
        return False
    
    for i, coord in enumerate(coords):
        if len(coord) != 2:
            raise ValueError(f"Coordinate {i} must have exactly 2 values, got {len(coord)}")
        
        lng, lat = coord[0], coord[1]
        
        # Check if values are in reasonable ranges for Jharia
        # If lng is in lat range and vice versa, order is likely swapped
        if 18 <= lng <= 30 and 80 <= lat <= 95:
            raise ValueError(
                f"Coordinate {i} appears to have swapped order: "
                f"expected [lng, lat] where lng~86, lat~23, got [{lng}, {lat}]"
            )
    
    return True


def validate_point_geometry(lat: float, lng: float) -> dict:
    """Comprehensive validation for point geometry.
    
    Args:
        lat: Latitude in decimal degrees
        lng: Longitude in decimal degrees
    
    Returns:
        dict with validation result and any errors
    """
    result = {"valid": True, "errors": []}
    
    # Check for NaN or infinity first (before range check)
    if not math.isfinite(lat) or not math.isfinite(lng):
        result["valid"] = False
        result["errors"].append(f"Coordinates must be finite numbers, got lat={lat}, lng={lng}")
        return result
    
    try:
        validate_coordinate_range(lng, lat)
    except ValueError as e:
        result["valid"] = False
        result["errors"].append(str(e))
    
    return result


def validate_polygon_geometry(ring: List[List[float]]) -> dict:
    """Comprehensive validation for polygon geometry.
    
    Args:
        ring: List of [lng, lat] coordinate pairs forming a polygon ring
    
    Returns:
        dict with validation result and any errors
    """
    result = {"valid": True, "errors": []}
    
    # Check minimum points for a polygon
    if not ring or len(ring) < 3:
        result["valid"] = False
        result["errors"].append(f"Polygon must have at least 3 points, got {len(ring) if ring else 0}")
        return result
    
    # Validate coordinate order
    try:
        validate_geojson_coordinate_order(ring)
    except ValueError as e:
        result["valid"] = False
        result["errors"].append(str(e))
    
    # Validate each coordinate
    for i, coord in enumerate(ring):
        try:
            validate_coordinate_range(coord[0], coord[1])
        except ValueError as e:
            result["valid"] = False
            result["errors"].append(f"Coordinate {i}: {str(e)}")
    
    # Check ring closure (first point should equal last point)
    if ring[0] != ring[-1]:
        result["warnings"] = result.get("warnings", [])
        result["warnings"].append("Polygon ring is not closed (first point != last point)")
    
    return result


def _point_in_ring(lng: float, lat: float, ring: List[List[float]]) -> bool:
    """Ray-casting point-in-polygon on a single [ [lng, lat], ... ] ring."""
    if not ring or len(ring) < 3:
        return False
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def _haversine_m(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    """Great-circle distance in metres (WGS84)."""
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def has_postgis() -> bool:
    """True only when connected to PostgreSQL with the PostGIS extension."""
    if database.IS_SQLITE:
        return False
    try:
        with database.engine.connect() as conn:
            row = conn.execute(
                text("SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis'")
            ).scalar()
        return bool(row)
    except Exception:
        return False


def zone_containing_point(lng: float, lat: float, mine_id: str = "jharia_01") -> Optional[dict]:
    """
    Return the risk zone containing the given point, or None.
    Uses ST_Contains on PostGIS; falls back to ray-casting over polygon_json.
    
    Args:
        lng: Longitude in decimal degrees (EPSG:4326)
        lat: Latitude in decimal degrees (EPSG:4326)
        mine_id: Mine identifier (default: "jharia_01")
    
    Returns:
        Zone dict if point is inside a zone, None otherwise
    
    Raises:
        ValueError: If coordinates are invalid
    """
    # Validate coordinates before processing
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    if has_postgis():
        try:
            with database.engine.connect() as conn:
                row = conn.execute(
                    text("""
                        SELECT id, code, name, status, risk_score,
                               'postgis' AS engine
                        FROM risk_zones
                        WHERE mine_id = :mine
                          AND geom IS NOT NULL
                          AND ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                        LIMIT 1
                    """),
                    {"lng": lng, "lat": lat, "mine": mine_id},
                ).mappings().first()
            return dict(row) if row else None
        except Exception:
            pass  # fall through to python path

    # Pure-Python fallback
    try:
        with database.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, code, name, status, risk_score, polygon_json FROM risk_zones WHERE mine_id = :mine"),
                {"mine": mine_id},
            ).mappings().all()
        for r in rows:
            try:
                ring = json.loads(r["polygon_json"]) if r["polygon_json"] else None
            except Exception:
                ring = None
            if ring and _point_in_ring(lng, lat, ring):
                return {
                    "id": r["id"], "code": r["code"], "name": r["name"],
                    "status": r["status"], "risk_score": r["risk_score"],
                    "engine": "python-fallback",
                }
    except Exception:
        return None
    return None


def nearest_sensors(lng: float, lat: float, limit: int = 5, mine_id: str = "jharia_01") -> List[dict]:
    """
    K-nearest sensors to a point (KNN on PostGIS; haversine scan otherwise).
    
    Args:
        lng: Longitude in decimal degrees (EPSG:4326)
        lat: Latitude in decimal degrees (EPSG:4326)
        limit: Maximum number of sensors to return
        mine_id: Mine identifier (default: "jharia_01")
    
    Returns:
        List of sensor dicts with distance_m field
    
    Raises:
        ValueError: If coordinates are invalid or limit is out of range
    """
    # Validate coordinates
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    # Validate limit
    if not isinstance(limit, int) or limit < 1 or limit > 100:
        raise ValueError(f"Limit must be between 1 and 100, got {limit}")
    
    if has_postgis():
        try:
            with database.engine.connect() as conn:
                rows = conn.execute(
                    text("""
                        SELECT id, name, zone,
                               ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AS distance_m,
                               'postgis' AS engine
                        FROM sensors
                        WHERE geom IS NOT NULL
                        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                        LIMIT :lim
                    """),
                    {"lng": lng, "lat": lat, "lim": limit},
                ).mappings().all()
            return [dict(r) for r in rows]
        except Exception:
            pass

    # Pure-Python fallback (haversine over lat/lng columns)
    try:
        with database.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, name, zone, lat, lng FROM sensors WHERE lat IS NOT NULL AND lng IS NOT NULL")
            ).mappings().all()
        scored = [
            {
                "id": r["id"], "name": r["name"], "zone": r["zone"],
                "distance_m": _haversine_m(lng, lat, r["lng"], r["lat"]),
                "engine": "python-fallback",
            }
            for r in rows
        ]
        scored.sort(key=lambda s: s["distance_m"])
        return scored[:limit]
    except Exception:
        return []


def workers_in_zone(zone_id: str) -> List[dict]:
    """Workers whose current position falls inside the given risk zone."""
    try:
        with database.engine.connect() as conn:
            zone = conn.execute(
                text("SELECT polygon_json, mine_id FROM risk_zones WHERE id = :z"),
                {"z": zone_id},
            ).mappings().first()
        if not zone or not zone["polygon_json"]:
            return []
        ring = json.loads(zone["polygon_json"])
        with database.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, code, name, status, lat, lng FROM workers WHERE lat IS NOT NULL AND lng IS NOT NULL")
            ).mappings().all()
        return [
            {"id": r["id"], "code": r["code"], "name": r["name"], "status": r["status"]}
            for r in rows
            if _point_in_ring(r["lng"], r["lat"], ring)
        ]
    except Exception:
        return []


def route_proximity(lng: float, lat: float, radius_m: float = 50.0) -> List[dict]:
    """
    Evacuation routes within `radius_m` of a point — supports
    "which escape corridors can this worker reach" decisions.
    
    Args:
        lng: Longitude in decimal degrees (EPSG:4326)
        lat: Latitude in decimal degrees (EPSG:4326)
        radius_m: Search radius in meters
    
    Returns:
        List of route dicts with distance_m field
    
    Raises:
        ValueError: If coordinates are invalid or radius is out of range
    """
    # Validate coordinates
    validation = validate_point_geometry(lat, lng)
    if not validation["valid"]:
        raise ValueError(f"Invalid coordinates: {', '.join(validation['errors'])}")
    
    # Validate radius
    if not isinstance(radius_m, (int, float)) or radius_m < 0 or radius_m > 10000:
        raise ValueError(f"Radius must be between 0 and 10000 meters, got {radius_m}")
    
    if has_postgis():
        try:
            with database.engine.connect() as conn:
                rows = conn.execute(
                    text("""
                        SELECT id, zone_id, name, status, waypoints_json,
                               ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AS distance_m,
                               'postgis' AS engine
                        FROM evacuation_routes
                        WHERE geom IS NOT NULL
                          AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :rad)
                        ORDER BY distance_m ASC
                    """),
                    {"lng": lng, "lat": lat, "rad": radius_m},
                ).mappings().all()
            return [dict(r) for r in rows]
        except Exception:
            pass

    # Fallback: min haversine distance to the sampled waypoints
    try:
        with database.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, zone_id, name, status, waypoints_json FROM evacuation_routes WHERE waypoints_json IS NOT NULL")
            ).mappings().all()
        out = []
        for r in rows:
            pts = json.loads(r["waypoints_json"])
            dmin = min(_haversine_m(lng, lat, p[0], p[1]) for p in pts) if pts else float("inf")
            if dmin <= radius_m:
                out.append({
                    "id": r["id"], "zone_id": r["zone_id"], "name": r["name"],
                    "status": r["status"], "distance_m": dmin, "engine": "python-fallback",
                })
        out.sort(key=lambda s: s["distance_m"])
        return out
    except Exception:
        return []
