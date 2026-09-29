from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SensorNodeSchema(BaseModel):
    id: str
    name: str
    zone: str
    lat: float
    lng: float
    tilt: float = Field(..., description="Tilt angle in degrees")
    displacement: float = Field(..., description="Displacement in mm")
    crack_width: float = Field(..., description="Crack width in mm")
    vibration: str = Field(..., description="LOW | MEDIUM | HIGH | CRITICAL")
    battery: int = Field(..., description="Battery percentage")
    lora_signal: int = Field(..., description="LoRa Signal percentage")
    ai_risk_score: int = Field(..., description="AI Risk Score 0-100")
    status: str = Field(..., description="SAFE | CAUTION | WARNING | CRITICAL")
    last_update: str
    confidence_pct: Optional[int] = Field(default=95, description="Model prediction confidence %")
    risk_label: Optional[str] = Field(default="0:NORMAL", description="NCB Risk label")
    anomaly_detected: Optional[bool] = Field(default=False, description="Isolation Forest anomaly flag")

class TelemetryIngestSchema(BaseModel):
    node_id: str = Field(..., example="NODE-017")
    tilt: Optional[float] = Field(default=0.0, description="Tilt in degrees")
    displacement: Optional[float] = Field(default=0.0, description="Displacement in mm")
    crack_width: Optional[float] = Field(default=0.0, description="Crack width in mm")
    vibration: Optional[str] = Field(default="LOW", description="LOW | MEDIUM | HIGH")
    ch4_pct: Optional[float] = Field(default=0.0, description="Methane %")
    battery: Optional[int] = Field(default=95, description="Battery percentage")
    rssi: Optional[int] = Field(default=-72, description="LoRa RSSI in dBm")
    zone: Optional[str] = Field(default="Zone B")
    temp_c: Optional[float] = Field(default=28.5, description="Ambient temperature °C")
    depth_m: Optional[float] = Field(default=185.0, description="Seam depth in meters")
    dom_freq_hz: Optional[float] = Field(default=8.5, description="Dominant vibration frequency")
    vib_peak_g: Optional[float] = Field(default=None, description="Peak vibration acceleration (g) — used by the blast-suppression layer")
    blast_flag: Optional[int] = Field(default=0, description="Manual blast indicator from the shift schedule (0/1)")

class WorkerSchema(BaseModel):
    id: str
    code: str
    name: str
    zone: str
    lat: float
    lng: float
    status: str = Field(..., description="SAFE | CAUTION | DANGER | OFFLINE")
    heart_rate: int
    spo2: int
    depth_m: int
    last_update: str

class ZoneSchema(BaseModel):
    id: str
    code: str
    name: str
    status: str = Field(..., description="SAFE | CAUTION | WARNING | CRITICAL")
    subsidence_rate: float
    active_workers: int
    active_sensors: int
    risk_score: int
    polygon: Optional[List[List[float]]] = None

class AlertSchema(BaseModel):
    id: str
    severity: str = Field(..., description="CRITICAL | WARNING | CAUTION | INFO")
    title: str
    description: str
    zone: str
    timestamp: str
    acknowledged: bool = False

class ExplainableFactors(BaseModel):
    tilt_change: int
    displacement_rate: int
    crack_widening: int
    vibration: int
    historical_trend: int

class AIRiskIntelligence(BaseModel):
    current_risk_score: int
    risk_level: str
    trend_percentage: int
    prediction: str
    factors: ExplainableFactors
    ai_confidence: int
    disclaimer: str

class EvacuationRoute(BaseModel):
    route_id: str
    name: str
    status: str  # SAFE | BLOCKED | CONGESTED
    color: str
    waypoints: List[List[float]]

class EvacuationStatus(BaseModel):
    target_zone: str
    zone_status: str
    route_a_status: str
    route_b_status: str
    workers_at_risk: int
    recommended_action: str
    routes: List[EvacuationRoute]
    flow_steps: List[Dict[str, Any]]
    # Honest personnel provenance: SIMULATOR for the demo roster; future
    # RFID/RTLS/UWB hardware feeds flow through /api/workers/location.
    personnel_location_source: Optional[str] = None
    personnel_provenance: Optional[str] = None

class InfrastructureItem(BaseModel):
    id: str
    category: str
    name: str
    distance_m: Optional[int] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    zone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    details: Optional[str] = None

class InfrastructureSummary(BaseModel):
    roads_at_risk: Optional[int] = None
    buildings_at_risk: Optional[int] = None
    agricultural_areas: Optional[int] = None
    forest_areas: Optional[int] = None
    total_structures: Optional[int] = None
    safe: Optional[int] = None
    critical: Optional[int] = None
    items: List[InfrastructureItem] = []

