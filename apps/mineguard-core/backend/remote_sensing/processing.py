import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from insar_models import ProcessingJobModel, DeformationProductModel

logger = logging.getLogger("terramesh.insar.processing")

class InSARProcessingService:
    """
    Manages the SAR processing lifecycle (Coregistration -> Interferogram -> Phase Unwrapping -> Geocoding).
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create_job(self, provider_name: str, scene_ids: List[str], aoi: Dict[str, Any]) -> ProcessingJobModel:
        job_id = f"JOB-{uuid.uuid4().hex[:8]}"
        job = ProcessingJobModel(
            id=job_id,
            provider=provider_name,
            scene_ids=scene_ids,
            aoi=aoi,
            status="QUEUED"
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        logger.info(f"Created InSAR processing job {job_id}")
        return job

    def run_simulated_processing(self, job_id: str) -> DeformationProductModel:
        """
        Simulates the processing pipeline for the Mock provider.
        """
        job = self.db.query(ProcessingJobModel).filter_by(id=job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        job.status = "SIMULATED"
        job.finished_at = datetime.utcnow()

        # Produce a Mock DeformationProduct
        product_id = f"DEF-{uuid.uuid4().hex[:8]}"
        product = DeformationProductModel(
            id=product_id,
            scene_id=job.scene_ids[0] if job.scene_ids else "UNKNOWN",
            timestamp=datetime.utcnow(),
            geometry=job.aoi, # Simplified
            los_displacement=-5.0, # Mock 5mm subsidence
            velocity=-10.0, # Mock 10mm/yr subsidence
            coherence=0.85,
            quality="VALID",
            units="mm",
            source="SIMULATED SATELLITE DATA",
            provenance="SIMULATED SATELLITE DATA",
            processing_version="mock-v1"
        )
        
        job.result_id = product.id
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
