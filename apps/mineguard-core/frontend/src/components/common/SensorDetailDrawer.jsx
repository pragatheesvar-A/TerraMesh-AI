import React, { useState } from 'react';
import { 
  X, Cpu, Activity, Battery, Wifi, ShieldAlert, CheckCircle2, 
  MapPin, Clock, ArrowRight, RefreshCw, Zap, Compass, BarChart2 
} from 'lucide-react';

export default function SensorDetailDrawer({ sensor, isOpen, onClose, onLocateOnMap }) {
  const [actionStatus, setActionStatus] = useState(null);

  if (!isOpen || !sensor) return null;

  const handleCalibrate = () => {
    setActionStatus(`Node ${sensor.id} zero-offset calibrated successfully`);
    setTimeout(() => setActionStatus(null), 3500);
  };

  const handleExportRaw = () => {
    const csvContent = `Sensor ID,Type,Zone,Measurement,Unit,Status,Signal,Battery,Timestamp\n"${sensor.id}","${sensor.type}","${sensor.zone}",${sensor.value},"${sensor.unit}","${sensor.status}","${sensor.signal}",${sensor.battery},"${new Date().toISOString()}"\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Telemetry_${sensor.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionStatus(`Raw telemetry CSV exported for ${sensor.id}`);
    setTimeout(() => setActionStatus(null), 3500);
  };

  const isCritical = sensor.status === 'CRITICAL';
  const isWarning = sensor.status === 'WARNING';
  const isCaution = sensor.status === 'CAUTION';

  const statusColor = isCritical 
    ? 'text-red-400 bg-red-950/80 border-red-800' 
    : (isWarning ? 'text-amber-400 bg-amber-950/80 border-amber-800' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fade-in flex justify-end font-mono">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-md bg-[#111827] border-l border-slate-700 h-full flex flex-col shadow-2xl animate-slide-left z-10 text-[#F8FAFC]">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  {sensor.id}
                </h3>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${statusColor}`}>
                  {sensor.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {sensor.name || 'In-Situ Borehole Telemetry Node'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Location & Sector Info */}
          <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#06B6D4]" />
                Mine Location:
              </span>
              <span className="font-bold text-[#F8FAFC]">{sensor.zone || 'Sector 7 — Borehole 03'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Depth & Strata:
              </span>
              <span className="text-slate-200">{sensor.depth || '-380m (Seam XII)'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Telemetry Sync:
              </span>
              <span className="text-[#06B6D4] font-bold">{sensor.last_update || '2s ago (100ms packet)'}</span>
            </div>
          </div>

          {/* Key In-Situ Geotechnical Telemetry Grid */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
              Sensor Transducer Channels
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#162235] border border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Roof Displacement</span>
                <span className="text-base font-extrabold text-red-400 mt-0.5 block">
                  {sensor.displacement !== undefined ? `${sensor.displacement} mm` : '12.4 mm'}
                </span>
                <span className="text-[9px] text-red-400">Threshold: 5.0 mm</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162235] border border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Tilt Vector (MPU6050)</span>
                <span className="text-base font-extrabold text-amber-400 mt-0.5 block">
                  {sensor.tilt !== undefined ? `${sensor.tilt}°` : '4.80°'}
                </span>
                <span className="text-[9px] text-amber-400">Axis: X: +3.2° Y: -2.1°</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162235] border border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Micro-Seismic Vibration</span>
                <span className="text-base font-extrabold text-[#06B6D4] mt-0.5 block">
                  {sensor.vibration !== undefined ? `${sensor.vibration} g` : '0.003 g'}
                </span>
                <span className="text-[9px] text-[#06B6D4]">Bandpass: 240 Hz</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162235] border border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Crack Extensometer</span>
                <span className="text-base font-extrabold text-orange-400 mt-0.5 block">
                  {sensor.crack_width !== undefined ? `${sensor.crack_width} mm` : '7.2 mm'}
                </span>
                <span className="text-[9px] text-orange-400">Rate: +0.4 mm/hr</span>
              </div>
            </div>
          </div>

          {/* 6-DOF Accelerometer Acceleration Breakdown */}
          <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              MPU6050 IMU Acceleration Vector
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-1.5 rounded-lg bg-[#111827] border border-slate-700">
                <span className="text-slate-400 block">Ax</span>
                <span className="font-bold text-[#F8FAFC]">0.08 m/s²</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#111827] border border-slate-700">
                <span className="text-slate-400 block">Ay</span>
                <span className="font-bold text-[#F8FAFC]">-0.12 m/s²</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#111827] border border-slate-700">
                <span className="text-slate-400 block">Az (Gravity)</span>
                <span className="font-bold text-[#06B6D4]">9.79 m/s²</span>
              </div>
            </div>
          </div>

          {/* Hardware Subsystems & Battery */}
          <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Node Hardware Health
            </span>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  LiFePO4 Battery:
                </span>
                <span className="font-bold text-emerald-400">{sensor.battery || 87}% (3.92V)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${sensor.battery || 87}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#06B6D4]" />
                LoRa Signal (RSSI):
              </span>
              <span className="font-bold text-[#06B6D4]">-68 dBm (SNR +9.2)</span>
            </div>
          </div>

          {/* AI Analysis Diagnostic Verdict */}
          <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#06B6D4]" />
              AI Strata Diagnostic Verdict
            </span>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              {isCritical 
                ? 'Immediate roof delamination risk detected. Structural convergence velocity is accelerating above safety margins.' 
                : 'Pillar convergence is within normal elastic deformation limits. Continuous surveillance active.'}
            </p>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F17] space-y-2">
          {onLocateOnMap && (
            <button
              onClick={() => {
                onLocateOnMap(sensor);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>PINPOINT ON MINE MAP</span>
            </button>
          )}

          {actionStatus && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold text-center animate-fade-in">
              ✓ {actionStatus}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCalibrate}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#162235] hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Calibrate Sensor</span>
            </button>
            <button
              onClick={handleExportRaw}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#162235] hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <BarChart2 className="w-3 h-3 text-[#06B6D4]" />
              <span>Export Raw Data</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
