"""
TerraMesh AI — Spatial Layer Builders
=======================================
GeoJSON Feature builders for canonical spatial entities.
Every layer carries explicit provenance in its properties.
"""
from typing import Any, Dict, List, Optional


def feature(fid: str, geometry: Dict, properties: Dict[str, Any]) -> Dict:
    """GeoJSON Feature."""
    return {"type": "Feature", "id": fid, "geometry": geometry, "properties": properties}


def point(coords: List[float]) -> Dict:
    return {"type": "Point", "coordinates": coords}


def linestring(coords: List[List[float]]) -> Dict:
    return {"type": "LineString", "coordinates": coords}


def polygon(coords: List[List[List[float]]]) -> Dict:
    return {"type": "Polygon", "coordinates": coords}


def feature_collection(features: List[Dict]) -> Dict:
    return {
        "type": "FeatureCollection",
        "features": features,
    }


# ─── Engineering Layer Definitions (canonical — previously hardcoded in the
# React frontend's RiskMap / mockData.js) ────────────────────────────────────
# Provenance: ENGINEERING (site engineering reference geometry, not live
# measurements). CRS: EPSG:4326 (WGS84 — matches PostGIS SRID 4326).

ENGINEERING_LAYERS: Dict[str, List[Dict]] = {
    "mine_boundary": [
        {
            "id": "mine-boundary-jharia-01",
            "name": "Jharia Colliery Mine Boundary (permitted footprint)",
            "type": "boundary",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": polygon([[
                [86.4020, 23.7820], [86.4190, 23.7845], [86.4250, 23.7780],
                [86.4220, 23.7660], [86.4080, 23.7640], [86.4010, 23.7710],
                [86.4020, 23.7820],
            ]]),
        },
    ],
    "pit_benches": [
        {
            "id": "bench-1",
            "name": "Pit Bench 1",
            "type": "bench",
            "elevation": "+180m MSL",
            "color": "#0284c7",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4040, 23.7810], [86.4170, 23.7835], [86.4230, 23.7770],
                    [86.4190, 23.7680], [86.4070, 23.7660], [86.4030, 23.7720],
                    [86.4040, 23.7810],
                ]
            ),
        },
        {
            "id": "bench-2",
            "name": "Pit Bench 2 (Overburden Cut)",
            "type": "bench",
            "elevation": "+140m MSL",
            "color": "#d97706",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4070, 23.7790], [86.4160, 23.7810], [86.4200, 23.7755],
                    [86.4165, 23.7700], [86.4090, 23.7685], [86.4060, 23.7735],
                    [86.4070, 23.7790],
                ]
            ),
        },
        {
            "id": "bench-3",
            "name": "Pit Floor / Seam Cut (Active Seam 14)",
            "type": "bench",
            "elevation": "+90m MSL",
            "color": "#dc2626",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4100, 23.7770], [86.4150, 23.7790], [86.4180, 23.7740],
                    [86.4140, 23.7710], [86.4090, 23.7730], [86.4100, 23.7770],
                ]
            ),
        },
    ],
    "faults": [
        {
            "id": "fault-f1",
            "name": "Damodar Main Boundary Fault F-1",
            "type": "Normal Fault (Dip 62° NE)",
            "color": "#dc2626",
            "weight": 3.5,
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4000, 23.7860], [86.4100, 23.7820],
                    [86.4200, 23.7760], [86.4280, 23.7700],
                ]
            ),
        },
        {
            "id": "fault-f3",
            "name": "Jharia South Shear Zone F-3",
            "type": "Strike-Slip Shear Plane",
            "color": "#ea580c",
            "weight": 3.0,
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4020, 23.7650], [86.4120, 23.7710],
                    [86.4220, 23.7760], [86.4290, 23.7810],
                ]
            ),
        },
    ],
    "drifts": [
        {
            "id": "drift-01",
            "name": "Incline Drift 01 (Main Haulage Ramp)",
            "type": "drift",
            "color": "#0284c7",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4070, 23.7690], [86.4120, 23.7730],
                    [86.4160, 23.7770],
                ]
            ),
        },
        {
            "id": "drift-02",
            "name": "Intake Gallery & Man-Riding Drift 02",
            "type": "drift",
            "color": "#16a34a",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4120, 23.7670], [86.4150, 23.7720],
                    [86.4180, 23.7750],
                ]
            ),
        },
        {
            "id": "drift-03",
            "name": "Return Airway Gallery (Ventilation Exhaust)",
            "type": "drift",
            "color": "#d97706",
            "provenance": "ENGINEERING CALCULATION",
            "geometry": linestring(
                [
                    [86.4080, 23.7780], [86.4140, 23.7750],
                    [86.4190, 23.7710],
                ]
            ),
        },
    ],
    "infrastructure": [
        {
            "id": "infra-road-ke",
            "name": "NH-32 Expressway",
            "type": "Road",
            "color": "#f97316",
            "provenance": "STATIC REFERENCE",
            "geometry": linestring(
                [
                    [86.4020, 23.7840], [86.4150, 23.7810],
                    [86.4250, 23.7780],
                ]
            ),
        },
        {
            "id": "infra-substation-33kv",
            "name": "Substation 33kV",
            "type": "Building",
            "color": "#eab308",
            "provenance": "STATIC REFERENCE",
            "geometry": point([86.4180, 23.7785]),
        },
        {
            "id": "infra-assembly-3",
            "name": "Safe Assembly Area 3",
            "type": "Assembly",
            "color": "#10b981",
            "provenance": "STATIC REFERENCE",
            "geometry": point([86.4230, 23.7680]),
        },
        {
            "id": "infra-crack-f04",
            "name": "Tension Fissure F-04",
            "type": "Crack",
            "color": "#ef4444",
            "provenance": "STATIC REFERENCE",
            "geometry": linestring(
                [
                    [86.4135, 23.7755], [86.4160, 23.7770],
                ]
            ),
        },
    ],
}


def to_feature_collection(layers: Dict[str, List[Dict]]) -> Dict:
    """Convert the engineering layer dict into a GeoJSON FeatureCollection."""
    features = []
    for layer_name, items in layers.items():
        for item in items:
            props = dict(item)
            props.pop("geometry", None)
            props["layer"] = layer_name
            features.append(feature(item["id"], item["geometry"], props))
    return feature_collection(features)


def engineering_layers() -> Dict[str, List[Dict]]:
    """Return the canonical engineering reference layers."""
    return ENGINEERING_LAYERS


def engineering_layers_geojson() -> Dict:
    """Return the canonical engineering reference layers as GeoJSON."""
    return to_feature_collection(ENGINEERING_LAYERS)
