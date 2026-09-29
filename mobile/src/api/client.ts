/**
 * Central API client — consumes the existing FastAPI backend.
 * Mirrors the web frontend's services/api.js contract exactly.
 */
import { API_CONFIG } from '../config/env';
import * as Keychain from 'react-native-keychain';
import type {
  LoginResponse, DashboardOverview, SensorNode, Worker,
  AlertItem, ZoneInfo, RiskIntelligence, EvacuationStatus,
} from '../types/models';

const BASE = API_CONFIG.API_BASE_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: 'terramesh' });
    return creds ? creds.password : null;
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('terramesh-user', token, {
    service: 'terramesh',
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: 'terramesh' });
}

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['X-API-Key'] = token;
  return h;
}

async function request<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
  auth = false,
): Promise<T> {
  const token = auth ? await getToken() : null;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `API returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await request<LoginResponse>('POST', '/api/login', { email, password });
    await setToken(data.token);
    return data;
  },
  logout: async (): Promise<void> => {
    await clearToken();
  },
  getToken,
};

// ── Domain ───────────────────────────────────────────────────────────────
export const api = {
  getDashboardOverview: (): Promise<DashboardOverview> =>
    request<DashboardOverview>('GET', '/api/dashboard/overview'),
  getSensors: (): Promise<SensorNode[]> =>
    request<SensorNode[]>('GET', '/api/sensors'),
  getWorkers: (): Promise<Worker[]> =>
    request<Worker[]>('GET', '/api/workers'),
  getZones: (): Promise<ZoneInfo[]> =>
    request<ZoneInfo[]>('GET', '/api/zones'),
  getAlerts: (): Promise<AlertItem[]> =>
    request<AlertItem[]>('GET', '/api/alerts'),
  getRisk: (): Promise<RiskIntelligence> =>
    request<RiskIntelligence>('GET', '/api/risk'),
  getEvacuation: (): Promise<EvacuationStatus> =>
    request<EvacuationStatus>('GET', '/api/evacuation'),
  // Real backend-authorized evacuation broadcast (role-gated: R_EMERGENCY).
  // The backend inserts a CRITICAL alert, broadcasts over WebSocket, runs
  // multi-channel dispatch, and records an audit-log entry.
  evacuationBroadcast: async (zone: string, message: string): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>('POST', '/api/evacuation/broadcast', {
      zone, message, target: 'ZONE_WORKERS',
    }, true),
  getHealth: (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>('GET', '/health'),
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await request<Record<string, unknown>>('POST', `/api/alerts/${alertId}/acknowledge`, {}, true);
  },
  registerFCMToken: async (workerId: string, token: string, zone: string): Promise<Record<string, unknown> | null> => {
    try {
      return await request<Record<string, unknown>>('POST', '/api/notifications/register-token', {
        worker_id: workerId, token, zone, platform: 'android',
      }, true);
    } catch { return null; }
  },
  getExplainData: (nodeId: string): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>('GET', `/api/ml/explain/${nodeId}`),
  getKalmanState: (nodeId: string): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>('GET', `/api/kalman/node/${nodeId}`) as Promise<never>,
  getEngineeringLayers: (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>('GET', '/api/spatial/engineering-layers'),
  generateReport: async (payload: Record<string, unknown>): Promise<boolean> => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/reports/generate`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
      });
      return res.ok && (res.headers.get('content-type') || '').includes('pdf');
    } catch { return false; }
  },
};
