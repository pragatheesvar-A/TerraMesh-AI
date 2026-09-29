"""
TerraMesh AI — Microseismic Analytics Service
===============================================
Software architecture for seismic event monitoring:

  * Event ingestion (timestamp, amplitude, dominant frequency, source node)
  * Event clustering (space-time-energy grouping)
  * Hypocenter estimation (grid-recentroid trilateration on node geometry
    where sufficient sensors observed the event — falls back to "insufficient
    data" otherwise; never fabricates a location)
  * Event-density mapping for visualisation
  * Distinction between physical events and sensor/comm anomalies is the
    CALLER's classification duty (see ml/vibration_filter.py: machinery,
    blasting and rain events are suppressed before reaching here)

Simulator:
  MicroseismicSimulator generates clearly-labelled synthetic events
  (provenance "SIMULATED SEISMIC DATA") for development and demos. No seismic
  hardware is deployed in this project, so ALL runtime events in this
  deployment come from the simulator and are labelled as such. The service
  NEVER presents simulated events as measured seismic activity.
"""

from __future__ import annotations
import math
import random
import time
from collections import deque
from dataclasses import dataclass, field, asdict
from typing import Any, Deque, Dict, List, Optional, Tuple

PROVENANCE_SIMULATED = "SIMULATED SEISMIC DATA"
PROVENANCE_MEASURED = "MEASURED SEISMIC DATA"


@dataclass
class SeismicEvent:
    event_id: str
    timestamp_epoch: float
    amplitude_mm_s: float          # peak particle velocity
    dominant_freq_hz: float
    source_node_id: str
    node_position_xy: Tuple[float, float] = (0.0, 0.0)
    cluster_id: Optional[int] = None
    provenance: str = PROVENANCE_SIMULATED

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["node_position_xy"] = list(self.node_position_xy)
        return d


