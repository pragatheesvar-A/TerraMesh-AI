"""
TerraMesh AI — InSAR Provider Abstraction
==========================================
Provider classes for satellite deformation data with EXPLICIT provider
states and acquisition metadata:

  Provider states (surfaced everywhere — the UI must never render MOCK as LIVE):
    LIVE                    — a real provider executed successfully
    MOCK                    — clearly-labelled simulator data
    UNAVAILABLE             — credentials present but the processing stack /
                              upstream service cannot serve data right now
    CONFIGURATION_REQUIRED  — credentials missing; the provider refuses to
                              fabricate and raises/states instead

Every result carries full acquisition metadata: scene id, acquisition
timestamp, spatial extent, CRS (EPSG:4326), units (mm/year LOS), velocity,
coherence, no-data policy, and provenance.

Providers:
  SentinelProvider   — ESA Sentinel-1 C-band (Copernicus Data Space)
  NISARProvider      — ISRO/NASA NISAR L/S-band
  MockInSARProvider  — labelled SIMULATOR (default; never presented as live)
"""

from __future__ import annotations
import asyncio
import logging
import os
import random
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger("terramesh.insar")

PROVENANCE_SIMULATED = "SIMULATED SATELLITE DATA"
PROVENANCE_SATELLITE = "LIVE SATELLITE DATA"

# Provider state vocabulary
STATE_LIVE = "LIVE"
STATE_MOCK = "MOCK"
STATE_UNAVAILABLE = "UNAVAILABLE"
STATE_CONFIGURATION_REQUIRED = "CONFIGURATION_REQUIRED"


def _base_metadata(scene_id: str, timestamp: str, bbox: Dict[str, float],
                   provider: str, resolution_m: float) -> Dict[str, Any]:
    """Acquisition metadata contract shared by every provider result."""
    return {
        "scene_id": scene_id,
        "acquisition_date": timestamp,
        "spatial_extent": bbox,                     # {min_lat, max_lat, min_lng, max_lng}
        "crs": "EPSG:4326",
        "units": "mm/year (line-of-sight, negative = subsidence)",
        "nodata": None,                             # every cell is valid; no -999 sentinel
        "resolution_m": resolution_m,
        "provider": provider,
    }


class InSARProvider(ABC):
    """Base class. `provenance` and `state` MUST be surfaced by every caller."""

    name: str = "base"
    provenance: str = "UNKNOWN"
    state: str = STATE_UNAVAILABLE

    @abstractmethod
    async def fetch_interferogram(self, bbox: Dict[str, float]) -> Dict[str, Any]:
        """Return {"grid", "metadata", "provenance", "provider_state", ...}
        or raise with a BLOCKED/UNAVAILABLE reason."""

    def status(self) -> Dict[str, Any]:
        """Machine-readable provider state for /health and the UI."""
        return {"provider": self.name, "state": self.state,
                "provenance": self.provenance}


class SentinelProvider(InSARProvider):
    """
    ESA Sentinel-1 C-band InSAR — real integration scaffold.

    Producing a real interferogram requires BOTH:
      1. Copernicus Data Space credentials (COP_USER / COP_PASSWORD)
      2. A processing stack (SNAP or ISCE): scene download, coregistration,
         interferogram formation, unwrapping, geocoding — NOT part of this
         repository. A production deployment adds a processing service that
         writes deformation grids (e.g. into object storage); this provider
         then reads them.
    """
    name = "sentinel-1"
    provenance = PROVENANCE_SATELLITE

    @property
    def state(self) -> str:
        if not (os.getenv("COP_USER") and os.getenv("COP_PASSWORD")):
            return STATE_CONFIGURATION_REQUIRED
        return STATE_UNAVAILABLE  # processing stack not installed in this deployment

    async def fetch_interferogram(self, bbox: Dict[str, float]) -> Dict[str, Any]:
        if self.state == STATE_CONFIGURATION_REQUIRED:
            raise RuntimeError(
                "BLOCKED — ENVIRONMENT NOT AVAILABLE: Sentinel-1 access requires "
                "Copernicus Data Space credentials (COP_USER / COP_PASSWORD env). "
                "Refusing to fabricate satellite observations. "
                "Set INSAR_PROVIDER=mock to use the labelled simulator."
            )
        raise RuntimeError(
            "UNAVAILABLE: credentials present, but the interferogram processing "
            "stack (SNAP/ISCE — scene download, coregistration, unwrap, geocode) "
            "is not installed in this deployment. See docs/INTEGRATIONS.md §4."
        )


class NISARProvider(InSARProvider):
    """
    ISRO/NASA NISAR L/S-band — real integration scaffold for the mission
    data portal. CONFIGURATION_REQUIRED until portal access exists.
    """
    name = "nisar"
    provenance = PROVENANCE_SATELLITE
    state = STATE_CONFIGURATION_REQUIRED

    async def fetch_interferogram(self, bbox: Dict[str, float]) -> Dict[str, Any]:
        raise RuntimeError(
            "CONFIGURATION_REQUIRED: NISAR mission data portal access is not "
            "configured. Refusing to fabricate satellite observations. "
            "Set INSAR_PROVIDER=mock to use the labelled simulator."
        )


class MockInSARProvider(InSARProvider):
    """
    SIMULATOR — generates plausible deformation grids for development.

    Honesty contract: provenance is ALWAYS "SIMULATED SATELLITE DATA",
    provider_state is ALWAYS "MOCK", and the payload includes
    `is_simulated: true`. It must never be presented as a live observation.
    """
    name = "mock"
    provenance = PROVENANCE_SIMULATED
    state = STATE_MOCK

    def __init__(self, resolution_m: float = 20.0, size: int = 10, seed: int = 42):
        self.resolution_m = resolution_m
        self.size = size
        self._rng = random.Random(seed)

    async def fetch_interferogram(self, bbox: Dict[str, float]) -> Dict[str, Any]:
        # Simulated API latency
        await asyncio.sleep(0.2)
        grid = [[round(self._rng.uniform(-15.0, 5.0), 3) for _ in range(self.size)]
                for _ in range(self.size)]
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return {
            "provider": self.name,
            "provider_state": self.state,               # MOCK — never rendered as LIVE
            "grid": grid,
            "timestamp": ts,
            "resolution_m": self.resolution_m,
            "coherence_avg": 0.82,
            "coherence_note": "SIMULATED coherence value (mock provider)",
            "velocity_note": "grid values are mm/year LOS; velocity per hotspot is "
                              "extracted downstream (deformation.py)",
            "provenance": self.provenance,
            "is_simulated": True,
            "metadata": _base_metadata(
                scene_id=f"MOCK-S1-{ts.replace('-', '').replace(':', '').replace('T', '')}",
                timestamp=ts, bbox=bbox, provider=self.name,
                resolution_m=self.resolution_m),
            "bbox": bbox,
        }


def get_provider(name: str = None) -> InSARProvider:
    """Provider factory. `name` defaults to the INSAR_PROVIDER env var, which
    defaults to the clearly-labelled mock."""
    name = (name or os.getenv("INSAR_PROVIDER", "mock")).lower()
    if name == "sentinel":
        return SentinelProvider()
    if name == "nisar":
        return NISARProvider()
    if name == "mock":
        return MockInSARProvider()
    raise ValueError(f"Unknown InSAR provider: {name!r} (expected mock|sentinel|nisar)")
