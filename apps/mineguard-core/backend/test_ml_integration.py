"""
Verification script for MINEGUARD AI ML Integration
Tests:
1. Model loading & ML service initialization
2. Single-packet inference across baseline, blast shock, sensor fault, and emergency scenarios
3. Direct FastAPI route checks
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ml_service import ml_service

def test_ml_pipeline():
    print("=" * 60)
    print("TEST 1: ML Model Loading & Service Check")
    print("=" * 60)
    print(f"Service loaded: {ml_service.is_loaded}")
    print(f"Model metadata: {ml_service.model_metadata['name']}")
    
    scenarios = [
        {
            "name": "1. Normal Baseline Sensor Telemetry",
            "packet": {"node_id": "NODE-001", "tilt": 0.05, "displacement": 0.2, "crack_width": 0.1, "vibration": "LOW", "battery": 95}
        },
        {
            "name": "2. High Frequency Blasting Shock (False Siren Rejection)",
            "packet": {"node_id": "NODE-005", "tilt": 0.1, "displacement": 0.3, "crack_width": 0.1, "vibration": "HIGH", "dom_freq_hz": 32.0, "vib_peak_g": 2.2, "battery": 90}
        },
        {
            "name": "3. Dead Battery / Hardware Sensor Fault (Fault Isolation)",
            "packet": {"node_id": "NODE-048", "tilt": 0.0, "displacement": 0.0, "crack_width": 0.0, "vibration": "LOW", "battery": 0}
        },
        {
            "name": "4. Critical Subsidence & Strata Shearing (Emergency Alarm)",
            "packet": {"node_id": "NODE-017", "tilt": 4.8, "displacement": 14.5, "crack_width": 8.2, "vibration": "CRITICAL", "dom_freq_hz": 6.5, "vib_peak_g": 2.8, "battery": 82}
        }
    ]

    print("\n" + "=" * 60)
    print("TEST 2: Scenario Inference Execution")
    print("=" * 60)
    results = {}
    for sc in scenarios:
        res = ml_service.predict_packet(sc["packet"])
        results[sc["name"]] = res
        print(f"\n[{sc['name']}]")
        print(f"  -> Predicted Label:   {res['risk_label']} ({res['status']})")
        print(f"  -> AI Risk Score:     {res['ai_risk_score']} / 100")
        print(f"  -> Confidence:        {res['confidence_pct']}%")
        print(f"  -> Inference Mode:     {res.get('inference_mode')}")
        print(f"  -> Blast Suppressed:  {res['is_blast_suppressed']}")
        print(f"  -> Anomaly Detected:  {res['anomaly_detected']}")
        print(f"  -> Sensor Health:     {res['sensor_health']['fault_type']}")
        print(f"  -> Explanation:       {res['explanation']}")

    # ── REAL assertions (this script previously printed PASS unconditionally) ──
    normal = results["1. Normal Baseline Sensor Telemetry"]
    assert normal["risk_class"] <= 1, "baseline telemetry should not escalate"
    assert normal["inference_mode"] in ("ml_model", "physics_fallback")

    blast = results["2. High Frequency Blasting Shock (False Siren Rejection)"]
    assert blast["is_blast_suppressed"] is True, "blasting shock must suppress the siren"
    assert blast["risk_class"] == 0, "suppressed blast must not raise a class"

    fault = results["3. Dead Battery / Hardware Sensor Fault (Fault Isolation)"]
    assert fault["sensor_health"]["is_faulted"] is True
    assert fault["sensor_health"]["fault_type"] == "DEAD_BATTERY"
    assert fault["status"] in ("OFFLINE", "CAUTION"), "sensor fault must not read as ground danger"

    critical = results["4. Critical Subsidence & Strata Shearing (Emergency Alarm)"]
    assert critical["risk_class"] >= 3, "critical subsidence must escalate"
    assert critical["ai_risk_score"] >= 75
    if critical["inference_mode"] == "ml_model":
        assert critical["provenance"] == "MODEL OUTPUT"

    print("\n" + "=" * 60)
    print("ALL ML INTEGRATION CHECKS PASSED (assertions verified) [SUCCESS]")
    print("=" * 60)

if __name__ == "__main__":
    test_ml_pipeline()
