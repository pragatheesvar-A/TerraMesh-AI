// Geotechnical & Spatial Mock Data for TerraMesh AI
// Jharia Underground Coal Basin (Jharkhand, India)

export const MINE_CENTER = [23.7745, 86.4120];

export const MINE_BOUNDARIES = [
  [23.7820, 86.4020],
  [23.7845, 86.4190],
  [23.7780, 86.4250],
  [23.7660, 86.4220],
  [23.7640, 86.4080],
  [23.7710, 86.4010]
];

// Master Measurement Thresholds Table
export const SENSOR_MEASUREMENT_THRESHOLDS = {
  vibration: {
    sensor: "Vibration Sensor",
    measures: "Ground shaking",
    unit: "mm/s",
    unit_full: "mm/s (PPV)",
    ranges: {
      normal: { min: 0, max: 2, label: "0–2 mm/s", color: "#10B981" },
      safe: { min: 2, max: 5, label: "2–5 mm/s", color: "#06B6D4" },
      warning: { min: 5, max: 10, label: "5–10 mm/s", color: "#F59E0B" },
      emergency: { min: 10, max: Infinity, label: ">10 mm/s", color: "#EF4444" }
    }
  },
  tilt: {
    sensor: "Tilt Sensor",
    measures: "Ground inclination / leaning or rotating",
    unit: "°",
    unit_full: "degrees (°)",
    ranges: {
      normal: { min: 0, max: 0.2, label: "0–0.2°", color: "#10B981" },
      safe: { min: 0.2, max: 0.5, label: "0.2–0.5°", color: "#06B6D4" },
      warning: { min: 0.5, max: 1.0, label: "0.5–1.0°", color: "#F59E0B" },
      emergency: { min: 1.0, max: Infinity, label: ">1.0°", color: "#EF4444" }
    }
  },
  displacement: {
    sensor: "Displacement Sensor",
    measures: "Ground movement",
    unit: "mm/day",
    unit_full: "mm/day",
    ranges: {
      normal: { min: 0, max: 2, label: "0–2 mm/day", color: "#10B981" },
      safe: { min: 2, max: 5, label: "2–5 mm/day", color: "#06B6D4" },
      warning: { min: 5, max: 20, label: "5–20 mm/day", color: "#F59E0B" },
      emergency: { min: 20, max: Infinity, label: ">20 mm/day", color: "#EF4444" }
    }
  },
  crack: {
    sensor: "Crack Width Sensor",
    measures: "Crack width and opening speed",
    unit: "mm",
    unit_full: "mm",
    ranges: {
      normal: { min: 0, max: 1, label: "0–1 mm", color: "#10B981" },
      safe: { min: 1, max: 3, label: "1–3 mm", color: "#06B6D4" },
      warning: { min: 3, max: 10, label: "3–10 mm", color: "#F59E0B" },
      emergency: { min: 10, max: Infinity, label: ">10 mm", color: "#EF4444" }
    }
  }
};

export const getSensorLevel = (type, val) => {
  const spec = SENSOR_MEASUREMENT_THRESHOLDS[type];
  if (!spec) return { level: 'Normal', color: '#10B981' };
  const v = typeof val === 'number' ? val : parseFloat(val) || 0;
  if (v > spec.ranges.warning.max) return { level: 'Emergency', color: '#EF4444' };
  if (v > spec.ranges.safe.max) return { level: 'Warning', color: '#F59E0B' };
  if (v > spec.ranges.normal.max) return { level: 'Safe', color: '#06B6D4' };
  return { level: 'Normal', color: '#10B981' };
};

