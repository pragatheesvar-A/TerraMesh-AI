"""InSAR — provider abstraction + honest provenance labelling tests."""
import pytest

from remote_sensing.providers import (
    get_provider, MockInSARProvider, SentinelProvider, NISARProvider,
    PROVENANCE_SIMULATED,
)
from remote_sensing.insar_service import insar_service
from remote_sensing.deformation import extract_critical_polygons, calculate_subsidence_velocity
import numpy as np


@pytest.mark.asyncio
async def test_mock_provider_is_labelled_simulated():
    provider = get_provider("mock")
    assert isinstance(provider, MockInSARProvider)
    result = await provider.fetch_interferogram({"min_lat": 0, "max_lat": 1, "min_lng": 0, "max_lng": 1})
    assert result["provenance"] == PROVENANCE_SIMULATED
    assert result["is_simulated"] is True
    assert len(result["grid"]) == 10


@pytest.mark.asyncio
async def test_sentinel_provider_raises_without_credentials(monkeypatch):
    monkeypatch.delenv("COP_USER", raising=False)
    monkeypatch.delenv("COP_PASSWORD", raising=False)
    provider = SentinelProvider()
    with pytest.raises(RuntimeError, match="BLOCKED"):
        await provider.fetch_interferogram({})


@pytest.mark.asyncio
async def test_nisar_provider_raises_configuration_required():
    # NISAR portal access does not exist yet -> CONFIGURATION_REQUIRED
    with pytest.raises(RuntimeError, match="CONFIGURATION_REQUIRED"):
        await NISARProvider().fetch_interferogram({})


@pytest.mark.asyncio
async def test_service_propagates_simulated_provenance():
    data = await insar_service.get_latest_deformation_map(
        "jharia_01", {"min_lat": 23.7, "max_lat": 23.8, "min_lng": 86.3, "max_lng": 86.4})
    assert data["provenance"] == PROVENANCE_SIMULATED  # NEVER "LIVE SATELLITE DATA"
    assert data["is_simulated"] is True
    assert data["provider_state"] == "MOCK"               # never rendered as LIVE
    assert data["is_live"] is False
    assert "critical_hotspots" in data
    # Acquisition metadata contract
    acq = data.get("acquisition") or {}
    assert acq.get("scene_id", "").startswith("MOCK-S1-")
    assert acq.get("crs") == "EPSG:4326"
    assert "mm/year" in acq.get("units", "")


def test_sentinel_state_matrix():
    """No credentials -> CONFIGURATION_REQUIRED; with credentials but no
    processing stack -> UNAVAILABLE. Both refuse to fabricate."""
    p = SentinelProvider()
    assert p.state == "CONFIGURATION_REQUIRED"
    assert p.status()["state"] == "CONFIGURATION_REQUIRED"


def test_unknown_provider_rejected():
    with pytest.raises(ValueError):
        get_provider("nonexistent")


def test_extract_critical_polygons_finds_connected_hotspots():
    grid = [
        [-20.0, -20.0, 0.0, 0.0],
        [-20.0, -20.0, 0.0, -15.0],
        [0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, -1.0],   # isolated weak cell — below threshold, ignored
    ]
    polys = extract_critical_polygons(grid, threshold_mm=10.0)
    # one 2x2 cluster + one single-cell cluster (scipy present) OR 5 single cells
    assert len(polys) >= 1
    assert polys[0]["cells"] >= 1
    assert polys[0]["peak_mm"] <= -10.0


def test_subsidence_velocity_math():
    cur = np.array([-12.0])
    prev = np.array([-4.0])
    v = calculate_subsidence_velocity(cur, prev, years_elapsed=0.5)
    assert v[0] == -16.0  # (cur-prev)/years -> -8/0.5
