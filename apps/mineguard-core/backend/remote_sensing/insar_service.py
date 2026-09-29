"""
TerraMesh AI — InSAR Deformation Service
==========================================
Fuses deformation data from the configured provider (see providers.py) and
extracts critical hotspots. Provider STATE and acquisition METADATA flow all
the way through: the response always carries provider_state (LIVE / MOCK /
UNAVAILABLE / CONFIGURATION_REQUIRED), provenance, and scene metadata — a
MOCK provider can never be rendered as LIVE.
"""

from __future__ import annotations
import logging
import time
from typing import Any, Dict

from .providers import get_provider, STATE_LIVE, PROVENANCE_SATELLITE
from .deformation import extract_critical_polygons

logger = logging.getLogger("terramesh.insar")


class InSARService:
    def __init__(self):
        self.default_provider = None  # lazy

    async def get_latest_deformation_map(self, mine_id: str, bbox: Dict[str, float]) -> Dict[str, Any]:
        provider = get_provider()
        logger.info("InSAR provider=%s state=%s mine=%s provenance=%s",
                    provider.name, provider.state, mine_id, provider.provenance)
        try:
            payload = await provider.fetch_interferogram(bbox)
        except RuntimeError as e:
            # Provider refused (credentials / processing stack) — surface the
            # provider state honestly instead of falling back silently to mock
            # data. Callers decide; we never substitute fabricated data.
            raise

        grid = payload["grid"]
        hotspots = extract_critical_polygons(grid, threshold_mm=10.0)

        return {
            "mine_id": mine_id,
            "timestamp": payload["timestamp"],
            "resolution_m": payload["resolution_m"],
            "grid_size": len(grid),
            "deformation_grid": grid,
            "critical_hotspots": hotspots,
            "sources": [payload.get("provider", "mock")],
            "provenance": payload["provenance"],
            "provider_state": payload["provider_state"],
            "is_live": payload["provider_state"] == STATE_LIVE and payload["provenance"] == PROVENANCE_SATELLITE,
            "is_simulated": bool(payload.get("is_simulated", False)),
            "acquisition": payload.get("metadata"),
            "coherence_avg": payload.get("coherence_avg"),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def provider_status(self) -> Dict[str, Any]:
        """Current provider state for /health + UI gating."""
        return get_provider().status()


insar_service = InSARService()