export const ZONES = [
  {
    id: "zone-a",
    code: "Zone A",
    name: "North Longwall Panel 01",
    status: "SAFE",
    risk_score: 18,
    subsidence_rate: 0.4,
    active_workers: 42,
    active_sensors: 14,
    color: "#10b981",
    fillColor: "rgba(16, 185, 129, 0.15)",
    polygon: [
      [23.7780, 86.4050],
      [23.7830, 86.4110],
      [23.7800, 86.4160],
      [23.7750, 86.4100]
    ]
  },
  {
    id: "zone-b",
    code: "Zone B",
    name: "Central Depillaring Section (High Risk)",
    status: "CRITICAL",
    risk_score: 87,
    subsidence_rate: 4.2,
    active_workers: 7,
    active_sensors: 8,
    color: "#ef4444",
    fillColor: "rgba(239, 68, 68, 0.28)",
    polygon: [
      [23.7750, 86.4100],
      [23.7800, 86.4160],
      [23.7760, 86.4210],
      [23.7710, 86.4150]
    ]
  },
  {
    id: "zone-c",
    code: "Zone C",
    name: "South Drift Panel 03",
    status: "CAUTION",
    risk_score: 46,
    subsidence_rate: 1.4,
    active_workers: 48,
    active_sensors: 16,
    color: "#eab308",
    fillColor: "rgba(234, 179, 8, 0.18)",
    polygon: [
      [23.7710, 86.4150],
      [23.7760, 86.4210],
      [23.7700, 86.4240],
      [23.7660, 86.4180]
    ]
  },
  {
    id: "zone-d",
    code: "Zone D",
    name: "West Main Haulage & Intake Shaft",
    status: "SAFE",
    risk_score: 12,
    subsidence_rate: 0.2,
    active_workers: 29,
    active_sensors: 10,
    color: "#10b981",
    fillColor: "rgba(16, 185, 129, 0.12)",
    polygon: [
      [23.7660, 86.4180],
      [23.7710, 86.4150],
      [23.7680, 86.4060],
      [23.7640, 86.4100]
    ]
  }
];

export const INITIAL_KPIS = {
  active_sensors_total: 48,
  active_sensors_online: 47,
  active_sensors_offline: 1,
  monitored_workers_total: 126,
  monitored_workers_safe: 119,
  monitored_workers_risk: 7,
  safe_zones_count: 38,
  safe_zones_status: "Stable",
  warning_zones_count: 7,
  warning_zones_delta: "+2 from previous hour",
  critical_zones_count: 3,
  critical_zones_status: "Immediate attention required"
};

