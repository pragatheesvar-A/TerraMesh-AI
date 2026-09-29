from pydantic import BaseModel
from typing import Dict, Optional

class EdgeTelemetrySchema(BaseModel):
    """
    Standardized payload format from edge nodes.
    Designed for low-bandwidth LoRaWAN / MQTT backhaul.
    """
    node_id: str
    type: str
    timestamp: float
    features: Dict[str, float]
    local_ml_score: float
    status: str
    # Simulator-originated by default in this deployment (no MCU hardware);
    # real hardware nodes must override with "MEASURED EDGE ML".
    provenance: str = "SIMULATED EDGE ML"
    battery: Optional[int] = 100
    signal: Optional[int] = -75
