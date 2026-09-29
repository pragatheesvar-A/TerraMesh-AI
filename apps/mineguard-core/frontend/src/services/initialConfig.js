import { API_BASE } from './api';

export const INITIAL_CONFIG = {
  general: {
    identity: {
      mineName: 'Jharia Coalfield — Pit 4B',
      facilityCode: 'JHA-PIT4B',
      deploymentId: 'TM-2026-X99',
      operatingShift: 'Shift A (06:00 - 14:00)',
      timezone: 'IST (UTC+05:30)',
      complianceCert: 'Project Standard 112 (CMR-2017-informed; not certified)',
      hotline: '+91 7010886232'
    },
    data: {
      pollingInterval: 1,
      retentionDays: 180,
      compression: 'Zstandard (Recommended)',
      unitSystem: 'Metric (°C, mm, kPa)',
      autoArchive: true
    },
    monitoring: {
      geotechRefresh: 1,
      gasRefresh: 2,
      workerRefresh: 3,
      lowBandwidthMode: false,
      autoCenterOnAlert: true,
      highPrecision3D: true
    }
  },
  site: {
    mineInfo: {
      facilityName: 'Jharia Deep Underground Coal Mine',
      seamDepth: 340,
      latitude: '23.7412° N',
      longitude: '86.4189° E',
      gassyCategory: 'Degree III (High Methane Prone)',
      mineManager: 'Er. Rajeshwar Sharma',
      safetyOfficer: 'Dr. Anita Roy'
    },
    zones: [
      { id: 'ZN-01', name: 'Zone A - South Highwall', riskLevel: 'HIGH', capacity: 35, workers: 18, route: 'Route A1 (South Portal)' },
      { id: 'ZN-02', name: 'Zone B - East Airway Drift', riskLevel: 'CRITICAL', capacity: 25, workers: 12, route: 'Route B2 (Incline 4 Shaft)' },
      { id: 'ZN-03', name: 'Zone C - North Longwall', riskLevel: 'ELEVATED', capacity: 40, workers: 28, route: 'Route C1 (Main Intake)' },
      { id: 'ZN-04', name: 'Zone D - Shaft 2 Pit Bottom', riskLevel: 'LOW', capacity: 50, workers: 34, route: 'Route D3 (Skip Shaft)' }
    ],
    gateways: [
      { id: 'GW-01', name: 'Pit Head Gateway', frequency: '865.20 MHz', status: 'ONLINE', signal: 'Strong (-68 dBm)', nodes: 14 },
      { id: 'GW-02', name: 'Shaft Incline Gateway', frequency: '866.10 MHz', status: 'ONLINE', signal: 'Good (-74 dBm)', nodes: 12 },
      { id: 'GW-03', name: 'Deep Seam IX Gateway', frequency: '867.00 MHz', status: 'ONLINE', signal: 'Fair (-82 dBm)', nodes: 8 }
    ]
  },
  sensors: {
    config: [
      { id: 'SN-TLT-101', name: 'Inclinometer 101', type: 'Tiltmeter', zone: 'Zone A', rate: '10 Hz', battery: 94 },
      { id: 'SN-CRK-204', name: 'Crackmeter 204', type: 'Crackmeter', zone: 'Zone B', rate: '5 Hz', battery: 88 },
      { id: 'SN-PIZ-309', name: 'Piezometer 309', type: 'Pore Pressure', zone: 'Zone B', rate: '2 Hz', battery: 91 },
      { id: 'SN-GAS-401', name: 'Multi-Gas 401', type: 'Gas (CH4/CO)', zone: 'Zone C', rate: '1 Hz', battery: 76 },
      { id: 'SN-EXT-502', name: 'Extensometer 502', type: 'Extensometer', zone: 'Zone A', rate: '5 Hz', battery: 82 }
    ],
    health: {
      autoIsolate: true,
      packetLossLimit: 5,
      minBattery: 20,
      onlineCount: 28,
      warningCount: 2,
      offlineCount: 0
    },
    calibration: {
      lastDate: '2026-08-15',
      nextDate: '2026-11-15',
      tiltZeroOffset: 0.04,
      dispZeroOffset: 0.02,
      technician: 'Tech. Sunita Karmakar'
    }
  },
  safety: {
    thresholds: {
      tiltCritical: 3.2,
      tiltWarning: 1.8,
      dispCritical: 2.8,
      dispWarning: 1.5,
      porePressureLimit: 280,
      ch4TripLimit: 1.25,
      coLimit: 50
    },
    riskLevels: {
      normalMax: 35,
      elevatedMax: 60,
      warningMax: 80,
      autoEscalateMins: 5
    },
    evacuation: {
      autoEvacuate: true,
      strobeLights: true,
      sirenCountdown: 30,
      primaryMuster: 'Muster Point Alpha (East Portal)',
      secondaryMuster: 'Muster Point Beta (South Terrace)'
    }
  },
  alerts: {
    notifications: {
      smsEnabled: true,
      emailEnabled: true,
      pagerEnabled: true,
      radioEnabled: true,
      recipients: '+91 7010886232, +91 94311 00234, +91 94311 00567'
    },
    audio: {
      volume: 85,
      sirenDuration: 30,
      tone: '880Hz Standard Industrial'
    },
    routing: [
      { severity: 'CRITICAL', notify: 'Primary (+91 7010886232), Mine GM, Safety Officer, Control Room', via: 'Siren, Instant SMS, Pager' },
      { severity: 'WARNING', notify: 'Primary (+91 7010886232), Control Room, Shift In-Charge, Geotech Lead', via: 'Audio Tone, SMS' },
      { severity: 'INFO', notify: 'System Logs & Dashboard', via: 'Screen Alert' }
    ]
  },
  aiModel: {
    prediction: {
      leadTimeHours: 6,
      lookbackHours: 24,
      confidenceMin: 85,
      modelType: 'Spatial-Temporal Strata Ensemble'
    },
    riskScoring: {
      tiltWeight: 35,
      extensometerWeight: 25,
      porePressureWeight: 20,
      seismicWeight: 10,
      gasWeight: 10
    },
    modelInfo: {
      version: 'v2.4.1 (Jharia Strata)',
      accuracy: '98.6%',
      lastTrained: '2026-09-08',
      status: 'Active & Validated'
    }
  },
  operators: {
    users: [
      { id: 'USR-100', name: 'Primary Dispatch Operator', role: 'Chief Controller', shift: 'All Shifts', phone: '+91 7010886232', active: true },
      { id: 'USR-101', name: 'Er. Rajeshwar Sharma', role: 'Mine General Manager', shift: 'General', phone: '+91 94311 00234', active: true },
      { id: 'USR-102', name: 'Dr. Anita Roy', role: 'Chief Safety Officer', shift: 'General', phone: '+91 94311 00567', active: true },
      { id: 'USR-103', name: 'Amit Kumar Verma', role: 'Control Room Operator', shift: 'Shift A', phone: '+91 94311 00890', active: true },
      { id: 'USR-104', name: 'Sunita Karmakar', role: 'Geotechnical Engineer', shift: 'Shift A', phone: '+91 94311 00412', active: true }
    ],
    roles: [
      { name: 'Mine General Manager', desc: 'Full administrative access and emergency declarations' },
      { name: 'Chief Safety Officer', desc: 'Manage safety thresholds, trigger evacuations and audits' },
      { name: 'Chief Controller', desc: 'Primary SMS emergency broadcast receiver & dispatch' },
      { name: 'Control Room Operator', desc: 'Live monitoring, acknowledge alerts, send broadcasts' },
      { name: 'Geotechnical Engineer', desc: 'Sensor calibration, AI parameter tuning, zone analysis' }
    ],
    permissions: [
      { action: 'Acknowledge Critical Alerts', roles: 'GM, Safety Officer, Chief Controller, Operator, Geotech' },
      { action: 'Trigger Emergency Siren / Evacuation', roles: 'GM, Safety Officer, Chief Controller, Operator' },
      { action: 'Modify Safety Thresholds', roles: 'GM, Safety Officer, Geotech' },
      { action: 'Calibrate Sensors', roles: 'Geotech, Sensor Technician' },
      { action: 'Tune AI Weights & Models', roles: 'Safety Officer, Geotech' }
    ]
  },
  system: {
    connectivity: {
      backendUrl: `${API_BASE}`,
      wsUrl: 'ws://<backend-host>/ws/live-monitoring (see services/api.js)',
      latency: 14,
      status: 'All Services Operational'
    },
    api: {
      apiKey: '',
      webhookUrl: 'https://scada.cil.in/webhooks/jharia-events'
    },
    database: {
      engine: 'TimescaleDB (PostgreSQL)',
      usedMb: 1842,
      totalMb: 20480,
      totalRows: '14.2M readings',
      lastCleaned: 'Yesterday 02:00'
    },
    auditLogs: [
      { id: 'LOG-8813', time: '15:46:12', user: 'Primary Controller', detail: 'Added +91 7010886232 to SMS Emergency Alert Dispatch List', type: 'Alert' },
      { id: 'LOG-8812', time: '14:48:12', user: 'Dr. Anita Roy', detail: 'Changed Critical Tilt Limit to 3.2°', type: 'Safety' },
      { id: 'LOG-8811', time: '14:32:05', user: 'Amit Kumar Verma', detail: 'Acknowledged Zone B pressure alert', type: 'Alert' },
      { id: 'LOG-8810', time: '14:15:20', user: 'Sunita Karmakar', detail: 'Calibrated Inclinometer 101', type: 'Sensor' },
      { id: 'LOG-8809', time: '13:58:44', user: 'Er. Rajeshwar Sharma', detail: 'Updated Gateway 03 frequency', type: 'System' }
    ]
  }
};
