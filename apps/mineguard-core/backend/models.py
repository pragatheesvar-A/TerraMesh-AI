from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, Index
from datetime import datetime
from database import Base

class FCMTokenModel(Base):
    __tablename__ = "fcm_tokens"

    worker_id = Column(String, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    platform = Column(String, default="android")
    zone = Column(String, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

class MineModel(Base):
    __tablename__ = "mines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    active = Column(Boolean, default=True)

class PanelModel(Base):
    __tablename__ = "panels"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), index=True)
    name = Column(String)
    status = Column(String, default="ACTIVE")
    workers_present = Column(Integer, default=0)


class SensorModel(Base):
    __tablename__ = "sensors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    zone = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    tilt = Column(Float, default=0.0)
    displacement = Column(Float, default=0.0)
    crack_width = Column(Float, default=0.0)
    vibration = Column(String, default="LOW")
    battery = Column(Integer, default=100)
    lora_signal = Column(Integer, default=95)
    ai_risk_score = Column(Integer, default=15)
    status = Column(String, default="SAFE")
    last_update = Column(DateTime, default=datetime.utcnow)

class WorkerModel(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, default="jharia_01", index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)  # display_name
    role = Column(String, nullable=True)
    zone = Column(String, index=True)
    panel_id = Column(String, nullable=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    elevation_m = Column(Float, nullable=True)
    accuracy_m = Column(Float, nullable=True)
    
    status = Column(String, default="SAFE")
    heart_rate = Column(Integer, default=75)
    spo2 = Column(Integer, default=98)
    depth_m = Column(Integer, default=120)
    last_update = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, nullable=True)
    
    location_source = Column(String, default="SIMULATOR")
    data_state = Column(String, default="SIMULATION")
    location_quality = Column(String, default="UNKNOWN")

class GeofenceModel(Base):
    __tablename__ = "geofences"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, index=True)
    name = Column(String)
    geometry = Column(Text)  # GeoJSON
    type = Column(String)  # DANGER, RESTRICTED, EXCLUSION, SAFE, ASSEMBLY, EVACUATION_CORRIDOR
    severity = Column(String)
    source = Column(String)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AssemblyPointModel(Base):
    __tablename__ = "assembly_points"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, index=True)
    name = Column(String)
    geometry = Column(Text)  # GeoJSON
    status = Column(String, default="OPEN")  # OPEN, BLOCKED, FULL, UNKNOWN
    capacity = Column(Integer, nullable=True)
    source = Column(String)

class MusterEventModel(Base):
    __tablename__ = "muster_events"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True)
    worker_id = Column(String, ForeignKey("workers.id"), index=True)
    assembly_point_id = Column(String, ForeignKey("assembly_points.id"), index=True)
    status = Column(String)  # ACCOUNTED, MISSING, UNKNOWN, EXEMPT, NOT_EXPECTED
    method = Column(String)  # MANUAL, RFID, UWB, MOBILE, RTLS, SIMULATION
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(String)
    source = Column(String)
    reason = Column(String, nullable=True)

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, default="jharia_01", index=True)
    type = Column(String, default="GENERAL")
    severity = Column(String, index=True) # INFO, ADVISORY, WARNING, CRITICAL, EVACUATE
    source = Column(String) # RISK_ENGINE, WORKER_SAFETY, ENVIRONMENTAL, GEOTECHNICAL, OPERATOR, SYSTEM
    status = Column(String, default="ACTIVE") # CREATED, ACTIVE, RESOLVED, CANCELLED
    
    zone_id = Column(String, nullable=True, index=True)
    panel_id = Column(String, nullable=True, index=True)
    worker_id = Column(String, nullable=True, index=True)
    
    title = Column(String)
    description = Column(String) # Message
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    provenance = Column(String, default="SYSTEM")
    
    acknowledged = Column(Boolean, default=False)
    timestamp = Column(String) # Legacy timestamp, keep for backwards compatibility

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    alert_id = Column(String, ForeignKey("alerts.id"), index=True)
    
    recipient_type = Column(String)
    recipient_id = Column(String, index=True)
    
    channel = Column(String) # LOCAL, FCM, SMS, EMAIL
    status = Column(String, default="QUEUED") # QUEUED, SENDING, SENT, DELIVERED, FAILED, RETRYING, EXPIRED, CANCELLED, BLOCKED
    
    attempt_count = Column(Integer, default=0)
    
    provider = Column(String, nullable=True)
    provider_message_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    error_code = Column(String, nullable=True)

class AcknowledgementModel(Base):
    __tablename__ = "acknowledgements"
    
    id = Column(String, primary_key=True, index=True)
    notification_id = Column(String, ForeignKey("notifications.id"), index=True)
    alert_id = Column(String, ForeignKey("alerts.id"), index=True)
    actor_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String)
    device_session = Column(String, nullable=True)

