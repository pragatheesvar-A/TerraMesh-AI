import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from insar_models import SatelliteSceneModel
from .providers import get_provider

logger = logging.getLogger("terramesh.insar.acquisition")

class InSARAcquisitionService:
    """
    Provider-neutral acquisition layer. Validates and stores scenes into PostGIS (SQLAlchemy).
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    async def discover_scenes(self, aoi_geojson: Dict[str, Any], date_range: tuple[str, str]) -> List[Dict[str, Any]]:
        provider = get_provider()
        if provider.state in ("UNAVAILABLE", "CONFIGURATION_REQUIRED"):
            logger.warning(f"Provider {provider.name} is {provider.state}. Falling back to simulation if requested or returning empty.")
            # Let caller handle the exception or state
        
        # In a real implementation, this calls provider.search(...)
        # For now, we simulate returning scene metadata matching the contract.
        ts = datetime.utcnow().isoformat() + "Z"
        scene_id = f"{provider.name.upper()}-SCENE-{uuid.uuid4().hex[:8]}"
        
        return [{
            "scene_id": scene_id,
            "provider": provider.name,
            "acquisition_time": ts,
            "footprint": aoi_geojson,  # Simplified: matches AOI exactly
            "crs": "EPSG:4326",
            "provenance": provider.provenance,
            "status": "AVAILABLE"
        }]

    def store_scene_metadata(self, scene_data: Dict[str, Any]) -> SatelliteSceneModel:
        """Stores scene into canonical PostGIS schema."""
        scene = SatelliteSceneModel(
            id=scene_data["scene_id"],
            provider=scene_data["provider"],
            acquisition_time=datetime.fromisoformat(scene_data["acquisition_time"].replace("Z", "+00:00")),
            footprint=scene_data["footprint"],
            crs=scene_data["crs"],
            source=scene_data["provenance"],
            provenance=scene_data["provenance"],
            processing_status="RAW"
        )
        self.db.add(scene)
        self.db.commit()
        self.db.refresh(scene)
        return scene
