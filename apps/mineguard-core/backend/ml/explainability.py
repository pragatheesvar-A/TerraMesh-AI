"""
TerraMesh AI — Module 4.3: Bilingual Explainability Engine (XAI)
================================================================
Generates real-time, human-readable explainability cards in English and Hindi
for Mine Safety Officers, Shift In-Charges, and Safety Regulatory Compliance.

Complies with SIH Problem Statement 26025 requirement:
  "Explainable Warning Hierarchy with Bilingual Ground Truth Action Protocols"
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import json
import pandas as pd

from ml.shadow_engine import ShadowDecision


# Bilingual Warning Tier Mappings
TIER_TRANSLATIONS = {
    "NORMAL": {
        "en": "NORMAL (STABLE)",
        "hi": "सामान्य (स्थिर स्थिति)",
        "color": "#10B981", # Green
    },
    "WATCH": {
        "en": "WATCH (ELEVATED ATTENTION)",
        "hi": "निगरानी (सतर्कता आवश्यक)",
        "color": "#F59E0B", # Yellow
    },
    "WARNING": {
        "en": "WARNING (ACTIVE DEFORMATION)",
        "hi": "चेतावनी (सक्रिय विरूपण)",
        "color": "#F97316", # Orange
    },
    "CRITICAL": {
        "en": "CRITICAL (IMMEDIATE EVACUATION)",
        "hi": "गंभीर ख़तरा (तत्काल निकासी)",
        "color": "#EF4444", # Red
    },
}


@dataclass
class ExplanationCard:
    node_id: str
    timestamp_iso: str
    warning_tier_en: str
    warning_tier_hi: str
    badge_color: str
    composite_risk_score: float
    summary_en: str
    summary_hi: str
    key_evidence: List[Dict[str, str]]
    spatial_consensus_en: str
    spatial_consensus_hi: str
    action_protocol_en: str
    action_protocol_hi: str
    siren_status_en: str
    siren_status_hi: str

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, ensure_ascii=False)


class BilingualExplainabilityEngine:
    """
    Synthesizes technical decisions from the SHADOW engine into actionable
    bilingual cards for control-room operators and mine safety officers.
    """

    def generate_card(
        self,
        decision: ShadowDecision,
        telemetry: Optional[pd.Series] = None,
    ) -> ExplanationCard:
        tier = decision.warning_tier
        trans = TIER_TRANSLATIONS.get(tier, TIER_TRANSLATIONS["NORMAL"])

        # Extract current telemetry metrics
        tilt_val = float(telemetry.get("tilt_mag_mrad", 0.0)) if telemetry is not None else 0.0
        crack_val = float(telemetry.get("crack_mm", telemetry.get("crack_gap_mm", 0.0))) if telemetry is not None else 0.0
        strain_val = float(telemetry.get("strain_ustrain", 0.0)) if telemetry is not None else 0.0
        vib_val = float(telemetry.get("vib_rms_g", 0.0)) if telemetry is not None else 0.0

        # Physical Evidence List
        key_evidence = [
            {
                "parameter_en": "Ground Tilt Magnitude",
                "parameter_hi": "सतह झुकाव (टिल्ट)",
                "value": f"{tilt_val:.2f} mrad",
                "status": "ELEVATED" if tilt_val > 4.0 else "NORMAL",
            },
            {
                "parameter_en": "Surface Crack Gap",
                "parameter_hi": "सतह दरार चौड़ाई",
                "value": f"{crack_val:.2f} mm",
                "status": "WIDENING" if crack_val > 10.0 else "BASELINE",
            },
            {
                "parameter_en": "Strata Microstrain",
                "parameter_hi": "भूगर्भीय माइक्रोस्ट्रेन",
                "value": f"{strain_val:.1f} με",
                "status": "TENSILE STRESS" if abs(strain_val) > 20.0 else "STABLE",
            },
            {
                "parameter_en": "Vibration Level",
                "parameter_hi": "कंपन स्तर (RMS)",
                "value": f"{vib_val:.4f} g",
                "status": "BLASTING" if decision.siren_suppressed else ("DYNAMIC" if vib_val > 0.02 else "QUIET"),
            },
        ]

        # Spatial Consensus Narrative
        if decision.spatial_consensus_count >= 2:
            spatial_en = f"Confirmed by {decision.spatial_consensus_count} neighboring mesh nodes ({', '.join(decision.corroborating_neighbors)})."
            spatial_hi = f"{decision.spatial_consensus_count} पड़ोसी सेंसर नोड्स ({', '.join(decision.corroborating_neighbors)}) द्वारा पुष्टि की गई।"
        elif decision.spatial_consensus_count == 1:
            spatial_en = f"Partial spatial agreement (1 adjacent node: {', '.join(decision.corroborating_neighbors)}). Held at caution tier."
            spatial_hi = f"आंशिक सहमति (1 पड़ोसी नोड: {', '.join(decision.corroborating_neighbors)})। सतर्कता स्तर पर रखा गया।"
        else:
            spatial_en = "Isolated node observation. No adjacent neighbor movement detected."
            spatial_hi = "एकल नोड अवलोकन। किसी भी पड़ोसी नोड पर हलचल नहीं देखी गई।"

        # Summaries & Action Protocols
        if tier == "CRITICAL":
            summary_en = f"CRITICAL HAZARD: Imminent strata failure detected on Node {decision.node_id}. Time-to-critical: {decision.hours_to_critical:.1f} hours."
            summary_hi = f"गंभीर ख़तरा: नोड {decision.node_id} पर संभावित भूधंसाव का संकेत। अनुमानित समय: {decision.hours_to_critical:.1f} घंटे।"
            action_en = "MANDATORY EVACUATION: Sound surface sirens, halt underground face advance, and evacuate production personnel per DGMS safety norms."
            action_hi = "अनिवार्य निकासी: सतह के सायरन बजाएं, भूमिगत खनन कार्य तुरंत रोकें और डीजीएमएस सुरक्षा मानकों के अनुसार कामगारों को सुरक्षित बाहर निकालें।"
        elif tier == "WARNING":
            summary_en = f"ACTIVE DEFORMATION: Sustained tilt and crack opening verified on Node {decision.node_id} across multi-node mesh."
            summary_hi = f"सक्रिय विरूपण: नोड {decision.node_id} और पड़ोसी नोड्स पर लगातार झुकाव और दरार विस्तार दर्ज किया गया।"
            action_en = "CAUTION DIRECTIVE: Halt longwall shearer advance; deploy geotechnical survey team to inspect surface crack extent."
            action_hi = "सावधानी निर्देश: लॉन्गवॉल कटर को रोकें; सतह की दरारों का निरीक्षण करने के लिए भू-तकनीकी टीम तैनात करें।"
        elif tier == "WATCH":
            summary_en = f"ELEVATED ATTENTION: Minor divergence or sensor health notice on Node {decision.node_id}. Driver: {decision.primary_driver}."
            summary_hi = f"सतर्कता स्थिति: नोड {decision.node_id} पर हल्का विचलन या सेंसर जांच आवश्यक। कारण: {decision.primary_driver}।"
            action_en = "INCREASE SURVEILLANCE: Shift telemetry polling rate to 30s. Verify battery voltage and optical line of sight."
            action_hi = "निगरानी बढ़ाएं: टेलीमेट्री दर को 30 सेकंड पर सेट करें। बैटरी वोल्टेज और सेंसर की दृश्य रेखा की जांच करें।"
        else:
            summary_en = f"NORMAL: Node {decision.node_id} reporting stable strata conditions with full sensor integrity."
            summary_hi = f"सामान्य: नोड {decision.node_id} स्थिर भूगर्भीय स्थिति और पूर्ण सेंसर अखंडता की रिपोर्ट कर रहा है।"
            action_en = "STANDARD PROTOCOL: Maintain standard 5-minute autonomous LoRa reporting cycle."
            action_hi = "मानक प्रक्रिया: मानक 5 मिनट का स्वायत्त लोरा रिपोर्टिंग चक्र जारी रखें।"

        # Siren Status
        if decision.siren_active:
            siren_en = "ACTIVE: Audio-Visual Siren Triggered"
            siren_hi = "सक्रिय: ऑडियो-विजुअल सायरन चालू है"
        elif decision.siren_suppressed:
            siren_en = "SUPPRESSED: Siren silenced due to scheduled blasting / machinery shock"
            siren_hi = "दबाया गया: पूर्व-निर्धारित ब्लास्टिंग / मशीनरी कंपन के कारण सायरन मौन है"
        else:
            siren_en = "SILENT: Normal operational baseline"
            siren_hi = "मौन: सामान्य परिचालन स्थिति"

        return ExplanationCard(
            node_id=decision.node_id,
            timestamp_iso=pd.Timestamp.now().isoformat(),
            warning_tier_en=trans["en"],
            warning_tier_hi=trans["hi"],
            badge_color=trans["color"],
            composite_risk_score=decision.composite_risk_score,
            summary_en=summary_en,
            summary_hi=summary_hi,
            key_evidence=key_evidence,
            spatial_consensus_en=spatial_en,
            spatial_consensus_hi=spatial_hi,
            action_protocol_en=action_en,
            action_protocol_hi=action_hi,
            siren_status_en=siren_en,
            siren_status_hi=siren_hi,
        )
