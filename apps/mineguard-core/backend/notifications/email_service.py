"""
TerraMesh AI — Email Alert Service
====================================
Deck alert-level contract: L2 Warning and L3 Critical include Email.

Env-driven SMTP (stdlib smtplib — no new dependency):
  SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM,
  SMTP_USE_TLS (true/false), ALERT_EMAIL_TO (comma-separated ops mailbox)

Honesty contract:
  * Without SMTP configuration, sends return success=False with an explicit
    'email disabled' reason — delivery is NEVER fabricated.
  * Every send is attempted synchronously with a timeout; failures are
    logged and reported, with a small retry.
"""

from __future__ import annotations
import logging
import os
import smtplib
import ssl
from dataclasses import dataclass
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

logger = logging.getLogger("terramesh.email")


@dataclass
class EmailSendResult:
    success: bool
    sent_count: int = 0
    failed_count: int = 0
    error: Optional[str] = None


class EmailService:
    MAX_RETRIES = 2

    def _config(self) -> dict:
        return {
            "host": os.getenv("SMTP_HOST", ""),
            "port": int(os.getenv("SMTP_PORT", "587")),
            "username": os.getenv("SMTP_USERNAME", ""),
            "password": os.getenv("SMTP_PASSWORD", ""),
            "from_addr": os.getenv("SMTP_FROM", "terramesh-alerts@localhost"),
            "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() == "true",
        }

    @property
    def is_enabled(self) -> bool:
        return bool(self._config()["host"])

    def default_recipients(self) -> List[str]:
        raw = os.getenv("ALERT_EMAIL_TO", "")
        return [r.strip() for r in raw.split(",") if r.strip() and "@" in r]

    def send_alert(self, severity: str, subject: str, body: str,
                   recipients: Optional[List[str]] = None) -> EmailSendResult:
        """Send one alert email. Without SMTP config -> success=False, honest."""
        cfg = self._config()
        recipients = recipients or self.default_recipients()
        if not cfg["host"]:
            return EmailSendResult(success=False, error="Email disabled — SMTP_HOST not configured. Message NOT sent.")
        if not recipients:
            return EmailSendResult(success=False, error="Email disabled — no ALERT_EMAIL_TO recipients configured.")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[TerraMesh {severity.upper()}] {subject}"
        msg["From"] = cfg["from_addr"]
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(
            f"{body}\n\n--\nTerraMesh AI / MineGuard automated safety alert.\n"
            f"Provenance: OPERATOR-configured notification channel. "
            f"Delivery receipt reflects the actual SMTP transaction.\n",
            "plain"))

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as server:
                    if cfg["use_tls"]:
                        server.starttls(context=ssl.create_default_context())
                    if cfg["username"]:
                        server.login(cfg["username"], cfg["password"])
                    server.sendmail(cfg["from_addr"], recipients, msg.as_string())
                logger.info("Alert email sent to %d recipient(s) (attempt %d)", len(recipients), attempt)
                return EmailSendResult(success=True, sent_count=len(recipients))
            except Exception as e:
                last_error = str(e)
                logger.warning("Email send attempt %d failed: %s", attempt, e)
        return EmailSendResult(success=False, failed_count=len(recipients), error=last_error)

    def status(self) -> dict:
        return {
            "enabled": self.is_enabled,
            "note": "SMTP configured" if self.is_enabled else
                    "SMTP_HOST not set — email alerts disabled (never fabricated)",
        }


# Module singleton
email_service = EmailService()
