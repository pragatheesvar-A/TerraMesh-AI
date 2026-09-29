import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_KPIS,
  INITIAL_SENSORS,
  INITIAL_WORKERS,
  INITIAL_EVACUATION,
  INITIAL_AI_RISK,
  INITIAL_ALERTS,
  INITIAL_SENSOR_HEALTH,
  INITIAL_INFRASTRUCTURE,
  INITIAL_SYSTEM_STATUS,
  ZONES
} from '../services/mockData';
import { INITIAL_CONFIG } from '../services/initialConfig';
import {
  evaluateSensorHealth,
  computeShadowResidual,
  calculateAdaptiveFusionWeights,
  getDeformationDna,
  getVibrationFingerprint,
  getAdaptiveSamplingState,
  generateExplainableAiAnalysis,
  SENSOR_HEALTH_STATUSES,
  VIBRATION_CLASSES,
  SAMPLING_POLICIES
} from '../services/digitalTwinIntelligence';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../services/api';
import { processTwinEvent, updateEntityTimestamp } from '../services/twinEventValidator';
import { routeTwinEvent } from '../services/twinEventRouter';

const MineDataContext = createContext();

export function MineDataProvider({ children }) {
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [sensors, setSensors] = useState(INITIAL_SENSORS);
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [zones, setZones] = useState(ZONES);
  const [evacuation, setEvacuation] = useState(INITIAL_EVACUATION);
  const [routes, setRoutes] = useState([]);
  const [aiRisk, setAiRisk] = useState(INITIAL_AI_RISK);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [sensorHealth, setSensorHealth] = useState(INITIAL_SENSOR_HEALTH);
  const [infrastructure, setInfrastructure] = useState(INITIAL_INFRASTRUCTURE);
  const [systemStatus, setSystemStatus] = useState(INITIAL_SYSTEM_STATUS);

  // Global Settings Configuration
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('coal_mine_simple_settings_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CONFIG;
  });

  // Selected sensor node for flyout inspection
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Selected / Located worker for spatial map tracking
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Selected Zone for map centering
  const [selectedZone, setSelectedZone] = useState(null);

  const selectZoneNode = (zoneOrId) => {
    setSelectedZone(zoneOrId);
  };

  // Demo Mode State Machine
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAutoPlay, setDemoAutoPlay] = useState(true);
  const [demoMessage, setDemoMessage] = useState("");

  // Time and live sync
  const [lastSyncSeconds, setLastSyncSeconds] = useState(2);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio siren alert state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [sirenCountdown, setSirenCountdown] = useState(0);
  const audioContextRef = useRef(null);
  const activeAudioRef = useRef(null);
  const sirenNodesRef = useRef(null);
  const sirenTimerRef = useRef(null);

  // Stop Emergency Siren completely
  const stopEmergencySiren = useCallback(() => {
    if (sirenTimerRef.current) {
      clearInterval(sirenTimerRef.current);
      sirenTimerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }
    if (sirenNodesRef.current) {
      try {
        const { masterGain, lfo, osc1, osc2, ctx } = sirenNodesRef.current;
        const now = ctx.currentTime;
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        setTimeout(() => {
          try {
            lfo.stop();
            osc1.stop();
            osc2.stop();
            lfo.disconnect();
            osc1.disconnect();
            osc2.disconnect();
            masterGain.disconnect();
          } catch (e) {}
        }, 90);
      } catch (e) {}
      sirenNodesRef.current = null;
    }
    setIsSirenActive(false);
    setSirenCountdown(0);
  }, []);

  // Web Audio Fallback Synthesizer
  const playFallbackSynth = useCallback((type = 'caution', customDuration = null) => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      if (type === 'critical' || type === 'siren') {
        const duration = customDuration || 30;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.28, now);
        masterGain.gain.setValueAtTime(0.28, now + duration - 0.8);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        masterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sawtooth';
        lfo.frequency.setValueAtTime(2.6, now);
        lfoGain.gain.setValueAtTime(300, now);
        lfo.connect(osc1.frequency);
        lfo.connect(osc2.frequency);

        osc1.frequency.setValueAtTime(780, now);
        osc2.frequency.setValueAtTime(784, now);

        osc1.connect(masterGain);
        osc2.connect(masterGain);

        lfo.start(now);
        osc1.start(now);
        osc2.start(now);

        lfo.stop(now + duration);
        osc1.stop(now + duration);
        osc2.stop(now + duration);

        sirenNodesRef.current = { masterGain, lfo, osc1, osc2, ctx };
      } else if (type === 'warning' || type === 'ping') {
        [0, 0.18, 0.36].forEach((delay) => {
          const t = now + delay;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1750, t);
          osc.frequency.exponentialRampToValueAtTime(2350, t + 0.12);
          gain.gain.setValueAtTime(0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
        });
      } else {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.14;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.42);
        });
      }
    } catch (e) {
      console.warn("Fallback synth error", e);
    }
  }, []);

  // Play Alert Audio (uses uploaded critical.mpeg & warning.mpeg audio files with fallback)
  const playAlertSound = useCallback((type = 'critical', customDuration = null) => {
    if (!soundEnabled) setSoundEnabled(true);
    stopEmergencySiren();

    if (type === 'critical' || type === 'siren') {
      const duration = customDuration || 30; // 30s continuous evacuation siren
      try {
        const audio = new Audio('/sounds/critical.mpeg');
        audio.volume = 0.95;
        audio.loop = duration > 5;
        activeAudioRef.current = audio;
        
        audio.play().catch((err) => {
          console.warn("HTML5 critical.mpeg fallback to mp3/synth", err);
          try {
            const audioMp3 = new Audio('/sounds/critical.mp3');
            audioMp3.volume = 0.95;
            audioMp3.loop = duration > 5;
            activeAudioRef.current = audioMp3;
            audioMp3.play().catch(() => {
              playFallbackSynth('critical', duration);
            });
          } catch (e2) {
            playFallbackSynth('critical', duration);
          }
        });

        setIsSirenActive(true);
        setSirenCountdown(duration);

        let timeLeft = duration;
        sirenTimerRef.current = setInterval(() => {
          timeLeft -= 1;
          if (timeLeft <= 0) {
            stopEmergencySiren();
          } else {
            setSirenCountdown(timeLeft);
          }
        }, 1000);

      } catch (e) {
        playFallbackSynth('critical', duration);
      }
    } else if (type === 'warning' || type === 'ping') {
      try {
        const audio = new Audio('/sounds/warning.mpeg');
        audio.volume = 0.95;
        audio.onended = () => {
          if (activeAudioRef.current === audio) activeAudioRef.current = null;
        };
        activeAudioRef.current = audio;
        audio.play().catch((err) => {
          console.warn("HTML5 warning.mpeg fallback to mp3/synth", err);
          try {
            const audioMp3 = new Audio('/sounds/warning.mp3');
            audioMp3.volume = 0.95;
            audioMp3.onended = () => {
              if (activeAudioRef.current === audioMp3) activeAudioRef.current = null;
            };
            activeAudioRef.current = audioMp3;
            audioMp3.play().catch(() => {
              playFallbackSynth('warning');
            });
          } catch (e2) {
            playFallbackSynth('warning');
          }
        });
      } catch (e) {
        playFallbackSynth('warning');
      }
    } else {
      playFallbackSynth('caution');
    }
  }, [soundEnabled, stopEmergencySiren, playFallbackSynth]);

  // High-Impact Multi-Tone Emergency Siren Sound (30 seconds continuous)
  const playEmergencySiren = useCallback((duration = 30) => {
    playAlertSound('critical', duration);
  }, [playAlertSound]);

  // Buffer for data polling
  const pendingUpdatesRef = useRef({
    sensors: [],
    overview: null,
    alerts: []
  });

  const flushWebSocketBuffer = useCallback(() => {
    const buffer = pendingUpdatesRef.current;
    
    if (buffer.sensors.length > 0) {
      setSensors(prev => {
        let updated = [...prev];
        buffer.sensors.forEach(update => {
          const idx = updated.findIndex(s => s.id === update.id);
          if (idx >= 0) updated[idx] = { ...updated[idx], ...update };
          else updated.push(update);
        });
        return updated;
      });
      buffer.sensors = [];
    }

    if (buffer.overview) {
      const o = buffer.overview;
      setKpis(o.kpis);
      setAiRisk(o.risk_intelligence);
      setEvacuation(o.evacuation);
      setSensorHealth(o.sensor_health);
      setInfrastructure(o.infrastructure);
      setSystemStatus(o.system_status);
      buffer.overview = null;
    }

    if (buffer.alerts.length > 0) {
      setAlerts(prev => {
        let updated = [...prev];
        buffer.alerts.forEach(a => {
          updated = [a, ...updated.filter(ext => ext.id !== a.id)];
        });
        return updated;
      });
      buffer.alerts.forEach(a => {
        if (a.severity === 'CRITICAL') playAlertSound('critical');
        else if (a.severity === 'WARNING') playAlertSound('warning');
      });
      buffer.alerts = [];
    }
  }, [playAlertSound]);

  // Keep a mutable ref of the latest config to use inside websocket and intervals without triggering re-connects
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Live clock, sync ticker & organic real-time telemetry stream via WebSocket
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setLastSyncSeconds(prev => {
        const currentConfig = configRef.current;
        const limit = currentConfig?.general?.data?.pollingInterval || 1;
        if (prev >= limit) {
          flushWebSocketBuffer();
          return 1;
        }
        return prev + 1;
      });

      // Auto-update the current shift based on time
      setConfig(prev => {
        if (!prev || !prev.general || !prev.general.identity) return prev;
        const hour = now.getHours();
        let calculatedShift = "Shift A (06:00 - 14:00)";
        if (hour >= 14 && hour < 22) {
          calculatedShift = "Shift B (14:00 - 22:00)";
        } else if (hour >= 22 || hour < 6) {
          calculatedShift = "Shift C (22:00 - 06:00)";
        }
        
        if (prev.general.identity.operatingShift !== calculatedShift) {
          const newConfig = {
            ...prev,
            general: {
              ...prev.general,
              identity: {
                ...prev.general.identity,
                operatingShift: calculatedShift
              }
            }
          };
          localStorage.setItem('coal_mine_simple_settings_v4', JSON.stringify(newConfig));
          return newConfig;
        }
        return prev;
      });
    }, 1000);

    // Fetch initial data from Python Backend
    const fetchInitialData = async () => {
      try {
        const [sRes, wRes, zRes, aRes, oRes, rRes] = await Promise.all([
          apiFetch(`/api/sensors`),
          apiFetch(`/api/workers`),
          apiFetch(`/api/zones`),
          apiFetch(`/api/alerts`),
          apiFetch(`/api/dashboard/overview`),
          apiFetch(`/api/spatial/route-proximity?lat=23.75&lng=86.42&radius_m=10000`)
        ]);

        // Honest connectivity state: any successful backend response means
        // we are online; all-failed means OFFLINE (mock data stays visible,
        // now honestly labelled by dataQuality).
        const anyOk = [sRes.ok, wRes.ok, zRes.ok, aRes.ok, oRes.ok, rRes?.ok].some(Boolean);
        setIsOffline(!anyOk);

        if (sRes.ok) setSensors(await sRes.json());
        if (wRes.ok) setWorkers(await wRes.json());
        if (zRes.ok) setZones(await zRes.json());
        if (aRes.ok) setAlerts(await aRes.json());
        if (rRes?.ok) {
          const rData = await rRes.json();
          if (rData.routes) setRoutes(rData.routes);
        }
        if (oRes.ok) {
          const overview = await oRes.json();
          setKpis(overview.kpis);
          setAiRisk(overview.risk_intelligence);
          setEvacuation(overview.evacuation);
          setSensorHealth(overview.sensor_health);
          setInfrastructure(overview.infrastructure);
          setSystemStatus(overview.system_status);
        }
      } catch (err) {
        setIsOffline(true);
        console.error("Backend unreachable — displaying locally-cached (SIMULATED-label) data:", err.message);
      }
    };

    fetchInitialData();

    // Connect to Live Python Backend WebSocket — with automatic reconnection
    // (exponential backoff, capped at 30s) so live updates survive backend
    // restarts and network drops.
    let ws = null;
    let wsReconnectAttempts = 0;
    let wsReconnectTimer = null;
    let wsClosedByUser = false;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl());

      ws.onopen = () => {
        wsReconnectAttempts = 0;
        console.log("[WS] Connected to AI Backend WebSocket");
      };

      ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'CONNECTED') {
          console.log("Connected to AI Backend WebSocket");
        }
        else if (msg.type === 'STATE_UPDATE') {
          // A global state change (e.g. demo step triggered on backend)
          // Re-fetch all dynamic arrays to stay in perfect sync
          fetchInitialData();
        }
        else if (msg.type === 'SENSOR_UPDATE') {
          const { node_id, data, ml_prediction, overview } = msg;
          // Phase 3: Convert to Twin event format for validation
          const twinEvent = {
            event_id: `sensor-${node_id}-${Date.now()}`,
            entity_id: node_id,
            entity_type: 'sensor',
            event_type: 'status_update',
            source: 'websocket',
            timestamp: new Date().toISOString(),
            payload: { node_id, data, ml_prediction, overview }
          };
          
          // Phase 3: Validate event using Twin event validator
          const validationResult = processTwinEvent(twinEvent);
          if (!validationResult.shouldProcess) {
            console.warn(`[Twin Validator] Event rejected: ${validationResult.reason}`, validationResult.errors);
            return;
          }
          
          // Update entity timestamp for stale detection
          updateEntityTimestamp(node_id, twinEvent.timestamp);
          
          // Phase 3: Route event to Twin state for selective updates
          routeTwinEvent(twinEvent, { sensors }, (updates) => {
            if (updates.sensors) setSensors(updates.sensors);
          });
          
          pendingUpdatesRef.current.sensors.push({
            id: node_id,
            ...data,
            status: ml_prediction.status,
            ai_risk_score: ml_prediction.ai_risk_score,
            last_update: "Just now (Live IoT)"
          });
          if (overview) pendingUpdatesRef.current.overview = overview;
        }
        else if (msg.type === 'TELEMETRY_UPDATE') {
          // Real MQTT/edge pipeline events (validated -> Kalman -> ML -> risk)
          const { node_id, decision, provenance, model_loaded } = msg;
          if (node_id && decision) {
            // Phase 3: Convert to Twin event format for validation
            const twinEvent = {
              event_id: `telemetry-${node_id}-${Date.now()}`,
              entity_id: node_id,
              entity_type: 'sensor',
              event_type: 'telemetry_update',
              source: 'mqtt',
              timestamp: new Date().toISOString(),
              payload: { node_id, decision, provenance, model_loaded }
            };
            
            // Phase 3: Validate event using Twin event validator
            const validationResult = processTwinEvent(twinEvent);
            if (!validationResult.shouldProcess) {
              console.warn(`[Twin Validator] Event rejected: ${validationResult.reason}`, validationResult.errors);
              return;
            }
            
            // Update entity timestamp for stale detection
            updateEntityTimestamp(node_id, twinEvent.timestamp);
            
            pendingUpdatesRef.current.sensors.push({
              id: node_id,
              ai_risk_score: Math.round(decision.composite_risk_score ?? 0),
              status: decision.warning_tier === 'CRITICAL' ? 'CRITICAL'
                    : decision.warning_tier === 'WARNING' ? 'WARNING'
                    : decision.warning_tier === 'WATCH' ? 'CAUTION' : 'SAFE',
              last_update: provenance === 'SIMULATION'
                ? "Simulated playback (labelled)"
                : `Just now (Edge pipeline${model_loaded === false ? ', degraded model' : ''})`
            });
          }
        }
        else if (msg.type === 'ALERT_NEW') {
          pendingUpdatesRef.current.alerts.push(msg.data);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
      };

      ws.onclose = () => {
        console.log("[WS] Connection lost");
        if (wsClosedByUser) return;
        // Exponential backoff reconnect: 2s, 4s, 8s ... capped at 30s
        const delay = Math.min(2000 * Math.pow(2, wsReconnectAttempts), 30000);
        wsReconnectAttempts += 1;
        wsReconnectTimer = setTimeout(connectWebSocket, delay);
      };

      ws.onerror = () => {
        // onclose fires after onerror; nothing extra needed here
      };
    };

    connectWebSocket();

    return () => {
      wsClosedByUser = true;
      clearTimeout(wsReconnectTimer);
      if (ws) ws.close();
      clearInterval(timer);
    };
  }, [playAlertSound]);

  // Set default selected sensor to NODE-017 for immediate rich inspection
  useEffect(() => {
    const node17 = sensors.find(s => s.id === "NODE-017");
    if (node17) setSelectedSensor(node17);
  }, []);

  // Demo step processor
  const applyDemoStep = useCallback((step) => {
    setDemoStep(step);
    setLastSyncSeconds(1);

    switch (step) {
      case 0:
        // NORMAL: All zones GREEN, nominal telemetry (0-0.2° Tilt, 0-2 mm/day Disp, 0-1 mm Crack, 0-2 mm/s Vibration)
        setDemoMessage("Baseline: All zones GREEN. Nominal geotechnical parameters.");
        setKpis({
          active_sensors_total: 48,
          active_sensors_online: 47,
          active_sensors_offline: 1,
          monitored_workers_total: 126,
          monitored_workers_safe: 126,
          monitored_workers_risk: 0,
          safe_zones_count: 48,
          safe_zones_status: "Stable",
          warning_zones_count: 0,
          warning_zones_delta: "0 from previous hour",
          critical_zones_count: 0,
          critical_zones_status: "Nominal"
        });
        setAiRisk({
          current_risk_score: 12,
          risk_level: "SAFE",
          trend_percentage: 0,
          trend_direction: "stable",
          prediction: "All mining panels operating within nominal baseline parameters.",
          factors: [
            { name: "Tilt Change", value: 6, color: "#10b981" },
            { name: "Displacement Rate", value: 8, color: "#10b981" },
            { name: "Crack Widening", value: 4, color: "#10b981" },
            { name: "Vibration", value: 5, color: "#10b981" },
            { name: "Historical Trend", value: 5, color: "#10b981" }
          ],
          ai_confidence: 96,
          disclaimer: "Prototype decision-support visualization for Smart India Hackathon (SIH26025)."
        });
        setZones(prev => prev.map(z => ({
          ...z,
          status: "SAFE",
          risk_score: 12,
          color: "#10b981",
          fillColor: "rgba(16, 185, 129, 0.15)"
        })));
        setSensors(prev => prev.map(s => {
          if (s.id === "NODE-048") return s;
          return {
            ...s,
            tilt: 0.15,
            displacement: 0.8,
            crack_width: 0.2,
            vibration: "LOW",
            ai_risk_score: 12,
            status: "SAFE"
          };
        }));
        setWorkers(prev => prev.map(w => ({ ...w, status: "SAFE" })));
        setEvacuation(prev => ({
          ...prev,
          target_zone: "ZONE B",
          zone_status: "SAFE",
          route_a_status: "SAFE",
          route_b_status: "SAFE",
          workers_at_risk: 0,
          recommended_action: "NORMAL DRIFT PASSAGE AVAILABLE"
        }));
        break;

      case 1:
        // Sensor detects safe drift (0.2–0.5° Tilt, 2–5 mm/day Disp)
        setDemoMessage("Phase 1: Sensor NODE-017 registers safe drift (+0.35° tilt, 3.2 mm/day disp).");
        playAlertSound('caution');
        setKpis(prev => ({
          ...prev,
          warning_zones_count: 1,
          warning_zones_delta: "+1 from last check",
          safe_zones_count: 47
        }));
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          tilt: 0.35,
          displacement: 3.2,
          crack_width: 1.8,
          ai_risk_score: 32,
          status: "SAFE"
        } : s));
        setZones(prev => prev.map(z => z.id === "zone-b" ? {
          ...z,
          status: "SAFE",
          risk_score: 32,
          color: "#06b6d4",
          fillColor: "rgba(6, 182, 212, 0.2)"
        } : z));
        setAiRisk(prev => ({
          ...prev,
          current_risk_score: 32,
          risk_level: "SAFE",
          trend_percentage: 5,
          prediction: "Micro-tilt safe drift on crown pillar 17-B. Parameters within 0.2–0.5° safe band."
        }));
        break;

      case 2:
        // Displacement increases into Warning band (5–20 mm/day, 0.5–1.0° Tilt)
        setDemoMessage("Phase 2: Extensometer displacement increases to 8.6 mm/day (Warning: 5–20 mm/day).");
        playAlertSound('warning');
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          tilt: 0.75,
          displacement: 8.6,
          crack_width: 4.8,
          vibration: "HIGH",
          ai_risk_score: 58,
          status: "WARNING"
        } : s));
        setZones(prev => prev.map(z => z.id === "zone-b" ? {
          ...z,
          status: "WARNING",
          risk_score: 58,
          color: "#f97316",
          fillColor: "rgba(249, 115, 22, 0.25)"
        } : z));
        setAiRisk(prev => ({
          ...prev,
          current_risk_score: 58,
          risk_level: "WARNING",
          trend_percentage: 14,
          prediction: "Vertical convergence velocity enters Warning threshold (8.6 mm/day) in Zone B."
        }));
        break;

      case 3:
        // Crack widening into Warning band (3–10mm)
        setDemoMessage("Phase 3: Crack gauge widens to 6.8mm (Warning: 3–10mm band). Vibration accelerates.");
        playAlertSound('warning');
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          tilt: 0.92,
          displacement: 14.5,
          crack_width: 6.8,
          vibration: "HIGH",
          ai_risk_score: 69,
          status: "WARNING"
        } : s));
        setAiRisk(prev => ({
          ...prev,
          current_risk_score: 69,
          risk_level: "WARNING",
          trend_percentage: 16,
          prediction: "Crack dilation rate approaching critical boundary (>10mm threshold)."
        }));
        break;

      case 4:
        // Emergency / Critical Level (>1.0° Tilt, >20 mm/day Disp, >10 mm Crack, >10 mm/s Vibration)
        setDemoMessage("Phase 4: EMERGENCY! Zone B turns RED (Tilt 4.8°, Sag 24.6 mm/day, Crack 12.4mm). 7 workers flagged in DANGER.");
        playAlertSound('critical');
        setKpis(prev => ({
          ...prev,
          critical_zones_count: 1,
          critical_zones_status: "Zone B Imminent Failure",
          monitored_workers_risk: 7,
          monitored_workers_safe: 119
        }));
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          tilt: 4.8,
          displacement: 24.6,
          crack_width: 12.4,
          vibration: "HIGH",
          ai_risk_score: 87,
          status: "CRITICAL",
          sampling_interval: "5 sec",
          power_profile: "High Frequency Burst 🚨"
        } : s));
        setZones(prev => prev.map(z => z.id === "zone-b" ? {
          ...z,
          status: "CRITICAL",
          risk_score: 87,
          color: "#ef4444",
          fillColor: "rgba(239, 68, 68, 0.35)"
        } : z));
        setWorkers(prev => prev.map(w => {
          if (["w-23", "w-41", "w-15", "w-34", "w-45", "w-62", "w-77"].includes(w.id)) {
            return { ...w, status: "DANGER", heart_rate: 114 };
          }
          return w;
        }));
        setAiRisk(prev => ({
          ...prev,
          current_risk_score: 87,
          risk_level: "CRITICAL",
          trend_percentage: 18,
          prediction: "EMERGENCY: Imminent crown pillar shearing predicted in Zone B within 28 minutes."
        }));
        break;

      case 3:
        // Crack width increases & vibration spikes
        setDemoMessage("Phase 3: Fissure gauge widens to 5.4mm. Acoustic vibration spike detected.");
        playAlertSound('critical');
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          crack_width: 5.4,
          vibration: "HIGH",
          ai_risk_score: 72,
          status: "WARNING"
        } : s));
        setAiRisk(prev => ({
          ...prev,
          current_risk_score: 72,
          risk_level: "WARNING",
          trend_percentage: 36,
          prediction: "Tensile crack propagating through shale roof bed in Zone B depillaring section."
        }));
        break;

      case 4:
        // AI Anomaly detected, Zone B turns RED, 7 workers flagged in danger!
        setDemoMessage("Phase 4: CRITICAL ANOMALY! Zone B turns RED. 7 workers in Zone B flagged DANGER!");
        playAlertSound('critical');
        setKpis({
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
        });
        setZones(prev => prev.map(z => z.id === "zone-b" ? {
          ...z,
          status: "CRITICAL",
          risk_score: 87,
          color: "#ef4444",
          fillColor: "rgba(239, 68, 68, 0.3)"
        } : z));
        setSensors(prev => prev.map(s => s.id === "NODE-017" ? {
          ...s,
          tilt: 4.8,
          displacement: 12.4,
          crack_width: 7.2,
          vibration: "HIGH",
          ai_risk_score: 87,
          status: "CRITICAL"
        } : s));
        setWorkers(prev => prev.map(w => {
          if (["w-23", "w-41", "w-15", "w-34", "w-45", "w-62", "w-77"].includes(w.id)) {
            return { ...w, status: "DANGER", heart_rate: 112 };
          }
          if (["w-52", "w-12", "w-28", "w-39", "w-66", "w-81", "w-93", "w-104", "w-115", "w-120"].includes(w.id)) {
            return { ...w, status: "CAUTION" };
          }
          return w;
        }));
        setAiRisk({
          current_risk_score: 87,
          risk_level: "CRITICAL",
          trend_percentage: 18,
          trend_direction: "up",
          prediction: "Deformation is increasing in Zone B.",
          factors: [
            { name: "Tilt Change", value: 32, color: "#ef4444" },
            { name: "Displacement Rate", value: 27, color: "#f97316" },
            { name: "Crack Widening", value: 18, color: "#eab308" },
            { name: "Vibration", value: 10, color: "#06b6d4" },
            { name: "Historical Trend", value: 13, color: "#8b5cf6" }
          ],
          ai_confidence: 91,
          disclaimer: "Prototype decision-support visualization for Smart India Hackathon (SIH26025)."
        });
        break;

      case 5:
        // Evacuation Route A blocked, AI reroutes to Route B, Alert generated
        setDemoMessage("Phase 5: Route A BLOCKED by roof collapse. AI auto-reroutes 7 workers to Route B!");
        playAlertSound('critical');
        setEvacuation({
          target_zone: "ZONE B",
          zone_status: "CRITICAL",
          route_a_status: "BLOCKED",
          route_b_status: "SAFE",
          workers_at_risk: 7,
          recommended_action: "EVACUATE THROUGH ROUTE B",
          routes: INITIAL_EVACUATION.routes,
          flow_steps: INITIAL_EVACUATION.flow_steps
        });
        setAlerts(prev => {
          const exists = prev.some(a => a.id === "ALT-DEMO-EVAC");
          if (exists) return prev;
          return [
            {
              id: "ALT-DEMO-EVAC",
              severity: "CRITICAL",
              title: "EMERGENCY: Zone B Route A Blocked — AI Reroute to Route B Active",
              description: "Pillar 12 timber beam sheared. Evacuation path automatically switched to East Airway Drift. 7 workers notified via pager vibrator.",
              zone: "Zone B",
              timestamp: new Date().toLocaleTimeString(),
              acknowledged: false
            },
            ...prev
          ];
        });
        break;

      default:
        break;
    }
  }, [playAlertSound]);

  // Demo auto-stepper
  useEffect(() => {
    if (!demoActive || !demoAutoPlay) return;

    const interval = setInterval(() => {
      setDemoStep(current => {
        const next = current >= 5 ? 0 : current + 1;
        applyDemoStep(next);
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [demoActive, demoAutoPlay, applyDemoStep]);

  // Toggle demo mode
  const toggleDemoMode = () => {
    if (demoActive) {
      setDemoActive(false);
      setDemoStep(0);
      applyDemoStep(4); // return to default full state
      setDemoMessage("");
    } else {
      setDemoActive(true);
      setDemoStep(0);
      applyDemoStep(0);
    }
  };

  // Acknowledge alert — local state update + server-side acknowledgement
  // (previously local-only; the backend record is what audits see)
  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    apiFetch(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'POST' })
      .then(res => { if (!res.ok) console.warn('[ACK] server acknowledgement failed:', res.status); })
      .catch(err => console.warn('[ACK] server unreachable:', err.message));
  };

  // Broadcast emergency warning
  const broadcastEmergency = (zoneName, customMsg, severity = 'CRITICAL') => {
    const sev = severity ? severity.toUpperCase() : 'CRITICAL';
    const newAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      severity: sev,
      title: `${sev} BROADCAST — ${zoneName.toUpperCase()}`,
      description: customMsg || `Immediate alert dispatched for ${zoneName}. Proceed as instructed.`,
      zone: zoneName,
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev]);

    if (sev === 'CRITICAL') {
      playAlertSound('critical');
    } else if (sev === 'WARNING') {
      playAlertSound('warning');
    } else {
      playAlertSound('caution');
    }
    return newAlert;
  };

  // Select sensor
  const selectSensorNode = (nodeOrId) => {
    if (typeof nodeOrId === 'string') {
      const found = sensors.find(s => s.id === nodeOrId);
      if (found) setSelectedSensor(found);
    } else {
      setSelectedSensor(nodeOrId);
    }
  };

  // Select / Locate worker
  const selectWorkerNode = (workerOrId) => {
    if (typeof workerOrId === 'string') {
      const found = workers.find(w => w.id === workerOrId || w.code === workerOrId);
      if (found) setSelectedWorker(found);
    } else {
      setSelectedWorker(workerOrId);
    }
  };

  // Simulation scenario states
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState('CRITICAL');
  const [isOffline, setIsOffline] = useState(false);

  // Data authenticity state: LIVE vs SIMULATED vs DEGRADED
  const dataQuality = (isSimulating || demoActive) ? 'SIMULATED' : (isOffline ? 'OFFLINE' : 'LIVE');

  const runScenario = useCallback((scenarioId) => {
    setActiveScenario(scenarioId);
    setIsSimulating(true);
    if (scenarioId === 'NORMAL') {
      applyDemoStep(0);
    } else if (scenarioId === 'WATCH') {
      applyDemoStep(1);
    } else if (scenarioId === 'WARNING') {
      applyDemoStep(2);
    } else if (scenarioId === 'CRITICAL') {
      applyDemoStep(4);
    } else if (scenarioId === 'SENSOR_FAILURE') {
      // Scenario B: S-17 freezes -> health drops -> weight drops to 0% -> self-healing
      setDemoMessage("Scenario B: NODE-017 ADC sensor frozen at 14.2mm. Self-healing engine drops weight to 0% and transfers load to adjacent nodes.");
      playAlertSound('warning');
      setSensors(prev => prev.map(s => {
        if (s.id === 'NODE-017') {
          return {
            ...s,
            isFrozen: true,
            frozen_detected: true,
            displacement: 14.2,
            tilt: 0.1,
            status: 'DEGRADED',
            health_note: 'ADC Frozen: Constant Value'
          };
        }
        return s;
      }));
    }
  }, [applyDemoStep, playAlertSound]);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setActiveScenario('NORMAL');
    setSensors(prev => prev.map(s => ({
      ...s,
      isFrozen: false,
      frozen_detected: false,
      health_note: null
    })));
    applyDemoStep(0);
  }, [applyDemoStep]);

  return (
    <MineDataContext.Provider value={{
      kpis,
      sensors,
      workers,
      routes,
      zones,
      evacuation,
      aiRisk,
      config,
      setConfig,
      alerts,
      sensorHealth,
      infrastructure,
      systemStatus,
      selectedSensor,
      selectSensorNode,
      selectedWorker,
      setSelectedWorker,
      selectWorkerNode,
      locateWorkerOnMap: selectWorkerNode,
      selectedZone,
      selectZoneNode,
      demoActive,
      demoStep,
      demoAutoPlay,
      setDemoAutoPlay,
      demoMessage,
      toggleDemoMode,
      applyDemoStep,
      isSimulating,
      activeScenario,
      runScenario,
      resetSimulation,
      dataQuality,
      isOffline,
      setIsOffline,
      soundEnabled,
      setSoundEnabled,
      playAlertSound,
      playSoundAlert: playAlertSound,
      playEmergencySiren,
      stopEmergencySiren,
      isSirenActive,
      sirenCountdown,
      lastSyncSeconds,
      currentTime,
      acknowledgeAlert,
      broadcastEmergency,
      // Intelligence Engine Helpers
      evaluateSensorHealth,
      computeShadowResidual,
      calculateAdaptiveFusionWeights,
      getDeformationDna,
      getVibrationFingerprint,
      getAdaptiveSamplingState,
      generateExplainableAiAnalysis,
      SENSOR_HEALTH_STATUSES,
      VIBRATION_CLASSES,
      SAMPLING_POLICIES
    }}>
      {children}
    </MineDataContext.Provider>
  );
}

export function useMineData() {
  return useContext(MineDataContext);
}
