"""
TerraMesh AI — Shared Domain Schemas
=====================================
Pydantic data contracts that flow through the entire pipeline.
Matches the exact hardware payload format from:
  - Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262, IN865 865-867 MHz)
  - MPU6050 (tilt/acceleration, I2C)
  - VL53L0X (ToF crack-gap ranging, I2C)
  - HX711 + Strain Gauge (microstrain, 2-wire)
  - ADXL345 (quantitative vibration, I2C)
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class SensorHealthState(str, Enum):
    HEALTHY  = "HEALTHY"   # All checks pass, readings plausible
    SUSPECT  = "SUSPECT"   # One anomaly indicator flagged
    FAULTED  = "FAULTED"   # Multiple indicators or critical failure


class WarningTier(str, Enum):
    NORMAL   = "NORMAL"    # Green  — quiet, data quality good
    WATCH    = "WATCH"     # Yellow — early trend or degraded data
    WARNING  = "WARNING"   # Orange — sustained + spatial consensus
    CRITICAL = "CRITICAL"  # Red    — multi-node corroborated failure


class VibrationClass(str, Enum):
    GROUND_MOTION = "GROUND_MOTION"   # 0-10 Hz strata deformation
    BLASTING      = "BLASTING"        # 10-50 Hz, high RMS — suppress
    MACHINERY     = "MACHINERY"       # Haul truck / drill — suppress
    RAIN_WIND     = "RAIN_WIND"       # Environmental — suppress
    SENSOR_FAULT  = "SENSOR_FAULT"    # Artefact


class ScenarioType(str, Enum):
    QUIET_BASELINE         = "QUIET_BASELINE"
    GRADUAL_SUBSIDENCE     = "GRADUAL_SUBSIDENCE"
    LOCALIZED_SUBSIDENCE   = "LOCALIZED_SUBSIDENCE"
    DIFFERENTIAL_MOVEMENT  = "DIFFERENTIAL_MOVEMENT"
    CRACK_INITIATION       = "CRACK_INITIATION"
    BLASTING_VIBRATION     = "BLASTING_VIBRATION"
    SENSOR_FAULT           = "SENSOR_FAULT"
    COMM_OUTAGE            = "COMM_OUTAGE"
    REAL_SUBSIDENCE_PLUS_FAULT = "REAL_SUBSIDENCE_PLUS_FAULT"
    INTERNET_DISCONNECT    = "INTERNET_DISCONNECT"
    MONSOON_THERMAL        = "MONSOON_THERMAL"


# ---------------------------------------------------------------------------
# Raw Node Telemetry (LoRa Packet Payload)
# ---------------------------------------------------------------------------

class SensorHealthFlags(BaseModel):
    """Status byte sent by each node every cycle."""
    mpu6050_ok:  bool = True   # MPU6050 I2C ACK
    vl53l0x_ok:  bool = True   # VL53L0X I2C ACK + range validity
    hx711_ok:    bool = True   # HX711 measurement within limits
    adxl345_ok:  bool = True   # ADXL345 I2C ACK


class NodeTelemetry(BaseModel):
    """
    Raw payload ingested from each Heltec ESP32-S3 LoRa node.
    All physical units documented in line with the hardware report.
    """
    # Identity
    node_id:           str
    timestamp:         datetime
    scenario:          Optional[ScenarioType] = None   # set by simulator only

    # Tilt / inclination (MPU6050 — gravity-vector method, NOT gyro integration)
    tilt_x_deg:        float = Field(..., description="Tilt along X axis (°)")
    tilt_y_deg:        float = Field(..., description="Tilt along Y axis (°)")
    tilt_mag_mrad:     float = Field(..., description="Tilt magnitude (mrad)")

    # Crack gap (VL53L0X ToF — differential distance across crack)
    crack_gap_mm:      float = Field(..., ge=0, description="Crack gap (mm)")

    # Strain (HX711 + 120Ω strain gauge)
    strain_ustrain:    float = Field(..., description="Strain (microstrains)")

    # Vibration (ADXL345 burst, 200 Hz window)
    vib_rms_g:         float = Field(..., ge=0, description="Vibration RMS (g)")
    vib_peak_g:        float = Field(..., ge=0, description="Vibration peak (g)")
    dom_freq_hz:       float = Field(..., ge=0, description="Dominant frequency (Hz)")
    band_energy_0_10:  float = Field(..., ge=0, description="0-10 Hz band energy")
    band_energy_10_50: float = Field(..., ge=0, description="10-50 Hz band energy")

    # Environmental
    temp_c:            float = Field(..., description="Node temperature (°C)")

    # Power & Comms telemetry
    battery_v:         float = Field(..., ge=0, description="Battery voltage (V)")
    rssi_dbm:          float = Field(..., description="RSSI of last uplink (dBm)")
    snr_db:            float = Field(..., description="SNR of last uplink (dB)")
    packet_seq:        int   = Field(0, description="Rolling packet counter")

    # Sensor health flags
    sensor_status:     SensorHealthFlags = Field(default_factory=SensorHealthFlags)

    # Operational context flags (consumed by the vibration classifier and the
    # feature contract — see edge/contracts/edge_model_contract.json)
    blast_flag:        Optional[int] = Field(default=0, description="Scheduled-blast window indicator (0/1)")
    rain_flag:         Optional[int] = Field(default=0, description="Rain/wind interference indicator (0/1)")
    vehicle_flag:      Optional[int] = Field(default=0, description="Machinery transit indicator (0/1)")

    # Ground truth (simulation only — NEVER used as model input)
    true_subsidence_mm:   Optional[float] = None
    true_tilt_mm_per_m:   Optional[float] = None
    true_strain_mm_per_m: Optional[float] = None


# ---------------------------------------------------------------------------
# Processed / Feature Layer
# ---------------------------------------------------------------------------

class NodeFeatures(BaseModel):
    """Engineered features computed by the edge gateway."""
    node_id:          str
    timestamp:        datetime

    # Rolling statistics (window = last 60 min)
    tilt_mean_mrad:       float
    tilt_rate_mrad_ph:    float    # mrad / hour
    tilt_accel_mrad_ph2:  float    # mrad / hour²
    crack_rate_mm_ph:     float    # mm / hour
    strain_rate_us_ph:    float    # µε / hour
    vib_rms_60min:        float

    # Physics residual  (observed − Knothe expected)
    subsidence_residual_mm: float
    tilt_residual_mrad:     float

    # Spatial consensus (from neighbours)
    n_agreeing_neighbours:  int
    neighbour_tilt_corr:    float   # Pearson r with neighbour average


# ---------------------------------------------------------------------------
# AI / ML Outputs
# ---------------------------------------------------------------------------

class SensorHealthReport(BaseModel):
    node_id:    str
    timestamp:  datetime
    state:      SensorHealthState
    reasons:    list[str]           # Human-readable fault descriptions


class VibrationFingerprintReport(BaseModel):
    node_id:    str
    timestamp:  datetime
    vib_class:  VibrationClass
    blast_flag: bool                # True → suppress alert
    confidence: float               # 0–1


class AnomalyScore(BaseModel):
    node_id:        str
    timestamp:      datetime
    hampel_flag:    bool
    cusum_flag:     bool
    iforest_score:  float           # Negative = anomalous
    composite:      float           # 0–1 normalised score


class DeformationForecast(BaseModel):
    node_id:            str
    timestamp:          datetime
    horizon_h:          int         # 24, 48, or 72
    predicted_mm:       float
    lower_90:           float       # Conformal lower bound
    upper_90:           float       # Conformal upper bound
    lead_time_to_crit_h: Optional[float]  # None if never crosses


class RiskDecision(BaseModel):
    panel_id:           str
    timestamp:          datetime
    tier:               WarningTier
    risk_score:         float       # 0–1
    confidence:         float       # 0–1
    triggering_nodes:   list[str]
    spatial_consensus:  float       # Fraction of live nodes agreeing
    persistence_cycles: int         # Number of cycles tier has been active
    data_quality:       float       # Fraction of nodes reporting
    evidence_en:        str         # English explainability card
    evidence_hi:        str         # Hindi explainability card
    blast_suppressed:   bool        # True if alert was suppressed by vibration filter


# ---------------------------------------------------------------------------
# Alert Record (persisted to SQLite)
# ---------------------------------------------------------------------------

class AlertRecord(BaseModel):
    alert_id:       str
    timestamp:      datetime
    tier:           WarningTier
    panel_id:       str
    nodes_involved: list[str]
    risk_score:     float
    evidence_en:    str
    evidence_hi:    str
    siren_triggered:bool
    sms_sent:       bool
    acknowledged:   bool = False
    ack_by:         Optional[str] = None
