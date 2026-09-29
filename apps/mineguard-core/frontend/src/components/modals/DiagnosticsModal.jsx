import React, { useState } from 'react';
import { 
  X, Wrench, Search, RefreshCw, Cpu, Battery, Wifi, CheckCircle2, 
  AlertTriangle, Zap, Clock, MapPin, Eye, ArrowRight, ShieldAlert, Activity, Info
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function DiagnosticsModal({ isOpen, onClose, onLocateOnMap }) {
  const { sensors, selectSensorNode } = useMineData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [calibratingId, setCalibratingId] = useState(null);
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  const [inspectedSensor, setInspectedSensor] = useState(null);

  if (!isOpen) return null;

  // Filter sensors
  const filteredSensors = sensors.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) || 
                          s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.zone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate diagnostic breakdown for each sensor
  const getSensorDiagnosis = (s) => {
    if (s.status === 'CRITICAL') {
      return {
        severity: 'CRITICAL',
        summary: `Roof sag ${s.displacement}mm (>5.0mm limit) & crack opening ${s.crack_width}mm with ${s.vibration} vibration.`,
        cause: 'Accelerated strata deformation and tensile fracturing in depillaring section.',
        thresholdViolation: true,
        action: 'Immediate worker clearance & installation of supplementary hydraulic supports.'
      };
    }
    if (s.status === 'WARNING') {
      return {
        severity: 'WARNING',
        summary: `Elevated displacement (${s.displacement}mm) & tilt (${s.tilt}°) approaching project engineering limit.`,
        cause: 'Bed separation detected in immediate roof strata; 30-second rapid sampling active.',
        thresholdViolation: false,
        action: 'Tighten surveillance interval and inspect pillar rib convergence.'
      };
    }
    if (s.status === 'CAUTION') {
      return {
        severity: 'CAUTION',
        summary: `Minor strata movement (${s.displacement}mm displ, ${s.tilt}° tilt).`,
        cause: 'Micro-fractures developing under normal extraction load; 1-min surveillance active.',
        thresholdViolation: false,
        action: 'Routine inspection during changeover shift.'
      };
    }
    if (s.status === 'OFFLINE') {
      return {
        severity: 'OFFLINE',
        summary: 'LoRaWAN gateway heartbeat missed; 0% battery charge.',
        cause: 'Power subsystem exhausted or physical LoRa mesh antenna obstruction.',
        thresholdViolation: false,
        action: 'Dispatch field technician for battery/transceiver swap.'
      };
    }
    return {
      severity: 'SAFE',
      summary: 'All geotechnical parameters within project baseline engineering limits.',
      cause: 'Stable strata conditions. Energy-saving 10-minute eco sampling active.',
      thresholdViolation: false,
      action: 'Nominal autonomous monitoring.'
    };
  };

  const handleCalibrate = (id, e) => {
    if (e) e.stopPropagation();
    setCalibratingId(id);
    setTimeout(() => {
      setCalibratingId(null);
      setCalibrationStatus(`Sensor ${id} zero-tare baseline recalibration completed successfully!`);
      setTimeout(() => setCalibrationStatus(null), 3500);
    }, 800);
  };

  const handleLocateOnMap = (sensor, e) => {
    if (e) e.stopPropagation();
    selectSensorNode(sensor);
    if (onLocateOnMap) {
      onLocateOnMap(sensor);
    } else {
      onClose();
    }
  };

  const criticalCount = sensors.filter(s => s.status === 'CRITICAL').length;
  const warningCount = sensors.filter(s => s.status === 'WARNING').length;
  const cautionCount = sensors.filter(s => s.status === 'CAUTION').length;
  const safeCount = sensors.filter(s => s.status === 'SAFE').length;
  const offlineCount = sensors.filter(s => s.status === 'OFFLINE').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-5 md:p-6 font-mono text-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-sans text-[#F8FAFC]">
                SENSOR NETWORK DIAGNOSTICS & TELEMETRY MATRIX
              </h2>
              <p className="text-xs text-slate-400">
                48 Geotechnical Sensor Nodes &bull; LoRaWAN 868MHz Mesh &bull; Energy-Aware Adaptive Sampling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#162235] hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Calibration Feedback Banner */}
        {calibrationStatus && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold text-center animate-fade-in">
            ✓ {calibrationStatus}
          </div>
        )}

        {/* Quick Diagnostic Counts & Adaptive Sampling Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3 text-xs">
          <div className="p-2 rounded-xl bg-[#162235] border border-slate-700 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">TOTAL NODES</span>
            <span className="text-lg font-black text-[#F8FAFC]">{sensors.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-red-400 font-bold">CRITICAL 🚨</span>
            <span className="text-lg font-black text-red-400">{criticalCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-orange-950/40 border border-orange-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-orange-400 font-bold">WARNING ⚠️</span>
            <span className="text-lg font-black text-orange-400">{warningCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 font-bold">CAUTION ⚠️</span>
            <span className="text-lg font-black text-amber-400">{cautionCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 font-bold">SAFE 🔋</span>
            <span className="text-lg font-black text-emerald-400">{safeCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold">OFFLINE 📡</span>
            <span className="text-lg font-black text-slate-400">{offlineCount}</span>
          </div>
        </div>

        {/* 🔋 Adaptive Sampling Strip */}
        <div className="p-2.5 mb-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🔋</span>
            <div>
              <span className="font-bold text-emerald-400">Energy-Aware Adaptive Sampling Engine:</span>
              <span className="text-slate-300 ml-1.5 text-[11px] hidden sm:inline font-sans">
                &ldquo;Sensors work slowly when safe (10m) and faster when danger is detected (30s &ndash; 5s)&rdquo;
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-semibold">
              Safe: 10 min
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700 font-semibold">
              Warning: 30s
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700 font-bold animate-pulse">
              Critical: 5s
            </span>
          </div>
        </div>

        {/* Controls: Search & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Node ID, Name, Zone or Diagnostic Cause..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#162235] border border-slate-700 text-xs text-[#F8FAFC] placeholder-slate-400 focus:border-[#06B6D4] outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#162235] p-0.5 rounded-lg border border-slate-700 text-[10px]">
            {['ALL', 'CRITICAL', 'WARNING', 'CAUTION', 'SAFE', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  statusFilter === status ? 'bg-[#06B6D4] text-[#0B0F17] font-extrabold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Sensors Table & Problem Diagnosis View */}
        <div className="flex-1 overflow-y-auto border border-slate-700/80 rounded-xl bg-[#111827] text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#162235] border-b border-slate-800 text-[11px] text-slate-400">
              <tr>
                <th className="p-2.5">Node ID</th>
                <th className="p-2.5">Zone & Type</th>
                <th className="p-2.5 text-center">Adaptive Sampling</th>
                <th className="p-2.5 text-center">Displacement</th>
                <th className="p-2.5 text-center">Crack</th>
                <th className="p-2.5 text-center">Tilt</th>
                <th className="p-2.5 text-center">AI Risk</th>
                <th className="p-2.5">Problem Diagnosis / Health Cause</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Map & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSensors.map((s) => {
                const isCrit = s.status === 'CRITICAL';
                const isWarn = s.status === 'WARNING';
                const isCaut = s.status === 'CAUTION';
                const isOff = s.status === 'OFFLINE';
                const diagnosis = getSensorDiagnosis(s);

                const statusBadge = isCrit
                  ? 'bg-red-950/80 text-red-400 border-red-800 animate-pulse'
                  : (isWarn ? 'bg-orange-950/80 text-orange-400 border-orange-800' : (isCaut ? 'bg-amber-950/80 text-amber-400 border-amber-800' : (isOff ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800')));

                const intervalBadge = isCrit
                  ? 'bg-red-950/60 text-red-400 border-red-800 animate-pulse'
                  : (isWarn ? 'bg-amber-950/60 text-amber-400 border-amber-800' : (isCaut ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800' : (isOff ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800')));

                const isInspected = inspectedSensor?.id === s.id;

                return (
                  <tr 
                    key={s.id} 
                    onClick={() => setInspectedSensor(isInspected ? null : s)}
                    className={`cursor-pointer transition-colors ${
                      isInspected 
                        ? 'bg-[#162235] border-l-4 border-l-[#06B6D4]' 
                        : (isCrit ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-[#162235]')
                    }`}
                  >
                    <td className="p-2.5 font-bold text-[#F8FAFC] flex items-center gap-1.5 whitespace-nowrap">
                      <Cpu className={`w-3.5 h-3.5 ${isCrit ? 'text-red-400 animate-pulse' : 'text-[#06B6D4]'}`} />
                      <span>{s.id}</span>
                    </td>
                    <td className="p-2.5 text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-[#F8FAFC]">{s.zone}</div>
                      <div className="text-[10px] text-slate-400">{s.name}</div>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${intervalBadge}`}>
                        {s.sampling_interval || (isCrit ? '5 sec' : (isWarn ? '30 sec' : '10 min'))}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold whitespace-nowrap">
                      <span className={s.displacement > 5.0 ? 'text-red-400 font-extrabold' : (s.displacement > 2.0 ? 'text-amber-400' : 'text-[#F8FAFC]')}>
                        {s.displacement} mm
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold whitespace-nowrap">
                      <span className={s.crack_width > 3.0 ? 'text-red-400 font-extrabold' : (s.crack_width > 1.0 ? 'text-orange-400' : 'text-[#F8FAFC]')}>
                        {s.crack_width} mm
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold whitespace-nowrap text-[#F8FAFC]">
                      {s.tilt}°
                    </td>
                    <td className="p-2.5 text-center font-bold whitespace-nowrap">
                      <span className={s.ai_risk_score > 70 ? 'text-red-400' : (s.ai_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400')}>
                        {s.ai_risk_score}%
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 max-w-[320px]">
                      <div className={`text-[11px] leading-tight ${isCrit ? 'text-red-400 font-semibold' : (isWarn ? 'text-amber-400' : (isCaut ? 'text-yellow-400' : (isOff ? 'text-slate-400' : 'text-[#F8FAFC]')))}`}>
                        {diagnosis.summary}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate font-sans">
                        {diagnosis.action}
                      </div>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${statusBadge}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleLocateOnMap(s, e)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-[#06B6D4] hover:text-[#0B0F17] text-[#06B6D4] border border-[#06B6D4]/40 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                          title="Locate & Focus on Live GIS Map"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Show on Map</span>
                        </button>
                        <button
                          onClick={(e) => handleCalibrate(s.id, e)}
                          disabled={calibratingId === s.id || isOff}
                          className="px-2 py-1 rounded-lg bg-[#162235] hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] cursor-pointer"
                          title="Zero-tare baseline recalibration"
                        >
                          {calibratingId === s.id ? 'Calibrating...' : 'Tare'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Sensor Deep Problem Inspector Card */}
        {inspectedSensor && (
          <div className="mt-3 p-3.5 rounded-xl bg-[#162235] border border-[#06B6D4]/50 text-xs shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${inspectedSensor.status === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                <span className="font-bold text-[#F8FAFC] text-sm">
                  {inspectedSensor.id} &bull; {inspectedSensor.name} ({inspectedSensor.zone})
                </span>
                <span className="text-slate-400 text-[11px]">
                  Depth: -{inspectedSensor.depth_m || 140}m &bull; Coords: [{inspectedSensor.lat}, {inspectedSensor.lng}]
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleLocateOnMap(inspectedSensor, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] text-[#0B0F17] font-extrabold text-xs shadow-sm hover:bg-[#0891B2] transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>LOCATE & TRACK ON LIVE MAP</span>
                </button>
                <button
                  onClick={() => setInspectedSensor(null)}
                  className="p-1 rounded-lg bg-[#111827] border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Problem Cause & System Diagnosis */}
              <div className="p-2.5 rounded-xl bg-[#111827] border border-slate-700 shadow-sm">
                <div className="text-[10px] text-amber-400 font-bold uppercase mb-1">
                  Why does this sensor have a problem?
                </div>
                <p className="text-[#F8FAFC] text-[11px] leading-relaxed mb-2 font-sans">
                  {getSensorDiagnosis(inspectedSensor).cause}
                </p>
                <div className="text-[10px] text-slate-400 font-sans">
                  <strong className="text-[#F8FAFC]">Project Action: </strong>
                  {getSensorDiagnosis(inspectedSensor).action}
                </div>
              </div>

              {/* Threshold Comparison Table */}
              <div className="p-2.5 rounded-xl bg-[#111827] border border-slate-700 shadow-sm">
                <div className="text-[10px] text-[#06B6D4] font-bold uppercase mb-1">
                  Engineering Safety Safety Limits
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300">
                  <div>Parameter</div>
                  <div className="text-center">Limit</div>
                  <div className="text-right">Measured</div>
                  
                  <div className="text-slate-400">Displacement:</div>
                  <div className="text-center text-slate-400">&le; 5.0 mm</div>
                  <div className={`text-right font-bold ${inspectedSensor.displacement > 5.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {inspectedSensor.displacement} mm
                  </div>

                  <div className="text-slate-400">Crack Width:</div>
                  <div className="text-center text-slate-400">&le; 3.0 mm</div>
                  <div className={`text-right font-bold ${inspectedSensor.crack_width > 3.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {inspectedSensor.crack_width} mm
                  </div>

                  <div className="text-slate-400">Strata Tilt:</div>
                  <div className="text-center text-slate-400">&le; 3.0°</div>
                  <div className={`text-right font-bold ${inspectedSensor.tilt > 3.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {inspectedSensor.tilt}°
                  </div>
                </div>
              </div>

              {/* Power & LoRa Link Status */}
              <div className="p-2.5 rounded-xl bg-[#111827] border border-slate-700 shadow-sm">
                <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                  Power & Adaptive Sampling Status
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Battery Level:</span>
                    <strong className="text-[#F8FAFC]">{inspectedSensor.battery}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>LoRa Mesh Signal:</span>
                    <strong className="text-[#06B6D4]">{inspectedSensor.lora_signal}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sampling Cadence:</span>
                    <strong className="text-amber-400">{inspectedSensor.sampling_interval || '10 min'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Showing {filteredSensors.length} of {sensors.length} nodes &bull; Click any row to inspect geotechnical root cause &bull; Click &ldquo;Show on Map&rdquo; to locate
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold text-xs shadow-md cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
}
