from risk.risk_engine import UnifiedRiskEngine

def test_scenario_a_normal_telemetry():
    engine = UnifiedRiskEngine()
    result = engine.evaluate_node("NODE_A", {"tilt": 0.5, "vibration_val": 1.0})
    assert result["status"] == "NORMAL"

def test_scenario_b_progressive_deformation():
    engine = UnifiedRiskEngine()
    # Step 1: Warning
    res1 = engine.evaluate_node("NODE_B", {"tilt": 2.5})
    assert res1["status"] == "WARNING"
    # Step 2: Critical
    res2 = engine.evaluate_node("NODE_B", {"tilt": 5.0})
    assert res2["status"] == "CRITICAL"

def test_scenario_c_sensor_failure():
    # If sensor health is bad, anomaly score usually handles it in SHADOW, but let's test ML override
    engine = UnifiedRiskEngine()
    result = engine.evaluate_node("NODE_C", {"tilt": 0.0, "local_ml_score": 0.99})
    assert result["status"] == "CRITICAL"

def test_scenario_d_sensor_recovery():
    engine = UnifiedRiskEngine()
    # Trigger critical
    engine.evaluate_node("NODE_D", {"tilt": 5.0})
    # Drop below hysteresis deadband to recover
    res = engine.evaluate_node("NODE_D", {"tilt": 0.5})
    assert res["status"] == "NORMAL"

def test_scenario_e_machinery_vibration():
    engine = UnifiedRiskEngine()
    # High vibration
    result = engine.evaluate_node("NODE_E", {"vibration_val": 8.0})
    assert result["status"] == "CRITICAL"

def test_scenario_f_multiple_abnormal():
    engine = UnifiedRiskEngine()
    res1 = engine.evaluate_node("NODE_F1", {"tilt": 5.0})
    res2 = engine.evaluate_node("NODE_F2", {"vibration_val": 8.0})
    assert res1["status"] == "CRITICAL"
    assert res2["status"] == "CRITICAL"

def test_scenario_g_worker_exposure():
    # While worker exposure is technically evaluated at the GIS level,
    # we simulate the node side outputting critical risk.
    engine = UnifiedRiskEngine()
    result = engine.evaluate_node("NODE_G", {"tilt": 5.0, "worker_present": True})
    assert result["status"] == "CRITICAL"