// 48 Sensor Nodes generated with NODE-017 matching prompt
export const INITIAL_SENSORS = Array.from({ length: 48 }, (_, idx) => {
  const i = idx + 1;
  const id = `NODE-${String(i).padStart(3, '0')}`;
  
  if (i === 17) {
    return {
      id: "NODE-017",
      name: "Roof Extensometer 17-B",
      zone: "Zone B",
      lat: 23.7762,
      lng: 86.4148,
      tilt: 4.8,
      displacement: 12.4,
      crack_width: 7.2,
      vibration: "HIGH",
      battery: 84,
      lora_signal: 92,
      ai_risk_score: 87,
      status: "CRITICAL",
      sampling_interval: "5 sec",
      sampling_mode: "CRITICAL_BURST",
      sampling_desc: "Rapid continuous telemetry for active deformation burst",
      solar_mw: 0,
      power_profile: "High Frequency Burst 🚨",
      last_update: "12s ago",
      depth_m: 145,
      type: "Multi-point Borehole Extensometer"
    };
  }

  if (i === 48) {
    return {
      id: "NODE-048",
      name: "Perimeter Pillar 48",
      zone: "Zone D",
      lat: 23.7652,
      lng: 86.4082,
      tilt: 0.1,
      displacement: 0.2,
      crack_width: 0.0,
      vibration: "LOW",
      battery: 0,
      lora_signal: 0,
      ai_risk_score: 5,
      status: "OFFLINE",
      sampling_interval: "OFFLINE",
      sampling_mode: "INACTIVE",
      sampling_desc: "Node disconnected from LoRa gateway",
      solar_mw: 0,
      power_profile: "Unpowered",
      last_update: "42m ago",
      depth_m: 60,
      type: "Surface Tiltmeter"
    };
  }

  const isZoneB = [15, 16, 18, 19, 20].includes(i);
  const isZoneC = [21, 22, 23, 24, 25, 26, 27, 28].includes(i);
  const zone = isZoneB ? "Zone B" : (isZoneC ? "Zone C" : (i <= 14 ? "Zone A" : "Zone D"));

  const isWarning = [16, 18].includes(i);
  const isCaution = [23, 25].includes(i);
  const status = isWarning ? "WARNING" : (isCaution ? "CAUTION" : "SAFE");

  const sampling_interval = isWarning ? "30 sec" : (isCaution ? "1 min" : "10 min");
  const sampling_mode = isWarning ? "ELEVATED_RISK" : (isCaution ? "SURVEILLANCE" : "NORMAL_ECO");
  const sampling_desc = isWarning 
    ? "Risk increasing: rapid 30s sampling for micro-fractures" 
    : (isCaution ? "Elevated risk: 1-minute detailed telemetry" : "Normal condition: 10-minute battery saving interval");
  const solar_mw = i % 2 === 0 ? Math.floor(65 + Math.random() * 80) : 0;
  const power_profile = isWarning ? "Accelerated (30s) ⚠️" : (isCaution ? "Surveillance (1m) ⚠️" : "Eco-Save (10m) 🔋");

  // Approximate lat/lng around mine zones
  const angle = (i / 48) * 2 * Math.PI;
  const radius = 0.0035 + (i % 5) * 0.0015;
  const lat = 23.7745 + Math.sin(angle) * radius;
  const lng = 86.4120 + Math.cos(angle) * radius;

  return {
    id,
    name: `Pillar Monitor ${i}`,
    zone,
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    tilt: isWarning ? 3.1 : (isCaution ? 1.9 : Number((0.2 + Math.random() * 0.7).toFixed(1))),
    displacement: isWarning ? 7.8 : (isCaution ? 4.2 : Number((0.4 + Math.random() * 1.5).toFixed(1))),
    crack_width: isWarning ? 4.1 : (isCaution ? 2.3 : Number((0.1 + Math.random() * 0.6).toFixed(1))),
    vibration: isWarning || i === 23 ? "HIGH" : (isCaution ? "MEDIUM" : "LOW"),
    battery: Math.floor(78 + Math.random() * 21),
    lora_signal: Math.floor(86 + Math.random() * 13),
    ai_risk_score: isWarning ? 68 : (isCaution ? 48 : Math.floor(10 + Math.random() * 20)),
    status,
    sampling_interval,
    sampling_mode,
    sampling_desc,
    solar_mw,
    power_profile,
    last_update: `${Math.floor(1 + Math.random() * 5)}m ago`,
    depth_m: 80 + (i * 3) % 90,
    type: i % 3 === 0 ? "Laser Crackmeter" : (i % 3 === 1 ? "Tilt & Inclinometer" : "Seismic Geophone")
  };
});

