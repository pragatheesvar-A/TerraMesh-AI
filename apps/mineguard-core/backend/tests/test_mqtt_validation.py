"""MQTT ingestion client — validation logic tests (no broker required).

These unit-test the topic allowlist, de-duplication and timestamp sanity
logic in isolation. Live broker integration requires the docker-compose
Mosquitto service (see tests/test_mqtt_integration.py).
"""
import time

import pytest

from mqtt.mqtt_client import MQTTIngestClient, MINE_ID


@pytest.fixture
def client():
    return MQTTIngestClient(packet_callback=lambda p: None)


def test_topic_allowlist_accepts_contract_topics(client):
    parsed = client._parse_topic(f"mines/{MINE_ID}/nodes/NODE-017/telemetry")
    assert parsed == {"kind": "telemetry", "node_id": "NODE-017"}
    assert client._parse_topic(f"mines/{MINE_ID}/nodes/ABC_1/heartbeat")["kind"] == "heartbeat"
    assert client._parse_topic(f"mines/{MINE_ID}/nodes/ABC-2/status")["kind"] == "status"
    assert client._parse_topic(f"mines/{MINE_ID}/gateway/status")["kind"] == "gateway_status"


def test_topic_allowlist_rejects_arbitrary_topics(client):
    assert client._parse_topic("random/topic") is None
    assert client._parse_topic("mines/other_mine/nodes/N1/telemetry") is None       # wrong mine
    assert client._parse_topic(f"mines/{MINE_ID}/nodes/N1/command") is None          # unknown kind
    assert client._parse_topic(f"mines/{MINE_ID}/nodes/bad!!id/telemetry") is None   # bad node id
    assert client._parse_topic(f"mines/{MINE_ID}/nodes/N1/telemetry/extra") is None  # too many parts


def test_dedup_same_packet_seq_dropped(client):
    assert client._is_duplicate("N1", 100) is False
    assert client._is_duplicate("N1", 100) is True   # QoS-1 redelivery
    assert client._is_duplicate("N2", 100) is False   # different node, same seq: fine
    assert client._is_duplicate("N1", 101) is False  # next sequence: fine


def test_dedup_absent_seq_passthrough(client):
    assert client._is_duplicate("N1", None) is False
    assert client._is_duplicate("N1", None) is False  # no seq -> no dedup possible


def test_timestamp_future_rejection(client):
    future = {"timestamp": time.time() + 3600}  # 1 hour ahead
    with pytest.raises(ValueError):
        client._check_timestamp(future)


def test_timestamp_stale_flagging(client):
    stale = {"timestamp": time.time() - 3600}  # 1 hour old
    assert client._check_timestamp(stale) == "STALE"


def test_timestamp_fresh_ok(client):
    fresh = {"timestamp": time.time() - 10}
    assert client._check_timestamp(fresh) is None


def test_timestamp_epoch_hours_format(client):
    payload = {"timestamp_h": time.time() / 3600.0 - 0.01}
    assert client._check_timestamp(payload) is None


def test_metrics_shape(client):
    s = client.stats()
    assert s["mine_id"] == MINE_ID
    assert s["state"] in ("ONLINE", "DEGRADED", "OFFLINE", "RECOVERING")
    for key in ("received", "accepted", "rejected_topic", "rejected_json",
                "rejected_schema", "rejected_duplicate", "rejected_future_ts",
                "flagged_stale"):
        assert key in s["metrics"]
