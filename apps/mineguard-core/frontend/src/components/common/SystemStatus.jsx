import React from 'react';
import { Clock, ShieldCheck, Activity, Wifi } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function SystemStatus() {
  const { systemStatus, lastSyncSeconds, isOffline } = useMineData();

  // Determine data freshness
  const isStale = lastSyncSeconds > 10;
  const isLive = !isOffline && lastSyncSeconds <= 5;

  return (
    <div 
      role="status" 
      aria-label="System telemetry status bar"
      className="h-7 shrink-0 bg-[#090E17] border-t border-slate-800/80 px-3 lg:px-6 text-xs text-slate-400 flex items-center justify-between shadow-lg select-none font-sans w-full z-20"
    >
      {/* Left: Operational State & Data Quality Indicator */}
      <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span 
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-emerald-500' : isStale ? 'bg-amber-500' : 'bg-cyan-500'
            }`} 
            aria-hidden="true" 
          />
          <span className="font-semibold text-slate-300">
            {isOffline ? 'OFFLINE — CACHED DATA (SIMULATED-LABEL)' : isLive ? 'SYSTEM LIVE' : isStale ? 'TELEMETRY STALE' : 'CONNECTED'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-3">
          <Wifi className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span>Mesh Gateway:</span>
          <span className="text-slate-300 font-mono-data text-[10px]">GW-JH-01 (100% Signal)</span>
        </div>
      </div>

      {/* Right: Sync latency, Uptime, and Compliance standard */}
      <div className="flex items-center gap-3 sm:gap-5 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3 h-3 text-cyan-400" aria-hidden="true" />
          <span>Sync:</span>
          <span className="text-cyan-400 font-bold font-mono-data text-[10px]">{lastSyncSeconds}s ago</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300 border-l border-slate-800 pl-3">
          <ShieldCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          <span>Uptime:</span>
          <span className="text-emerald-400 font-bold font-mono-data text-[10px]">{systemStatus.system_uptime || '99.98'}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-3">
          <Activity className="w-3 h-3 text-slate-500" aria-hidden="true" />
          <span className="text-[10px]">Project Standard 112 Standard</span>
        </div>
      </div>
    </div>
  );
}