class TelemetryLogModel(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    tilt = Column(Float)
    displacement = Column(Float)
    crack_width = Column(Float)
    vibration = Column(String)
    ai_risk_score = Column(Integer)

class TelemetryModel(Base):
    """
    Canonical time-series telemetry store (TimescaleDB hypertable target).

    Written by the MQTT/edge ingestion pipeline after validation, dedup,
    Kalman filtering and risk scoring. Designed for:

      SELECT create_hypertable('telemetry', 'ts', if_not_exists => TRUE);

    NOTE: the composite PRIMARY KEY (node_id, ts) is TimescaleDB-safe —
    every unique constraint includes the partitioning column ('ts') — and
    it enforces one row per node per timestamp (guaranteed upstream by
    timestamp normalization + dedup). Every row carries an explicit
    `provenance` label (MEASURED / SIMULATED / OPERATOR ACTION ...).
    PostGIS geometry columns are added by migration
    f3c9d2e7a4b1 on PostgreSQL only (never on SQLite).
    """
    __tablename__ = "telemetry"

    # Composite primary key (node_id, ts) — TimescaleDB-safe because every
    # unique constraint must include the partitioning column ('ts'), and this
    # one does. It also enforces one row per node per timestamp, which the
    # ingestion pipeline guarantees via timestamp normalization + dedup.
    mine_id = Column(String, nullable=False, default="jharia_01", index=True)
    node_id = Column(String, nullable=False, primary_key=True, index=True)
    ts = Column(DateTime, nullable=False, primary_key=True, default=datetime.utcnow, index=True)
    tilt = Column(Float)
    vibration = Column(Float)
    displacement = Column(Float)
    crack_width = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    battery = Column(Float)
    signal_strength = Column(Float)
    risk_score = Column(Float)
    warning_tier = Column(String)
    provenance = Column(String, nullable=False, default="MEASURED")

    __table_args__ = (
        Index("ix_telemetry_node_ts", "node_id", "ts"),
    )

class AuditLogModel(Base):
    """
    Immutable-style application audit trail.

    Append-only by convention (no update/delete code paths). Records who did
    what, to which resource, with before/after state. Never stores
    credentials or raw secrets.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    user_email = Column(String, nullable=True, index=True)
    role = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    resource = Column(String, nullable=True)
    previous_state = Column(Text, nullable=True)   # JSON snapshot
    new_state = Column(Text, nullable=True)         # JSON snapshot
    ip_address = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)

class UserModel(Base):
    """
    Role-based user registry. Roles:
    ADMIN | CONTROL_ROOM_OPERATOR | SAFETY_OFFICER | ENGINEER | SUPERVISOR | VIEWER
    Passwords are stored as salted PBKDF2 hashes only — never plaintext.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="VIEWER")
    name = Column(String)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class ZoneModel(Base):
    """
    Mine risk zones. `polygon_json` holds a GeoJSON ring (EPSG:4326) on all
    backends; on PostgreSQL+PostGIS a materialized `geom` geometry(MultiPolygon,4326)
    column is added by migration 0002 and used for point-in-polygon /
    containment queries. WGS84 (EPSG:4326) is used everywhere.
    """
    __tablename__ = "risk_zones"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, nullable=False, default="jharia_01", index=True)
    code = Column(String, nullable=False, index=True)
    name = Column(String)
    status = Column(String, default="SAFE")
    risk_score = Column(Float, default=0.0)
    subsidence_rate = Column(Float, default=0.0)
    active_workers = Column(Integer, default=0)
    active_sensors = Column(Integer, default=0)
    polygon_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EvacuationRouteModel(Base):
    """
    Evacuation routes per zone. `waypoints_json` is a GeoJSON LineString
    (EPSG:4326). On PostgreSQL+PostGIS a `geom` geometry(LineString,4326)
    column is added by migration 0002 for proximity queries.
    """
    __tablename__ = "evacuation_routes"

    id = Column(String, primary_key=True, index=True)
    zone_id = Column(String, nullable=False, index=True)
    name = Column(String)
    status = Column(String, default="SAFE")   # SAFE | BLOCKED | CONGESTED
    eta_minutes = Column(Float, nullable=True)
    waypoints_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BroadcastGroup(Base):
    __tablename__ = "broadcasts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    status = Column(String, default="ACTIVE") # ACTIVE or ARCHIVED
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at = Column(DateTime, nullable=True)

class BroadcastRecipient(Base):
    __tablename__ = "broadcast_recipients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    broadcast_id = Column(String, index=True)
    user_id = Column(String, nullable=True) # Specific user ID
    role = Column(String, nullable=True) # Or role (e.g., 'Worker', 'Supervisor')
    created_at = Column(DateTime, default=datetime.utcnow)

class BroadcastChannel(Base):
    __tablename__ = "broadcast_channels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    broadcast_id = Column(String, index=True)
    sms_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)
    dashboard_enabled = Column(Boolean, default=True)

class BroadcastHistory(Base):
    __tablename__ = "broadcast_history"

    id = Column(String, primary_key=True, index=True)
    broadcast_id = Column(String, index=True)
    alert_id = Column(String, index=True)
    sent_by = Column(String)
    recipient_count = Column(Integer, default=0)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Sent")
    alert_type = Column(String, default="EMERGENCY") # EMERGENCY or MANUAL_SMS
    message_content = Column(Text, nullable=True)

class BroadcastDelivery(Base):
    __tablename__ = "broadcast_delivery"

    id = Column(Integer, primary_key=True, autoincrement=True)
    history_id = Column(String, index=True)
    recipient_id = Column(String, index=True)
    channel = Column(String) # SMS, Email, Dashboard
    status = Column(String, default="Pending") # Pending, Sent, Delivered, Failed, Acknowledged
    provider_message_id = Column(String, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    failure_reason = Column(String, nullable=True)


