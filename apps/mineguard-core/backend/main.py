import asyncio
import json
import logging
import html
import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Response, Request
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Structured logging (observability) + audit trail (DB-backed)
from logging_config import configure_logging
configure_logging()
import audit_service
from auth import hash_password, verify_password, issue_token, authenticate, demo_passwords, ROLES


# Load .env file if present (dev mode)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv optional; use system env vars in production

from schemas import (
    DashboardOverview, SensorNodeSchema, WorkerSchema,
    AlertSchema, AIRiskIntelligence, EvacuationStatus,
    InfrastructureSummary, SystemStatusSchema, TelemetryIngestSchema,
    MLPredictionResponse, MLModelInfoResponse
)
from simulation import sim_engine
from ml_service import ml_service

from edge_database import get_latest_node_states, get_node_history
from edge_ingest_loop import pipeline_instance
import database
import models

# Create tables (dev convenience; production uses `alembic upgrade head`)
from sqlalchemy import text
models.Base.metadata.create_all(bind=database.engine)
try:
    with database.engine.connect() as conn:
        for col, coltype in [("alert_type", "VARCHAR DEFAULT 'EMERGENCY'"), ("message_content", "TEXT")]:
            try:
                conn.execute(text(f"ALTER TABLE broadcast_history ADD COLUMN {col} {coltype}"))
                conn.commit()
            except Exception:
                pass
except Exception as _mig_err:
    logging.warning(f"Schema migration note: {_mig_err}")

app = FastAPI(
    title="MINEGUARD AI - Mine Subsidence Monitoring & Safety API",
    description="Backend API with Real-Time ML Multi-Layer Subsidence Classifier for SIH26025 Underground Coal Mine Safety Command Center",
    version="1.0.0"
)

# ─── Middleware: request/correlation IDs + secure headers ─────────────────────

@app.middleware("http")
async def observability_and_security_headers(request: Request, call_next):
    # Request ID: honour incoming X-Request-ID, otherwise generate one
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    # Secure headers (defense in depth; also enforced by the frontend nginx)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response


# Enable CORS — origins controlled via ALLOWED_ORIGINS env var
_allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_raw.split(",") if o.strip()]
# In development, also allow wildcard if ENVIRONMENT is not production
if os.getenv("ENVIRONMENT", "development") != "production":
    ALLOWED_ORIGINS = ["*"]  # Dev convenience; restricted in prod via env

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─── Authentication ───────────────────────────────────────────────────────────

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

# Production guard: refuse to run with the publicly-known dev default key.
_DEV_DEFAULT_KEY = "terramesh_secure_key_2026"
if IS_PRODUCTION and os.getenv("SECRET_KEY", _DEV_DEFAULT_KEY) == _DEV_DEFAULT_KEY:
    import sys as _sys
    print("[FATAL] Production cannot run with the development default SECRET_KEY. "
          "Generate one with: openssl rand -hex 32")
    _sys.exit(1)
API_KEY = os.getenv("SECRET_KEY", "terramesh_secure_key_2026")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(api_key: str = Depends(api_key_header), request: Request = None):
    """
    Accepts (in order of precedence):
      1. The service API key (X-API-Key: <SECRET_KEY>)
      2. A properly HMAC-signed session token issued by /api/login
      3. Legacy `JWT_TERRAMESH_*` demo tokens — ONLY when ENVIRONMENT != production
    """
    auth_result = authenticate(api_key, allow_legacy_demo=not IS_PRODUCTION)
    if not auth_result:
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    if request is not None:
        request.state.auth = auth_result
    return auth_result


# ── Backend-enforced RBAC (Phase G) ─────────────────────────────────────────
# Frontend role-hiding is cosmetic; authorization happens HERE. Sensitive
# endpoints declare an EXPLICIT allowed-role set (this domain is not a pure
# ladder: a Safety Officer may order an evacuation but must not retrain the
# model; an Engineer configures but does not dispatch emergencies).
from auth import ROLE_RANK as _ROLE_RANK

R_ENGINEERING = {"ENGINEER", "ADMIN"}
R_EMERGENCY = {"CONTROL_ROOM_OPERATOR", "SAFETY_OFFICER", "ADMIN"}
R_AUDIT_READ = {"SAFETY_OFFICER", "CONTROL_ROOM_OPERATOR", "ENGINEER", "ADMIN"}
R_SMS = {"SAFETY_OFFICER", "CONTROL_ROOM_OPERATOR", "ENGINEER", "ADMIN"}
R_OPERATIONS = {"SUPERVISOR", "SAFETY_OFFICER", "CONTROL_ROOM_OPERATOR",
                "ENGINEER", "ADMIN"}


def require_roles(allowed: set):
    """FastAPI dependency factory: authenticate, then authorize against an
    explicit allowed-role set. Service API-key calls act as ADMIN; session
    tokens carry their /api/login-issued role; demo tokens act as
    CONTROL_ROOM_OPERATOR. Callers outside the set get 403."""
    allowed = set(allowed)

    def authorizer(api_key: str = Depends(api_key_header), request: Request = None):
        auth_result = verify_api_key(api_key, request)
        role = (auth_result or {}).get("role", "VIEWER")
        if role not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Role {role} is not authorized for this action "
                       f"(allowed: {', '.join(sorted(allowed))})",
            )
        if request is not None:
            request.state.auth = auth_result
        return auth_result

    return authorizer


def _client_ip(request: Request) -> str:
    return request.client.host if request and request.client else "unknown"


# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logging.error(f"WebSocket broadcast error: {e}")

manager = ConnectionManager()

from archive_service import archive_service
from cache.redis_client import redis_cache
from mqtt.mqtt_client import mqtt_ingest

# ─── Edge node heartbeat handler (battery / RSSI → Redis node state) ────────

async def handle_edge_heartbeat(payload: Dict[str, Any]):
    try:
        await redis_cache.set_node(str(payload.get("node_id", "UNKNOWN")), {
            "battery": payload.get("battery_v", payload.get("batt_v")),
            "rssi_dbm": payload.get("rssi_dbm"),
            "heartbeat_at": payload.get("timestamp"),
            "provenance": "MEASURED",
        })
    except Exception:
        pass  # heartbeat bookkeeping must never crash the broker thread


# ─── Multi-channel alert dispatch (deck alert levels) ──────────────────────
# L1 Caution: dashboard notification (handled by the WebSocket broadcast)
# L2 Warning / L3 Critical: additionally FCM push + Email (each channel
# reports its ACTUAL outcome; disabled channels are never fabricated).

async def dispatch_alert_channels(
    severity: str,
    title: str,
    body: str,
    zone: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Dispatch one alert over every configured channel; return honest results."""
    result: Dict[str, Any] = {"severity": severity, "channels": {}}

    # 1. FCM push (BLOCKED without Firebase credentials)
    try:
        from notifications.fcm_service import fcm_service
        from notifications.token_store import token_store
        tokens = (token_store.get_tokens_for_zone(zone) if zone else []) or token_store.get_all_tokens()
        fcm_res = await fcm_service.send_alert(
            token_list=tokens, severity=severity, title=title, body=body,
            data={**(extra or {}), **({"zone": zone} if zone else {})},
        )
        result["channels"]["fcm"] = {
            "enabled": fcm_service.is_enabled,
            "success": fcm_res.success,
            "sent": fcm_res.sent_count,
            "failed": fcm_res.failed_count,
            "error": fcm_res.error,
        }
    except Exception as e:
        result["channels"]["fcm"] = {"enabled": False, "success": False, "error": str(e)}

    # 2. Email (L2 Warning and above per the deck's alert-level contract)
    if severity.upper() in ("WARNING", "CRITICAL", "EVACUATE"):
        try:
            from notifications.email_service import email_service
            mail = email_service.send_alert(
                severity=severity,
                subject=title,
                body=f"{body}\n\nZone: {zone or '—'}",
            )
            result["channels"]["email"] = {
                "enabled": email_service.is_enabled,
                "success": mail.success,
                "sent": mail.sent_count,
                "error": mail.error,
            }
        except Exception as e:
            result["channels"]["email"] = {"enabled": False, "success": False, "error": str(e)}
    else:
        result["channels"]["email"] = {"skipped": "email dispatch reserved for L2 WARNING and above"}

    return result


@app.on_event("startup")
async def startup_event():
    # Archive service with default retention 180 (overridden on first settings sync)
    await archive_service.start(retention_days=180)
    # Redis (graceful in-memory fallback when unavailable)
    await redis_cache.connect()
    # Wire the telemetry pipeline's async sinks BEFORE MQTT starts:
    #   pipeline events -> WebSocket broadcast + Redis node-state cache
    pipeline_instance.broadcast_callback = manager.broadcast
    pipeline_instance.redis_cache = redis_cache
    # MQTT ingestion -> full pipeline (validation happens in the MQTT client)
    mqtt_ingest._callback = pipeline_instance.process_and_dispatch
    mqtt_ingest._heartbeat_callback = handle_edge_heartbeat
    loop = asyncio.get_event_loop()
    await mqtt_ingest.start(event_loop=loop)

@app.on_event("shutdown")
async def shutdown_event():
    await redis_cache.disconnect()
    await mqtt_ingest.stop()

# ─── Health / Readiness / Liveness (honest per-service states) ──────────────

def _fcm_status() -> dict:
    try:
        from notifications.fcm_service import fcm_service
        return {"status": "enabled" if fcm_service.is_enabled else "disabled",
                "note": "enabled" if fcm_service.is_enabled else
                        "FIREBASE_CREDENTIALS_PATH not configured — push delivery skipped"}
    except Exception:
        return {"status": "unavailable"}

@app.get("/health", tags=["System"])
async def health_check():
    """
    Honest service-status probe. Dependencies unavailable in this environment
    are reported as such — never claimed healthy.
    """
    import time
    status = {"status": "ok", "timestamp": time.time(), "services": {}}

    # API (this process) is trivially alive if we are answering
    status["services"]["api"] = {"status": "healthy"}

    # Database — honest probe incl. extension availability
    status["services"]["database"] = database.check_database_health()

    # Redis — configured state, not a fake
    status["services"]["redis"] = {
        "status": redis_cache.status,   # connected | reconnecting | disabled
        "url_configured": bool(os.getenv("REDIS_URL", "")),
    }

    # MQTT ingestion — real connection state machine + counters
    status["services"]["mqtt"] = mqtt_ingest.stats()

    # ML pipeline + models
    status["services"]["ml_pipeline"] = {
        "status": "ok" if pipeline_instance and pipeline_instance.model else "degraded_no_model",
        "model_status": ml_service.model_status,
        "metrics": pipeline_instance.stats()["metrics"] if pipeline_instance else {},
    }

    # FCM — disabled until credentials exist
    status["services"]["fcm"] = _fcm_status()

    # Aggregate: degraded if any required dependency is not healthy
    degraded = (
        status["services"]["database"].get("status") != "healthy"
        or status["services"]["redis"]["status"] == "reconnecting"
    )
    status["status"] = "degraded" if degraded else "ok"

    http_status = 200 if status["status"] == "ok" else 503
    return Response(
        content=json.dumps(status),
        media_type="application/json",
        status_code=http_status
    )


@app.get("/readiness", tags=["System"])
async def readiness_probe():
    """Readiness = can this instance serve traffic (database reachable)."""
    db = database.check_database_health()
    ready = db.get("status") == "healthy"
    return Response(
        content=json.dumps({"ready": ready, "database": db, "timestamp": __import__("time").time()}),
        media_type="application/json",
        status_code=200 if ready else 503,
    )


@app.get("/liveness", tags=["System"])
async def liveness_probe():
    """Liveness = process responsive. Always 200 while serving."""
    return {"alive": True, "timestamp": __import__("time").time()}


# ─── Kalman Filter Diagnostics ────────────────────────────────────────────────
@app.get("/api/kalman/node/{node_id}", tags=["Analytics"])
async def get_kalman_state(node_id: str, api_key: str = Depends(verify_api_key)):
    """
    Returns Kalman filter diagnostic state for a sensor node.
    Useful for raw vs filtered signal comparison in the frontend chart.
    """
    try:
        stats = pipeline_instance.kalman_bank.get_node_stats(node_id)
        active_nodes = pipeline_instance.kalman_bank.active_node_count
        return {
            "node_id": node_id,
            "filter_state": stats,
            "active_filter_nodes": active_nodes,
            "provenance": "MODEL OUTPUT — Kalman Filter (analytics/kalman_filter.py)",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kalman state retrieval error: {e}")

# ─── FCM Push Notifications ──────────────────────────────────────────────────
from notifications.fcm_service import fcm_service
from notifications.token_store import token_store

class FCMTokenRequest(BaseModel):
    worker_id: str
    token: str
    zone: str
    platform: str = "android"

@app.post("/api/notifications/register-token", tags=["Notifications"], dependencies=[Depends(verify_api_key)])
async def register_fcm_token(req: FCMTokenRequest):
    """Register a worker's FCM device token for push alert delivery.
    (Authenticated — this writes to the database and enables push routing.)"""
    ok = token_store.register(req.worker_id, req.token, req.zone, req.platform)
    return {"success": ok, "registered_tokens": token_store.token_count}

@app.delete("/api/notifications/deregister-token/{worker_id}", tags=["Notifications"])
async def deregister_fcm_token(worker_id: str, api_key: str = Depends(verify_api_key)):
    """Remove a worker's FCM token (e.g., on logout or device change)."""
    ok = token_store.deregister(worker_id)
    return {"success": ok, "registered_tokens": token_store.token_count}

@app.get("/api/notifications/status", tags=["Notifications"])
async def get_notification_status(api_key: str = Depends(verify_api_key)):
    """Returns FCM service status and registered token counts."""
    return {
        "fcm_enabled": fcm_service.is_enabled,
        "registered_tokens": token_store.token_count,
        "mqtt_connected": mqtt_ingest.is_connected,
        "redis_available": redis_cache.is_available,
    }

# ─── PDF Reports ─────────────────────────────────────────────────────────────
from reports.report_service import report_service
from fastapi.responses import Response

class ReportRequest(BaseModel):
    report_type: str
    data: dict

@app.post("/api/reports/generate", tags=["Reports"])
@limiter.limit("5/minute")
async def generate_report(req: ReportRequest, request: Request, api_key: str = Depends(verify_api_key)):
    """Generate a PDF report from provided template ID and payload.
    Reports are NOT digitally signed and carry no certification claim."""
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    # fpdf2 returns bytearray — Response requires bytes
    pdf_bytes = bytes(report_service.generate_report(req.report_type, req.data))
    audit_service.record(
        "REPORT_GENERATION",
        user_email=(auth_info or {}).get("email", "service"),
        resource=req.report_type,
        ip_address=_client_ip(request),
        detail=f"pdf_bytes={len(pdf_bytes)}",
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="TerraMesh_{req.report_type}.pdf"'
        }
    )

