"""
TerraMesh AI — Geotechnical Analysis Engine
=============================================
Transparent engineering calculations SEPARATE from ML predictions.
All outputs carry provenance "ENGINEERING CALCULATION".

Implements (documented, industry-standard empirical methods):

  * Factor of Safety against roof/strata failure
      - Mohr-Coulomb shear-strength estimate with a simplified
        pseudo-single-plane admittance form:
          driving stress  ~ gamma * depth * (1 - extraction_ratio)
          resisting stress ~ cohesion + sigma_n * tan(phi)
        FoS = resisting / driving  (clamped, unit-consistent)
  * RMR-89 (Bieniawski) rock-mass rating with explicit input weights
  * Q-System (Barton) rock-mass quality: Q = (RQD/Jn)(Jr/Ja)(Jw/SRF)
  * Sheorey (1993)/NCB expected subsidence context (shared by shadow_engine)

Engineering assumptions are CONFIGURABLE (method parameters with defaults).
These are standard textbook formulations — NOT regulatory compliance
certifications. No certification or statutory approval is claimed anywhere
in this module.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class GeotechInputs:
    depth_m: float = 185.0
    seam_thickness_m: float = 3.2
    cohesion_mpa: float = 2.4          # intact rock cohesion
    friction_angle_deg: float = 28.0   # Mohr-Coulomb phi
    ucs_mpa: float = 25.0              # unconfined compressive strength
    rqd_pct: float = 70.0             # Rock Quality Designation
    joint_set_number: int = 9          # Jn (3 joint sets => 9)
    joint_roughness: float = 1.5      # Jr (rough/planar)
    joint_alteration: float = 2.0     # Ja (slightly altered)
    joint_water_reduction: float = 1.0  # Jw (dry)
    stress_reduction_factor: float = 2.5  # SRF (moderate stress)
    gamma_kn_per_m3: float = 25.0     # rock unit weight (kN/m^3)
    extraction_ratio: float = 0.75    # fraction of coal extracted
    dry_condition: bool = True       # RMR groundwater adjustment


class GeotechEngine:
    """Stateless engineering calculations — pure functions of the inputs."""

    PROVENANCE = "ENGINEERING CALCULATION"

    # ── Factor of Safety ──────────────────────────────────────────────────
    def factor_of_safety(self, p: GeotechInputs) -> Dict[str, Any]:
        """
        FoS = shear resistance / driving stress.

        driving  sigma_1 = (gamma/1000 MPa/kN) * depth * (1 - extraction_ratio)
        resisting tau     = c + sigma_n * tan(phi), with sigma_n ~ 0.5*sigma_1
        (simplified confined-roof formulation; conservative mid-plane normal
        stress assumption is documented here deliberately).
        """
        import math
        gamma_mpa_per_m = p.gamma_kn_per_m3 / 1000.0  # kN/m^3 -> MPa/m
        sigma_driving_mpa = gamma_mpa_per_m * p.depth_m * max(0.05, (1.0 - p.extraction_ratio))
        sigma_normal_mpa = 0.5 * sigma_driving_mpa
        tau_resisting_mpa = p.cohesion_mpa + sigma_normal_mpa * math.tan(math.radians(p.friction_angle_deg))
        if sigma_driving_mpa <= 0:
            fos = float("inf")
        else:
            fos = tau_resisting_mpa / sigma_driving_mpa
        return {
            "factor_of_safety": round(fos, 3) if fos != float("inf") else None,
            "driving_stress_mpa": round(sigma_driving_mpa, 4),
            "resisting_shear_mpa": round(tau_resisting_mpa, 4),
            "interpretation": (
                "FoS >= 2.0 stable | 1.4-2.0 acceptable | 1.0-1.4 marginal | < 1.0 unsafe"
            ),
            "assumptions": {
                "gamma_kn_per_m3": p.gamma_kn_per_m3,
                "extraction_ratio": p.extraction_ratio,
                "normal_stress_model": "0.5 * driving (documented simplification)",
                "strength_model": "Mohr-Coulomb (c, phi)",
            },
        }

    # ── RMR-89 (Bieniawski) ────────────────────────────────────────────────
    def rmr89(self, p: GeotechInputs) -> Dict[str, Any]:
        """
        RMR-89 with explicit component scores. UCS -> A1, RQD -> A2,
        spacing from RQD (correlated proxy, documented), joint condition
        from Jr/Ja character, groundwater from dry/wet state.
        Range: 0-100.
        """
        # A1: UCS strength (MPa)
        if p.ucs_mpa > 250: a1 = 15
        elif p.ucs_mpa > 100: a1 = 12
        elif p.ucs_mpa > 50: a1 = 7
        elif p.ucs_mpa > 25: a1 = 4
        elif p.ucs_mpa > 5: a1 = 2
        elif p.ucs_mpa > 1: a1 = 1
        else: a1 = 0

        # A2: RQD
        if p.rqd_pct >= 90: a2 = 20
        elif p.rqd_pct >= 75: a2 = 17
        elif p.rqd_pct >= 50: a2 = 13
        elif p.rqd_pct >= 25: a2 = 8
        else: a2 = 3

        # A3: joint spacing — RQD-correlated proxy (documented)
        if p.rqd_pct >= 90: a3 = 20      # > 3 m
        elif p.rqd_pct >= 75: a3 = 15     # 1-3 m
        elif p.rqd_pct >= 50: a3 = 10     # 0.3-1 m
        else: a3 = 8                      # < 50 mm-300 mm band

        # A4: joint condition from Jr/Ja ratio (rough-clean planar baseline)
        jr_ja = p.joint_roughness / max(p.joint_alteration, 1e-6)
        if jr_ja >= 1.0: a4 = 25         # rough, unaltered
        elif jr_ja >= 0.5: a4 = 20
        elif jr_ja >= 0.25: a4 = 12
        else: a4 = 6

        # A5: groundwater (dry = 10, wet assumed reduced)
        a5 = 10 if p.dry_condition else 4

        total = a1 + a2 + a3 + a4 + a5
        if total >= 80: cls = "I - Very good rock"
        elif total >= 60: cls = "II - Good rock"
        elif total >= 40: cls = "III - Fair rock"
        elif total >= 20: cls = "IV - Poor rock"
        else: cls = "V - Very poor rock"
        return {
            "rmr89": total,
            "components": {"A1_ucs": a1, "A2_rqd": a2, "A3_spacing_proxy": a3,
                            "A4_joint_condition": a4, "A5_groundwater": a5},
            "class": cls,
            "notes": "A3 uses an RQD-correlated spacing proxy (documented simplification). "
                     "Standard Bieniawski (1989) weighting; no certification implied.",
        }

    # ── Q-System (Barton) ──────────────────────────────────────────────────
    def q_system(self, p: GeotechInputs) -> Dict[str, Any]:
        """Q = (RQD/Jn) x (Jr/Ja) x (Jw/SRF) — Barton et al. (1974)."""
        rqd = max(p.rqd_pct, 10.0)  # Barton recommends 10 as floor
        q_value = (rqd / p.joint_set_number) \
            * (p.joint_roughness / max(p.joint_alteration, 1e-6)) \
            * (p.joint_water_reduction / max(p.stress_reduction_factor, 1e-6))
        if q_value >= 40: quality = "Very good (III a-b lower boundary to II)"
        elif q_value >= 10: quality = "Good"
        elif q_value >= 4: quality = "Fair"
        elif q_value >= 1: quality = "Poor"
        elif q_value >= 0.1: quality = "Very poor"
        else: quality = "Exceptionally poor"
        # Equivalent stand-up time support categories (Barton categories 1-7)
        return {
            "q_value": round(q_value, 3),
            "quality": quality,
            "inputs": {"RQD": rqd, "Jn": p.joint_set_number, "Jr": p.joint_roughness,
                        "Ja": p.joint_alteration, "Jw": p.joint_water_reduction,
                        "SRF": p.stress_reduction_factor},
            "notes": "Barton Q-system (1974). Empirical classification only.",
        }

    # ── Combined panel analysis ────────────────────────────────────────────
    def analyze_panel(self, **kwargs) -> Dict[str, Any]:
        p = GeotechInputs(**{k: v for k, v in kwargs.items() if v is not None and hasattr(GeotechInputs, k)})
        return {
            "provenance": self.PROVENANCE,
            "factor_of_safety": self.factor_of_safety(p),
            "rmr89": self.rmr89(p),
            "q_system": self.q_system(p),
            "disclaimer": "Engineering calculations per published empirical methods. "
                          "Not a certification, statutory determination, or substitute for "
                          "a qualified geotechnical engineer's assessment.",
        }
