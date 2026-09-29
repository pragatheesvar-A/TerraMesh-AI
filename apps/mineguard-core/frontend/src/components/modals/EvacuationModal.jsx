import React, { useState, useRef, useEffect } from 'react';
import { 
  X, AlertOctagon, CheckCircle2, 
  Users, ChevronDown, Radio, Shield, Clock, MapPin, Send
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { useAuth } from '../../context/AuthContext';

function TacticalSelect({ label, value, onChange, options, colorClass = 'border-slate-700', valueColorClass = 'text-[#F8FAFC]' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[#0D1524] border ${colorClass} ${valueColorClass} font-medium text-xs outline-none transition-colors hover:border-slate-500 cursor-pointer`}
      >
        <span className="truncate text-left">{selected?.label || value}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-[99999] top-full mt-1 w-full rounded-md bg-[#0D1524] border border-slate-700 shadow-2xl overflow-hidden py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer
                ${value === opt.value
                  ? 'bg-slate-800 text-cyan-400 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                flex items-center gap-2`}
            >
              {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EvacuationModal({ isOpen, onClose }) {
  const { evacuation, workers, broadcastEmergency, playAlertSound, lastSyncSeconds } = useMineData();
  const { user } = useAuth();

  const safeRoute = evacuation?.routes?.find(r => r.status === 'SAFE');
  const blockedRoute = evacuation?.routes?.find(r => r.status === 'BLOCKED');
  const defaultZone = evacuation?.target_zone || 'Zone B';
  const defaultRoute = safeRoute?.name || 'Route B (East Airway Drift)';

  const [targetZone, setTargetZone] = useState(defaultZone);
  const [evacRoute, setEvacRoute] = useState(defaultRoute);
  const [musterPoint, setMusterPoint] = useState('Muster Station 02 (Shaft Bottom)');
  const [evacSuccess, setEvacSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dangerWorkers = workers?.filter(w => w.status === 'DANGER') || [];
  const workersAtRisk = evacuation?.workers_at_risk ?? (dangerWorkers.length || 7);
  const timestampNow = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

  if (!isOpen) return null;

  const handleAuthorizeEvac = () => {
    setIsSubmitting(true);
    playAlertSound('critical');
    broadcastEmergency(targetZone, `CRITICAL EVACUATION ORDER: Personnel in ${targetZone} evacuate immediately via ${evacRoute} to ${musterPoint}.${blockedRoute ? ` ${blockedRoute.name} is BLOCKED.` : ''}`);
    setTimeout(() => {
      setIsSubmitting(false);
      setEvacSuccess(true);
    }, 800);
  };

  const zoneOptions = [
    { value: 'Zone B', label: 'Zone B (Central Depillaring) — 7 At Risk' },
    { value: 'Zone C', label: 'Zone C (South Drift Panel)' },
    { value: 'Zone A', label: 'Zone A (North Longwall)' },
    { value: 'ALL',    label: 'Entire Underground Operations' },
  ];

  const routeOptions = [
    { value: safeRoute?.name || 'Route B (East Airway Drift)', label: `${safeRoute?.name || 'Route B (East Airway Drift)'} — Safe Corridor` },
    { value: 'Refuge Chamber 04', label: 'Refuge Chamber 04 (Pressurized Sanctuary)' },
  ];

  const musterOptions = [
    { value: 'Muster Station 02 (Shaft Bottom)', label: 'Muster Station 02 (Shaft Bottom)' },
    { value: 'Surface Headframe Assembly', label: 'Surface Headframe Assembly Area' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Emergency evacuation authorization review"
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0D1524] border border-slate-700 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">

        {/* Top Operational Stripe */}
        <div className="h-1 w-full bg-red-600" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Emergency Evacuation Authorization
              </h2>
              <p className="text-[11px] text-slate-400">
                Statutory Project Standard 112 &bull; Pre-Activation Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#131E33] border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {evacSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Evacuation Order Authorized & Dispatched
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                  Audible siren active across <strong className="text-slate-100">{targetZone}</strong>. Distress alerts transmitted to <strong className="text-red-400">{workersAtRisk} miners</strong>. Evacuation corridor routed via <strong className="text-emerald-400">{evacRoute}</strong> to <strong className="text-slate-100">{musterPoint}</strong>.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { setEvacSuccess(false); onClose(); }}
                  className="px-5 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs cursor-pointer transition-colors"
                >
                  Return to Active Monitoring
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Incident Evidence & Data Quality */}
              <div className="p-3 rounded-lg bg-[#131E33] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                    1. Incident Detection & Evidence
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-400 border border-red-800/80 font-bold text-[10px]">
                    CRITICAL SEVERITY
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hazard Type</span>
                    <span className="font-medium text-slate-200">Crown Pillar Subsidence</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Zone</span>
                    <span className="font-medium text-red-400 font-mono-data">{targetZone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Detection Time</span>
                    <span className="font-medium text-slate-200 font-mono-data">{timestampNow}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data Quality</span>
                    <span className="font-medium text-emerald-400 font-mono-data">
                      {lastSyncSeconds <= 5 ? 'LIVE (verified)' : 'STALE (degraded)'}
                    </span>
                  </div>
                </div>
                {blockedRoute && (
                  <div className="p-2 rounded bg-red-950/40 border border-red-900/60 text-[11px] text-red-300">
                    <strong>Hazard Confirmation:</strong> Primary tunnel <span className="font-mono-data font-bold">{blockedRoute.name}</span> blocked by roof fall.
                  </div>
                )}
              </div>

              {/* 2. Evacuation Corridor & Muster Scope */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  2. Evacuation Scope & Plan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <TacticalSelect
                    label="Target Zone"
                    value={targetZone}
                    onChange={setTargetZone}
                    options={zoneOptions}
                    colorClass="border-red-900/60 text-red-300"
                  />
                  <TacticalSelect
                    label="Safe Corridor"
                    value={evacRoute}
                    onChange={setEvacRoute}
                    options={routeOptions}
                    colorClass="border-emerald-900/60 text-emerald-300"
                  />
                  <TacticalSelect
                    label="Designated Muster"
                    value={musterPoint}
                    onChange={setMusterPoint}
                    options={musterOptions}
                    colorClass="border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              {/* 3. At-Risk Worker Roster */}
              <div className="p-3 rounded-lg bg-[#131E33] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    3. Affected Personnel ({workersAtRisk} Miners in {targetZone})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">All telemetry active</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                  {(dangerWorkers.length > 0 ? dangerWorkers : [
                    { id: 'W-023', code: 'W-023', name: 'Amit Sen' },
                    { id: 'W-041', code: 'W-041', name: 'Bikram S.' },
                    { id: 'W-015', code: 'W-015', name: 'R. Soren' },
                    { id: 'W-034', code: 'W-034', name: 'M. Das' },
                    { id: 'W-045', code: 'W-045', name: 'K. Nayak' },
                    { id: 'W-062', code: 'W-062', name: 'S. Paul' },
                    { id: 'W-077', code: 'W-077', name: 'A. Ansari' }
                  ]).map((w) => (
                    <div key={w.id} className="p-1.5 rounded bg-[#0D1524] border border-slate-700/60 flex items-center justify-between">
                      <span className="font-mono-data text-red-300 font-bold">{w.code}</span>
                      <span className="text-slate-400 truncate max-w-[80px]">{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Communication Dispatch Channels */}
              <div className="p-3 rounded-lg bg-[#131E33] border border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block">
                  4. Automated Dispatch Matrix
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300">
                  <div className="p-1.5 rounded bg-[#0D1524] border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Siren Broadcast</span>
                    <span className="text-red-400 font-medium">110 dB Acoustic Array</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#0D1524] border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Personal Pagers</span>
                    <span className="text-cyan-400 font-medium">Cap Lamp Flashing + Vibe</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#0D1524] border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Emergency SMS</span>
                    <span className="text-emerald-400 font-medium">All Surface & Shift Leads</span>
                  </div>
                </div>
              </div>

              {/* 5. Operator Audit Sign-Off */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Authorizing Officer:</span>
                  <span className="text-slate-200 font-semibold">{user?.name || 'Er. Poovarasan K'}</span>
                  <span className="text-slate-500">({user?.role || 'Safety Controller'})</span>
                </div>
                <div className="font-mono-data text-[10px]">{timestampNow}</div>
              </div>

              {/* Final Confirmation Action */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-[#131E33] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel / Return
                </button>

                <button
                  type="button"
                  onClick={handleAuthorizeEvac}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting Protocols...' : 'Authorize & Dispatch Evacuation Order'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
