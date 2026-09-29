import sys
from pathlib import Path

# Add edge directory to sys.path
EDGE_DIR = Path(__file__).resolve().parent.parent.parent / "edge"
sys.path.insert(0, str(EDGE_DIR))

from inference.feature_extractor import FeatureExtractor
from inference.edge_model import EdgeAnomalyDetector

def test_feature_extractor():
    extractor = FeatureExtractor(window_size=10)
    for i in range(5):
        extractor.add_reading(1.0)
    
    # Should be None since window is not full
    assert extractor.extract() is None
    
    for i in range(5):
        extractor.add_reading(2.0)
        
    features = extractor.extract()
    assert features is not None
    assert len(features) == 4 # mean, std, peak, energy
    assert features[0] == 1.5 # mean of five 1s and five 2s

def test_edge_model():
    model = EdgeAnomalyDetector()
    # High peak and energy should trigger high score
    features_critical = [0.0, 1.0, 20.0, 1500.0]
    score = model.predict(features_critical)
    assert score > 0.5
    
    # Normal features
    features_normal = [0.0, 0.5, 2.0, 50.0]
    score2 = model.predict(features_normal)
    assert score2 < 0.5
