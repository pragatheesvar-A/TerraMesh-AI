import React from 'react';
import { 
  X, AlertTriangle, Battery, Wifi, Activity, Gauge, 
  Clock, ShieldAlert, Cpu, Wrench, RefreshCw, CheckCircle2, Compass, Layers 
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function SensorFlyout({ onOpenDiagnostics }) {
  const { selectedSensor, selectSensorNode, broadcastEmergency } = useMineData();

  if (!selectedSensor) return null;

  const isCritical = selectedSensor.status === 'CRITICAL';
  const isWarning = selectedSensor.status === 'WARNING';

  const statusColor = isCritical 
    ? 'text-red-400 border-red-500/40 bg-red-950/50' 
    : (isWarning ? 'text-amber-400 border-amber-500/40 bg-amber-950/50' : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/50');

  // Realistic MPU6050 accelerometer vector values based on tilt & displacement
  const accelX = isCritical ? -0.84 : -0.36;
  const accelY = isCritical ? +0.48 : +0.02;
  const accelZ = isCritical ? +9.74 : +9.81;
  const magnitude = Math.sqrt(accelX*accelX + accelY*accelY + accelZ*accelZ).toFixed(2);

  const tiltX = (selectedSensor.tilt * 0.75).toFixed(2);
  const tiltY = (selectedSensor.tilt * 0.42).toFixed(2);

  return (
    <div className="bg-[#111827] border border-slate-700 rounded-xl p-3.5 shadow-2xl font-sans text-[#F8FAFC]">
      
      {/* Top Banner: Node ID + Status + Close */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 tracking-wide">
                {selectedSensor.id}
              </h3>
              <span className={`px-2 py-0.2 rounded-md text-[10px] font-mono font-bold border ${statusColor}`}>
                ● {selectedSensor.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Heltec ESP32 LoRa 32 V3 &bull; {selectedSensor.zone} &bull; Depth -{selectedSensor.depth_m || 145}m
            </p>
          </div>
        </div>

        <button
          onClick={() => selectSensorNode(null)}
          className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          title="Close Telemetry Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
        
        {/* Box 1: Vibration & Accelerometer (Ground Shaking mm/s) */}
        <div className="bg-slate-900/60 border border-slate-700/70 p-2.5 rounded-xl font-mono text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60 pb-1">
            <span>1. VIBRATION (SHAKING)</span>
            <span className="text-cyan-400">mm/s (PPV)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">VIBRATION:</span>
            <span className={`font-bold ${selectedSensor.vibration === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {selectedSensor.vibration === 'HIGH' ? '8.40 mm/s' : '0.42 mm/s'}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-700/60 text-[10px] flex items-center justify-between">
            <span className="text-slate-400">LEVEL</span>
            <span className={`font-bold ${selectedSensor.vibration === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {selectedSensor.vibration === 'HIGH' ? 'Warning (5–10 mm/s)' : 'Normal (0–2 mm/s)'}
            </span>
          </div>
        </div>

        {/* Box 2: Tilt & Inclination (Degrees) */}
        <div className="bg-slate-900/60 border border-slate-700/70 p-2.5 rounded-xl font-mono text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60 pb-1">
            <span>2. TILT (INCLINATION)</span>
            <span className="text-amber-400">degrees (°)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">TOTAL TILT:</span>
            <span className={`font-bold ${selectedSensor.tilt > 1.0 ? 'text-red-400' : (selectedSensor.tilt >= 0.5 ? 'text-amber-400' : 'text-emerald-400')}`}>
              {selectedSensor.tilt}°
            </span>
          </div>
          <div className="pt-1 border-t border-slate-700/60 text-[10px] flex items-center justify-between">
            <span className="text-slate-400">STATUS</span>
            <span className={`font-bold ${selectedSensor.tilt > 1.0 ? 'text-red-400' : (selectedSensor.tilt >= 0.5 ? 'text-amber-400' : 'text-emerald-400')}`}>
              {selectedSensor.tilt > 1.0 ? 'Emergency (>1.0°)' : (selectedSensor.tilt >= 0.5 ? 'Warning (0.5–1.0°)' : (selectedSensor.tilt >= 0.2 ? 'Safe (0.2–0.5°)' : 'Normal (0–0.2°)'))}
            </span>
          </div>
        </div>

        {/* Box 3: Displacement & Crack Width */}
        <div className="bg-slate-900/60 border border-slate-700/70 p-2.5 rounded-xl font-mono text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60 pb-1">
            <span>3. DISP &amp; 4. CRACK</span>
            <span className="text-cyan-400">mm &bull; mm/day</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">DISPLACEMENT:</span>
            <span className={`font-bold ${selectedSensor.displacement > 20 ? 'text-red-400' : (selectedSensor.displacement >= 5 ? 'text-amber-400' : 'text-emerald-400')}`}>
              {selectedSensor.displacement} mm/day
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">CRACK WIDTH:</span>
            <span className={`font-bold ${selectedSensor.crack_width > 10 ? 'text-red-400' : (selectedSensor.crack_width >= 3 ? 'text-amber-400' : 'text-emerald-400')}`}>
              {selectedSensor.crack_width} mm
            </span>
          </div>
          <div className="pt-1 border-t border-slate-700/60 text-[10px] flex items-center justify-between">
            <span className="text-slate-400">BATTERY {selectedSensor.battery}%</span>
            <span className="text-emerald-400 font-bold">LoRa {selectedSensor.lora_signal}%</span>
          </div>
        </div>

      </div>

      {/* Telemetry Actions & Diagnostics strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/80 text-[10px] font-mono">
        <span className="text-slate-400">
          Last Telemetry Packet: <strong className="text-slate-200">{selectedSensor.last_update || '2 sec ago'}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDiagnostics}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 transition-colors shadow-sm font-bold"
          >
            Diagnostics
          </button>
          <button
            onClick={() => broadcastEmergency(selectedSensor.zone, `Manual priority warning for ${selectedSensor.id}.`)}
            className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-400 border border-red-500/40 transition-colors font-bold shadow-sm"
          >
            Dispatch Sector Alert
          </button>
        </div>
      </div>

    </div>
  );
}
