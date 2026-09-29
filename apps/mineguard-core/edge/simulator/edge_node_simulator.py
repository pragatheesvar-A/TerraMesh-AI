import json
import time
import random
import threading
from datetime import datetime, timezone

from ..inference.feature_extractor import FeatureExtractor
from ..inference.edge_model import EdgeAnomalyDetector

# Topic contract enforced by the backend MQTT ingestion client:
#   mines/{mine_id}/nodes/{node_id}/telemetry  (JSON payload)
MINE_ID_DEFAULT = "jharia_01"


class EdgeNodeSimulator:
    """
    EDGE INFERENCE SIMULATOR — simulates a smart edge sensor node running
    TinyML locally (clearly labelled; no physical MCU hardware is deployed).

    It reads raw high-frequency data, performs local (mock) inference, and
    publishes summary telemetry to the backend's MQTT topic contract as
    JSON — interoperable with the real ingestion pipeline.
    """

    def __init__(self, node_id: str, sensor_type: str, mqtt_client=None,
                 mine_id: str = MINE_ID_DEFAULT):
        self.node_id = node_id
        self.sensor_type = sensor_type
        self.mqtt_client = mqtt_client
        self.mine_id = mine_id

        self.extractor = FeatureExtractor(window_size=50)
        self.model = EdgeAnomalyDetector()

        self.running = False
        self._seq = 0

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False

    def _run_loop(self):
        while self.running:
            # Simulate high-frequency 100Hz sampling loop for 0.5s
            # (50 samples = 1 window)
            raw_data = [random.gauss(0.0, 1.0) for _ in range(50)]

            # Extract features (DSP)
            for reading in raw_data:
                self.extractor.add_reading(reading)

            features = self.extractor.extract()

            if features is not None:
                # Local TinyML inference (SIMULATOR — mock heuristics)
                anomaly_prob = self.model.predict(features)

                # Determine local alert state
                status = "NORMAL"
                if anomaly_prob > 0.8:
                    status = "CRITICAL"
                elif anomaly_prob > 0.5:
                    status = "WARNING"

                self._seq += 1
                telemetry = {
                    "node_id": self.node_id,
                    "type": self.sensor_type,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "packet_seq": self._seq,
                    "features": {
                        "mean": float(features[0]),
                        "std": float(features[1]),
                        "peak": float(features[2]),
                    },
                    "local_ml_score": float(anomaly_prob),
                    "status": status,
                    "provenance": "SIMULATED EDGE ML",
                }

                # Transmit — JSON on the backend topic contract
                if self.mqtt_client:
                    self.mqtt_client.publish(
                        f"mines/{self.mine_id}/nodes/{self.node_id}/telemetry",
                        json.dumps(telemetry),
                    )

            # Sleep until next window
            time.sleep(1.0)
