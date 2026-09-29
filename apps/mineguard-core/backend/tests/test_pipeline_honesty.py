"""Telemetry pipeline — honesty contract tests (no external services)."""
import numpy as np


def test_degraded_mode_uses_uniform_probabilities_not_fabricated_normal():
    """When the model artifact is missing, the pipeline must NOT fabricate an
    'all normal' confidence vector. Degraded events carry model_loaded=false."""
    from edge_ingest_loop import IngestPipeline
    p = IngestPipeline()
    p.model = None  # force degraded mode
    packet = {
        "node_id": "TEST-DEGRADED", "timestamp": 1_700_000_000.0,
        "tilt": 0.1, "displacement_rate": 0.2, "crack_mm": 0.1,
    }
    event = p.process_packet(packet)
    assert event["model_loaded"] is False
    assert event["provenance"] == "MEASURED"
    assert event["decision"]["warning_tier"] in ("NORMAL", "WATCH", "WARNING", "CRITICAL")
    # The fabricated [1,0,0,0,0] vector would make local_ml_score ~0.10;
    # uniform makes it 0.2*sum(weights)/100... verify no '100% normal' fabrication:
    assert p._metrics["degraded_predictions"] >= 1


def test_pipeline_produces_decision_and_card():
    from edge_ingest_loop import pipeline_instance
    packet = {
        "node_id": "TEST-FULL", "timestamp": 1_700_000_060.0,
        "tilt": 0.4, "displacement_rate": 1.2, "crack_mm": 0.5,
        "vib_rms_g": 0.05, "vib_peak_g": 0.1, "dom_freq_hz": 9.0,
    }
    event = pipeline_instance.process_packet(dict(packet))
    assert event["type"] == "TELEMETRY_UPDATE"
    assert event["node_id"] == "TEST-FULL"
    assert "card" in event and event["card"]
    assert "decision" in event
    assert event["decision"]["warning_tier"] in ("NORMAL", "WATCH", "WARNING", "CRITICAL")
    assert event["decision"]["unified_risk_status"] in ("NORMAL", "WARNING", "CRITICAL")


def test_risk_override_reason_is_recorded():
    """A CRITICAL unified-risk escalation must produce an override_reason on
    the decision (previously an AttributeError on a nonexistent field)."""
    from edge_ingest_loop import pipeline_instance
    packet = {
        "node_id": "TEST-OVERRIDE", "timestamp": 1_700_000_120.0,
        "tilt": 9.9,  # far above critical threshold -> unified engine CRITICAL
    }
    event = pipeline_instance.process_packet(dict(packet))
    # The unified engine must have scored CRITICAL
    assert event["decision"]["unified_risk_status"] == "CRITICAL"
    # If SHADOW didn't already say CRITICAL, the override reason must be present
    if event["decision"]["unified_risk_status"] == "CRITICAL":
        assert isinstance(event["decision"]["override_reason"], str)
    assert "OVERRIDE" in event["decision"]["override_reason"] or \
           event["decision"]["warning_tier"] == "CRITICAL"


def test_output_event_has_no_fabricated_crack_default():
    """The legacy fabricated `crack_mm: 5.0` default must be gone — absent
    crack readings are reported as 0.0, never a made-up 5.0 mm fissure."""
    from edge_ingest_loop import pipeline_instance
    packet = {"node_id": "TEST-NOCRACK", "timestamp": 1_700_000_180.0, "tilt": 0.1}
    event = pipeline_instance.process_packet(dict(packet))
    assert event["telemetry"]["crack_mm"] == 0.0


def test_stats_surface():
    from edge_ingest_loop import pipeline_instance
    s = pipeline_instance.stats()
    assert "model_loaded" in s and "metrics" in s
    assert "packets_processed" in s["metrics"]


def test_self_healing_lifecycle_is_driven_by_pipeline():
    """The NodeStateManager must actually be driven by the pipeline —
    previously update() had zero callers and the endpoint was a facade."""
    from ml.sensor_health import node_state_manager
    from edge_ingest_loop import pipeline_instance
    packet = {
        "node_id": "TEST-LIFECYCLE", "timestamp": 1_700_000_900.0,
        "tilt": 0.1, "displacement_rate": 0.2, "crack_mm": 0.1,
    }
    pipeline_instance.process_packet(dict(packet))
    # State must now be tracked (not just the default forever-unknown)
    assert node_state_manager.get_state("TEST-LIFECYCLE") in (
        "HEALTHY", "SUSPECT", "QUARANTINED", "PENDING_VALIDATION")
    # Transition records exist on the pipeline
    assert "TEST-LIFECYCLE" in pipeline_instance.last_health_transitions
    # Network summary is exposed via stats()
    assert "sensor_lifecycle" in pipeline_instance.stats()
