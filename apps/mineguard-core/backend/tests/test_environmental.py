"""Environmental safety engine — gas classification + Coward triangle tests."""
import pytest

from environmental import EnvironmentalSafetyEngine, AtmosphereReading, classify_gas_packet


def test_normal_atmosphere():
    r = EnvironmentalSafetyEngine().classify_atmosphere(AtmosphereReading(
        ch4_pct=0.1, co_ppm=5.0, co2_pct=0.4, o2_pct=20.9, temperature_c=27.0))
    assert r["overall_state"] == "NORMAL"
    assert r["explosibility"]["state"] == "NOT EXPLOSIBLE"


def test_methane_warning_and_evacuation_thresholds():
    e = EnvironmentalSafetyEngine()
    warn = e.classify_atmosphere(AtmosphereReading(ch4_pct=0.6))
    evac = e.classify_atmosphere(AtmosphereReading(ch4_pct=1.2))
    assert warn["channels"]["methane"]["state"] == "WARNING"
    assert evac["overall_state"] == "EVACUATE"


def test_oxygen_deficiency():
    r = EnvironmentalSafetyEngine().classify_atmosphere(AtmosphereReading(o2_pct=17.5))
    assert r["channels"]["oxygen"]["state"] == "EVACUATE"
    warn = EnvironmentalSafetyEngine().classify_atmosphere(AtmosphereReading(o2_pct=19.0))
    assert warn["channels"]["oxygen"]["state"] == "WARNING"


def test_coward_triangle_explosible_region():
    """~10% CH4 with ~16% O2 lies inside the Coward triangle."""
    e = EnvironmentalSafetyEngine()
    r = e.explosibility_analysis(AtmosphereReading(ch4_pct=10.0, o2_pct=16.0))
    assert r["available"] is True
    assert r["state"] == "EXPLOSIBLE"


def test_coward_triangle_far_below_lel():
    e = EnvironmentalSafetyEngine()
    r = e.explosibility_analysis(AtmosphereReading(ch4_pct=0.5, o2_pct=20.9))
    assert r["state"] == "NOT EXPLOSIBLE"


def test_coward_triangle_insufficient_data():
    e = EnvironmentalSafetyEngine()
    r = e.explosibility_analysis(AtmosphereReading(ch4_pct=5.0))  # no O2
    assert r["available"] is False


def test_sensor_health_never_reported_as_gas_danger():
    """A dead sensor (None readings) is not classified as EVACUATE —
    absence of data is absence of classification, never hazard."""
    r = EnvironmentalSafetyEngine().classify_atmosphere(AtmosphereReading(
        ch4_pct=None, o2_pct=None, co_ppm=None))
    assert r["overall_state"] == "NORMAL"
    assert r["channels"] == {}
    assert "sensor-health" in r["sensor_health_note"].replace("_", "-").lower() or \
           "sensor health" in r["sensor_health_note"].lower()


def test_provenance_is_echoed_not_fabricated():
    r = classify_gas_packet({"ch4_pct": 0.4, "_provenance": "SIMULATED"})
    assert "SIMULATED" in r["provenance"]
    assert "MEASURED" not in r["provenance"]
