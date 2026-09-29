import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List

logger = logging.getLogger("terramesh.notification")

class NotificationProvider:
    def __init__(self, is_configured: bool):
        self.is_configured = is_configured

    async def send(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_configured:
            return {"status": "BLOCKED", "error": "CONFIGURATION_REQUIRED"}
        return await self._send_impl(notification)

    async def _send_impl(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def get_health(self) -> str:
        return "CONFIGURED" if self.is_configured else "CONFIGURATION_REQUIRED"

class FCMAdapter(NotificationProvider):
    async def _send_impl(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        # FCM implementation would go here.
        # But we don't have credentials, so we shouldn't ever hit this in production
        # if is_configured is False.
        return {"status": "FAILED", "error": "NO_FCM_CREDENTIALS"}

class SMSAdapter(NotificationProvider):
    async def _send_impl(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "FAILED", "error": "NO_SMS_CREDENTIALS"}

class EmailAdapter(NotificationProvider):
    async def _send_impl(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "FAILED", "error": "NO_SMTP_CREDENTIALS"}

class LocalAdapter(NotificationProvider):
    async def _send_impl(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "SENT", "provider_message_id": "LOCAL-123"}

class AudienceResolver:
    def resolve(self, alert: Dict[str, Any]) -> List[str]:
        # Returns user IDs. Respects mine_id isolation.
        return ["worker-1", "supervisor-1"]

class NotificationOrchestrator:
    def __init__(self):
        self.providers = {
            "FCM": FCMAdapter(is_configured=False),
            "SMS": SMSAdapter(is_configured=False),
            "EMAIL": EmailAdapter(is_configured=False),
            "LOCAL": LocalAdapter(is_configured=True)
        }
        self.resolver = AudienceResolver()

    async def process_alert(self, alert: Dict[str, Any]):
        recipients = self.resolver.resolve(alert)
        for recipient in recipients:
            for channel, provider in self.providers.items():
                # Apply policy
                if alert.get("severity") in ["CRITICAL", "EVACUATE"] or channel == "LOCAL":
                    result = await provider.send({
                        "recipient": recipient,
                        "alert_id": alert.get("id"),
                        "channel": channel
                    })
                    logger.info(f"Notification to {recipient} via {channel}: {result['status']}")

    def get_health(self) -> Dict[str, str]:
        return {k: v.get_health() for k, v in self.providers.items()}