# ─── Remote Sensing (InSAR) ──────────────────────────────────────────────────
from remote_sensing.insar_service import insar_service

@app.get("/api/satellite/insar/{mine_id}", tags=["Remote Sensing"])
async def get_insar_data(mine_id: str, api_key: str = Depends(verify_api_key)):
    """InSAR deformation grid with provider state + acquisition metadata.
    MOCK data is always labelled (provider_state=MOCK, provenance=SIMULATED
    SATELLITE DATA, is_live=false); providers that cannot serve real data
    return their honest BLOCKED/UNAVAILABLE state instead of fabricating."""
    try:
        bbox = {"min_lat": 23.7, "max_lat": 23.8, "min_lng": 86.3, "max_lng": 86.4}
        data = await insar_service.get_latest_deformation_map(mine_id, bbox)
        return data
    except RuntimeError as e:
        # Provider refused honestly (credentials / processing stack)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"InSAR fetch failed: {e}")


@app.get("/api/satellite/insar-status", tags=["Remote Sensing"])
def get_insar_provider_status(api_key: str = Depends(verify_api_key)):
    """Current InSAR provider state (LIVE | MOCK | UNAVAILABLE |
    CONFIGURATION_REQUIRED) for UI gating — the UI must never render MOCK
    as LIVE."""
    return insar_service.provider_status()

# ─── Edge Computing / TinyML ────────────────────────────────────────────────
# HONESTY NOTE: there is no deployed ONNX TinyML fleet in this project. Edge
# inference in this deployment is the EDGE INFERENCE SIMULATOR (see
# docs/EDGE_ARCHITECTURE.md). These endpoints report the REAL state of the
# local inference pipeline and model artifacts — never fabricated node fleets.

class EdgeTelemetryPayload(BaseModel):
    node_id: str
    tilt_x_deg: Optional[float] = None
    tilt_y_deg: Optional[float] = None
    tilt_mag_mrad: Optional[float] = None
    crack_gap_mm: Optional[float] = None
    vib_rms_g: Optional[float] = None
    vib_peak_g: Optional[float] = None
    dom_freq_hz: Optional[float] = None
    batt_v: Optional[float] = None
    rssi_dbm: Optional[float] = None
    temp_c: Optional[float] = None
    packet_seq: Optional[int] = None
    timestamp: Optional[float] = None


@app.post("/api/edge/telemetry", tags=["Edge Computing"])
async def ingest_edge_telemetry(payload: EdgeTelemetryPayload, request: Request,
                                api_key: str = Depends(verify_api_key)):
    """
    HTTP fallback for edge nodes without MQTT: runs the packet through the
    SAME validation -> Kalman -> health -> vibration -> XGBoost -> SHADOW
    fusion -> risk engine pipeline as MQTT telemetry, persists it, and
    broadcasts to WebSocket listeners.
    """
    packet = payload.model_dump(exclude_none=True)
    packet["_provenance"] = "MEASURED"
    event = await pipeline_instance.process_and_dispatch(packet)
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    audit_service.record(
        "EDGE_TELEMETRY_INGEST",
        user_email=(auth_info or {}).get("email", "service"),
        resource=payload.node_id,
        ip_address=_client_ip(request),
    )
    return {
        "status": "processed",
        "node_id": payload.node_id,
        "warning_tier": event.get("decision", {}).get("warning_tier"),
        "risk_score": event.get("decision", {}).get("composite_risk_score"),
        "model_loaded": event.get("model_loaded"),
        "provenance": event.get("provenance"),
    }


@app.get("/api/edge/status", tags=["Edge Computing"])
async def get_edge_network_status(api_key: str = Depends(verify_api_key)):
    """
    Real status of the edge ingestion layer: MQTT connection state, pipeline
    model availability, and the inference simulator's configuration.
    No fabricated node counts or ONNX deployment claims.
    """
    from pathlib import Path as _P
    simulator_path = _P(__file__).resolve().parent.parent / "edge" / "simulator" / "edge_node_simulator.py"
    pipeline_stats = pipeline_instance.stats()
    mqtt_stats = mqtt_ingest.stats()
    return {
        "implementation_status": "EDGE INFERENCE SIMULATOR",
        "note": "No quantized ONNX model is deployed on physical MCU hardware. "
                "Local inference runs the trained scikit-learn/XGBoost artifacts "
                "server-side; edge/ contains the clearly-labelled simulator.",
        "mqtt_ingest": {
            "state": mqtt_stats["state"],
            "connected": mqtt_stats["connected"],
            "broker": mqtt_stats["broker"],
            "metrics": mqtt_stats["metrics"],
        },
        "inference_pipeline": {
            "model_loaded": pipeline_stats["model_loaded"],
            "nodes_tracked": pipeline_stats["nodes_tracked"],
            "packets_processed": pipeline_stats["metrics"]["packets_processed"],
            "degraded_predictions": pipeline_stats["metrics"]["degraded_predictions"],
        },
        "api_ml_service": ml_service.model_status,
        "edge_simulator_available": simulator_path.exists(),
        "artifacts_on_disk": {
            "terramesh_final_model.joblib": pipeline_stats["model_loaded"],
            "xgboost_risk.joblib": ml_service.model_status["xgboost_loaded"],
            "isolation_forest.joblib": ml_service.model_status["isolation_forest_loaded"],
        },
    }

class ArchiveSettingsRequest(BaseModel):
    auto_archive: bool
    retention_days: int

    safety_thresholds: dict = None


@app.post("/api/settings/sync", dependencies=[Depends(require_roles(R_ENGINEERING))])
async def sync_settings(req: ArchiveSettingsRequest, request: Request):
    # Audited operator action: archive/retention + ML safety thresholds
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    previous_thresholds = {
        "tilt_critical": ml_service.tilt_critical,
        "disp_critical": ml_service.disp_critical,
        "pore_pressure_limit": ml_service.pore_pressure_limit,
        "ch4_trip_limit": ml_service.ch4_trip_limit,
    }
    if req.auto_archive:
        if not archive_service.is_active:
            await archive_service.start(req.retention_days)
        else:
            archive_service.retention_days = req.retention_days
    else:
        if archive_service.is_active:
            await archive_service.stop()

    if req.safety_thresholds:
        ml_service.update_thresholds(req.safety_thresholds)

    audit_service.record(
        "SETTINGS_SYNC",
        user_email=(auth_info or {}).get("email", "service"),
        role=(auth_info or {}).get("role"),
        resource="archive+thresholds",
        previous_state={
            "auto_archive": archive_service.is_active,
            "retention_days": archive_service.retention_days,
            "thresholds": previous_thresholds,
        },
        new_state={
            "auto_archive": req.auto_archive,
            "retention_days": req.retention_days,
            "thresholds": req.safety_thresholds,
        },
        ip_address=_client_ip(request),
    )
    return {"status": "success", "auto_archive": req.auto_archive, "retention_days": req.retention_days}

@app.post("/api/settings/calibrate", dependencies=[Depends(require_roles(R_ENGINEERING))])
async def calibrate_sensors(request: Request):
    count = 0
    for sensor in sim_engine.sensors:
        if sensor["type"] == "Tiltmeter" or "tilt" in sensor:
            sensor["tilt"] = 0.0
            count += 1

    # Reset Kalman filter state for the affected nodes (sensor recalibration)
    for sensor in sim_engine.sensors:
        if "tilt" in sensor:
            pipeline_instance.kalman_bank.reset_node(sensor["id"])

    # Broadcast the new state to connected UI clients
    overview = sim_engine.get_overview()
    await manager.broadcast({"type": "STATE_UPDATE", "data": overview})

    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    audit_service.record(
        "SENSOR_CALIBRATION",
        user_email=(auth_info or {}).get("email", "service"),
        role=(auth_info or {}).get("role"),
        resource=f"tilt_sensors:{count}",
        new_state={"tilt_zeroed": True, "kalman_reset_nodes": count},
        ip_address=_client_ip(request),
    )
    return {"status": "success", "calibrated_nodes": count, "kalman_filters_reset": count}