// 126 Monitored Workers
export const INITIAL_WORKERS = Array.from({ length: 126 }, (_, idx) => {
  const i = idx + 1;
  const code = `W-${String(i).padStart(3, '0')}`;

  if (i === 1) {
    return {
      id: "w-1",
      code: "W-001",
      name: "Rajesh Kumar (Foreman)",
      zone: "Zone A",
      status: "SAFE",
      heart_rate: 74,
      spo2: 99,
      depth_m: 90,
      lat: 23.7792,
      lng: 86.4085,
      last_update: "10s ago",
      rfid_tag: "RF-8821"
    };
  }

  if (i === 23) {
    return {
      id: "w-23",
      code: "W-023",
      name: "Amit Sen (Drill Operator)",
      zone: "Zone B",
      status: "DANGER",
      heart_rate: 114,
      spo2: 94,
      depth_m: 142,
      lat: 23.7758,
      lng: 86.4142,
      last_update: "4s ago",
      rfid_tag: "RF-9104"
    };
  }

  if (i === 41) {
    return {
      id: "w-41",
      code: "W-041",
      name: "Bikram Soren (Blasting Tech)",
      zone: "Zone B",
      status: "DANGER",
      heart_rate: 109,
      spo2: 95,
      depth_m: 145,
      lat: 23.7765,
      lng: 86.4153,
      last_update: "6s ago",
      rfid_tag: "RF-4281"
    };
  }

  if (i === 52) {
    return {
      id: "w-52",
      code: "W-052",
      name: "Dharmendra Singh (Support Team)",
      zone: "Zone C",
      status: "CAUTION",
      heart_rate: 88,
      spo2: 97,
      depth_m: 115,
      lat: 23.7712,
      lng: 86.4184,
      last_update: "1m ago",
      rfid_tag: "RF-3372"
    };
  }

  // 7 workers in Danger (in Zone B)
  const dangerIndices = [23, 41, 15, 34, 45, 62, 77];
  // 10 workers in Caution (in Zone C)
  const cautionIndices = [52, 12, 28, 39, 66, 81, 93, 104, 115, 120];

  const isDanger = dangerIndices.includes(i);
  const isCaution = cautionIndices.includes(i);
  const status = isDanger ? "DANGER" : (isCaution ? "CAUTION" : "SAFE");
  const zone = isDanger ? "Zone B" : (isCaution ? "Zone C" : (i <= 60 ? "Zone A" : "Zone D"));

  const latOffset = (Math.random() - 0.5) * 0.004;
  const lngOffset = (Math.random() - 0.5) * 0.004;

  const baseZoneCoord = {
    "Zone A": [23.7790, 86.4100],
    "Zone B": [23.7760, 86.4150],
    "Zone C": [23.7720, 86.4190],
    "Zone D": [23.7680, 86.4120]
  }[zone];

  return {
    id: `w-${i}`,
    code,
    name: `Worker ${code}`,
    zone,
    status,
    heart_rate: isDanger ? Math.floor(104 + Math.random() * 15) : (isCaution ? Math.floor(82 + Math.random() * 10) : Math.floor(68 + Math.random() * 12)),
    spo2: isDanger ? Math.floor(93 + Math.random() * 3) : Math.floor(97 + Math.random() * 3),
    depth_m: isDanger ? 140 + (i % 12) : 80 + (i % 50),
    lat: Number((baseZoneCoord[0] + latOffset).toFixed(5)),
    lng: Number((baseZoneCoord[1] + lngOffset).toFixed(5)),
    last_update: `${Math.floor(1 + Math.random() * 8)}m ago`,
    rfid_tag: `RF-${1000 + i}`
  };
});

// Evacuation Paths & Status
export const INITIAL_EVACUATION = {
  target_zone: "ZONE B",
  zone_status: "CRITICAL",
  route_a_status: "BLOCKED",
  route_b_status: "SAFE",
  workers_at_risk: 7,
  recommended_action: "EVACUATE THROUGH ROUTE B",
  routes: [
    {
      id: "route-a",
      name: "Route A (Central Incline Haulage)",
      status: "BLOCKED",
      color: "#ef4444",
      block_reason: "Roof shear collapse detected at Pillar 12-B",
      coordinates: [
        [23.7762, 86.4148],
        [23.7750, 86.4125],
        [23.7735, 86.4100],
        [23.7710, 86.4060]
      ]
    },
    {
      id: "route-b",
      name: "Route B (East Auxiliary Airway Drift)",
      status: "SAFE",
      color: "#10b981",
      block_reason: null,
      coordinates: [
        [23.7762, 86.4148],
        [23.7780, 86.4185],
        [23.7760, 86.4225],
        [23.7720, 86.4250],
        [23.7680, 86.4230]
      ]
    }
  ],
  flow_steps: [
    { id: 1, label: "Worker", status: "AT RISK", icon: "user" },
    { id: 2, label: "Danger Zone", status: "ZONE B", icon: "alert-triangle" },
    { id: 3, label: "Route A", status: "BLOCKED", icon: "x-circle", isCross: true },
    { id: 4, label: "AI Rerouting", status: "ACTIVE", icon: "cpu" },
    { id: 5, label: "Route B", status: "SAFE", icon: "shield-check" },
    { id: 6, label: "Safe Zone", status: "ASSEMBLY 3", icon: "flag" }
  ]
};

