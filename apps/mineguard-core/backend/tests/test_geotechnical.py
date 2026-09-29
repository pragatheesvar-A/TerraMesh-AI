"""Geotechnical engine — transparent engineering calculation tests."""
from geotechnical import GeotechEngine, GeotechInputs


def test_factor_of_safety_stable_config():
    e = GeotechEngine()
    r = e.factor_of_safety(GeotechInputs(depth_m=185.0, extraction_ratio=0.75,
                                          cohesion_mpa=2.4, friction_angle_deg=28.0))
    # gamma 25 kN/m3 -> 0.025 MPa/m; driving = 0.025*185*0.25 = 1.156 MPa
    assert abs(r["driving_stress_mpa"] - 1.1563) < 0.01
    # sigma_n = 0.578; tau = 2.4 + 0.578*tan(28deg) = 2.4 + 0.307 = 2.707
    assert abs(r["resisting_shear_mpa"] - 2.707) < 0.01
    assert r["factor_of_safety"] > 2.0  # stable configuration
    assert r["interpretation"].startswith("FoS")


def test_factor_of_safety_unsafe_weak_rock_deep_high_extraction():
    e = GeotechEngine()
    r = e.factor_of_safety(GeotechInputs(depth_m=500.0, extraction_ratio=0.95,
                                          cohesion_mpa=0.3, friction_angle_deg=15.0))
    # driving = 0.025 MPa/m * 500 m * 0.05 = 0.625 MPa
    assert r["factor_of_safety"] < 1.0  # weak rock, deep, aggressive extraction


def test_rmr89_ranges_and_monotonicity():
    e = GeotechEngine()
    good = e.rmr89(GeotechInputs(ucs_mpa=150.0, rqd_pct=90.0, dry_condition=True))
    poor = e.rmr89(GeotechInputs(ucs_mpa=3.0, rqd_pct=20.0, dry_condition=False))
    assert good["rmr89"] > poor["rmr89"]
    assert 0 <= poor["rmr89"] <= 100
    assert "I" in good["class"] or "II" in good["class"]
    assert "IV" in poor["class"] or "V" in poor["class"]
    # component weights are explicit and sum to the total
    assert sum(good["components"].values()) == good["rmr89"]


def test_q_system_formula():
    e = GeotechEngine()
    r = e.q_system(GeotechInputs(rqd_pct=70.0, joint_set_number=9,
                                 joint_roughness=1.5, joint_alteration=2.0,
                                 joint_water_reduction=1.0, stress_reduction_factor=2.5))
    expected = (70.0 / 9.0) * (1.5 / 2.0) * (1.0 / 2.5)
    assert abs(r["q_value"] - expected) < 0.01
    assert "Fair" in r["quality"] or "Good" in r["quality"] or "Poor" in r["quality"]


def test_analyze_panel_provenance_labelling():
    e = GeotechEngine()
    r = e.analyze_panel(depth_m=185.0, tilt_deg=0.0)
    assert r["provenance"] == "ENGINEERING CALCULATION"
    assert "certification" in r["disclaimer"].lower()
    # ML is never invoked — no ml imports needed here
    assert "factor_of_safety" in r and "rmr89" in r and "q_system" in r