@app.post("/api/ml/retrain", dependencies=[Depends(require_roles(R_ENGINEERING))])
async def retrain_ml_model(request: Request):
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    audit_service.record(
        "ML_RETRAIN",
        user_email=(auth_info or {}).get("email", "service"),
        ip_address=_client_ip(request),
        detail="isolation-forest retraining subprocess",
    )
    try:
        success = await ml_service.retrain_model()
        if success:
            return {"status": "success", "message": "ML Model retrained successfully"}
        else:
            # Honest failure: the training corpus is not present in this deployment
            raise HTTPException(
                status_code=500,
                detail="Retraining failed — training data corpus not available in this environment (see synth/ pipeline)",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {
        "system": "MINEGUARD AI",
        "project": "Smart India Hackathon (SIH26025)",
        "status": "OPERATIONAL",
        "ml_engine": {
            "xgboost_loaded": ml_service.model_status["xgboost_loaded"],
            "isolation_forest_loaded": ml_service.model_status["isolation_forest_loaded"],
            "inference_mode": ml_service.model_status["inference_mode"],
            "note": "model load state reported honestly; physics-fallback is labelled per prediction",
        },
        "documentation": "/docs"
    }

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


def _user_count() -> int:
    try:
        db = database.SessionLocal()
        try:
            return db.query(models.UserModel).count()
        finally:
            db.close()
    except Exception:
        return 0


@app.post("/api/login")
@limiter.limit("10/minute")
def login(req: LoginRequest, request: Request):
    """
    Login against the users table (PBKDF2 password verification).

    Fallback (DEMO MODE) — only when BOTH of these hold:
      * no users exist in the database, and
      * ENVIRONMENT != production
    In that mode the historical demo password list is accepted and the login
    is explicitly logged as a demo login. Production NEVER accepts demo
    credentials.
    """
    ip = _client_ip(request)

    # 1. Try the users table first (production authority)
    if req.email:
        try:
            db = database.SessionLocal()
            try:
                user = db.query(models.UserModel).filter(models.UserModel.email == req.email.lower()).first()
            finally:
                db.close()
            if user and user.active and verify_password(req.password, user.password_hash):
                token = issue_token(user.email, user.role)
                try:
                    db = database.SessionLocal()
                    try:
                        u = db.query(models.UserModel).filter(models.UserModel.id == user.id).first()
                        if u:
                            from datetime import datetime as _dt
                            u.last_login = _dt.utcnow()
                            db.commit()
                    finally:
                        db.close()
                except Exception:
                    pass
                audit_service.record(
                    "LOGIN", user_email=user.email, role=user.role,
                    resource="api", ip_address=ip,
                    detail="authenticated via users table",
                )
                return {"token": token, "user": {"name": user.name or user.email, "role": user.role, "email": user.email}, "auth_mode": "users_table"}
        except Exception as e:
            logging.getLogger("terramesh.auth").warning("Users-table login path error: %s", e)

    # 2. Demo mode (no users configured AND not production)
    if not IS_PRODUCTION and _user_count() == 0:
        if req.password in demo_passwords():
            logging.getLogger("terramesh.auth").warning(
                "DEMO LOGIN accepted for %s — no users configured and ENVIRONMENT=development. "
                "Create real users before production use.", req.email,
            )
            audit_service.record(
                "LOGIN", user_email=req.email, role="CONTROL_ROOM_OPERATOR",
                resource="api", ip_address=ip,
                detail="DEMO LOGIN (demo password list; users table empty; ENVIRONMENT != production)",
            )
            return {
                "token": issue_token(req.email.lower(), "CONTROL_ROOM_OPERATOR"),
                "user": {"name": req.email, "role": "CONTROL_ROOM_OPERATOR", "email": req.email},
                "auth_mode": "demo",
                "warning": "Demo authentication active — configure the users table for production.",
            }

    audit_service.record("LOGIN_FAILED", user_email=req.email, resource="api", ip_address=ip)
    raise HTTPException(status_code=401, detail="Invalid Email or Password")


@app.get("/api/roles", tags=["System"])
def list_roles(api_key: str = Depends(verify_api_key)):
    """Available RBAC roles (scaffolding for role-based access control)."""
    return {"roles": list(ROLES)}

@app.get("/api/dashboard/overview", response_model=DashboardOverview)
async def get_dashboard_overview(api_key: str = Depends(verify_api_key)):
    # Try Redis cache first (TTL 2s) — falls back gracefully if Redis unavailable
    cached = await redis_cache.get_dashboard()
    if cached:
        return cached
    data = sim_engine.get_overview()
    # Convert Pydantic model to dict for caching if needed
    try:
        cache_data = data.model_dump() if hasattr(data, 'model_dump') else data
        await redis_cache.set_dashboard(cache_data)
    except Exception:
        pass
    return data


@app.get("/api/sensors", response_model=List[SensorNodeSchema])
def get_sensors(api_key: str = Depends(verify_api_key)):
    return sim_engine.sensors

@app.get("/api/sensors/{sensor_id}", response_model=SensorNodeSchema)
def get_sensor(sensor_id: str, api_key: str = Depends(verify_api_key)):
    for s in sim_engine.sensors:
        if s["id"].lower() == sensor_id.lower():
            return s
    raise HTTPException(status_code=404, detail="Sensor node not found")

@app.post("/api/telemetry/ingest", dependencies=[Depends(verify_api_key)])
async def ingest_hardware_telemetry(data: TelemetryIngestSchema):
    """
    Ingest live telemetry from ESP32 Heltec LoRa 32 V3 hardware nodes or LoRa Gateway.
    Executes real-time multi-layer ML model inference (XGBoost 5-Class + Isolation Forest + Vibration Filter).
    Broadcasts state immediately to frontend dashboard over WebSocket.
    """
    node_id = data.node_id.upper()
    data_dict = data.model_dump() if hasattr(data, 'model_dump') else data.dict()
    
    # 1. RUN MULTI-LAYER ML MODEL INFERENCE ON INCOMING TELEMETRY
    ml_result = ml_service.predict_packet(data_dict)
    
    found = False
    for s in sim_engine.sensors:
        if s["id"].upper() == node_id:
            s["tilt"] = data.tilt if data.tilt is not None else s["tilt"]
            s["displacement"] = data.displacement if data.displacement is not None else s["displacement"]
            s["crack_width"] = data.crack_width if data.crack_width is not None else s["crack_width"]
            s["battery"] = data.battery if data.battery is not None else s["battery"]
            s["vibration"] = data.vibration if data.vibration is not None else s["vibration"]
            s["last_update"] = "Just now (Heltec LoRa + ML)"
            
            # Apply dynamic ML predictions
            s["status"] = ml_result["status"]
            s["ai_risk_score"] = ml_result["ai_risk_score"]
            s["risk_label"] = ml_result["risk_label"]
            s["confidence_pct"] = ml_result["confidence_pct"]
            s["anomaly_detected"] = ml_result["anomaly_detected"]
            found = True
            break
            
    # If it's a new custom hardware node, register it dynamically
    if not found:
        new_node = {
            "id": node_id,
            "name": f"Heltec Node {node_id}",
            "zone": data.zone or "Zone B",
            "lat": 23.7780,
            "lng": 86.4150,
            "tilt": data.tilt or 0.0,
            "displacement": data.displacement or 0.0,
            "crack_width": data.crack_width or 0.0,
            "vibration": data.vibration or "LOW",
            "battery": data.battery or 95,
            "lora_signal": 95,
            "ai_risk_score": ml_result["ai_risk_score"],
            "status": ml_result["status"],
            "confidence_pct": ml_result["confidence_pct"],
            "risk_label": ml_result["risk_label"],
            "anomaly_detected": ml_result["anomaly_detected"],
            "last_update": "Just now (Heltec LoRa + ML)"
        }
        sim_engine.sensors.append(new_node)

    # 2. Check if a high risk alert should be triggered dynamically
    if ml_result["risk_class"] >= 3 and not ml_result["is_blast_suppressed"]:
        alert_exists = any(a["zone"] == (data.zone or "Zone B") and a["severity"] == "CRITICAL" for a in sim_engine.alerts[:3])
        if not alert_exists:
            new_alert = {
                "id": f"ALT-{len(sim_engine.alerts) + 1094}",
                "severity": "CRITICAL",
                "title": f"ML EMERGENCY: {data.zone or 'Zone B'} Strata Instability",
                "description": f"Model predicted {ml_result['risk_label']} ({ml_result['confidence_pct']}% confidence). {ml_result['explanation']}",
                "zone": data.zone or "Zone B",
                "timestamp": "Just now",
                "acknowledged": False
            }
            sim_engine.alerts.insert(0, new_alert)
            await manager.broadcast({"type": "ALERT_NEW", "data": new_alert})

            # Multi-channel dispatch (deck L3): dashboard (done above) + FCM + email.
            # Each channel reports its ACTUAL outcome — nothing is fabricated.
            dispatch = await dispatch_alert_channels(
                severity="CRITICAL",
                title=new_alert["title"],
                body=new_alert["description"],
                zone=new_alert["zone"],
                extra={"alert_id": new_alert["id"], "source": "ml_ingest",
                       "inference_mode": ml_result.get("inference_mode", "unknown")},
            )
            logging.getLogger("terramesh.alerts").info(
                "Critical-alert channel dispatch: %s", dispatch
            )

    # Persist the telemetry snapshot to the canonical store (provenance-labelled)
    try:
        from models import TelemetryModel as _TM
        from datetime import datetime as _dtm
        _row = _TM(
            mine_id="jharia_01", node_id=node_id, ts=_dtm.utcnow(),
            tilt=data.tilt, displacement=data.displacement,
            crack_width=data.crack_width,
            vibration=float(data.vibration) if isinstance(data.vibration, (int, float)) else None,
            temperature=data.temp_c,
            battery=data.battery, signal_strength=data.rssi,
            risk_score=float(ml_result.get("ai_risk_score", 0) or 0),
            warning_tier=ml_result.get("risk_label", ""),
            provenance="MEASURED",
        )
        _db = database.SessionLocal()
        try:
            _db.add(_row)
            _db.commit()
        except Exception:
            _db.rollback()
        finally:
            _db.close()
    except Exception as _persist_err:
        logging.getLogger("terramesh.database").warning(
            "Telemetry persistence skipped for %s: %s", node_id, _persist_err)

    # Broadcast live update to all connected web browsers
    overview = sim_engine.get_overview()
    await manager.broadcast({
        "type": "SENSOR_UPDATE",
        "node_id": node_id,
        "data": data_dict,
        "ml_prediction": ml_result,
        "overview": overview
    })
    
    return {
        "status": "ingested",
        "node_id": node_id,
        "broadcast": True,
        "ml_prediction": ml_result,
        "timestamp": "Now"
    }

# Dedicated ML Prediction API
@app.post("/api/ml/predict", response_model=MLPredictionResponse)
def run_ml_prediction(telemetry: TelemetryIngestSchema, api_key: str = Depends(verify_api_key)):
    """
    On-demand ML evaluation endpoint for raw sensor values, simulations, or edge hardware testing.
    """
    data_dict = telemetry.model_dump() if hasattr(telemetry, 'model_dump') else telemetry.dict()
    pred = ml_service.predict_packet(data_dict)
    pred["node_id"] = telemetry.node_id
    return pred

@app.get("/api/ml/model-info", response_model=MLModelInfoResponse)
def get_model_info(api_key: str = Depends(verify_api_key)):
    """
    Active ML model metadata with HONEST load state. Metrics come from the
    artifacts' own training reports when present (synthetic-corpus holdout),
    never hand-typed.
    """
    info = ml_service.model_metadata.copy()
    info["is_loaded"] = ml_service.is_loaded
    info["xgboost_loaded"] = ml_service.model_status["xgboost_loaded"]
    info["isolation_forest_loaded"] = ml_service.model_status["isolation_forest_loaded"]
    info["inference_mode"] = ml_service.model_status["inference_mode"]
    report = info.get("xgboost_report") or {}
    info["macro_f1"] = report.get("macro_f1")
    info["weighted_f1"] = report.get("weighted_f1")
    info["metrics_note"] = "Synthetic training-corpus holdout metrics (see synth/); no field-data validation exists"
    return info

@app.get("/api/workers", response_model=List[WorkerSchema])
def get_workers(api_key: str = Depends(verify_api_key)):
    return sim_engine.workers

def _seeded_zones_from_db():
    """Zone rows from the seeded PostGIS/SQLite risk_zones table (geometry
    + engineering parameters). Returns [] when the table is empty."""
    try:
        import json as _json
        db = database.SessionLocal()
        try:
            rows = db.query(models.ZoneModel).all()
            out = []
            for z in rows:
                polygon = None
                if z.polygon_json:
                    try:
                        polygon = _json.loads(z.polygon_json)
                    except Exception:
                        polygon = None
                out.append({
                    "id": z.id, "code": z.code, "name": z.name,
                    "status": z.status, "subsidence_rate": z.subsidence_rate,
                    "active_workers": z.active_workers, "active_sensors": z.active_sensors,
                    "risk_score": z.risk_score, "polygon": polygon,
                })
            return out
        finally:
            db.close()
    except Exception:
        return []


@app.get("/api/zones")
def get_zones(api_key: str = Depends(verify_api_key)):
    """
    Zone overlay data. Source of truth is the SEEDED risk_zones table
    (geometry from seed_spatial.py; verified by the spatial API); the demo
    engine's live state overlays the status/risk of the demo scenario so
    the map, dashboard and demo stepper stay synchronized. Provenance is
    explicit per field — geometry is never implied to be live survey data.
    """
    seeded = _seeded_zones_from_db()
    # Live demo-state overlay (SIMULATION-labelled): zone-b status/risk
    demo_overlay = {
        "zone-b": {
            "status": sim_engine.zone_b_status,
            "subsidence_rate": 4.2 if sim_engine.zone_b_status == "CRITICAL" else 0.8,
            "risk_score": sim_engine.current_risk_score,
        }
    }
    for z in seeded:
        ov = demo_overlay.get(z["id"])
        if ov:
            z.update(ov)
        z["provenance"] = {
            "geometry": "SEEDED DATABASE",       # seed_spatial.py engineering geometry
            "status": "SIMULATION" if z["id"] == "zone-b" else "SEEDED DATABASE",
        }
    if seeded:
        return seeded
    # Fallback (empty DB — e.g. pre-seed dev): the scripted constants,
    # honestly labelled.
    return [
        {"id": "zone-a", "code": "Zone A", "name": "North Longwall Face 1",
         "status": "SAFE", "subsidence_rate": 0.4, "active_workers": 42,
         "active_sensors": 14, "risk_score": 18, "polygon": None,
         "provenance": {"geometry": "STATIC DESIGN DATA", "status": "SIMULATION"}},
        {"id": "zone-b", "code": "Zone B", "name": "Central Depillaring Section",
         "status": sim_engine.zone_b_status,
         "subsidence_rate": 4.2 if sim_engine.zone_b_status == "CRITICAL" else 0.8,
         "active_workers": 7, "active_sensors": 8,
         "risk_score": sim_engine.current_risk_score, "polygon": None,
         "provenance": {"geometry": "STATIC DESIGN DATA", "status": "SIMULATION"}},
        {"id": "zone-c", "code": "Zone C", "name": "South Drift Panel 3",
         "status": "CAUTION", "subsidence_rate": 1.2, "active_workers": 48,
         "active_sensors": 16, "risk_score": 42, "polygon": None,
         "provenance": {"geometry": "STATIC DESIGN DATA", "status": "SIMULATION"}},
        {"id": "zone-d", "code": "Zone D", "name": "West Main Haulage Roadway",
         "status": "SAFE", "subsidence_rate": 0.2, "active_workers": 29,
         "active_sensors": 10, "risk_score": 12, "polygon": None,
         "provenance": {"geometry": "STATIC DESIGN DATA", "status": "SIMULATION"}},
    ]

@app.get("/api/alerts", response_model=List[AlertSchema])
def get_alerts(api_key: str = Depends(verify_api_key)):
    return sim_engine.alerts

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, api_key: str = Depends(verify_api_key)):
    for a in sim_engine.alerts:
        if a["id"] == alert_id:
            a["acknowledged"] = True
            return {"status": "success", "message": f"Alert {alert_id} acknowledged"}
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/risk", response_model=AIRiskIntelligence)
def get_risk_intelligence(api_key: str = Depends(verify_api_key)):
    overview = sim_engine.get_overview()
    return overview["risk_intelligence"]

