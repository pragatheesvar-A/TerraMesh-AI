import numpy as np

class FeatureExtractor:
    """Extracts DSP features from raw sensor data for TinyML inference."""
    
    def __init__(self, window_size=50):
        self.window_size = window_size
        self.buffer = []
        
    def add_reading(self, reading):
        self.buffer.append(reading)
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)
            
    def extract(self):
        if len(self.buffer) < self.window_size:
            return None
            
        data = np.array(self.buffer)
        
        # Basic statistical features
        mean = np.mean(data)
        std = np.std(data)
        peak = np.max(np.abs(data))
        
        # Frequency domain feature (mock)
        # In a real DSP pipeline on a Cortex-M4, we'd use CMSIS-DSP for real FFT
        fft_energy = np.sum(np.abs(np.fft.fft(data))**2) / len(data)
        
        return np.array([mean, std, peak, fft_energy], dtype=np.float32)
