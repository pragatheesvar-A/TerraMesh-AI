"""
TerraMesh AI — Firebase Cloud Messaging (FCM) Service
=====================================================
Provides push notification delivery to mobile worker devices.

Alert Severity → FCM Priority:
  CRITICAL / EVACUATE → priority: high, sound: alarm
  DANGER / CAUTION    → priority: high, sound: default
  WATCH / NORMAL      → priority: normal, sound: none

Configuration (via .env):
  FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

Graceful Degradation:
  If FIREBASE_CREDENTIALS_PATH is not set or the credentials file is missing,
  FCM is silently disabled. The application continues to function normally.
  Alerts are still stored in the database. Only push delivery is skipped.

References:
  - firebase-admin SDK: https://firebase.google.com/docs/admin/setup
  - FCM HTTP v1 API
"""

from __future__ import annotations
import json
import logging
import os
from dataclasses import dataclass
from typing import List, Optional

logger = logging.getLogger("terramesh.fcm")

# Attempt to import firebase_admin; graceful skip if not installed
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    HAS_FIREBASE = True
except ImportError:
    HAS_FIREBASE = False
    logger.info("firebase-admin not installed — FCM push notifications disabled")


# Alert severity → FCM notification config
SEVERITY_CONFIG = {
    "EVACUATE": {
        "priority": "high",
        "sound": "alarm_critical",
        "android_priority": "high",
        "vibration_pattern": [0, 500, 250, 500, 250, 500],
        "notification_color": "#EF4444",
    },
    "CRITICAL": {
        "priority": "high",
        "sound": "alarm_critical",
        "android_priority": "high",
        "vibration_pattern": [0, 500, 250, 500],
        "notification_color": "#EF4444",
    },
    "DANGER": {
        "priority": "high",
        "sound": "default",
        "android_priority": "high",
        "vibration_pattern": [0, 300, 200, 300],
        "notification_color": "#F59E0B",
    },
    "CAUTION": {
        "priority": "high",
        "sound": "default",
        "android_priority": "high",
        "vibration_pattern": [0, 200],
        "notification_color": "#F59E0B",
    },
    "WATCH": {
        "priority": "normal",
        "sound": "default",
        "android_priority": "default",
        "vibration_pattern": [0, 100],
        "notification_color": "#3B82F6",
    },
    "NORMAL": {
        "priority": "normal",
        "sound": None,
        "android_priority": "default",
        "vibration_pattern": [],
        "notification_color": "#10B981",
    },
}


@dataclass
class FCMSendResult:
    success: bool
    sent_count: int
    failed_count: int
    error: Optional[str] = None