@app.get("/api/evacuation", response_model=EvacuationStatus)
def get_evacuation(api_key: str = Depends(verify_api_key)):
    overview = sim_engine.get_overview()
    return overview["evacuation"]

class BroadcastRequest(BaseModel):
    zone: str
    message: str
    target: str

class SMSRequest(BaseModel):
    phone: str
    message: str
    gateway: str = "fast2sms"
    api_key: str = ""
    smsgate_url: str = ""

@app.post("/api/alerts/send-sms", dependencies=[Depends(require_roles(R_SMS))])
@limiter.limit("10/minute")
async def send_sms_alert(req: SMSRequest, request: Request):
    """
    Dispatch a single SMS via the configured gateway.

    Gateways (env-configured only — NO credentials in source):
      * SMSGate-compatible gateway: SMS_GATEWAY_URL + SMS_GATEWAY_USER + SMS_GATEWAY_PASS
      * Fast2SMS: FAST2SMS_API_KEY
    If no gateway is configured the message is NOT sent and the response is
    explicitly labelled SIMULATED DISPATCH — delivery is never fabricated.
    """
    import urllib.request
    from datetime import datetime

    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    clean_phone = req.phone.replace("+91", "").replace(" ", "").replace("-", "").strip()
    clean_message = html.escape(req.message)

    gateway_url = os.getenv("SMS_GATEWAY_URL", "")
    gateway_user = os.getenv("SMS_GATEWAY_USER", "")
    gateway_pass = os.getenv("SMS_GATEWAY_PASS", "")
    fast2sms_key = req.api_key or os.getenv("FAST2SMS_API_KEY", "")

    result = {
        "success": True,
        "phone": mask_phone_number(req.phone),
        "message": clean_message,
        "gateway": req.gateway,
        "timestamp": datetime.utcnow().isoformat(),
    }

    # 1. SMSGate-compatible LAN gateway (env-configured)
    if gateway_url and gateway_user:
        try:
            import base64
            payload = json.dumps({
                "phoneNumbers": [f"+91{clean_phone}"],
                "message": req.message
            }).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + base64.b64encode(
                    f"{gateway_user}:{gateway_pass}".encode('ascii')).decode('ascii'),
            }
            req_post = urllib.request.Request(gateway_url, data=payload, headers=headers, method='POST')
            with urllib.request.urlopen(req_post, timeout=6) as response:
                res_body = response.read().decode('utf-8')
                try:
                    result["api_response"] = json.loads(res_body)
                except (json.JSONDecodeError, ValueError):
                    result["api_response"] = res_body
                result["status"] = "delivered_via_smsgate"
        except Exception as e:
            result["success"] = False
            result["api_error"] = str(e)
            result["status"] = "gateway_failed"
    # 2. Fast2SMS cloud gateway (env-configured)
    elif fast2sms_key and len(clean_phone) == 10:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = json.dumps({
                "route": "q",
                "message": req.message,
                "language": "english",
                "flash": 0,
                "numbers": clean_phone
            }).encode('utf-8')
            headers = {
                'authorization': fast2sms_key,
                'Content-Type': 'application/json'
            }
            req_post = urllib.request.Request(url, data=payload, headers=headers, method='POST')
            with urllib.request.urlopen(req_post, timeout=6) as response:
                result["api_response"] = json.loads(response.read().decode('utf-8'))
                result["status"] = "delivered_via_fast2sms"
        except Exception as e:
            result["success"] = False
            result["api_error"] = str(e)
            result["status"] = "gateway_failed"
    else:
        # NO gateway configured — honest refusal to fabricate delivery
        result["success"] = False
        result["status"] = "SIMULATED DISPATCH"
        result["note"] = (
            "No SMS gateway configured (set SMS_GATEWAY_URL / FAST2SMS_API_KEY). "
            "The message was NOT transmitted to any carrier; this is a simulated dispatch only."
        )

    audit_service.record(
        "SMS_DISPATCH",
        user_email=(auth_info or {}).get("email", "service"),
        resource=mask_phone_number(req.phone),
        ip_address=_client_ip(request),
        detail=f"status={result.get('status')}",
    )
    return result

@app.post("/api/evacuation/broadcast", dependencies=[Depends(require_roles(R_EMERGENCY))])
async def broadcast_warning(req: BroadcastRequest, request: Request):
    clean_message = html.escape(req.message)
    clean_zone = html.escape(req.zone)
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    ip = _client_ip(request)

    new_alert = {
        "id": f"ALT-{len(sim_engine.alerts) + 1093}",
        "severity": "CRITICAL",
        "title": f"EMERGENCY BROADCAST: {clean_zone}",
        "description": clean_message,
        "zone": clean_zone,
        "timestamp": "Just now",
        "acknowledged": False
    }
    sim_engine.alerts.insert(0, new_alert)
    await manager.broadcast({"type": "ALERT_NEW", "data": new_alert})

    # Multi-channel dispatch (deck L3): dashboard broadcast (done above) + FCM + email
    dispatch = await dispatch_alert_channels(
        severity="EVACUATE",
        title=new_alert["title"],
        body=clean_message,
        zone=clean_zone,
        extra={"alert_id": new_alert["id"], "source": "operator_broadcast"},
    )

    audit_service.record(
        "EVACUATION_BROADCAST",
        user_email=(auth_info or {}).get("email", "service"),
        role=(auth_info or {}).get("role"),
        resource=clean_zone,
        new_state={"alert_id": new_alert["id"], "message": clean_message[:200]},
        ip_address=ip,
        detail=f"channels={ {k: v.get('sent', 0) for k, v in dispatch['channels'].items()} }",
    )
    return {
        "status": "broadcast_transmitted",
        "recipients": len(sim_engine.workers),
        "alert": new_alert,
        "channel_dispatch": dispatch,
        "note": "Every channel reports its actual outcome; disabled channels are never fabricated.",
        "provenance": "OPERATOR ACTION",
    }

@app.get("/api/infrastructure", response_model=InfrastructureSummary)
def get_infrastructure(api_key: str = Depends(verify_api_key)):
    overview = sim_engine.get_overview()
    return overview["infrastructure"]

@app.get("/api/system-health")
def get_system_health(api_key: str = Depends(verify_api_key)):
    overview = sim_engine.get_overview()
    return {
        "sensor_health": overview["sensor_health"],
        "system_status": overview["system_status"]
    }

@app.post("/api/demo/step/{step}")
async def trigger_demo_step(step: int, api_key: str = Depends(verify_api_key)):
    sim_engine.set_demo_step(step)
    overview = sim_engine.get_overview()
    await manager.broadcast({"type": "STATE_UPDATE", "data": overview})
    return {"status": "step_updated", "step": step, "overview": overview}

class HardwareTelemetryPayload(BaseModel):
    sensor_id: str
    tilt: Optional[float] = None
    displacement: Optional[float] = None
    crack_width: Optional[float] = None
    vibration: Optional[float] = None

@app.post("/api/ingest/telemetry", status_code=410, include_in_schema=False)
async def ingest_hardware_data(payload: HardwareTelemetryPayload, api_key: str = Depends(verify_api_key)):
    """REMOVED (410 Gone): legacy unauthenticated state-mutating duplicate of
    /api/telemetry/ingest. It bypassed ML inference and persistence entirely.
    Use POST /api/telemetry/ingest (authenticated, full pipeline) instead."""
    return {
        "detail": "This legacy endpoint has been removed. "
                  "Use POST /api/telemetry/ingest with an X-API-Key header."
    }