class SensorHealthCategory(BaseModel):
    name: str
    online: int
    total: int
    status: str

class SensorNetworkHealth(BaseModel):
    categories: List[SensorHealthCategory]
    lora_network_pct: int
    gateway_status: str
    battery_health_pct: int

class SystemStatusSchema(BaseModel):
    backend_api: str
    ai_engine: str
    database: str
    lora_gateway: str
    gis_service: str
    last_data_sync: str
    system_uptime: float

class OverviewKPIs(BaseModel):
    active_sensors_total: int
    active_sensors_online: int
    active_sensors_offline: int
    monitored_workers_total: int
    monitored_workers_safe: int
    monitored_workers_risk: int
    safe_zones_count: int
    safe_zones_status: str
    warning_zones_count: int
    warning_zones_delta: str
    critical_zones_count: int
    critical_zones_status: str

class DashboardOverview(BaseModel):
    kpis: OverviewKPIs
    risk_intelligence: AIRiskIntelligence
    sensor_health: SensorNetworkHealth
    evacuation: EvacuationStatus
    infrastructure: InfrastructureSummary
    system_status: SystemStatusSchema

# New ML Service Schemas
class MLPredictionResponse(BaseModel):
    node_id: Optional[str] = None
    risk_class: int
    risk_label: str
    status: str
    ai_risk_score: int
    confidence_pct: int
    class_probabilities: Dict[str, float]
    inference_mode: Optional[str] = None
    model_loaded: Optional[bool] = None
    anomaly_score: Optional[float] = None
    anomaly_threshold: Optional[float] = None
    provenance: Optional[str] = None
    anomaly_detected: bool
    is_blast_suppressed: bool
    sensor_health: Dict[str, Any]
    factors: Dict[str, int]
    explanation: str

class MLModelInfoResponse(BaseModel):
    """Honest model metadata. Metrics are OPTIONAL because they exist only
    when the artifacts' own training reports are present on disk — never
    fabricated. Metrics are measured on the SYNTHETIC training-corpus
    holdout, not field data."""
    name: str
    version: str
    trained_accuracy: Optional[float] = None
    macro_f1: Optional[float] = None
    weighted_f1: Optional[float] = None
    metrics_source: Optional[str] = None
    metrics_note: Optional[str] = None
    layers: List[str]
    is_loaded: bool
    xgboost_loaded: bool = False
    isolation_forest_loaded: bool = False
    inference_mode: str = "physics_fallback"

# Broadcast Management Schemas
class WorkerLocationFix(BaseModel):
    """Canonical worker-location fix — hardware-ready architecture.
    The evacuation system consumes this schema regardless of source;
    `location_source` + derived provenance keep simulated positions clearly
    separated from future RFID/RTLS/UWB hardware feeds."""
    worker_id: str
    timestamp: str = Field(..., description="ISO-8601 capture timestamp")
    x: Optional[float] = None            # local mine grid coordinates (m)
    y: Optional[float] = None
    z: Optional[float] = Field(default=None, description="Depth (m, negative underground)")
    lat: Optional[float] = None           # WGS84 (when GNSS/geographic fix exists)
    lng: Optional[float] = None
    panel_id: Optional[str] = None
    zone_id: Optional[str] = None
    location_source: str = Field(..., description="SIMULATOR | RFID | RTLS | UWB | OTHER")
    accuracy_m: Optional[float] = None
    battery: Optional[float] = None
    signal: Optional[float] = None
    status: Optional[str] = None         # SAFE | CAUTION | DANGER | OFFLINE
    provenance: Optional[str] = None     # derived server-side from location_source

class BroadcastChannelSchema(BaseModel):
    sms_enabled: bool = True
    email_enabled: bool = True
    dashboard_enabled: bool = True

class BroadcastRecipientSchema(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class BroadcastGroupCreate(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    channels: BroadcastChannelSchema
    recipients: List[BroadcastRecipientSchema]
    status: str = "ACTIVE"

class BroadcastGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    created_at: str
    channels: BroadcastChannelSchema
    recipient_count: int

class BroadcastAlertPayload(BaseModel):
    broadcast_id: str
    alert_type: str
    zone: str
    hazard_type: str
    risk_level: str
    detected_value: str
    threshold: str
    trend: str = "Stable"
    channels: BroadcastChannelSchema
    languages: List[str] = ["English"]

class ManualSmsPayload(BaseModel):
    broadcast_id: str
    message: str
    languages: List[str] = ["English"]
    template_id: Optional[str] = None
    sender: Optional[str] = "Admin / Safety Dispatch"