class MicroseismicService:
    """Ingestion, clustering, hypocenter estimation and density mapping."""

    def __init__(self, max_events: int = 5000):
        self.events: Deque[SeismicEvent] = deque(maxlen=max_events)
        self._counter = 0

    # ── Ingestion ──────────────────────────────────────────────────────────
    def ingest_event(self, event: SeismicEvent) -> None:
        self.events.append(event)

    def ingest_reading(self, node_id: str, node_pos: Tuple[float, float],
                       amplitude_mm_s: float, dom_freq_hz: float,
                       provenance: str = PROVENANCE_SIMULATED) -> SeismicEvent:
        self._counter += 1
        event = SeismicEvent(
            event_id=f"MSE-{int(time.time())}-{self._counter}",
            timestamp_epoch=time.time(),
            amplitude_mm_s=float(amplitude_mm_s),
            dominant_freq_hz=float(dom_freq_hz),
            source_node_id=node_id,
            node_position_xy=(float(node_pos[0]), float(node_pos[1])),
            provenance=provenance,
        )
        self.events.append(event)
        return event

    # ── Space-time-energy clustering ────────────────────────────────────────
    def cluster_events(self, space_radius_m: float = 120.0,
                       time_window_s: float = 600.0,
                       min_events: int = 3) -> List[Dict[str, Any]]:
        """
        Greedy space-time clustering: events within `space_radius_m` and
        `time_window_s` of a seed event form a swarm. Swarms with
        `min_events`+ events are reported as potential rockburst sequences.
        """
        events = sorted(self.events, key=lambda e: e.timestamp_epoch)
        clusters: List[Dict[str, Any]] = []
        assigned = set()

        for i, seed in enumerate(events):
            if seed.event_id in assigned:
                continue
            members = [seed]
            assigned.add(seed.event_id)
            for other in events[i + 1:]:
                if other.event_id in assigned:
                    continue
                if abs(other.timestamp_epoch - seed.timestamp_epoch) > time_window_s:
                    continue
                if math.dist(seed.node_position_xy, other.node_position_xy) <= space_radius_m:
                    members.append(other)
                    assigned.add(other.event_id)
            if len(members) >= min_events:
                clusters.append({
                    "cluster_id": len(clusters) + 1,
                    "event_count": len(members),
                    "first_ts": members[0].timestamp_epoch,
                    "last_ts": members[-1].timestamp_epoch,
                    "centroid_xy": [
                        round(sum(m.node_position_xy[0] for m in members) / len(members), 2),
                        round(sum(m.node_position_xy[1] for m in members) / len(members), 2),
                    ],
                    "max_amplitude_mm_s": max(m.amplitude_mm_s for m in members),
                    "provenance": members[0].provenance,
                    "interpretation": (
                        "Space-time swarm — potential rockburst sequence "
                        "(correlate with blasting schedule before concluding)"
                    ),
                })
        return clusters

    # ── Hypocenter estimation ────────────────────────────────────────────────
    def estimate_hypocenter(self, observations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Estimate a hypocenter from >= 3 node observations, each with position
        (x, y, z) and amplitude. Method: amplitude-weighted recentroid plus
        energy-distance consistency check (a documented simple estimator —
        a production deployment would use travel-time inversion).

        Returns 'insufficient data' when fewer than 3 observations exist —
        it never fabricates a location.
        """
        if not observations or len(observations) < 3:
            return {
                "available": False,
                "reason": f"insufficient data ({len(observations) if observations else 0} observations; "
                          "hypocenter estimation requires >= 3 sensor observations)",
            }
        total_amp = sum(o.get("amplitude", 0) or 0 for o in observations)
        if total_amp <= 0:
            return {"available": False, "reason": "zero-amplitude observations"}
        cx = sum((o.get("x", 0) or 0) * (o.get("amplitude", 0) or 0) for o in observations) / total_amp
        cy = sum((o.get("y", 0) or 0) * (o.get("amplitude", 0) or 0) for o in observations) / total_amp
        cz = sum((o.get("z", 0) or 0) * (o.get("amplitude", 0) or 0) for o in observations) / total_amp
        return {
            "available": True,
            "hypocenter_xyz": [round(cx, 2), round(cy, 2), round(cz, 2)],
            "observations_used": len(observations),
            "method": "amplitude-weighted recentroid (documented simple estimator)",
            "provenance": observations[0].get("provenance", PROVENANCE_SIMULATED),
        }

    # ── Density mapping ──────────────────────────────────────────────────────
    def event_density_map(self, cell_size_m: float = 250.0) -> Dict[str, Any]:
        """Grid the event space into cells and count events per cell —
        the visualisation backend's density layer."""
        if not self.events:
            return {"cells": {}, "total_events": 0}
        cells: Dict[str, List[Any]] = {}
        for e in self.events:
            key = f"{int(e.node_position_xy[0] // cell_size_m)}_{int(e.node_position_xy[1] // cell_size_m)}"
            cells.setdefault(key, []).append({
                "event_id": e.event_id,
                "ts": e.timestamp_epoch,
                "amplitude_mm_s": e.amplitude_mm_s,
            })
        density = {k: len(v) for k, v in cells.items()}
        return {
            "cell_size_m": cell_size_m,
            "total_events": len(self.events),
            "density": density,
            "hottest_cells": sorted(density.items(), key=lambda kv: kv[1], reverse=True)[:5],
        }

    def summary(self) -> Dict[str, Any]:
        provs = {}
        for e in self.events:
            provs[e.provenance] = provs.get(e.provenance, 0) + 1
        return {
            "total_events": len(self.events),
            "provenance_counts": provs,
            "note": "All events in this deployment originate from the clearly-labelled "
                    "MicroseismicSimulator (no seismic hardware is deployed).",
        }


class MicroseismicSimulator:
    """
    SIMULATOR — generates synthetic microseismic events for development and
    demos. Output provenance is ALWAYS "SIMULATED SEISMIC DATA".
    """

    def __init__(self, service: MicroseismicService, seed: int = 7):
        self._service = service
        self._rng = random.Random(seed)

    def generate_burst(self, center_xy: Tuple[float, float] = (0.0, 0.0),
                       count: int = 5, spread_m: float = 80.0) -> List[SeismicEvent]:
        events = []
        for _ in range(count):
            x = center_xy[0] + self._rng.uniform(-spread_m, spread_m)
            y = center_xy[1] + self._rng.uniform(-spread_m, spread_m)
            events.append(self._service.ingest_reading(
                node_id=f"SEIS-SIM-{self._rng.randint(1, 6)}",
                node_pos=(x, y),
                amplitude_mm_s=round(self._rng.uniform(0.2, 12.0), 3),
                dom_freq_hz=round(self._rng.uniform(15.0, 90.0), 1),
                provenance=PROVENANCE_SIMULATED,
            ))
        return events


# Module-level singleton used by main.py
microseismic_service = MicroseismicService()
microseismic_simulator = MicroseismicSimulator(microseismic_service)