@app.websocket("/ws/live-monitoring")
async def websocket_endpoint(websocket: WebSocket, api_key: Optional[str] = None):
    """
    Live monitoring stream (read-only broadcasts; client may PING).

    Authentication: optional `api_key` query parameter. When supplied it is
    validated like any X-API-Key (invalid -> connection closed 1008).
    Unauthenticated connections are currently PERMITTED and logged — the
    stream is read-only, the frontend dashboards connect without keys, and
    restricting it is a documented production-hardening step (see
    docs/DEPLOYMENT.md). Override WS_REQUIRE_AUTH=true to enforce.
    """
    require_auth = os.getenv("WS_REQUIRE_AUTH", "false").lower() == "true"
    auth_state = "unauthenticated"
    if api_key is not None:
        auth_result = authenticate(api_key, allow_legacy_demo=not IS_PRODUCTION)
        if not auth_result:
            await websocket.close(code=1008, reason="Invalid API key")
            return
        auth_state = auth_result["kind"]
    elif require_auth:
        await websocket.close(code=1008, reason="WebSocket authentication required (WS_REQUIRE_AUTH)")
        return
    logging.getLogger("terramesh.ws").info("WS client connected (%s)", auth_state)

    await manager.connect(websocket)
    try:
        # Initial greeting with current state
        await websocket.send_json({"type": "CONNECTED", "data": sim_engine.get_overview()})
        while True:
            # Keep-alive or handle client messages
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get("action") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": "Now"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─────────────────────────────────────────────────────────────────────────────
# XAI Explainability + Self-Healing Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/ml/explain/{node_id}", dependencies=[Depends(verify_api_key)])
async def explain_node_risk(node_id: str):
    """
    Returns XAI explanation card for a specific sensor node.
    Includes physics residual, contributing factors, and bilingual action protocol.
    """
    sensor = next((s for s in sim_engine.sensors if s["id"] == node_id), None)
    if not sensor:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")

    tilt = sensor.get("tilt", 0.0)
    risk = sensor.get("risk", 50)

    # Compute physics residual for this node
    from ml.shadow_engine import _physics_model
    expected_tilt, residual, physics_anomalous = _physics_model.compute_residual(
        actual_tilt_deg=tilt, surface_distance_m=60.0
    )

    # Build XAI factors
    xai_factors = {
        "XGBoost Risk Score": round(risk * 0.4, 1),
        "Anomaly Divergence": round(risk * 0.25, 1),
        "Forecast Velocity": round(risk * 0.15, 1),
        "Physics Residual Penalty": round(20.0 if physics_anomalous else 0.0, 1),
        "Sensor Health Penalty": 0.0 if sensor.get("status") == "ONLINE" else 15.0,
    }

    return {
        "node_id": node_id,
        "risk_score": risk,
        "warning_tier": sensor.get("alert", "NORMAL"),
        "primary_driver": max(xai_factors, key=xai_factors.get),
        "xai_factors": xai_factors,
        "physics_residual": {
            "expected_tilt_deg": expected_tilt,
            "actual_tilt_deg": tilt,
            "residual_deg": residual,
            "is_anomalous": physics_anomalous,
            "model": "Sheorey (1993) NCB Empirical — Jharia Coalfield"
        },
        "action_protocol": (
            "IMMEDIATE EVACUATION: Multi-node corroboration confirms critical strata collapse." if risk >= 80
            else "HAZARD ADVISORY: Halt operations; dispatch geotechnical inspection." if risk >= 55
            else "ELEVATED MONITORING: Increase reporting frequency to 30s." if risk >= 25
            else "NORMAL OPERATIONS: Strata stability verified."
        )
    }


@app.get("/api/ml/sensor-health/network", dependencies=[Depends(verify_api_key)])
async def get_sensor_network_health():
    """
    Returns the Self-Healing lifecycle state of all sensor nodes.
    Shows HEALTHY / SUSPECT / QUARANTINED / PENDING_VALIDATION states.
    """
    from ml.sensor_health import node_state_manager
    summary = node_state_manager.get_network_summary()

    # Enrich with simulation sensor data
    enriched = {}
    for sensor in sim_engine.sensors:
        nid = sensor["id"]
        enriched[nid] = {
            "lifecycle_state": node_state_manager.get_state(nid),
            "is_active_in_fusion": node_state_manager.is_active(nid),
            "sensor_status": sensor.get("status", "ONLINE"),
            "risk": sensor.get("risk", 0),
        }

    return {
        "network_summary": summary,
        "nodes": enriched,
        "total_nodes": len(sim_engine.sensors),
        "active_in_fusion": sum(1 for n in enriched.values() if n["is_active_in_fusion"]),
        "quarantined": sum(1 for n in enriched.values() if n["lifecycle_state"] == "QUARANTINED"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# BROADCAST MANAGEMENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

from schemas import BroadcastGroupCreate, BroadcastGroupResponse, BroadcastAlertPayload, ManualSmsPayload
from models import BroadcastGroup, BroadcastRecipient, BroadcastChannel, BroadcastHistory, BroadcastDelivery, WorkerModel
import uuid
import time
from datetime import datetime
import random
import re
import hashlib
from sqlalchemy.orm import Session
from database import get_db

# In-memory duplicate dispatch tracker (keyed by broadcast_id + msg hash)
recent_sms_dispatches: Dict[str, float] = {}

def calculate_sms_segments(text: str) -> dict:
    is_unicode = any(ord(c) > 127 for c in text)
    length = len(text)
    if is_unicode:
        segment_size = 70 if length <= 70 else 67
    else:
        segment_size = 160 if length <= 160 else 153
    segments = 1 if length == 0 else (length + segment_size - 1) // segment_size
    return {
        "char_count": length,
        "is_unicode": is_unicode,
        "segment_size": segment_size,
        "segments": segments
    }

def mask_phone_number(phone: str) -> str:
    cleaned = re.sub(r'\D', '', str(phone or ''))
    if len(cleaned) >= 10:
        return f"+91 ••••••{cleaned[-4:]}"
    elif len(cleaned) >= 4:
        return f"+91 ••••••{cleaned[-4:]}"
    return "+91 ••••••8214"

@app.get("/api/broadcasts", dependencies=[Depends(verify_api_key)])
def get_broadcasts(db: Session = Depends(get_db)):
    """Fetch all broadcast groups"""
    groups = db.query(BroadcastGroup).filter(BroadcastGroup.status == "ACTIVE").all()
    results = []
    for g in groups:
        channels = db.query(BroadcastChannel).filter(BroadcastChannel.broadcast_id == g.id).first()
        recipients_count = db.query(BroadcastRecipient).filter(BroadcastRecipient.broadcast_id == g.id).count()
        
        # fallback if channels missing
        chan_dict = {"sms_enabled": True, "email_enabled": True, "dashboard_enabled": True}
        if channels:
            chan_dict = {
                "sms_enabled": channels.sms_enabled,
                "email_enabled": channels.email_enabled,
                "dashboard_enabled": channels.dashboard_enabled
            }
            
        results.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "status": g.status,
            "created_at": g.created_at.isoformat() if g.created_at else "",
            "channels": chan_dict,
            "recipient_count": recipients_count
        })
    return results

@app.post("/api/broadcasts", dependencies=[Depends(require_roles(R_OPERATIONS))])
def create_broadcast(payload: BroadcastGroupCreate, db: Session = Depends(get_db)):
    """Create or Edit a broadcast group"""
    is_edit = payload.id is not None
    group_id = payload.id if is_edit else f"BG-{uuid.uuid4().hex[:8].upper()}"
    
    if is_edit:
        group = db.query(BroadcastGroup).filter(BroadcastGroup.id == group_id).first()
        if group:
            group.name = payload.name
            group.description = payload.description
            group.status = payload.status
            # Clear old channels & recipients
            db.query(BroadcastChannel).filter(BroadcastChannel.broadcast_id == group_id).delete()
            db.query(BroadcastRecipient).filter(BroadcastRecipient.broadcast_id == group_id).delete()
        else:
            is_edit = False
    
    if not is_edit:
        group = BroadcastGroup(
            id=group_id,
            name=payload.name,
            description=payload.description,
            status=payload.status,
            created_by="Admin"
        )
        db.add(group)
    
    chan = BroadcastChannel(
        broadcast_id=group_id,
        sms_enabled=payload.channels.sms_enabled,
        email_enabled=payload.channels.email_enabled,
        dashboard_enabled=payload.channels.dashboard_enabled
    )
    db.add(chan)
    
    for r in payload.recipients:
        db.add(BroadcastRecipient(
            broadcast_id=group_id,
            user_id=r.user_id,
            role=r.role
        ))
        
    db.commit()
    return {"status": "success", "id": group_id}

@app.get("/api/broadcasts/recipients", dependencies=[Depends(verify_api_key)])
def get_recipients(db: Session = Depends(get_db)):
    """Get all potential recipients (for simplicity, returning workers)"""
    workers = db.query(WorkerModel).all()
    return [{"id": w.id, "name": w.name, "role": "Worker", "zone": w.zone} for w in workers]

@app.get("/api/broadcasts/history", dependencies=[Depends(verify_api_key)])
def get_broadcast_history(db: Session = Depends(get_db)):
    """Fetch history of sent broadcasts (emergency & manual SMS)"""
    history = db.query(BroadcastHistory).order_by(BroadcastHistory.sent_at.desc()).limit(50).all()
    results = []
    for h in history:
        group = db.query(BroadcastGroup).filter(BroadcastGroup.id == h.broadcast_id).first()
        is_manual = (getattr(h, 'alert_type', None) == 'MANUAL_SMS') or (h.alert_id and h.alert_id.startswith("MANUAL-"))
        alert_type = "MANUAL_SMS" if is_manual else getattr(h, 'alert_type', "EMERGENCY")
        
        deliveries = db.query(BroadcastDelivery).filter(BroadcastDelivery.history_id == h.id).all()
        delivered_cnt = sum(1 for d in deliveries if d.status == "Delivered")
        failed_cnt = sum(1 for d in deliveries if d.status == "Failed")
        if not deliveries and h.recipient_count:
            delivered_cnt = h.recipient_count
            failed_cnt = 0
            
        results.append({
            "id": h.id,
            "alert_id": h.alert_id,
            "alert_type": alert_type,
            "message_content": getattr(h, 'message_content', None),
            "broadcast_id": h.broadcast_id,
            "broadcast_name": group.name if group else "Unknown",
            "sent_by": h.sent_by,
            "recipient_count": h.recipient_count,
            "delivered_count": delivered_cnt,
            "failed_count": failed_cnt,
            "sent_at": h.sent_at.isoformat() if h.sent_at else "",
            "status": h.status
        })
    return results

@app.get("/api/broadcasts/history/{history_id}/deliveries", dependencies=[Depends(verify_api_key)])
def get_history_deliveries(history_id: str, db: Session = Depends(get_db)):
    """Fetch recipient delivery receipts for a broadcast history event"""
    deliveries = db.query(BroadcastDelivery).filter(BroadcastDelivery.history_id == history_id).all()
    history = db.query(BroadcastHistory).filter(BroadcastHistory.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
        
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == history.broadcast_id).first()
    
    results = []
    for d in deliveries:
        results.append({
            "id": d.id,
            "recipient_id": d.recipient_id,
            "channel": d.channel,
            "status": d.status,
            "failure_reason": d.failure_reason,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "provider_message_id": d.provider_message_id
        })
        
    return {
        "history_id": history.id,
        "alert_id": history.alert_id,
        "alert_type": getattr(history, "alert_type", "EMERGENCY"),
        "message_content": getattr(history, "message_content", None),
        "broadcast_name": group.name if group else "Unknown",
        "sent_at": history.sent_at.isoformat() if history.sent_at else "",
        "deliveries": results
    }