// AI Risk Intelligence (Explainable AI Engine)
export const INITIAL_AI_RISK = {
  current_risk_score: 87,
  risk_level: "CRITICAL",
  trend_percentage: 18,
  trend_direction: "up",
  prediction: "Deformation is increasing in Zone B.",
  factors: {
    tilt_change: 32,
    displacement_rate: 27,
    crack_widening: 18,
    vibration: 10,
    historical_trend: 13
  },
  explainable_reasons: [
    {
      id: "reason-1",
      title: "Ground movement increased",
      percentage: 32,
      detail: "Displacement velocity reached 4.8 mm/day and accelerated tilt rate (+3.4mm/hr) in Zone B.",
      status: "CRITICAL",
      badge: "+32% Weight",
      color: "text-red-400",
      dotColor: "bg-red-500",
      barColor: "#ef4444"
    },
    {
      id: "reason-2",
      title: "Nearby vibration increased",
      percentage: 27,
      detail: "Micro-seismic geophone acoustic emission energy peaked at 240 Joules from depillaring operations.",
      status: "HIGH ENERGY",
      badge: "+27% Weight",
      color: "text-orange-400",
      dotColor: "bg-orange-500",
      barColor: "#f97316"
    },
    {
      id: "reason-3",
      title: "Water level changed",
      percentage: 18,
      detail: "Piezometric hydrostatic pore pressure shifted +14% due to strata bed delamination.",
      status: "PORE PRESSURE",
      badge: "+18% Weight",
      color: "text-amber-400",
      dotColor: "bg-amber-500",
      barColor: "#eab308"
    },
    {
      id: "reason-4",
      title: "Historical mine workings exist below",
      percentage: 13,
      detail: "Legacy unmapped bord-and-pillar goaf void located at -145m depth causing tensile fracturing.",
      status: "GOAF VOID",
      badge: "+13% Weight",
      color: "text-red-400",
      dotColor: "bg-red-500",
      barColor: "#ef4444"
    },
    {
      id: "reason-5",
      title: "Multiple sources agree",
      percentage: 10,
      detail: "Satellite InSAR (Sentinel-1), subsurface LoRa inclinometers, and optical laser crackmeters cross-verify.",
      status: "VERIFIED",
      badge: "+10% Weight (91% Consensus)",
      color: "text-emerald-400",
      dotColor: "bg-emerald-500",
      barColor: "#10b981"
    }
  ],
  ai_confidence: 91,
  disclaimer: "Prototype decision-support visualization for Smart India Hackathon (SIH26025). Geotechnical validation required before regulatory enforcement."
};

// Active Alerts Feed
export const INITIAL_ALERTS = [
  {
    id: "ALT-1092",
    severity: "CRITICAL",
    title: "Zone B deformation increasing",
    description: "Accelerated vertical displacement detected across Pillar 17-B cluster. Rate exceeds safety threshold: 3.4mm/hr.",
    zone: "Zone B",
    timestamp: "10:42:18 AM",
    acknowledged: false
  },
  {
    id: "ALT-1091",
    severity: "WARNING",
    title: "Node-017 crack widening detected",
    description: "Geotagged fissure gauge 7.2mm (+1.8mm in 15 mins). Risk of roof spalling.",
    zone: "Zone B",
    timestamp: "10:40:02 AM",
    acknowledged: false
  },
  {
    id: "ALT-1090",
    severity: "CAUTION",
    title: "Node-023 vibration anomaly",
    description: "Micro-seismic acoustic emission pulse detected. Possible geological fault settlement.",
    zone: "Zone C",
    timestamp: "10:38:41 AM",
    acknowledged: true
  },
  {
    id: "ALT-1089",
    severity: "WARNING",
    title: "Route A roof beam compression",
    description: "Timber pack load cell reached 91% bearing limit. Airway drift clearance compromised.",
    zone: "Tunnel A-2",
    timestamp: "10:31:05 AM",
    acknowledged: true
  }
];

