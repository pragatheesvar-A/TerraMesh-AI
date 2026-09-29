"""
TerraMesh AI — Environmental Safety Engine (Mine Atmosphere)
==============================================================
Gas-risk and explosibility analysis for mine atmospheres.

Scope & honesty:
  * This module computes hazard classifications FROM SUPPLIED CONCENTRATION
    MEASUREMENTS. It never fabricates live gas readings — callers provide
    measured concentrations (or explicitly-labelled simulated ones).
  * Sensor health (a node problem) is handled SEPARATELY from environmental
    hazard (an atmosphere problem) — a failing CH4 sensor is NOT a gas
    danger, and vice versa. `classify_atmosphere` reports both dimensions
    distinctly.
  * Explosibility uses the Coward explosibility triangle concept (documented
    engineering logic used in mine ventilation practice). Results are
    engineering guidance, not regulatory determinations.

Supported channels:
  * methane (CH4) — % by volume
  * carbon monoxide (CO) — ppm
  * carbon dioxide (CO2) — %
  * oxygen (O2) — %
  * temperature — °C
  * humidity — %RH
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class AtmosphereReading:
    ch4_pct: Optional[float] = None
    co_ppm: Optional[float] = None
    co2_pct: Optional[float] = None
    o2_pct: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    # Provenance of the INPUT concentrations (caller decides: MEASURED/SIMULATED)
    provenance: str = "MEASURED"


class EnvironmentalSafetyEngine:
    PROVENANCE = "ENGINEERING CALCULATION"

    # ── Channel-wise limits (project engineering limits — documented) ──────
    # CH4 explosible range 5-15% v/v; project action levels are set far lower.
    CH4_WARN_PCT = 0.5
    CH4_EVAC_PCT = 1.0
    CH4_LEL_PCT = 5.0           # literature lower explosible limit

    CO_WARN_PPM = 24.0           # ~30 mg/m^3 ST exposure guidance band
    CO_EVAC_PPM = 50.0
    CO_FATAL_HINT_PPM = 1000.0   # immediate danger band (literature)

    CO2_WARN_PCT = 1.0
    CO2_EVAC_PCT = 3.0

    O2_DEFICIENT_PCT = 19.5      # O2-deficient atmosphere threshold
    O2_CRITICAL_PCT = 18.0

    TEMP_WARN_C = 32.0
    TEMP_EVAC_C = 38.0

    def classify_atmosphere(self, reading: AtmosphereReading) -> Dict[str, Any]:
        """Classify each channel, then the overall atmosphere. Sensor-health
        issues are NOT mixed into the hazard verdict."""
        channels: Dict[str, Any] = {}

        if reading.ch4_pct is not None:
            ch4 = float(reading.ch4_pct)
            if ch4 >= self.CH4_EVAC_PCT: ch4_state = "EVACUATE"
            elif ch4 >= self.CH4_WARN_PCT: ch4_state = "WARNING"
            else: ch4_state = "NORMAL"
            channels["methane"] = {
                "value_pct": ch4, "state": ch4_state,
                "fraction_of_lel_pct": round(100.0 * ch4 / self.CH4_LEL_PCT, 2),
            }

        if reading.co_ppm is not None:
            co = float(reading.co_ppm)
            if co >= self.CO_EVAC_PPM: co_state = "EVACUATE"
            elif co >= self.CO_WARN_PPM: co_state = "WARNING"
            else: co_state = "NORMAL"
            channels["carbon_monoxide"] = {"value_ppm": co, "state": co_state}

        if reading.co2_pct is not None:
            co2 = float(reading.co2_pct)
            if co2 >= self.CO2_EVAC_PCT: co2_state = "EVACUATE"
            elif co2 >= self.CO2_WARN_PCT: co2_state = "WARNING"
            else: co2_state = "NORMAL"
            channels["carbon_dioxide"] = {"value_pct": co2, "state": co2_state}

        if reading.o2_pct is not None:
            o2 = float(reading.o2_pct)
            if o2 <= self.O2_CRITICAL_PCT: o2_state = "EVACUATE"
            elif o2 <= self.O2_DEFICIENT_PCT: o2_state = "WARNING"
            else: o2_state = "NORMAL"
            channels["oxygen"] = {"value_pct": o2, "state": o2_state}

        if reading.temperature_c is not None:
            t = float(reading.temperature_c)
            t_state = "EVACUATE" if t >= self.TEMP_EVAC_C else (
                "WARNING" if t >= self.TEMP_WARN_C else "NORMAL")
            channels["temperature"] = {"value_c": t, "state": t_state}

        if reading.humidity_pct is not None:
            channels["humidity"] = {"value_pct": float(reading.humidity_pct), "state": "INFO"}

        # Overall verdict: worst of the classified channels
        states = [c["state"] for c in channels.values() if isinstance(c, dict) and "state" in c]
        overall = "EVACUATE" if "EVACUATE" in states else (
            "WARNING" if "WARNING" in states else "NORMAL")

        explosibility = self.explosibility_analysis(reading) if reading.ch4_pct is not None else None

        return {
            "provenance": f"{self.PROVENANCE} (input data: {reading.provenance})",
            "overall_state": overall,
            "channels": channels,
            "explosibility": explosibility,
            "sensor_health_note": "Channel states reflect ATMOSPHERE hazard only. "
                                  "Sensor/comm faults are tracked separately (ml/sensor_health.py) "
                                  "and are never reported as gas danger.",
            "disclaimer": "Project engineering limits, not statutory exposure or "
                          "ventilation-law determinations.",
        }

    # ── Coward explosibility triangle ────────────────────────────────────────
    def explosibility_analysis(self, reading: AtmosphereReading) -> Dict[str, Any]:
        """
        Coward-triangle screening (documented engineering logic):

        The methane explosibility triangle in (CH4, O2) space is bounded by
        the lower explosible limit point (5% CH4 on the air line), the upper
        explosible limit point (15% CH4 on the air line) and the nose — the
        intersection of the LEL line with the critical-O2 line (~12.1% O2),
        at approximately (5.9% CH4, 12.1% O2) for methane. A gas sample is
        EXPLOSIBLE when its (CH4, O2) point lies inside the triangle.
        """
        if reading.ch4_pct is None or reading.o2_pct is None:
            return {"available": False,
                    "reason": "explosibility screening needs both CH4% and O2%"}

        ch4 = float(reading.ch4_pct)
        o2 = float(reading.o2_pct)

        # Triangle vertices (literature values, Coward method)
        nose = (5.9, 12.1)
        lel_pt = (5.0, 20.93)
        uel_pt = (15.0, 17.79)

        inside = self._point_in_triangle((ch4, o2), nose, lel_pt, uel_pt)
        # Approach screening: inside a 1.25x dilated triangle = near-explosible
        near = (not inside) and self._point_in_triangle(
            (ch4, o2),
            self._dilate(nose, nose, lel_pt, uel_pt, 1.25),
            self._dilate(lel_pt, nose, lel_pt, uel_pt, 1.25),
            self._dilate(uel_pt, nose, lel_pt, uel_pt, 1.25),
        )

        state = "EXPLOSIBLE" if inside else ("NEAR-EXPLOSIBLE" if near else "NOT EXPLOSIBLE")
        return {
            "available": True,
            "state": state,
            "ch4_pct": ch4,
            "o2_pct": o2,
            "triangle_vertices": {"nose": nose, "lel": lel_pt, "uel": uel_pt},
            "method": "Coward explosibility triangle (documented screening logic)",
            "notes": "Screening guidance for ventilation officers; confirm with "
                     "portable gas analysis before operational decisions.",
        }

    # ── Geometry helpers ─────────────────────────────────────────────────────
    @staticmethod
    def _sign(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

    @classmethod
    def _point_in_triangle(cls, pt, v1, v2, v3) -> bool:
        d1 = cls._sign(pt, v1, v2)
        d2 = cls._sign(pt, v2, v3)
        d3 = cls._sign(pt, v3, v1)
        has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
        has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
        return not (has_neg and has_pos)

    @staticmethod
    def _dilate(pt, v1, v2, v3, factor: float):
        """Dilate a triangle vertex about the triangle centroid."""
        cx = (v1[0] + v2[0] + v3[0]) / 3.0
        cy = (v1[1] + v2[1] + v3[1]) / 3.0
        return (cx + (pt[0] - cx) * factor, cy + (pt[1] - cy) * factor)


# ── Environmental hazard API surface (wired from main.py telemetry) ─────────

def classify_gas_packet(packet: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience wrapper: classify a telemetry packet's gas fields.
    Absent channels are simply not classified — never defaulted."""
    reading = AtmosphereReading(
        ch4_pct=packet.get("ch4_pct"),
        co_ppm=packet.get("co_ppm"),
        co2_pct=packet.get("co2_pct"),
        o2_pct=packet.get("o2_pct"),
        temperature_c=packet.get("temp_c"),
        humidity_pct=packet.get("humidity_pct"),
        provenance=str(packet.get("_provenance", "MEASURED")).upper(),
    )
    return EnvironmentalSafetyEngine().classify_atmosphere(reading)