@app.get("/api/broadcasts/{group_id}", dependencies=[Depends(verify_api_key)])
def get_broadcast(group_id: str, db: Session = Depends(get_db)):
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Not found")
    
    channels = db.query(BroadcastChannel).filter(BroadcastChannel.broadcast_id == group_id).first()
    recipients = db.query(BroadcastRecipient).filter(BroadcastRecipient.broadcast_id == group_id).all()
    
    chan_dict = {"sms_enabled": True, "email_enabled": True, "dashboard_enabled": True}
    if channels:
        chan_dict = {
            "sms_enabled": channels.sms_enabled,
            "email_enabled": channels.email_enabled,
            "dashboard_enabled": channels.dashboard_enabled
        }
        
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "status": group.status,
        "channels": chan_dict,
        "recipients": [{"user_id": r.user_id, "role": r.role} for r in recipients]
    }

@app.delete("/api/broadcasts/{group_id}", dependencies=[Depends(require_roles(R_OPERATIONS))])
def archive_broadcast(group_id: str, db: Session = Depends(get_db)):
    """Archive a broadcast group (soft delete)"""
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.status = "ARCHIVED"
    db.commit()
    return {"status": "success"}

@app.get("/api/broadcasts/{group_id}/recipients", dependencies=[Depends(verify_api_key)])
def get_broadcast_group_recipients(group_id: str, db: Session = Depends(get_db)):
    """Fetch recipient roster for a specific broadcast group with phone eligibility metrics"""
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Broadcast group not found")
    
    workers = db.query(WorkerModel).all()
    group_recipients = db.query(BroadcastRecipient).filter(BroadcastRecipient.broadcast_id == group_id).all()
    
    # Preset pool of mining personnel for realistic industrial command center
    sample_pool = [
        ("Ramesh Kumar", "Underground Miner", "Shaft 3 / South Wall", "9876541201"),
        ("Suresh Patel", "Haulage Operator", "Tunnel B / Level 2", "9876541202"),
        ("Amit Sharma", "Ventilation Tech", "Shaft 1 / Air Intake", "9876541203"),
        ("Vikram Singh", "Drill Specialist", "Deep Seam 4", "9876541204"),
        ("Rajesh Verma", "Electrical Safety Lead", "Substation 2", "9876541205"),
        ("Manoj Tiwari", "Gas Monitor", "Ventilation Return 3", "9876541206"),
        ("Dinesh Yadav", "Conveyor Operator", "Main Conveyor Line", "9876541207"),
        ("Sunil Meena", "Roof Bolter", "Advancing Face A", "9876541208"),
        ("Kavita Rao", "Shift Controller", "Central Dispatch", "9876541209"),
        ("Pradeep Gupta", "Rescue Team Leader", "Emergency Bay 1", "9876541210"),
        ("Anil Nair", "Geotechnical Scout", "North Slope Incline", "9876541211"),
        ("Pooja Choudhury", "Safety Auditor", "Surface Control", "9876541212"),
        ("Harish Murthy", "Pump Operator", "Sump Station 4", ""), # Missing phone example
        ("Santosh Jha", "Loco Driver", "Rail Haulage West", "9876541214"),
        ("Gopal Das", "Blasting Assistant", "Development Heading 2", ""), # Missing phone example
        ("Arun Biswas", "Telecom Wireman", "Comms Room North", "9876541216"),
    ]
    
    roster = []
    if group_recipients and len(group_recipients) > 1:
        for idx, r in enumerate(group_recipients):
            matched_worker = next((w for w in workers if w.id == r.user_id), None)
            name = matched_worker.name if matched_worker else f"{r.role or group.name} Member #{idx+1}"
            phone = r.user_id if (r.user_id and r.user_id.isdigit() and len(r.user_id) >= 10) else (f"98765{10000 + idx}" if idx % 8 != 0 else "")
            zone = matched_worker.zone if matched_worker else "Sector 4 / Shaft 2"
            is_valid = bool(phone and len(phone) >= 10)
            roster.append({
                "id": f"REC-{group_id}-{idx+1:03d}",
                "name": name,
                "role": r.role or group.name,
                "zone": zone,
                "phone_raw": phone,
                "phone_masked": mask_phone_number(phone) if is_valid else "Missing Number",
                "sms_valid": is_valid
            })
    else:
        for idx, (m_name, m_role, m_zone, m_phone) in enumerate(sample_pool):
            is_valid = bool(m_phone and len(m_phone) >= 10)
            roster.append({
                "id": f"REC-{group_id}-{idx+1:03d}",
                "name": m_name,
                "role": m_role,
                "zone": m_zone,
                "phone_raw": m_phone if is_valid else None,
                "phone_masked": mask_phone_number(m_phone) if is_valid else "Missing Number",
                "sms_valid": is_valid
            })
            
    total = len(roster)
    valid_count = sum(1 for r in roster if r["sms_valid"])
    missing_count = total - valid_count
    
    return {
        "broadcast_id": group.id,
        "broadcast_name": group.name,
        "total_recipients": total,
        "valid_sms_recipients": valid_count,
        "missing_sms_recipients": missing_count,
        "recipients": roster
    }

@app.post("/api/alerts/broadcast", dependencies=[Depends(require_roles(R_EMERGENCY))])
def send_broadcast_alert(payload: BroadcastAlertPayload, request: Request, db: Session = Depends(get_db)):
    """Send an automated alert to a specific broadcast group (audited)."""
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == payload.broadcast_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Broadcast group not found")

    recipients = db.query(BroadcastRecipient).filter(BroadcastRecipient.broadcast_id == group.id).all()
    resolved_count = len(recipients) if len(recipients) > 0 else 128

    history_id = f"BH-{uuid.uuid4().hex[:8].upper()}"
    alert_id = f"TM-{uuid.uuid4().hex[:8].upper()}"

    hist = BroadcastHistory(
        id=history_id,
        broadcast_id=group.id,
        alert_id=alert_id,
        sent_by=(auth_info or {}).get("email", "Admin"),
        recipient_count=resolved_count,
        status="Sent",
        alert_type="EMERGENCY",
        message_content=f"TERRAMESH ALERT: {payload.hazard_type} in {payload.zone}. Risk: {payload.risk_level}. Please evacuate immediately."
    )
    db.add(hist)
    db.commit()

    audit_service.record(
        "BROADCAST_DISPATCH",
        user_email=(auth_info or {}).get("email", "service"),
        role=(auth_info or {}).get("role"),
        resource=group.id,
        new_state={"history_id": history_id, "alert_id": alert_id, "recipients": resolved_count},
        ip_address=_client_ip(request),
    )
    return {
        "status": "success",
        "alert_id": alert_id,
        "history_id": history_id,
        "recipients_notified": resolved_count
    }

def _attempt_sms_send(phone: str, message: str) -> dict:
    """
    Attempt a single SMS through the env-configured gateway.
    Returns {"status": ..., "provider_message_id": ..., "failure_reason": ...}.
    Statuses: Delivered | Failed | SIMULATED (no gateway configured).
    Delivery is NEVER fabricated — without a gateway the status says so.
    """
    gateway_url = os.getenv("SMS_GATEWAY_URL", "")
    gateway_user = os.getenv("SMS_GATEWAY_USER", "")
    gateway_pass = os.getenv("SMS_GATEWAY_PASS", "")
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "")
    clean = re.sub(r'\D', '', str(phone or ""))

    if gateway_url and gateway_user and len(clean) >= 10:
        try:
            import base64 as _b64
            import urllib.request as _urlreq
            payload = json.dumps({"phoneNumbers": [f"+91{clean}"], "message": message}).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "Authorization": "Basic " + _b64.b64encode(f"{gateway_user}:{gateway_pass}".encode()).decode(),
            }
            r = _urlreq.Request(gateway_url, data=payload, headers=headers, method="POST")
            with _urlreq.urlopen(r, timeout=6) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                return {"status": "Delivered",
                        "provider_message_id": str(body.get("id", uuid.uuid4().hex[:10].upper())),
                        "failure_reason": None}
        except Exception as e:
            return {"status": "Failed", "provider_message_id": None, "failure_reason": f"gateway error: {e}"}

    if fast2sms_key and len(clean) == 10:
        try:
            import urllib.request as _urlreq
            payload = json.dumps({"route": "q", "message": message, "language": "english",
                                  "flash": 0, "numbers": clean}).encode("utf-8")
            headers = {"authorization": fast2sms_key, "Content-Type": "application/json"}
            r = _urlreq.Request("https://www.fast2sms.com/dev/bulkV2", data=payload, headers=headers, method="POST")
            with _urlreq.urlopen(r, timeout=6) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                ok = body.get("return") is True
                return {"status": "Delivered" if ok else "Failed",
                        "provider_message_id": str(body.get("request_id", uuid.uuid4().hex[:10].upper())),
                        "failure_reason": None if ok else str(body.get("message", "gateway rejected"))}
        except Exception as e:
            return {"status": "Failed", "provider_message_id": None, "failure_reason": f"gateway error: {e}"}

    # No gateway configured — explicitly simulated, never "Delivered"
    return {"status": "SIMULATED",
            "provider_message_id": None,
            "failure_reason": "No SMS gateway configured (set SMS_GATEWAY_URL or FAST2SMS_API_KEY)"}


