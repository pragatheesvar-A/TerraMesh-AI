import pytest
from datetime import datetime
import uuid
import os

from remote_sensing.providers import get_provider, SentinelProvider, NISARProvider, MockInSARProvider
from insar_models import SatelliteSceneModel, ProcessingJobModel, DeformationProductModel
from remote_sensing.acquisition import InSARAcquisitionService
from remote_sensing.processing import InSARProcessingService

def test_provider_status_no_credentials():
    # Force credentials off
    os.environ.pop("COP_USER", None)
    os.environ.pop("COP_PASSWORD", None)
    
    provider = get_provider("sentinel")
    assert isinstance(provider, SentinelProvider)
    assert provider.state == "CONFIGURATION_REQUIRED"
    
    nisar = get_provider("nisar")
    assert isinstance(nisar, NISARProvider)
    assert nisar.state == "CONFIGURATION_REQUIRED"

def test_mock_provider_honesty():
    provider = get_provider("mock")
    assert isinstance(provider, MockInSARProvider)
    assert provider.state == "MOCK"
    assert provider.provenance == "SIMULATED SATELLITE DATA"

def test_scene_model_schema():
    scene = SatelliteSceneModel(
        id=f"SCENE-{uuid.uuid4().hex}",
        provider="mock",
        acquisition_time=datetime.utcnow(),
        footprint={"type": "Polygon", "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]},
        source="SIMULATED SATELLITE DATA",
        provenance="SIMULATED SATELLITE DATA"
    )
    assert scene.provider == "mock"
    assert scene.source == "SIMULATED SATELLITE DATA"

def test_deformation_product_schema():
    product = DeformationProductModel(
        id="DEF-1",
        scene_id="SCENE-1",
        timestamp=datetime.utcnow(),
        los_displacement=-12.5,
        velocity=-25.0,
        coherence=0.9,
        source="SIMULATED SATELLITE DATA",
        provenance="SIMULATED SATELLITE DATA"
    )
    assert product.los_displacement == -12.5
    assert product.velocity == -25.0
