"""
TerraMesh AI — Audit Log Service.

Append-only application audit trail stored in PostgreSQL (audit_logs table,
models.AuditLogModel). Records:

  timestamp, user, role, action, resource, previous state, new state,
  IP address, session id, free-text detail.

Never stores credentials or raw secrets. Failures to persist are logged at
WARNING level but NEVER break the audited operation (the alert must still go
out if the audit write fails — the failure itself is observable).

Covered actions (wired from main.py):
  LOGIN, LOGIN_FAILED, ALERT_ACKNOWLEDGE, EVACUATION_BROADCAST,
  SETTINGS_SYNC, SAFETY_THRESHOLD_CHANGE, SENSOR_CALIBRATION, ML_RETRAIN,
  REPORT_GENERATION, BROADCAST_DISPATCH, SMS_DISPATCH, EDGE_TELEMETRY_OVERRIDE
"""

from __future__ import annotations
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger("terramesh.audit")

# stdlib audit logger kept for stdout/structured-log pipelines (defense in depth)
import logging as _logging
stdout_audit_logger = _logging.getLogger("terramesh.audit.stdout")


def _safe_snapshot(state: Optional[Any]) -> Optional[str]:
    """JSON-serialise a state snapshot, scrubbing obviously secret fields."""
    if state is None:
        return None
    try:
        if isinstance(state, str):
            return state
        scrubbed = dict(state)
        for k in list(scrubbed):
            if any(t in k.lower() for t in ("password", "secret", "token", "api_key", "credentials")):
                scrubbed[k] = "[REDACTED]"
        return json.dumps(scrubbed, default=str)
    except Exception:
        return str(state)[:2000]


def record(
    action: str,
    *,
    user_email: Optional[str] = None,
    role: Optional[str] = None,
    resource: Optional[str] = None,
    previous_state: Optional[Any] = None,
    new_state: Optional[Any] = None,
    ip_address: Optional[str] = None,
    session_id: Optional[str] = None,
    detail: Optional[str] = None,
) -> None:
    """Persist one audit record. Never raises."""
    # Always emit to stdout logger for log-shipping pipelines
    stdout_audit_logger.info(
        "AUDIT %s user=%s role=%s resource=%s ip=%s detail=%s",
        action, user_email or "-", role or "-", resource or "-", ip_address or "-", detail or "-",
    )
    try:
        import database
        from models import AuditLogModel
        db = database.SessionLocal()
        try:
            db.add(AuditLogModel(
                timestamp=datetime.utcnow(),
                user_email=user_email,
                role=role,
                action=action,
                resource=resource,
                previous_state=_safe_snapshot(previous_state),
                new_state=_safe_snapshot(new_state),
                ip_address=ip_address,
                session_id=session_id,
                detail=detail,
            ))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning("Audit record could not be persisted to the database (%s) — "
                       "the audited action itself is NOT affected.", e)


def query(limit: int = 100, action: Optional[str] = None) -> list:
    """Read the audit trail (most recent first). For the admin API."""
    try:
        import database
        from models import AuditLogModel
        from sqlalchemy import desc
        db = database.SessionLocal()
        try:
            q = db.query(AuditLogModel).order_by(desc(AuditLogModel.timestamp)).limit(min(limit, 1000))
            if action:
                q = q.filter(AuditLogModel.action == action)
            rows = []
            for r in q.all():
                rows.append({
                    "id": r.id,
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                    "user_email": r.user_email,
                    "role": r.role,
                    "action": r.action,
                    "resource": r.resource,
                    "previous_state": r.previous_state,
                    "new_state": r.new_state,
                    "ip_address": r.ip_address,
                    "session_id": r.session_id,
                    "detail": r.detail,
                })
            return rows
        finally:
            db.close()
    except Exception as e:
        logger.warning("Audit query failed: %s", e)
        return []


# Backwards-compatible alias for the previous name used in main.py
audit_logger = stdout_audit_logger
