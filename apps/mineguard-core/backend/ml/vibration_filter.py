"""
TerraMesh AI — Vibration Fingerprinter & Blasting Suppression Engine
====================================================================
Analyzes 200 Hz ADXL345 quantitative vibration bursts to discriminate:
  1. Genuine Strata Motion (0–10 Hz, low frequency energy)
  2. Routine Shift Blasting (10–50 Hz, high RMS, short impulse)
  3. Heavy Machinery / Haul Truck Rumblings (15–35 Hz, continuous)
  4. Monsoon Rain / Environmental Noise

Automatically enforces SIREN SUPPRESSION during blasting events
to prevent false mine evacuation alarms.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Union
import numpy as np
import pandas as pd


@dataclass
class VibrationResult:
    vibration_class: str       # "GROUND_MOTION", "BLASTING", "MACHINERY", "RAIN_WIND", "QUIET"
    is_blast: bool
    suppress_alarm: bool       # Gate for siren and evacuation trigger
    band_ratio_0_10: float     # E(0-10) / (E(0-10) + E(10-50))
    confidence: float
    details: Dict[str, float]


class VibrationFingerprinter:
    """
    Classifies vibration events from spectral energy bands, peak acceleration,
    and daily mine blasting schedules.
    """

    def __init__(
        self,
        ambient_noise_floor_g: float = 0.015,
        blast_rms_threshold_g: float = 0.050,
        blast_peak_threshold_g: float = 0.150,
        strata_freq_max_hz: float = 10.0,
        blasting_freq_min_hz: float = 12.0,
        scheduled_blast_hours: Tuple[int, int] = (10, 11),  # Typical 10:00 - 11:00 AM mine shift blast
    ):
        self.ambient_noise_floor_g = ambient_noise_floor_g
        self.blast_rms_threshold_g = blast_rms_threshold_g
        self.blast_peak_threshold_g = blast_peak_threshold_g
        self.strata_freq_max_hz = strata_freq_max_hz
        self.blasting_freq_min_hz = blasting_freq_min_hz
        self.scheduled_blast_hours = scheduled_blast_hours

    def compute_band_ratio(self, e_0_10: float, e_10_50: float) -> float:
        """Computes ratio of low-frequency (strata) energy to total energy."""
        tot = e_0_10 + e_10_50
        if tot <= 1e-9:
            return 0.5
        return float(e_0_10 / tot)

    def is_in_blast_schedule(self, timestamp_h: float) -> bool:
        """Returns True if the timestamp falls within scheduled daily blasting window."""
        hour_of_day = int(timestamp_h) % 24
        start, end = self.scheduled_blast_hours
        return start <= hour_of_day < end

    def classify(
        self,
        vib_rms_g: float,
        vib_peak_g: float,
        dom_freq_hz: float,
        band_energy_0_10: float = 0.0,
        band_energy_10_50: float = 0.0,
        timestamp_h: float = 0.0,
        rain_flag: int = 0,
        vehicle_flag: int = 0,
        manual_blast_flag: Optional[int] = None,
    ) -> VibrationResult:
        """
        Classifies a single telemetry cycle's vibration burst into one of the 5 classes
        and determines whether warning sirens should be suppressed.
        """
        band_ratio = self.compute_band_ratio(band_energy_0_10, band_energy_10_50)
        in_schedule = self.is_in_blast_schedule(timestamp_h)
        details = {
            "vib_rms_g": vib_rms_g,
            "vib_peak_g": vib_peak_g,
            "dom_freq_hz": dom_freq_hz,
            "band_ratio_0_10": band_ratio,
            "in_blast_schedule": float(in_schedule),
        }

        # Check for ambient quiet
        if vib_rms_g < self.ambient_noise_floor_g and vib_peak_g < (self.ambient_noise_floor_g * 2.5):
            return VibrationResult(
                vibration_class="QUIET",
                is_blast=False,
                suppress_alarm=False,
                band_ratio_0_10=band_ratio,
                confidence=0.99,
                details=details,
            )

        # 1. BLASTING IDENTIFICATION (Rule + Spectral Signature)
        # Blast features: High RMS, high peak, dominant freq > 12 Hz, high 10-50 Hz energy
        is_blast_sig = (
            (vib_rms_g >= self.blast_rms_threshold_g or vib_peak_g >= self.blast_peak_threshold_g)
            and (dom_freq_hz >= self.blasting_freq_min_hz or band_ratio < 0.35)
        )

        if manual_blast_flag == 1 or (is_blast_sig and in_schedule) or (vib_rms_g > 0.10 and dom_freq_hz > 15.0):
            return VibrationResult(
                vibration_class="BLASTING",
                is_blast=True,
                suppress_alarm=True,    # CRITICAL: Suppress siren during blast!
                band_ratio_0_10=band_ratio,
                confidence=0.96 if in_schedule else 0.88,
                details=details,
            )

        # 2. VEHICLE / HAUL TRUCK DISTURBANCE
        if vehicle_flag == 1 or (15.0 <= dom_freq_hz <= 35.0 and vib_rms_g < self.blast_rms_threshold_g and band_ratio < 0.40):
            return VibrationResult(
                vibration_class="MACHINERY",
                is_blast=False,
                suppress_alarm=True,    # Suppress siren for passing haul trucks
                band_ratio_0_10=band_ratio,
                confidence=0.85,
                details=details,
            )

        # 3. RAIN / MONSOON NOISE
        if rain_flag == 1 or (dom_freq_hz > 30.0 and vib_rms_g < 0.03 and band_ratio < 0.30):
            return VibrationResult(
                vibration_class="RAIN_WIND",
                is_blast=False,
                suppress_alarm=True,
                band_ratio_0_10=band_ratio,
                confidence=0.80,
                details=details,
            )

        # 4. STRATA / GROUND MOTION
        # Low frequency dominant (<10 Hz), higher energy in 0-10 Hz band
        if dom_freq_hz <= self.strata_freq_max_hz or band_ratio >= 0.50:
            return VibrationResult(
                vibration_class="GROUND_MOTION",
                is_blast=False,
                suppress_alarm=False,   # DO NOT SUPPRESS — genuine strata movement!
                band_ratio_0_10=band_ratio,
                confidence=0.92,
                details=details,
            )

        # Default fallback
        return VibrationResult(
            vibration_class="QUIET",
            is_blast=False,
            suppress_alarm=False,
            band_ratio_0_10=band_ratio,
            confidence=0.70,
            details=details,
        )

    def classify_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Vectorized / batched classification across a DataFrame."""
        results = []
        for _, row in df.iterrows():
            res = self.classify(
                vib_rms_g=float(row.get("vib_rms_g", 0.0)),
                vib_peak_g=float(row.get("vib_peak_g", 0.0)),
                dom_freq_hz=float(row.get("dom_freq_hz", 0.0)),
                band_energy_0_10=float(row.get("band_energy_0_10", 0.0)),
                band_energy_10_50=float(row.get("band_energy_10_50", 0.0)),
                timestamp_h=float(row.get("timestamp_h", 0.0)),
                rain_flag=int(row.get("rain_flag", 0)),
                vehicle_flag=int(row.get("vehicle_flag", 0)),
                manual_blast_flag=int(row.get("blast_flag", 0)) if "blast_flag" in row else None,
            )
            results.append({
                "pred_vibration_class": res.vibration_class,
                "is_blast": int(res.is_blast),
                "suppress_alarm": int(res.suppress_alarm),
                "band_ratio_0_10": res.band_ratio_0_10,
                "confidence": res.confidence,
            })
        return pd.DataFrame(results, index=df.index)