// Sensor Network Health Matrix
export const INITIAL_SENSOR_HEALTH = {
  categories: [
    { name: "Tilt Sensors", online: 48, total: 48, status: "OPTIMAL", color: "text-emerald-400" },
    { name: "Displacement", online: 47, total: 48, status: "DEGRADED", color: "text-amber-400" },
    { name: "Crack Sensors", online: 45, total: 48, status: "ATTENTION", color: "text-orange-400" },
    { name: "Vibration", online: 48, total: 48, status: "OPTIMAL", color: "text-emerald-400" }
  ],
  lora_network_pct: 98,
  gateway_status: "ONLINE",
  battery_health_pct: 92
};

// Subsidence Trend Graph datasets for 1H, 6H, 24H, 7D, 30D
export const TREND_DATA_RANGES = {
  "1H": [
    { time: "10:00", risk_score: 69, tilt: 3.2, displacement: 8.1, crack_growth: 4.8 },
    { time: "10:10", risk_score: 72, tilt: 3.5, displacement: 8.9, crack_growth: 5.2 },
    { time: "10:20", risk_score: 76, tilt: 3.8, displacement: 9.8, crack_growth: 5.8 },
    { time: "10:30", risk_score: 80, tilt: 4.2, displacement: 10.9, crack_growth: 6.4 },
    { time: "10:40", risk_score: 84, tilt: 4.5, displacement: 11.8, crack_growth: 6.9 },
    { time: "10:45", risk_score: 87, tilt: 4.8, displacement: 12.4, crack_growth: 7.2 }
  ],
  "6H": [
    { time: "05:00", risk_score: 42, tilt: 1.8, displacement: 3.2, crack_growth: 2.1 },
    { time: "06:00", risk_score: 45, tilt: 1.9, displacement: 3.8, crack_growth: 2.4 },
    { time: "07:00", risk_score: 51, tilt: 2.2, displacement: 4.6, crack_growth: 2.9 },
    { time: "08:00", risk_score: 58, tilt: 2.6, displacement: 5.8, crack_growth: 3.6 },
    { time: "09:00", risk_score: 69, tilt: 3.2, displacement: 8.1, crack_growth: 4.8 },
    { time: "10:00", risk_score: 87, tilt: 4.8, displacement: 12.4, crack_growth: 7.2 }
  ],
  "24H": [
    { time: "12:00", risk_score: 28, tilt: 0.9, displacement: 1.8, crack_growth: 1.1 },
    { time: "16:00", risk_score: 31, tilt: 1.1, displacement: 2.2, crack_growth: 1.4 },
    { time: "20:00", risk_score: 36, tilt: 1.4, displacement: 2.8, crack_growth: 1.7 },
    { time: "00:00", risk_score: 40, tilt: 1.7, displacement: 3.1, crack_growth: 1.9 },
    { time: "04:00", risk_score: 46, tilt: 2.0, displacement: 4.2, crack_growth: 2.5 },
    { time: "08:00", risk_score: 62, tilt: 2.9, displacement: 6.5, crack_growth: 3.9 },
    { time: "10:45", risk_score: 87, tilt: 4.8, displacement: 12.4, crack_growth: 7.2 }
  ],
  "7D": [
    { time: "Day 1", risk_score: 18, tilt: 0.4, displacement: 0.8, crack_growth: 0.3 },
    { time: "Day 2", risk_score: 22, tilt: 0.6, displacement: 1.2, crack_growth: 0.6 },
    { time: "Day 3", risk_score: 25, tilt: 0.8, displacement: 1.5, crack_growth: 0.9 },
    { time: "Day 4", risk_score: 32, tilt: 1.2, displacement: 2.4, crack_growth: 1.4 },
    { time: "Day 5", risk_score: 44, tilt: 1.8, displacement: 3.9, crack_growth: 2.2 },
    { time: "Day 6", risk_score: 65, tilt: 3.1, displacement: 7.4, crack_growth: 4.5 },
    { time: "Day 7", risk_score: 87, tilt: 4.8, displacement: 12.4, crack_growth: 7.2 }
  ],
  "30D": [
    { time: "Wk 1", risk_score: 14, tilt: 0.3, displacement: 0.5, crack_growth: 0.2 },
    { time: "Wk 2", risk_score: 19, tilt: 0.5, displacement: 1.1, crack_growth: 0.5 },
    { time: "Wk 3", risk_score: 35, tilt: 1.3, displacement: 2.8, crack_growth: 1.6 },
    { time: "Wk 4", risk_score: 87, tilt: 4.8, displacement: 12.4, crack_growth: 7.2 }
  ]
};