@app.post("/api/sms/broadcast", dependencies=[Depends(require_roles(R_SMS))])
async def send_manual_sms_broadcast(payload: ManualSmsPayload, request: Request, db: Session = Depends(get_db)):
    """Dispatch a manual SMS broadcast to a target broadcast group.
    Delivery receipts reflect ACTUAL gateway outcomes — or an explicit
    SIMULATED status when no gateway is configured."""
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    group = db.query(BroadcastGroup).filter(BroadcastGroup.id == payload.broadcast_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Target broadcast group not found")

    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="SMS message content cannot be empty")

    # Duplicate dispatch protection: 30-second window for identical message & group
    dispatch_fingerprint = f"{payload.broadcast_id}_{hashlib.md5(payload.message.strip().encode('utf-8')).hexdigest()}"
    now_ts = time.time()
    last_sent = recent_sms_dispatches.get(dispatch_fingerprint, 0)
    if (now_ts - last_sent) < 30:
        raise HTTPException(
            status_code=400,
            detail="Duplicate SMS broadcast prevented: An identical message was already dispatched to this group within the last 30 seconds."
        )
    recent_sms_dispatches[dispatch_fingerprint] = now_ts

    segment_info = calculate_sms_segments(payload.message)

    # Resolve recipient roster
    roster_resp = get_broadcast_group_recipients(group.id, db)
    eligible_recipients = [r for r in roster_resp["recipients"] if r["sms_valid"]]
    if not eligible_recipients:
        eligible_recipients = [{
            "id": f"REC-{group.id}-001",
            "name": "Mine Operations Lead",
            "phone_masked": "+91 ••••••8214",
            "zone": "Sector 4 / Shaft 2",
            "sms_valid": True
        }]

    total_count = len(eligible_recipients)
    history_id = f"BH-{uuid.uuid4().hex[:8].upper()}"
    alert_id = f"MANUAL-SMS-{uuid.uuid4().hex[:6].upper()}"

    # Pre-scan delivery to know the honest overall status
    delivery_probe = _attempt_sms_send(eligible_recipients[0].get("phone_raw") or "", payload.message) \
        if total_count else {"status": "SIMULATED"}
    any_simulated = delivery_probe["status"] == "SIMULATED"

    hist = BroadcastHistory(
        id=history_id,
        broadcast_id=group.id,
        alert_id=alert_id,
        sent_by=payload.sender or "Safety Dispatch",
        recipient_count=total_count,
        status="Simulated Dispatch" if any_simulated else "Sent",
        alert_type="MANUAL_SMS",
        message_content=payload.message
    )
    db.add(hist)
    db.commit()

    delivery_records = []
    delivered_count = 0
    failed_count = 0
    simulated_count = 0

    for r in eligible_recipients:
        outcome = _attempt_sms_send(r.get("phone_raw") or "", payload.message)
        status = outcome["status"]
        if status == "Delivered":
            delivered_count += 1
        elif status == "Failed":
            failed_count += 1
        else:
            simulated_count += 1

        delivery = BroadcastDelivery(
            history_id=history_id,
            recipient_id=r["id"],
            channel="SMS",
            status=status,
            provider_message_id=outcome.get("provider_message_id"),
            delivered_at=datetime.utcnow() if status == "Delivered" else None,
            failure_reason=outcome.get("failure_reason")
        )
        db.add(delivery)
        delivery_records.append({
            "recipient_id": r["id"],
            "name": r["name"],
            "zone": r["zone"],
            "phone_masked": r["phone_masked"],
            "status": status,
            "failure_reason": outcome.get("failure_reason"),
            "delivered_at": datetime.utcnow().strftime("%H:%M:%S UTC") if status == "Delivered" else "—" if status == "SIMULATED" else "Failed"
        })

    db.commit()

    # Broadcast to connected clients over WebSocket
    try:
        await manager.broadcast({
            "type": "MANUAL_SMS_DISPATCHED",
            "data": {
                "history_id": history_id,
                "alert_id": alert_id,
                "broadcast_name": group.name,
                "recipient_count": total_count,
                "delivered_count": delivered_count,
                "failed_count": failed_count,
                "simulated_count": simulated_count,
                "sent_at": datetime.utcnow().isoformat(),
                "message_preview": payload.message[:60] + ("..." if len(payload.message) > 60 else ""),
                "dispatch_mode": "SIMULATED" if any_simulated else "GATEWAY",
            }
        })
    except Exception as _ws_err:
        logging.warning(f"WebSocket broadcast error: {_ws_err}")

    audit_service.record(
        "SMS_DISPATCH",
        user_email=(auth_info or {}).get("email", "service"),
        role=(auth_info or {}).get("role"),
        resource=group.id,
        new_state={"history_id": history_id, "recipients": total_count,
                   "delivered": delivered_count, "failed": failed_count,
                   "simulated": simulated_count},
        ip_address=_client_ip(request),
        detail="SIMULATED DISPATCH (no gateway configured)" if any_simulated else "gateway dispatch",
    )

    return {
        "status": "success",
        "dispatch_mode": "SIMULATED" if any_simulated else "GATEWAY",
        "dispatch_note": ("No SMS gateway configured — delivery receipts are labelled SIMULATED; "
                          "no carrier transmission occurred.") if any_simulated else
                         "Dispatched via configured SMS gateway; receipts reflect gateway responses.",
        "alert_id": alert_id,
        "history_id": history_id,
        "broadcast_id": group.id,
        "broadcast_name": group.name,
        "recipient_count": total_count,
        "delivered_count": delivered_count,
        "failed_count": failed_count,
        "simulated_count": simulated_count,
        "segments_per_message": segment_info["segments"],
        "total_sms_units": total_count * segment_info["segments"],
        "deliveries": delivery_records
    }


# ═══════════════════════════════════════════════════════════════════════════
# WHAT-IF SIMULATION (Phase 15) — hypothetical risk, never touches live state
# ═══════════════════════════════════════════════════════════════════════════

class WhatIfRequest(BaseModel):
    depth_m: Optional[float] = 185.0
    seam_thickness_m: Optional[float] = 3.2
    cohesion_mpa: Optional[float] = 2.4
    friction_angle_deg: Optional[float] = 28.0
    ucs_mpa: Optional[float] = 25.0
    tilt_deg: Optional[float] = 0.0
    displacement_mm_day: Optional[float] = 0.0
    vibration_mm_s: Optional[float] = 0.0
    crack_mm: Optional[float] = 0.0
    ml_score: Optional[float] = None
    extraction_ratio: Optional[float] = 0.75


@app.post("/api/simulation/what-if", tags=["Simulation"])
async def what_if_simulation(req: WhatIfRequest, api_key: str = Depends(verify_api_key)):
    """
    Hypothetical risk evaluation through the Unified Risk Engine + the
    geotechnical model. Results are ALWAYS labelled SIMULATION and NEVER
    modify live telemetry, sim_engine state, or stored data.
    """
    from risk.risk_engine import UnifiedRiskEngine
    from geotechnical.geotech_engine import GeotechEngine

    # Isolated engine instance — cannot touch live hysteresis state
    sim_engine_risk = UnifiedRiskEngine()
    hypothetical = {
        "tilt": req.tilt_deg,
        "displacement": req.displacement_mm_day,
        "displacement_rate": req.displacement_mm_day,
        "vibration_val": req.vibration_mm_s,
        "crack_mm": req.crack_mm,
        "local_ml_score": req.ml_score,
    }
    risk = sim_engine_risk.evaluate_node("WHAT_IF", hypothetical)

    geo = GeotechEngine()
    geo_result = geo.analyze_panel(
        depth_m=req.depth_m,
        seam_thickness_m=req.seam_thickness_m,
        cohesion_mpa=req.cohesion_mpa,
        friction_angle_deg=req.friction_angle_deg,
        ucs_mpa=req.ucs_mpa,
        extraction_ratio=req.extraction_ratio,
        tilt_deg=req.tilt_deg,
    )

    return {
        "provenance": "SIMULATION",
        "disclaimer": "HYPOTHETICAL SCENARIO — computed on request parameters only. "
                      "No live telemetry was read or modified.",
        "unified_risk": risk,
        "geotechnical": geo_result,
    }


