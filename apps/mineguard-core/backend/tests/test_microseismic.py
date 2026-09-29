"""Microseismic service — clustering, hypocenter honesty, provenance labels."""
from microseismic import (
    MicroseismicService, MicroseismicSimulator,
    PROVENANCE_SIMULATED,
)


def test_simulator_events_are_labelled_simulated():
    svc = MicroseismicService()
    sim = MicroseismicSimulator(svc)
    events = sim.generate_burst(count=6)
    assert len(events) == 6
    for e in events:
        assert e.provenance == PROVENANCE_SIMULATED
    assert svc.summary()["provenance_counts"][PROVENANCE_SIMULATED] == 6


def test_space_time_clustering_finds_swarms():
    svc = MicroseismicService()
    # 5 events, same place, same moment -> one swarm of >= 3
    for i in range(5):
        svc.ingest_reading("N-1", (100.0 + i, 100.0 - i), 3.0, 40.0)
    # 2 far-away isolated events -> not a swarm
    svc.ingest_reading("N-9", (5000.0, 5000.0), 1.0, 30.0)
    svc.ingest_reading("N-9", (6000.0, 6000.0), 1.0, 30.0)

    clusters = svc.cluster_events(space_radius_m=150.0, time_window_s=600.0, min_events=3)
    assert len(clusters) == 1
    assert clusters[0]["event_count"] == 5
    assert clusters[0]["provenance"] == PROVENANCE_SIMULATED


def test_hypocenter_refuses_insufficient_data():
    svc = MicroseismicService()
    r = svc.estimate_hypocenter([])
    assert r["available"] is False
    r2 = svc.estimate_hypocenter([{"x": 0, "y": 0, "z": 0, "amplitude": 1.0}])
    assert r2["available"] is False
    assert "insufficient" in r2["reason"]


def test_hypocenter_amplitude_weighted_centroid():
    svc = MicroseismicService()
    obs = [
        {"x": 0.0, "y": 0.0, "z": -100.0, "amplitude": 1.0},
        {"x": 100.0, "y": 0.0, "z": -100.0, "amplitude": 1.0},
        {"x": 0.0, "y": 100.0, "z": -100.0, "amplitude": 2.0},
    ]
    r = svc.estimate_hypocenter(obs)
    assert r["available"] is True
    cx, cy, cz = r["hypocenter_xyz"]
    # amplitude weights: (1,1,2) -> centroid biased toward the strong station
    assert cx < 50.0
    assert cy >= 50.0
    assert cz == -100.0


def test_density_map():
    svc = MicroseismicService()
    for i in range(10):
        svc.ingest_reading("N-1", (100.0 + i, 100.0), 1.0, 30.0)
    m = svc.event_density_map(cell_size_m=250.0)
    assert m["total_events"] == 10
    assert sum(m["density"].values()) == 10
    assert m["hottest_cells"][0][1] == 10
