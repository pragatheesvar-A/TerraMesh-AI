from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean
from datetime import datetime
from database import Base

class SatelliteSceneModel(Base):
    """
    Canonical InSAR Scene footprint and metadata.
    """
    __tablename__ = "insar_scenes"

    id = Column(String, primary_key=True, index=True)
    provider = Column(String, nullable=False, index=True)
    platform = Column(String)  # e.g., SENTINEL-1A, NISAR
    acquisition_time = Column(DateTime, nullable=False, index=True)
    processing_time = Column(DateTime)
    orbit = Column(String)
    relative_orbit = Column(String)
    polarization = Column(String)
    mode = Column(String)
    # GeoJSON footprint geometry
    footprint = Column(JSON)
    crs = Column(String, default="EPSG:4326")
    look_direction = Column(String)
    incidence_angle = Column(Float)
    processing_status = Column(String, default="RAW")
    source = Column(String, nullable=False) # e.g., SATELLITE or SIMULATION
    provenance = Column(String, nullable=False)


class ProcessingJobModel(Base):
    """
    Tracks state of async InSAR processing (coregistration, unwrapping).
    """
    __tablename__ = "insar_processing_jobs"

    id = Column(String, primary_key=True, index=True)
    provider = Column(String, nullable=False)
    scene_ids = Column(JSON) # List of Scene IDs forming the interferogram
    aoi = Column(JSON) # Processing Area of Interest
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String, default="QUEUED") # QUEUED, RUNNING, SUCCEEDED, FAILED, SIMULATED
    error = Column(String, nullable=True)
    processing_version = Column(String)
    result_id = Column(String, nullable=True) # ID of DeformationProductModel


class DeformationProductModel(Base):
    """
    Canonical extracted deformation product.
    """
    __tablename__ = "insar_deformation_products"

    id = Column(String, primary_key=True, index=True)
    scene_id = Column(String, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    geometry = Column(JSON) # Polygon or Multipolygon
    los_displacement = Column(Float)
    velocity = Column(Float, nullable=True)
    coherence = Column(Float, nullable=True)
    quality = Column(String, default="UNKNOWN") # VALID, LOW_COHERENCE, MASKED
    crs = Column(String, default="EPSG:4326")
    units = Column(String, default="mm")
    source = Column(String, nullable=False)
    provenance = Column(String, nullable=False)
    processing_version = Column(String)