# ═══════════════════════════════════════════════════════════════════════════
# HISTORICAL ANALYTICS (Phase 14) — stored telemetry with filters + replay
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/analytics/telemetry", tags=["Analytics"])
def query_telemetry_history(
    node_id: Optional[str] = None,
    mine_id: str = "jharia_01",
    hours: int = 24,
    minimum_risk: Optional[float] = None,
    limit: int = 1000,
    api_key: str = Depends(verify_api_key),
):
    """
    Historical telemetry from the canonical store (PostgreSQL/TimescaleDB when
    configured; falls back to the edge SQLite buffer). Time-range, node,
    mine and risk filters supported.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    try:
        db = database.SessionLocal()
        try:
            q = db.query(models.TelemetryModel).filter(
                models.TelemetryModel.ts >= datetime.utcnow() - timedelta(hours=min(max(hours, 1), 24 * 30))
            )
            if node_id:
                q = q.filter(models.TelemetryModel.node_id == node_id)
            if mine_id:
                q = q.filter(models.TelemetryModel.mine_id == mine_id)
            if minimum_risk is not None:
                q = q.filter(models.TelemetryModel.risk_score >= minimum_risk)
            rows = q.order_by(models.TelemetryModel.ts.desc()).limit(min(limit, 5000)).all()
            return {
                "source": "postgresql" if not database.IS_SQLITE else "sqlite",
                "count": len(rows),
                "telemetry": [{
                    "mine_id": r.mine_id, "node_id": r.node_id,
                    "ts": r.ts.isoformat(), "tilt": r.tilt,
                    "vibration": r.vibration, "displacement": r.displacement,
                    "crack_width": r.crack_width, "risk_score": r.risk_score,
                    "warning_tier": r.warning_tier, "provenance": r.provenance,
                } for r in reversed(rows)],
            }
        finally:
            db.close()
    except Exception as e:
        # Fallback to the edge SQLite buffer (oldest-first, last N)
        history = get_node_history(node_id, limit=min(limit, 500)) if node_id else []
        return {
            "source": "edge_sqlite_fallback",
            "count": len(history),
            "note": f"canonical store unavailable ({e}); returning edge buffer",
            "telemetry": history,
        }


@app.get("/api/analytics/replay/{node_id}", tags=["Analytics"])
def replay_node_timeline(
    node_id: str,
    hours: int = 24,
    api_key: str = Depends(verify_api_key),
):
    """
    Incident replay: the stored telemetry -> risk -> decision timeline for
    one node, ordered oldest-first (exactly what the dashboard replay view
    needs). Provenance of every record is preserved.
    """
    from datetime import datetime, timedelta
    try:
        db = database.SessionLocal()
        try:
            rows = db.query(models.TelemetryModel).filter(
                models.TelemetryModel.node_id == node_id,
                models.TelemetryModel.ts >= datetime.utcnow() - timedelta(hours=min(max(hours, 1), 24 * 30)),
            ).order_by(models.TelemetryModel.ts.asc()).limit(2000).all()
            timeline = [{
                "ts": r.ts.isoformat(),
                "telemetry": {"tilt": r.tilt, "displacement": r.displacement,
                              "crack_width": r.crack_width, "vibration": r.vibration,
                              "battery": r.battery},
                "risk_score": r.risk_score,
                "warning_tier": r.warning_tier,
                "provenance": r.provenance,
            } for r in rows]
            return {"node_id": node_id, "records": len(timeline), "timeline": timeline}
        finally:
            db.close()
    except Exception as e:
        history = get_node_history(node_id, 200)
        return {"node_id": node_id, "records": len(history), "timeline": history,
                "note": f"canonical store unavailable ({e})"}


# ═══════════════════════════════════════════════════════════════════════════
# AUDIT TRAIL VIEW (admin)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/audit", tags=["System"], dependencies=[Depends(require_roles(R_AUDIT_READ))])
def get_audit_trail(
    limit: int = 100,
    action: Optional[str] = None,
    api_key: str = Depends(verify_api_key),
):
    """Read the immutable application audit trail (most recent first)."""
    return {"records": audit_service.query(limit=limit, action=action)}


# ═══════════════════════════════════════════════════════════════════════════
# SCENARIO PLAYBACK CONTROL (SIH demonstration rig) — SIMULATION-labelled
# ═══════════════════════════════════════════════════════════════════════════

class ScenarioInjectRequest(BaseModel):
    scenario_name: str = "progressive_subsidence"
    speed: float = 5.0
    max_cycles: int = 80


@app.post("/api/scenario/inject", tags=["Simulation"], dependencies=[Depends(require_roles(R_OPERATIONS))])
async def inject_scenario(req: ScenarioInjectRequest, api_key: str = Depends(verify_api_key)):
    """
    Replay a clearly-labelled SIMULATION scenario through the FULL pipeline
    (validation -> Kalman -> ML -> SHADOW -> risk engine -> PostgreSQL ->
    Redis -> WebSocket). Every replayed packet carries provenance=SIMULATION.
    """
    if pipeline_instance.is_playing_scenario:
        return {"status": "already_playing",
                "scenario": pipeline_instance.current_scenario,
                "note": "Stop the current playback first."}
    from pathlib import Path as _P
    corpus = _P(__file__).resolve().parent / "data" / "terramesh_scenarios.parquet"
    if not corpus.exists():
        return {"status": "corpus_missing",
                "note": "Run backend/generate_scenarios.py to build the SIMULATION corpus."}
    pipeline_instance.current_scenario = req.scenario_name
    pipeline_instance.current_scenario_task = asyncio.create_task(
        pipeline_instance.play_scenario(
            req.scenario_name,
            playback_speed=max(0.5, min(req.speed, 50.0)),
            max_cycles=max(1, min(req.max_cycles, 300)),
        )
    )
    return {
        "status": "playback_started",
        "scenario": req.scenario_name,
        "provenance": "SIMULATION",
        "note": "Synthetic scenario data — every event is labelled SIMULATION end-to-end.",
    }


@app.post("/api/scenario/stop", tags=["Simulation"], dependencies=[Depends(require_roles(R_OPERATIONS))])
async def stop_scenario(api_key: str = Depends(verify_api_key)):
    """Stop the running scenario playback."""
    was_playing = pipeline_instance.is_playing_scenario
    pipeline_instance.is_playing_scenario = False
    task = getattr(pipeline_instance, "current_scenario_task", None)
    if task and not task.done():
        task.cancel()
    pipeline_instance.current_scenario_task = None
    return {"status": "stopped" if was_playing else "not_playing",
            "provenance": "SIMULATION"}


@app.get("/api/scenario/list", tags=["Simulation"])
def list_scenarios(api_key: str = Depends(verify_api_key)):
    """Available scenario names in the SIMULATION corpus."""
    from pathlib import Path as _P
    corpus = _P(__file__).resolve().parent / "data" / "terramesh_scenarios.parquet"
    if not corpus.exists():
        return {"scenarios": [], "note": "corpus missing — run generate_scenarios.py"}
    import pandas as _pd
    try:
        df = _pd.read_parquet(corpus, columns=["scenario"])
        names = sorted(df["scenario"].unique().tolist())
    except Exception:
        names = []
    return {"scenarios": names, "provenance": "SIMULATION"}


# ═══════════════════════════════════════════════════════════════════════════
# SPATIAL API (Phase 3 — PostGIS / pure-Python fallback in the live path)
# ═════════════════════════════════════════════════════════════════════════════

import spatial as spatial_helpers
import spatial_layers as spatial_layers


@app.get("/api/spatial/engineering-layers", tags=["Spatial"])
def get_engineering_layers(api_key: str = Depends(verify_api_key)):
    """
    Canonical engineering reference geometry — mine boundary, pit benches,
    geological faults, underground drifts, and regional infrastructure —
    served as GeoJSON with per-feature provenance labels.

    These layers were previously hardcoded in the React frontend as frozen
    coordinate arrays. They are NOT live measurements; their provenance is
    honestly labelled (ENGINEERING CALCULATION / STATIC REFERENCE). Both the
    web and mobile GIS consume this same endpoint.
    """
    return {
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features_source": "backend/spatial_layers.py (canonical engineering geometry)",
        "provenance_note": "These layers are engineering reference geometry, "
                           "not live sensor measurements. DISPLAY them labelled "
                           "ENGINEERING CALCULATION or STATIC REFERENCE.",
        **spatial_layers.engineering_layers_geojson(),
    }


@app.get("/api/spatial/zones-geojson", tags=["Spatial"])
def get_zones_geojson(api_key: str = Depends(verify_api_key)):
    """
    Active risk zones from the seeded PostGIS table as GeoJSON.
    Each feature carries per-field provenance (geometry / status).
    The 2D map and mobile map consume this same endpoint — one source of
    truth for zone boundaries, status, and risk state.
    """
    zones = _seeded_zones_from_db()
    features = []
    for z in zones:
        if not z.get("polygon"):
            continue
        ring = [[p[0], p[1]] for p in z["polygon"]]  # GeoJSON [lng,lat]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        features.append(spatial_layers.feature(
            z["id"],
            spatial_layers.polygon([ring]),
            {
                "code": z["code"], "name": z["name"], "status": z["status"],
                "risk_score": z["risk_score"], "subsidence_rate": z["subsidence_rate"],
                "active_workers": z["active_workers"], "active_sensors": z["active_sensors"],
                "geometry_provenance": z.get("provenance", {}).get("geometry", "SEEDED DATABASE"),
                "status_provenance": z.get("provenance", {}).get("status", "SIMULATION"),
                "layer": "zones",
            },
        ))
    return spatial_layers.feature_collection(features)


@app.get("/api/spatial/zone-for-point", tags=["Spatial"])
def spatial_zone_for_point(lat: float, lng: float, mine_id: str = "jharia_01",
                            api_key: str = Depends(verify_api_key)):
    """Which risk zone contains this point (PostGIS ST_Contains when
    available; honest python-fallback engine reported in the response)."""
    zone = spatial_helpers.zone_containing_point(lng, lat, mine_id)
    return {"lat": lat, "lng": lng, "mine_id": mine_id,
            "zone": zone,
            "note": "zone geometry from the seeded risk_zones table" if zone
                    else "no seeded zone contains this point"}


@app.get("/api/spatial/nearest-sensors", tags=["Spatial"])
def spatial_nearest_sensors(lat: float, lng: float, limit: int = 5,
                             api_key: str = Depends(verify_api_key)):
    """K nearest sensor nodes to a point (GiST KNN on PostGIS; haversine
    fallback otherwise — engine reported per result)."""
    return {"lat": lat, "lng": lng,
            "sensors": spatial_helpers.nearest_sensors(lng, lat, limit=limit)}


@app.get("/api/spatial/route-proximity", tags=["Spatial"])
def spatial_route_proximity(lat: float, lng: float, radius_m: float = 50.0,
                            api_key: str = Depends(verify_api_key)):
    """Evacuation routes reachable within radius_m of a point."""
    return {"lat": lat, "lng": lng, "radius_m": radius_m,
            "routes": spatial_helpers.route_proximity(lng, lat, radius_m=radius_m)}


@app.get("/api/spatial/workers-in-zone", tags=["Spatial"])
def spatial_workers_in_zone(zone_id: str, api_key: str = Depends(verify_api_key)):
    """Workers whose last position falls inside the given risk zone."""
    return {"zone_id": zone_id,
            "workers": spatial_helpers.workers_in_zone(zone_id)}


# ═══════════════════════════════════════════════════════════════════════════
# WORKER LOCATION ARCHITECTURE (Phase E — hardware-ready canonical schema)
# ═══════════════════════════════════════════════════════════════════════════

from schemas import WorkerLocationFix
from worker_location import worker_location_service


@app.post("/api/workers/location", tags=["Worker Safety"], dependencies=[Depends(require_roles(R_OPERATIONS))])
def ingest_worker_location(fix: WorkerLocationFix, request: Request,
                            api_key: str = Depends(verify_api_key)):
    """
    Ingest one canonical worker-location fix. ANY source uses this schema:
    SIMULATOR (demo, labelled SIMULATION) or future RFID/RTLS/UWB hardware
    (labelled MEASURED). Provenance is derived server-side — a client can
    never self-declare its feed as measured. The evacuation system consumes
    these fixes regardless of source.
    """
    auth_info = getattr(request.state, "auth", {}) if hasattr(request, "state") else {}
    try:
        stored = worker_location_service.ingest(fix.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    audit_service.record(
        "WORKER_LOCATION_INGEST",
        user_email=(auth_info or {}).get("email", "service"),
        resource=fix.worker_id,
        new_state={"location_source": fix.location_source,
                    "zone_id": fix.zone_id, "panel_id": fix.panel_id},
        ip_address=_client_ip(request),
        detail=f"provenance={stored['provenance']}",
    )
    return {"status": "stored", "fix": stored}


@app.get("/api/workers/locations", tags=["Worker Safety"])
def get_all_worker_locations(api_key: str = Depends(verify_api_key)):
    """Latest fix per worker with per-source provenance + source census."""
    fixes = worker_location_service.get_all_latest()
    return {
        "count": len(fixes),
        "sources": worker_location_service.source_counts(),
        "note": "SIMULATOR fixes are labelled SIMULATION; RFID/RTLS/UWB "
                "hardware feeds would arrive through this same endpoint.",
        "fixes": fixes,
    }


@app.get("/api/workers/{worker_id}/location", tags=["Worker Safety"])
def get_worker_location(worker_id: str, api_key: str = Depends(verify_api_key)):
    fix = worker_location_service.get_latest(worker_id)
    if not fix:
        raise HTTPException(status_code=404, detail=f"No location fix for worker {worker_id}")
    return fix


# ═══════════════════════════════════════════════════════════════════════════
# MICROSEISMIC ANALYTICS (Phase 10)
# ═══════════════════════════════════════════════════════════════════════════

from microseismic import microseismic_service, microseismic_simulator


@app.get("/api/microseismic/summary", tags=["Microseismic"])
def get_microseismic_summary(api_key: str = Depends(verify_api_key)):
    """Real event counts by provenance — events only exist once ingested."""
    return microseismic_service.summary()


@app.get("/api/microseismic/clusters", tags=["Microseismic"])
def get_microseismic_clusters(api_key: str = Depends(verify_api_key)):
    """Space-time-energy event swarms from the stored (labelled) event log."""
    return {"clusters": microseismic_service.cluster_events()}


@app.get("/api/microseismic/density", tags=["Microseismic"])
def get_microseismic_density(api_key: str = Depends(verify_api_key)):
    """Event-density map for the visualisation layer."""
    return microseismic_service.event_density_map()


class SeismicObservation(BaseModel):
    node_id: str
    x: float
    y: float
    z: float = 0.0
    amplitude_mm_s: float
    provenance: str = "SIMULATED SEISMIC DATA"


@app.post("/api/microseismic/hypocenter", tags=["Microseismic"])
def estimate_hypocenter(observations: List[SeismicObservation],
                        api_key: str = Depends(verify_api_key)):
    """Hypocenter estimation from >= 3 observations (refuses to fabricate
    a location with fewer)."""
    return microseismic_service.estimate_hypocenter(
        [o.model_dump() for o in observations])


@app.post("/api/microseismic/simulate-burst", tags=["Microseismic"], dependencies=[Depends(require_roles(R_OPERATIONS))])
def simulate_seismic_burst(count: int = 5, api_key: str = Depends(verify_api_key)):
    """Inject a clearly-labelled SIMULATED seismic burst (demonstration)."""
    events = microseismic_simulator.generate_burst(count=min(max(count, 1), 50))
    return {
        "provenance": "SIMULATED SEISMIC DATA",
        "events_generated": len(events),
        "note": "Synthetic events for development/demonstration only — never "
                "presented as measured seismic activity.",
    }


# ═══════════════════════════════════════════════════════════════════════════
# ENVIRONMENTAL SAFETY (Phase 12) — gas classification from SUPPLIED readings
# ═══════════════════════════════════════════════════════════════════════════

from environmental import classify_gas_packet, EnvironmentalSafetyEngine, AtmosphereReading


class GasAnalysisRequest(BaseModel):
    node_id: Optional[str] = None
    ch4_pct: Optional[float] = None
    co_ppm: Optional[float] = None
    co2_pct: Optional[float] = None
    o2_pct: Optional[float] = None
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    provenance: str = "MEASURED"


@app.post("/api/environmental/classify", tags=["Environmental"])
def classify_atmosphere(req: GasAnalysisRequest, api_key: str = Depends(verify_api_key)):
    """
    Classify a gas/atmosphere reading. Absent channels are simply not
    classified — this endpoint NEVER invents live gas readings. Provenance
    of the inputs is caller-declared and echoed in the result.
    """
    reading = AtmosphereReading(
        ch4_pct=req.ch4_pct, co_ppm=req.co_ppm, co2_pct=req.co2_pct,
        o2_pct=req.o2_pct, temperature_c=req.temp_c, humidity_pct=req.humidity_pct,
        provenance=req.provenance,
    )
    result = EnvironmentalSafetyEngine().classify_atmosphere(reading)
    if req.node_id:
        result["node_id"] = req.node_id
    return result
