import pytest
import asyncio
from datetime import datetime
from notification_service import NotificationOrchestrator, FCMAdapter, LocalAdapter

@pytest.mark.asyncio
async def test_fcm_adapter_blocked():
    adapter = FCMAdapter(is_configured=False)
    res = await adapter.send({"test": "data"})
    assert res["status"] == "BLOCKED"
    assert res["error"] == "CONFIGURATION_REQUIRED"

@pytest.mark.asyncio
async def test_local_adapter_sent():
    adapter = LocalAdapter(is_configured=True)
    res = await adapter.send({"test": "data"})
    assert res["status"] == "SENT"

def test_provider_health():
    orchestrator = NotificationOrchestrator()
    health = orchestrator.get_health()
    assert health["FCM"] == "CONFIGURATION_REQUIRED"
    assert health["SMS"] == "CONFIGURATION_REQUIRED"
    assert health["EMAIL"] == "CONFIGURATION_REQUIRED"
    assert health["LOCAL"] == "CONFIGURED"

@pytest.mark.asyncio
async def test_alert_processing():
    orchestrator = NotificationOrchestrator()
    alert = {"id": "A-1", "severity": "CRITICAL"}
    await orchestrator.process_alert(alert)
    # The processing runs without exceptions and gracefully skips unconfigured providers.
    health_after = orchestrator.get_health()
    assert health_after["LOCAL"] == "CONFIGURED"
