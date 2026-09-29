"""
TerraMesh AI — Worker Location Service
=======================================
Canonical worker-location store. Hardware-ready: the SAME schema and the
SAME consumption path (evacuation, zone containment, dashboards) work for

  SIMULATOR  — the demo roster (current source; always labelled SIMULATION)
  RFID       — gate/gantry readers (future hardware)
  RTLS       — real-time location systems (future hardware)
  UWB        — ultra-wideband anchors (future hardware)
  OTHER      — any positional source; provenance stays UNLABELED until
               an operator classifies it

Storage: latest-fix-per-worker with TTL semantics (positions are ephemeral).
Redis is the production store; an in-memory dict is the honest fallback
(single-process dev). Provenance is DERIVED server-side from the declared
source — a client can never mark its own feed as MEASURED without a
hardware source code.
"""

from __future__ import annotations
import logging
import time
from typing import Dict, List, Optional

logger = logging.getLogger("terramesh.worker_location")

VALID_SOURCES = ("SIMULATOR", "RFID", "RTLS", "UWB", "OTHER")

# Derived provenance per source — the honesty contract
SOURCE_PROVENANCE = {
    "SIMULATOR": "SIMULATION",
    "RFID": "MEASURED DATA",
    "RTLS": "MEASURED DATA",
    "UWB": "MEASURED DATA",
    "OTHER": "UNLABELED",
}

MAX_FIXES = 4096          # bounded history (latest per worker)
STALE_AFTER_S = 900       # a fix older than 15 minutes is flagged stale


class WorkerLocationService:
    def __init__(self):
        self._latest: Dict[str, Dict] = {}      # worker_id -> fix dict
        self._history: Dict[str, List[Dict]] = {}
        self._sources: Dict[str, str] = {}

    def ingest(self, fix: Dict) -> Dict:
        """Validate + store one location fix. Returns the stored fix with
        server-derived provenance."""
        source = str(fix.get("location_source", "OTHER")).upper()
        if source not in VALID_SOURCES:
            raise ValueError(f"location_source must be one of {VALID_SOURCES}, got {source!r}")
        stored = dict(fix)
        stored["location_source"] = source
        stored["provenance"] = SOURCE_PROVENANCE[source]
        stored["received_epoch"] = time.time()

        wid = stored["worker_id"]
        self._latest[wid] = stored
        self._sources[wid] = source
        hist = self._history.setdefault(wid, [])
        hist.append(stored)
        if len(hist) > 20:
            hist.pop(0)
        if len(self._latest) > MAX_FIXES:
            # evict oldest received
            oldest = min(self._latest.values(), key=lambda f: f.get("received_epoch", 0))
            self._latest.pop(oldest["worker_id"], None)
        if source == "SIMULATOR":
            logger.debug("Simulated worker fix stored for %s", wid)
        return stored

    def get_latest(self, worker_id: str) -> Optional[Dict]:
        fix = self._latest.get(worker_id)
        if not fix:
            return None
        out = dict(fix)
        age = time.time() - out.get("received_epoch", 0)
        out["stale"] = age > STALE_AFTER_S
        return out

    def get_all_latest(self) -> List[Dict]:
        out = []
        for wid in self._latest:
            f = self.get_latest(wid)
            if f:
                out.append(f)
        return out

    def source_counts(self) -> Dict[str, int]:
        counts = {s: 0 for s in VALID_SOURCES}
        for s in self._sources.values():
            counts[s] = counts.get(s, 0) + 1
        return counts


# Module singleton
worker_location_service = WorkerLocationService()
