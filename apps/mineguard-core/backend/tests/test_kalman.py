from analytics.kalman_filter import KalmanFilterBank

def test_kalman_smoothing():
    kf = KalmanFilterBank()
    # Add noise around a true value of 5.0
    readings = [5.1, 4.8, 5.3, 4.7, 5.2, 4.9, 10.0, 5.0] # 10.0 is an outlier
    
    filtered_results = []
    for r in readings:
        res = kf.process("NODE_1", r, r, r)
        filtered_results.append(res.filtered_tilt)
        
    # The outlier (10.0) should be smoothed down significantly
    assert filtered_results[6] < 9.0 
    assert abs(filtered_results[-1] - 5.0) < 1.0
