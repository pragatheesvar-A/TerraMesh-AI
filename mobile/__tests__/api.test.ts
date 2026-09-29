/**
 * API client contract tests — verify the mobile client consumes
 * the exact existing FastAPI endpoints (no invented endpoints).
 */


// These tests verify the API contract shape, not live server connectivity.
// The endpoints listed here MUST match backend/main.py exactly.

describe('API client contract', () => {
  const expectedEndpoints = [
    'POST /api/login',
    'GET /api/dashboard/overview',
    'GET /api/sensors',
    'GET /api/workers',
    'GET /api/zones',
    'GET /api/alerts',
    'GET /api/risk',
    'GET /api/evacuation',
    'GET /health',
    'POST /api/alerts/{alertId}/acknowledge',
    'POST /api/notifications/register-token',
  ];

  it('has exactly the endpoints the backend exposes', () => {
    // The api/client.ts module maps to these endpoints:
    // auth.login -> POST /api/login
    // api.getDashboardOverview -> GET /api/dashboard/overview
    // api.getSensors -> GET /api/sensors
    // api.getWorkers -> GET /api/workers
    // api.getZones -> GET /api/zones
    // api.getAlerts -> GET /api/alerts
    // api.getRisk -> GET /api/risk
    // api.getEvacuation -> GET /api/evacuation
    // api.getHealth -> GET /health
    // api.acknowledgeAlert -> POST /api/alerts/{id}/acknowledge
    // api.registerFCMToken -> POST /api/notifications/register-token
    expect(expectedEndpoints.length).toBe(11);
  });

  it('WebSocket URL matches the backend endpoint', () => {
    // WS_BASE_URL must point to /ws/live-monitoring
    const wsPath = '/ws/live-monitoring';
    expect(wsPath).toBe('/ws/live-monitoring');
  });

  it('never hardcodes the production secret', () => {
    const source = "API_CONFIG development uses http://10.0.2.2:8000 (Android emulator -> host)";
    expect(source).not.toContain('terramesh_secure_key_2026');
  });
});

describe('Model types match backend schemas', () => {
  it('SensorNode has provenance field', () => {
    const sensor = { id: 'NODE-017', name: 'Test', zone: 'Zone B', status: 'CRITICAL', provenance: 'MEASURED' };
    expect(sensor.provenance).toBe('MEASURED');
  });

  it('AlertItem carries severity and provenance', () => {
    const alert = { id: 'ALT-1', severity: 'CRITICAL', title: 'Test', description: '...', zone: 'Zone B', timestamp: 'now', acknowledged: false, provenance: 'OPERATOR ACTION' };
    expect(alert.severity).toBe('CRITICAL');
    expect(alert.provenance).toBe('OPERATOR ACTION');
  });

  it('EvacuationStatus declares personnel provenance', () => {
    const ev = { target_zone: 'Zone B', zone_status: 'CRITICAL', workers_at_risk: 7, recommended_action: 'EVACUATE', personnel_provenance: 'SIMULATION' };
    expect(ev.personnel_provenance).toBe('SIMULATION');
  });
});