class FCMService:
    """
    Firebase Cloud Messaging service for mine safety alerts.
    Initialised lazily — first send attempt triggers credential load.
    """

    def __init__(self):
        self._app = None
        self._initialized = False
        self._enabled = False

    def _init(self) -> bool:
        """Lazy initialisation — loads Firebase credentials on first use."""
        if self._initialized:
            return self._enabled

        credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
        if not credentials_path:
            logger.info("FIREBASE_CREDENTIALS_PATH not set — FCM push disabled")
            self._initialized = True
            self._enabled = False
            return False

        if not os.path.exists(credentials_path):
            logger.warning(f"Firebase credentials not found: {credentials_path}")
            self._initialized = True
            self._enabled = False
            return False

        if not HAS_FIREBASE:
            logger.warning("firebase-admin not installed — FCM push disabled")
            self._initialized = True
            self._enabled = False
            return False

        try:
            cred = credentials.Certificate(credentials_path)
            if not firebase_admin._apps:
                self._app = firebase_admin.initialize_app(cred)
            else:
                self._app = firebase_admin.get_app()
            self._initialized = True
            self._enabled = True
            logger.info("FCM service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"FCM initialization failed: {e}")
            self._initialized = True
            self._enabled = False
            return False

    async def send_alert(
        self,
        token_list: List[str],
        title: str,
        body: str,
        severity: str = "WATCH",
        data: Optional[dict] = None,
        max_retries: int = 2,
    ) -> FCMSendResult:
        """
        Send push notification to a list of FCM registration tokens.

        Behaviour:
          * FCM disabled (no credentials) -> success=False with an explicit
            'disabled' reason. Delivery is never fabricated.
          * Transient send errors -> retried up to `max_retries` with backoff.
          * Per-token UNREGISTERED / SENDER_MISMATCH failures are pruned from
            the token store (invalid-token cleanup).
        """
        if not self._init() or not token_list:
            return FCMSendResult(success=False, sent_count=0, failed_count=0,
                                 error="FCM disabled (FIREBASE_CREDENTIALS_PATH not configured) or no tokens — push NOT sent")

        cfg = SEVERITY_CONFIG.get(severity.upper(), SEVERITY_CONFIG["WATCH"])
        data_payload = {
            "severity": severity,
            "source": "TerraMesh AI",
            **(data or {}),
        }
        # FCM data values must be strings
        data_payload = {k: str(v) for k, v in data_payload.items()}

        import asyncio as _asyncio
        attempts = 0
        last_error = None
        while attempts <= max_retries:
            attempts += 1
            try:
                multicast = messaging.MulticastMessage(
                    tokens=token_list,
                    notification=messaging.Notification(title=title, body=body),
                    android=messaging.AndroidConfig(
                        priority=cfg["android_priority"],
                        notification=messaging.AndroidNotification(
                            sound=cfg["sound"] or "default",
                            color=cfg["notification_color"],
                            vibrate_timings_millis=cfg["vibration_pattern"] or None,
                        ),
                    ),
                    apns=messaging.APNSConfig(
                        payload=messaging.APNSPayload(
                            aps=messaging.Aps(sound="default", badge=1)
                        ),
                        headers={"apns-priority": "10" if cfg["priority"] == "high" else "5"},
                    ),
                    data=data_payload,
                )
                response = messaging.send_each_for_multicast(multicast)

                # Invalid-token cleanup: prune UNREGISTERED / SENDER_MISMATCH
                # devices so they stop receiving (and failing) future sends.
                pruned = 0
                try:
                    from .token_store import token_store as _store
                    known = set(_store.get_all_tokens())
                    for idx, resp in enumerate(response.responses):
                        if not resp.success and idx < len(token_list) and token_list[idx] in known:
                            code = str(getattr(getattr(resp, "exception", None), "code", ""))
                            if "unregistered" in code.lower() or "mismatch" in code.lower():
                                _store.deregister_by_token(token_list[idx])
                                pruned += 1
                except Exception:
                    pass

                logger.info("FCM sent: %d ok, %d failed (%d invalid tokens pruned)",
                            response.success_count, response.failure_count, pruned)
                return FCMSendResult(
                    success=response.failure_count == 0,
                    sent_count=response.success_count,
                    failed_count=response.failure_count,
                    error=None if response.failure_count == 0
                           else f"{response.failure_count} tokens failed",
                )
            except Exception as e:
                last_error = str(e)
                logger.warning("FCM send attempt %d failed: %s", attempts, e)
                if attempts <= max_retries:
                    await _asyncio.sleep(1.0 * attempts)
        logger.error("FCM send failed after %d attempts: %s", attempts, last_error)
        return FCMSendResult(success=False, sent_count=0, failed_count=len(token_list), error=last_error)

    async def send_zone_alert(
        self,
        zone: str,
        severity: str,
        title: str,
        message: str,
        token_store: Optional[object] = None,
    ) -> FCMSendResult:
        """
        Send push notification to all workers registered in a specific zone.

        Args:
            zone:       Zone name (e.g., "Zone B")
            severity:   Alert severity
            title:      Notification title
            message:    Notification body
            token_store: Token store instance to look up zone tokens
        """
        tokens = []
        if token_store:
            try:
                tokens = token_store.get_tokens_for_zone(zone)
            except Exception as e:
                logger.warning(f"Token lookup failed for zone {zone}: {e}")

        if not tokens:
            logger.info(f"No FCM tokens for zone {zone} — push skipped")
            return FCMSendResult(success=True, sent_count=0, failed_count=0,
                                 error="No tokens for zone")

        return await self.send_alert(
            token_list=tokens,
            title=title,
            body=message,
            severity=severity,
            data={"zone": zone},
        )

    @property
    def is_enabled(self) -> bool:
        return self._init()


# Module-level singleton
fcm_service = FCMService()
