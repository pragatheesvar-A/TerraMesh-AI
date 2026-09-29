"""
TerraMesh AI — InSAR Deformation Analysis
==========================================
Extracts critical-deformation hotspots and subsidence velocity from
interferometric deformation grids. Pure numpy/scipy analysis — no fabrication.
"""

from __future__ import annotations
from typing import Any, Dict, List

import numpy as np


def calculate_subsidence_velocity(current_mm: np.ndarray, previous_mm: np.ndarray,
                                   years_elapsed: float) -> np.ndarray:
    """
    Line-of-sight subsidence velocity in mm/year.
    Negative = downward motion (subsidence convention).
    """
    if years_elapsed <= 0:
        raise ValueError("years_elapsed must be positive")
    return (current_mm - previous_mm) / years_elapsed


def extract_critical_polygons(grid: List[List[float]], threshold_mm: float) -> List[Dict[str, Any]]:
    """
    Find connected deformation hotspots (cells more negative than threshold)
    using scipy connected-component labeling, and return their bounding cells
    and centroid coordinates (grid row/col indices).
    """
    arr = np.asarray(grid, dtype=float)
    mask = arr < -abs(threshold_mm)  # more negative than -|threshold|

    try:
        from scipy import ndimage
        labeled, num_features = ndimage.label(mask)
    except ImportError:
        # Fallback without scipy: single-cell hotspots
        hotspots = np.argwhere(mask)
        return [
            {"cells": 1, "centroid_rc": [int(r), int(c)],
             "bbox": {"r0": int(r), "r1": int(r), "c0": int(c), "c1": int(c)},
             "peak_mm": float(arr[r, c])}
            for r, c in hotspots
        ]

    polygons: List[Dict[str, Any]] = []
    for label_idx in range(1, num_features + 1):
        coords = np.argwhere(labeled == label_idx)
        if coords.size == 0:
            continue
        centroid = coords.mean(axis=0)
        polygons.append({
            "cells": int(len(coords)),
            "centroid_rc": [float(centroid[0]), float(centroid[1])],
            "bbox": {
                "r0": int(coords[:, 0].min()), "r1": int(coords[:, 0].max()),
                "c0": int(coords[:, 1].min()), "c1": int(coords[:, 1].max()),
            },
            "peak_mm": float(arr[tuple(coords[0])]),
        })
    polygons.sort(key=lambda p: p["cells"], reverse=True)
    return polygons
