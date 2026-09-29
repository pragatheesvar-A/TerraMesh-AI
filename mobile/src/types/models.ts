/**
 * Canonical backend data models — mirror the FastAPI Pydantic schemas exactly.
 * Every model carries a `provenance` field where the backend provides one.
 */

export interface SensorNode {
  id: string;
  name: string;
  zone: string;
  lat?: number;
  lng?: number;
  tilt?: number;
  displacement?: number;
  crack_width?: number;
  vibration?: string;
  battery?: number;
  lora_signal?: number;
  ai_risk_score?: number;
  status: string;
  risk_label?: string;
  provenance?: string;
  last_update?: string;
}

export interface Worker {
  id: string;
  code: string;
  name: string;
  zone: string;
  lat?: number;
  lng?: number;
  status: string;
  heart_rate?: number;
  spo2?: number;
  depth_m?: number;
  provenance?: string;
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'DANGER' | 'WARNING' | 'CAUTION' | 'INFO';
  title: string;
  description: string;
  zone: string;
  timestamp: string;
  acknowledged: boolean;
  provenance?: string;
}

export interface ZoneProvenance {
  geometry: string;
  status: string;
}

export interface ZoneInfo {
  id: string;
  code: string;
  name: string;
  status: string;
  subsidence_rate: number;
  active_workers: number;
  active_sensors: number;
  risk_score: number;
  polygon?: number[][];
  provenance?: ZoneProvenance;
}

export interface RiskIntelligence {
  current_risk_score: number;
  risk_level: string;
  trend_percentage: number;
  prediction: string;
  factors?: Record<string, number>;
  ai_confidence: number;
  provenance?: string;
  disclaimer?: string;
}

export interface EvacuationRoute {
  route_id: string;
  name: string;
  status: string;
  color?: string;
  waypoints?: number[][];
  coordinates?: number[][];
}

export interface EvacuationStatus {
  target_zone: string;
  zone_status: string;
  route_a_status: string;
  route_b_status: string;
  workers_at_risk: number;
  recommended_action: string;
  routes?: EvacuationRoute[];
  personnel_location_source?: string;
  personnel_provenance?: string;
}

export interface DashboardOverview {
  kpis: Record<string, number | string>;
  risk_intelligence: RiskIntelligence;
  sensor_health: Record<string, unknown>;
  evacuation: EvacuationStatus;
  infrastructure: Record<string, unknown>;
  system_status: Record<string, string>;
}

export interface LoginResponse {
  token: string;
  user?: { name?: string; role?: string; email?: string };
  auth_mode?: string;
  warning?: string;
}

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'RECONNECTING' | 'SYNCING';

export type ProvenanceLabel =
  | 'MEASURED DATA'
  | 'MODEL OUTPUT'
  | 'SIMULATION'
  | 'SIMULATED SATELLITE DATA'
  | 'ENGINEERING CALCULATION'
  | 'OPERATOR ACTION'
  | 'UNLABELED'
  | string;