// Infrastructure Impact
export const INITIAL_INFRASTRUCTURE = {
  roads_at_risk: 2,
  buildings_at_risk: 12,
  agricultural_areas: 4,
  forest_areas: 1,
  items: [
    {
      id: "INF-01",
      category: "Road",
      name: "NH-32 Coal Expressway (Ch 14+200)",
      distance_m: 35,
      risk_level: "HIGH",
      displacement_projected_mm: 48,
      status_note: "Transverse tensile cracks propagating across road surface"
    },
    {
      id: "INF-02",
      category: "Building",
      name: "Pithead Power Substation (33kV)",
      distance_m: 72,
      risk_level: "MEDIUM",
      displacement_projected_mm: 22,
      status_note: "Differential settlement nearing 1:500 tilt limit"
    },
    {
      id: "INF-03",
      category: "Agriculture",
      name: "Dhanbad Village Terrace Farmland",
      distance_m: 50,
      risk_level: "HIGH",
      displacement_projected_mm: 64,
      status_note: "Ground depression leading to flash ponding hazard"
    },
    {
      id: "INF-04",
      category: "Forest",
      name: "Sal Reserved Buffer Canopy",
      distance_m: 120,
      risk_level: "LOW",
      displacement_projected_mm: 8,
      status_note: "Superficial soil fissuring, no root shear"
    }
  ]
};

// Surface Infrastructure Geometries for Map
export const INFRASTRUCTURE_GEO = [
  {
    type: "Road",
    name: "NH-32 Expressway",
    coords: [
      [23.7840, 86.4020],
      [23.7810, 86.4150],
      [23.7780, 86.4250]
    ],
    color: "#f97316"
  },
  {
    type: "Building",
    name: "Substation 33kV",
    coords: [23.7785, 86.4180],
    color: "#eab308"
  },
  {
    type: "Assembly",
    name: "Safe Assembly Area 3",
    coords: [23.7680, 86.4230],
    color: "#10b981"
  },
  {
    type: "Crack",
    name: "Tension Fissure F-04",
    coords: [
      [23.7755, 86.4135],
      [23.7770, 86.4160]
    ],
    color: "#ef4444"
  }
];

// Bottom System Status
export const INITIAL_SYSTEM_STATUS = {
  backend_api: "ONLINE",
  ai_engine: "ONLINE",
  database: "ONLINE",
  lora_gateway: "ONLINE",
  gis_service: "ONLINE",
  last_data_sync: "3 seconds ago",
  system_uptime: 99.8
};
