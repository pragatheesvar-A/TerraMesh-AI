/**
 * TerraMesh AI — Advanced Digital Mine Twin Intelligence Engine
 * 
 * Provides:
 * 1. Sensor Health & Diagnostics (Constant-value/Frozen detection, Heartbeat, Reliability)
 * 2. Shadow Residual Monitoring (Actual - Expected, Drift analysis)
 * 3. Adaptive Multi-Sensor Fusion & Dynamic Weighting (Self-healing exclusion of failed nodes)
 * 4. Deformation DNA (Multi-axis structural signature)
 * 5. Vibration Fingerprinting (Spectral signature & class identification)
 * 6. Energy-Aware Adaptive Sampling (Risk-responsive sampling intervals & energy savings)
 * 7. Explainable AI ("Why This Alert?" human-readable reasoning with confidence vs data quality)
 */

// 1. SENSOR HEALTH & DIAGNOSTICS
export const SENSOR_HEALTH_STATUSES = {
  ONLINE: { label: 'ONLINE', color: 'text-emerald-400', badgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' },
  DEGRADED: { label: 'DEGRADED', color: 'text-amber-400', badgeClass: 'bg-amber-950/40 text-amber-400 border-amber-800/60' },
  STALE: { label: 'STALE', color: 'text-orange-400', badgeClass: 'bg-orange-950/40 text-orange-400 border-orange-800/60' },
  SUSPECTED_FAILURE: { label: 'SUSPECTED FAILURE', color: 'text-rose-400', badgeClass: 'bg-rose-950/40 text-rose-400 border-rose-800/60' },
  FAILED: { label: 'FAILED', color: 'text-red-500', badgeClass: 'bg-red-950/40 text-red-500 border-red-800/60' }
};

/**
 * Evaluates individual sensor health based on telemetry attributes, heartbeat, and value variance.
 */
export function evaluateSensorHealth(sensor) {
  if (!sensor) return { status: 'ONLINE', reliability: 95, reason: 'Nominal' };

  // Explicit status overrides
  if (sensor.status === 'OFFLINE' || sensor.status === 'FAILED') {
    return {
      status: 'FAILED',
      reliability: 0,
      reason: 'No heartbeat received in >5 minutes',
      isFrozen: false,
      excludeFromFusion: true
    };
  }

  // Frozen sensor check: exactly zero variation on physical readings or flagged
  if (sensor.isFrozen || sensor.frozen_detected) {
    return {
      status: 'SUSPECTED FAILURE',
      reliability: 18,
      reason: 'Constant value detected across 12 cycles (Frozen ADC suspected)',
      isFrozen: true,
      excludeFromFusion: true
    };
  }

  // Battery checks
  const battery = sensor.battery ?? 90;
  if (battery < 15) {
    return {
      status: 'DEGRADED',
      reliability: 45,
      reason: `Critical battery level (${battery}%). Signal transmission sporadic.`,
      isFrozen: false,
      excludeFromFusion: false
    };
  }

  // Stale check
  if (sensor.last_update && (sensor.last_update.includes('min') && parseInt(sensor.last_update) > 10)) {
    return {
      status: 'STALE',
      reliability: 55,
      reason: 'Last ping exceeds standard reporting window',
      isFrozen: false,
      excludeFromFusion: false
    };
  }

  // High noise / abnormal gradient check
  if (sensor.displacement > 25 && sensor.tilt < 0.2) {
    return {
      status: 'DEGRADED',
      reliability: 62,
      reason: 'Uncorrelated displacement spike without corresponding tilt inclination',
      isFrozen: false,
      excludeFromFusion: false
    };
  }

  return {
    status: 'ONLINE',
    reliability: Math.min(100, Math.max(80, Math.round(92 + (battery / 20)))),
    reason: 'Continuous valid telemetry stream',
    isFrozen: false,
    excludeFromFusion: false
  };
}

// 2. SHADOW RESIDUAL MONITORING
/**
 * Computes expected values and residuals for a given node or zone.
 * Residual = Actual - Expected
 */
export function computeShadowResidual(sensor) {
  if (!sensor) return null;

  // Expected model based on geotechnical baseline
  const expectedDisp = sensor.expected_displacement ?? 1.2;
  const actualDisp = sensor.displacement !== undefined ? sensor.displacement : 1.2;
  const residualDisp = Number((actualDisp - expectedDisp).toFixed(2));

  const expectedTilt = sensor.expected_tilt ?? 0.35;
  const actualTilt = sensor.tilt !== undefined ? sensor.tilt : 0.35;
  const residualTilt = Number((actualTilt - expectedTilt).toFixed(2));

  const residualTrend = residualDisp > 4.0 ? 'Accelerating Divergence' : (residualDisp > 1.5 ? 'Moderate Deviation' : 'Within Expected Tolerance');
  const isAnomaly = Math.abs(residualDisp) > 5.0 || Math.abs(residualTilt) > 1.5;

  return {
    expected: { displacement: expectedDisp, tilt: expectedTilt },
    actual: { displacement: actualDisp, tilt: actualTilt },
    residual: { displacement: residualDisp, tilt: residualTilt },
    trend: residualTrend,
    isAnomaly,
    severity: isAnomaly ? (residualDisp > 10 ? 'HIGH' : 'WARNING') : 'NOMINAL'
  };
}

// 3. ADAPTIVE SENSOR WEIGHTING & SELF-HEALING FUSION
/**
 * Calculates dynamic fusion weights across available sensors, transparently
 * excluding failed/frozen sensors and redistributing influence among healthy nodes.
 */
export function calculateAdaptiveFusionWeights(sensorList = []) {
  if (!sensorList || sensorList.length === 0) return [];

  const evaluated = sensorList.map(s => {
    const health = evaluateSensorHealth(s);
    let baseWeight = 25; // Default equal weighting

    // Type-specific baseline importance
    if (s.type === 'Displacement' || s.type?.includes('Sag')) baseWeight = 35;
    else if (s.type === 'Tilt' || s.type?.includes('Inclinometer')) baseWeight = 25;
    else if (s.type === 'Vibration' || s.type?.includes('Acoustic')) baseWeight = 20;
    else if (s.type === 'Crack') baseWeight = 20;

    // Weight adjustment by health
    let activeWeight = baseWeight;
    let excludedReason = null;

    if (health.excludeFromFusion) {
      activeWeight = 0;
      excludedReason = health.reason;
    } else if (health.status === 'DEGRADED') {
      activeWeight = baseWeight * 0.5;
    } else if (health.status === 'STALE') {
      activeWeight = baseWeight * 0.7;
    }

    return {
      sensor: s,
      health,
      rawWeight: activeWeight,
      excludedReason
    };
  });

  // Normalize active weights to sum to 100%
  const totalRawWeight = evaluated.reduce((acc, curr) => acc + curr.rawWeight, 0);

  return evaluated.map(item => {
    const finalWeight = totalRawWeight > 0 
      ? Math.round((item.rawWeight / totalRawWeight) * 100) 
      : 0;

    return {
      id: item.sensor.id || item.sensor.name,
      name: item.sensor.name || item.sensor.id,
      type: item.sensor.type || 'Telemetry Node',
      health: item.health.status,
      reliability: item.health.reliability,
      weight: finalWeight,
      excluded: item.rawWeight === 0,
      excludedReason: item.excludedReason,
      isFrozen: item.health.isFrozen
    };
  });
}

// 4. DEFORMATION DNA SIGNATURE
/**
 * Generates a normalized 6-axis structural deformation fingerprint vector
 * comparing current readings against nominal baseline and engineering limits.
 */
export function getDeformationDna(zoneData = {}) {
  const disp = zoneData.displacement ?? 14.2;
  const tilt = zoneData.tilt ?? 4.8;
  const crack = zoneData.crack ?? 7.2;
  const vibration = zoneData.vibration ?? 3.8;
  const porePressure = zoneData.porePressure ?? 42.6;
  const shearStrain = zoneData.microStrain ?? 1420;

  // Normalized (0-100) relative to statutory critical thresholds
  const normDisp = Math.min(100, Math.round((disp / 20.0) * 100));
  const normTilt = Math.min(100, Math.round((tilt / 5.0) * 100));
  const normCrack = Math.min(100, Math.round((crack / 10.0) * 100));
  const normVib = Math.min(100, Math.round((vibration / 10.0) * 100));
  const normPore = Math.min(100, Math.round((porePressure / 60.0) * 100));
  const normStrain = Math.min(100, Math.round((shearStrain / 2000.0) * 100));

  return [
    { axis: 'Vertical Convergence', current: normDisp, baseline: 12, limit: 100, raw: `${disp} mm` },
    { axis: 'Angular Tilt', current: normTilt, baseline: 8, limit: 100, raw: `${tilt}°` },
    { axis: 'Crack Dilation', current: normCrack, baseline: 5, limit: 100, raw: `${crack} mm` },
    { axis: 'Acoustic Energy', current: normVib, baseline: 10, limit: 100, raw: `${vibration} mm/s` },
    { axis: 'Pore Hydrostatic', current: normPore, baseline: 25, limit: 100, raw: `${porePressure} m` },
    { axis: 'Shear Strain', current: normStrain, baseline: 15, limit: 100, raw: `${shearStrain} µε` }
  ];
}

// 5. VIBRATION FINGERPRINTING
export const VIBRATION_CLASSES = {
  NORMAL_MINING: { label: 'Normal Mining Activity', desc: 'Continuous shearer cutting & belt conveyor rotation', color: 'text-slate-300' },
  EQUIPMENT: { label: 'Heavy Equipment Activity', desc: 'Shuttle car tramming or continuous miner advance', color: 'text-cyan-400' },
  CONTROLLED_BLAST: { label: 'Blast / Controlled Event', desc: 'Short duration high-amplitude detonation wave', color: 'text-amber-400' },
  STRUCTURAL_ANOMALY: { label: 'Structural Anomaly (Fault Slip)', desc: 'Low-frequency microseismic pulse indicating roof shear', color: 'text-rose-400' },
  UNKNOWN: { label: 'Unknown Pattern', desc: 'Unclassified acoustic emission event', color: 'text-slate-400' }
};

export function getVibrationFingerprint(vibrationLevel = 3.8, isCritical = false) {
  if (isCritical || vibrationLevel > 5.0) {
    return {
      classification: VIBRATION_CLASSES.STRUCTURAL_ANOMALY,
      dominantFreq: '14.2 Hz',
      ppv: `${vibrationLevel} mm/s`,
      duration: '420 ms',
      historicalMatch: 'Zone B Fault Slip (Aug 2024)',
      similarity: 88,
      isSimulated: true
    };
  } else if (vibrationLevel > 2.0) {
    return {
      classification: VIBRATION_CLASSES.EQUIPMENT,
      dominantFreq: '48.5 Hz',
      ppv: `${vibrationLevel} mm/s`,
      duration: 'Continuous',
      historicalMatch: 'Tailgate Conveyor Drive (Nominal)',
      similarity: 94,
      isSimulated: true
    };
  }
  return {
    classification: VIBRATION_CLASSES.NORMAL_MINING,
    dominantFreq: '62.0 Hz',
    ppv: `${vibrationLevel} mm/s`,
    duration: 'Background',
    historicalMatch: 'Mine Baseline Ambient',
    similarity: 97,
    isSimulated: true
  };
}

// 6. ENERGY-AWARE ADAPTIVE SAMPLING
export const SAMPLING_POLICIES = {
  NORMAL:   { interval: '10 min', seconds: 600, powerProfile: 'Ultra-Low Power Sleep', savingPct: 88 },
  LOW:      { interval: '5 min',  seconds: 300, powerProfile: 'Periodic Standby',      savingPct: 76 },
  MEDIUM:   { interval: '1 min',  seconds: 60,  powerProfile: 'Balanced Active',       savingPct: 54 },
  HIGH:     { interval: '10 sec', seconds: 10,  powerProfile: 'High-Frequency Alert',  savingPct: 22 },
  CRITICAL: { interval: '5 sec',  seconds: 5,   powerProfile: 'Real-Time Burst 🚨',    savingPct: 0 }
};

export function getAdaptiveSamplingState(riskScore = 50, trend = 'stable') {
  if (riskScore >= 75) {
    return {
      policy: SAMPLING_POLICIES.CRITICAL,
      previousInterval: '1 min',
      currentInterval: '5 sec',
      reason: 'Rapid displacement velocity exceeds the project engineering warning limit',
      batteryImpact: 'Maximum Available Bandwidth',
      estimatedEnergySaved: '0% (Emergency Burst Mode)'
    };
  } else if (riskScore >= 50) {
    return {
      policy: SAMPLING_POLICIES.HIGH,
      previousInterval: '5 min',
      currentInterval: '10 sec',
      reason: 'Elevated rate of vertical convergence detected',
      batteryImpact: 'Accelerated Discharges',
      estimatedEnergySaved: '22% vs Constant Polling'
    };
  } else if (riskScore >= 30) {
    return {
      policy: SAMPLING_POLICIES.MEDIUM,
      previousInterval: '10 min',
      currentInterval: '1 min',
      reason: 'Slight micro-tilt drift observed in adjacent panel',
      batteryImpact: 'Moderate',
      estimatedEnergySaved: '54% vs Constant Polling'
    };
  }
  return {
    policy: SAMPLING_POLICIES.NORMAL,
    previousInterval: '10 min',
    currentInterval: '10 min',
    reason: 'Nominal baseline geotechnical stability',
    batteryImpact: 'Minimal Drain (Sleep Mode)',
    estimatedEnergySaved: '88% vs Constant Polling'
  };
}

// 7. EXPLAINABLE AI ("Why This Alert?")
export function generateExplainableAiAnalysis({
  riskLevel = 'CRITICAL',
  riskScore = 87,
  confidence = 94,
  dataQuality = 'LIVE',
  activeSensorsCount = 8,
  totalSensorsCount = 9,
  hotspotName = 'Panel 17-B'
}) {
  const isHigh = riskScore >= 50;

  const reasons = isHigh ? [
    {
      title: 'Accelerated Vertical Convergence',
      detail: `Extensometer displacement rate reached 3.4 mm/hr across ${hotspotName} crown pillar cluster.`,
      icon: 'arrow-down',
      type: 'critical'
    },
    {
      title: 'Angular Tilt Deviation Spalling',
      detail: 'Inclinometers register 4.8° NNE rotation, signaling differential sag across sandstone/shale contact.',
      icon: 'compass',
      type: 'warning'
    },
    {
      title: 'Micro-Seismic Acoustic Emission Corroboration',
      detail: 'Geophones detect 14.2 Hz fault-slip acoustic signature, indicating tensile shear fracture progression.',
      icon: 'activity',
      type: 'warning'
    },
    {
      title: 'Historical Instability Similarity',
      detail: 'Current deformation trajectory matches 88% correlation with Jharia Colliery 2024 depillaring failure.',
      icon: 'trending-up',
      type: 'info'
    }
  ] : [
    {
      title: 'Nominal Ground Stability',
      detail: 'All borehole extensometers and inclinometers operate within safe statutory baselines.',
      icon: 'check',
      type: 'nominal'
    },
    {
      title: 'Low Acoustic Emission Level',
      detail: 'No microseismic clustering or tensile fracture pulses observed in surrounding pillars.',
      icon: 'activity',
      type: 'nominal'
    }
  ];

  const recommendation = isHigh
    ? 'Restrict unauthorized personnel access to Panel 17-B tailgate. Reroute logistics via East Airway Bypass corridor. Initiate immediate hydraulic shield chock reinforcement.'
    : 'Maintain standard routine strata monitoring per project engineering practice. Next scheduled physical inspection in 4 hours.';

  return {
    riskLevel,
    riskScore,
    confidence,
    dataQuality,
    sensorsRatio: `${activeSensorsCount}/${totalSensorsCount}`,
    sensorsHealthSummary: activeSensorsCount === totalSensorsCount ? 'All Sensors Healthy' : '1 Node Excluded (Auto-Healed)',
    reasons,
    recommendation,
    modelName: 'XGBoost 5-Class V4.2 Ensemble',
    engineeringStandard: 'Project Standard 112 (Strata Control) - project-defined, not a statutory certification'
  };
}
