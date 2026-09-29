import React from 'react';
import { 
  Navigation, AlertTriangle, ShieldCheck, XCircle, 
  CheckCircle2, Users, Radio, Clock, Shield
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { useAuth } from '../../context/AuthContext';

export default function DynamicEvacuationView({ onOpenEvacuationModal, onOpenMapRoute }) {
  const { evacuation, workers, isSirenActive, sirenCountdown } = useMineData();
  const { user } = useAuth();

  const targetZone = evacuation?.target_zone || 'Zone B';
  const dangerWorkers = workers?.filter(w => w.status === 'DANGER') || [];
  const workersAtRisk = evacuation?.workers_at_risk ?? (dangerWorkers.length || 7);
  const recommendedRoute = evacuation?.routes?.find(r => r.status === 'SAFE') || evacuation?.routes?.[1];
  const blockedRoute = evacuation?.routes?.find(r => r.status === 'BLOCKED') || evacuation?.routes?.[0];

  return (
    <div className="space-y-4 w-full font-sans text-xs text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Evacuation Command &amp; Corridor Solver
            </h1>
            <p className="text-[11px] text-slate-400">
              Autonomous Dynamic Escape Pathfinding &bull; Real-time Worker Muster Tracking
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEvacuationModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Review Evacuation Plan &rarr;</span>
        </button>
      </div>

      {/* Siren Warning if Active */}
      {isSirenActive && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white">
            <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="font-semibold">
              Emergency Alarm Active in {targetZone} &bull; Countdown: <span className="font-mono-data text-amber-300 font-bold">{sirenCountdown}s</span>
            </span>
          </div>
          <span className="text-[11px] text-red-300 font-mono-data">Dispatched to 7 cap-lamp pagers</span>
        </div>
      )}

      {/* 4-Level Operational Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* Level 1: Incident & Affected Scope */}
        <div className="p-4 rounded-lg bg-[#0D1524] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              1. Incident &amp; Scope
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-800 text-red-400">
              CRITICAL HAZARD
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Affected Sector</span>
              <span className="font-bold text-slate-100 font-mono-data text-sm">{targetZone}</span>
              <span className="text-[10px] text-slate-500 block">Longwall Panel 17-B</span>
            </div>
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Miners at Risk</span>
              <span className="font-bold text-amber-400 font-mono-data text-sm">{workersAtRisk} Personnel</span>
              <span className="text-[10px] text-emerald-400 block">All beacons reporting</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">Incident Detection:</div>
            <p className="text-slate-400 leading-relaxed">
              Borehole displacement sensor recorded 14.2mm strata sag exceeding engineering 5.0mm convergence ceiling.
            </p>
          </div>
        </div>

        {/* Level 2: Evacuation Plan & Safe Corridors */}
        <div className="p-4 rounded-lg bg-[#0D1524] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              2. Evacuation Routing Plan
            </h2>
            <button
              onClick={onOpenMapRoute}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              View on Spatial Map &rarr;
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Designated Safe Corridor</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {recommendedRoute ? recommendedRoute.name : 'Route B (East Airway Drift)'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-medium">
                CLEAR
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Hazard Obstruction</span>
                <span className="font-bold text-red-400 flex items-center gap-1 mt-0.5">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  {blockedRoute ? blockedRoute.name : 'Main Haulage Ramp A'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/60 border border-red-800 text-red-400 font-medium">
                FALL BLOCKED
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Designated Safe Muster Point:</span>
              <span className="font-semibold text-slate-200">Muster Station 02 (Shaft Bottom Sanctuary)</span>
            </div>
          </div>
        </div>

        {/* Level 3: Authorization State */}
        <div className="p-4 rounded-lg bg-[#0D1524] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              3. Operational Authorization
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              AUDITED LOG
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Authorized Operator:</span>
              <span className="font-semibold text-slate-200">{user?.name || 'Er. Poovarasan K'}</span>
            </div>
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Statutory Authority:</span>
              <span className="text-slate-200 font-mono-data">Project Standard 112 Safety Lead</span>
            </div>
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Dispatch Mechanism:</span>
              <span className="text-slate-200">Cap-lamp pulse strobe + Audible horn + SMS broadcast</span>
            </div>
          </div>
        </div>

        {/* Level 4: Accountability & Progress Tracking */}
        <div className="p-4 rounded-lg bg-[#0D1524] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              4. Muster Progress Tracking
            </h2>
            <span className="text-[11px] font-mono-data text-emerald-400 font-semibold">
              Live RFID Mesh
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Accounted</span>
              <span className="text-lg font-bold text-emerald-400 font-mono-data">119</span>
            </div>
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">En Route</span>
              <span className="text-lg font-bold text-amber-400 font-mono-data">7</span>
            </div>
            <div className="p-2.5 rounded bg-[#131E33] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Exceptions</span>
              <span className="text-lg font-bold text-slate-400 font-mono-data">0</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#131E33] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Estimated Corridor Transit Time:</span>
            <span className="font-semibold text-slate-200 font-mono-data">4.5 minutes to Station 02</span>
          </div>
        </div>

      </div>

    </div>
  );
}
