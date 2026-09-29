import React from 'react';
import { 
  Navigation, CheckCircle2, XCircle, Users, Radio, ShieldAlert
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function EvacuationPanel({ onOpenEvacuationModal, onOpenMapRoute }) {
  const { evacuation } = useMineData();

  const targetZone = evacuation?.target_zone || 'Zone B';
  const workersAtRisk = evacuation?.workers_at_risk ?? 7;
  const recommendedRoute = evacuation?.routes?.find(r => r.status === 'SAFE') || evacuation?.routes?.[1];
  const blockedRoute = evacuation?.routes?.find(r => r.status === 'BLOCKED') || evacuation?.routes?.[0];
  const isDanger = workersAtRisk > 0 || blockedRoute;

  return (
    <div className="relative overflow-hidden rounded-xl flex flex-col justify-between text-xs text-slate-100"
      style={{
        background: 'linear-gradient(135deg, rgba(9,14,23,0.98) 0%, rgba(13,21,36,0.96) 100%)',
        border: isDanger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,212,255,0.1)',
        boxShadow: isDanger
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.06)'
          : '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: isDanger
          ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7) 50%, transparent)'
          : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5) 50%, transparent)'
        }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg"
              style={isDanger
                ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }
                : { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
              }
            >
              <Navigation className="w-4 h-4" style={{ color: isDanger ? '#f87171' : '#34d399' }} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Evacuation Escalation
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Autonomous Corridor Guidance
              </p>
            </div>
          </div>
          {isDanger && (
            <span className="px-2 py-1 rounded-md text-[9px] font-black tracking-widest animate-soft-pulse"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
              ACTION REQUIRED
            </span>
          )}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <span className="text-[9px] uppercase block font-bold tracking-wider text-slate-500 mb-1">Affected Sector</span>
            <span className="text-base font-black font-mono-data" style={{ color: '#f87171', letterSpacing: '-0.02em' }}>
              {targetZone}
            </span>
          </div>

          <div className="p-2.5 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <span className="text-[9px] uppercase block font-bold tracking-wider text-slate-500 mb-1">Workers at Risk</span>
            <span className="text-base font-black font-mono-data" style={{ color: '#fbbf24', letterSpacing: '-0.02em' }}>
              {workersAtRisk}
              <span className="text-xs font-semibold text-slate-500 ml-1">miners</span>
            </span>
          </div>
        </div>

        {/* Corridor Status */}
        <div className="rounded-lg overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[10px] text-slate-500 font-medium">Safe Corridor</span>
            <span className="font-bold text-[11px] flex items-center gap-1.5" style={{ color: '#34d399' }}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {recommendedRoute ? recommendedRoute.name : 'Route B (East Airway)'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="text-[10px] text-slate-500 font-medium">Hazard Obstruction</span>
            <span className="font-bold text-[11px] flex items-center gap-1.5"
              style={{ color: blockedRoute ? '#f87171' : '#475569' }}>
              {blockedRoute ? (
                <>
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {blockedRoute.name} (Blocked)
                </>
              ) : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        <button
          onClick={onOpenEvacuationModal}
          className="btn-press w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black tracking-wider transition-all duration-200 cursor-pointer relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#f87171',
            boxShadow: '0 0 16px rgba(239,68,68,0.12)'
          }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.06), transparent)' }} />
          <Radio className="w-3.5 h-3.5 animate-soft-pulse shrink-0" />
          <span>Review Evacuation Plan</span>
          <ShieldAlert className="w-3.5 h-3.5 ml-auto shrink-0" />
        </button>

        <button
          onClick={onOpenMapRoute}
          className="w-full py-1.5 text-center text-[11px] font-semibold cursor-pointer transition-colors hover:text-cyan-300"
          style={{ color: '#00D4FF' }}
        >
          Inspect Corridors on GIS Map →
        </button>
      </div>
    </div>
  );
}
