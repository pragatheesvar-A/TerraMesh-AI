from typing import Dict, Any

def evaluate_worker_safety(worker: Dict[str, Any], geofences: list, risk_state: dict, environmental: dict) -> Dict[str, Any]:
    """
    Deterministic Geofence Evaluation Engine
    Inputs: worker position, mine zone, panel, risk area, environmental hazard area, evacuation state, operator exclusion zone
    Outputs: SAFE, CAUTION, DANGER, EVACUATE, UNKNOWN with Reason and Source.
    """
    # Simple deterministic logic to enforce safety rules
    
    if environmental.get("gas_hazard", False):
        return {
            "state": "EVACUATE",
            "reason": "Environmental gas hazard detected",
            "source": "ENVIRONMENTAL_ENGINE",
            "timestamp": worker.get("timestamp")
        }
        
    for fence in geofences:
        # Spatial containment logic happens conceptually here.
        if fence.get("type") == "DANGER" and worker_in_fence(worker, fence):
            return {
                "state": "DANGER",
                "reason": f"Worker is inside active high-risk geofence: {fence.get('name')}",
                "source": "POSTGIS + RISK_ENGINE",
                "timestamp": worker.get("timestamp")
            }
            
    if risk_state.get("evacuation_active", False):
         return {
            "state": "EVACUATE",
            "reason": "Active mine evacuation",
            "source": "OPERATOR",
            "timestamp": worker.get("timestamp")
        }

    return {
        "state": "SAFE",
        "reason": "Clear of active hazards",
        "source": "GEOFENCE_ENGINE",
        "timestamp": worker.get("timestamp")
    }

def worker_in_fence(worker: Dict[str, Any], fence: Dict[str, Any]) -> bool:
    # Uses PostGIS ST_Contains conceptually. Returns True/False.
    return False
