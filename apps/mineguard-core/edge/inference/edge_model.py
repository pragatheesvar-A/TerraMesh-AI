import numpy as np

class EdgeAnomalyDetector:
    """
    Mock ONNX Runtime wrapper for Edge ML.
    In a real system, this would load an exported ONNX model (`model.onnx`) 
    quantized for Cortex-M processors.
    """
    
    def __init__(self, model_path="model_quantized.onnx"):
        self.model_path = model_path
        # self.session = onnxruntime.InferenceSession(self.model_path)
        
    def predict(self, features: np.ndarray) -> float:
        """
        Returns anomaly probability (0.0 to 1.0) based on extracted features.
        """
        # Mock ML inference based on feature heuristics
        mean, std, peak, energy = features
        
        score = 0.0
        
        # High vibration peak or energy
        if peak > 15.0 or energy > 1000.0:
            score += 0.6
            
        # High variance (erratic sensor behavior)
        if std > 5.0:
            score += 0.3
            
        return min(1.0, score)
