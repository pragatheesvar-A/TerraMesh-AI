import React from 'react';
import { Users, ShieldCheck, AlertTriangle, Flame, WifiOff, MapPin, ArrowRight, Activity, Heart } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function WorkerSafety({ onOpenWorkerModal }) {
  const { workers } = useMineData();

  const total = workers.length;
  const danger = workers.filter(w => w.status === 'DANGER').length;
  const caution = workers.filter(w => w.status === 'CAUTION').length;
  const safe = workers.filter(w => w.status === 'SAFE').length;
  const offline = workers.filter(w => w.status === 'OFFLINE').length;

  // Selected priority workers: W-001, W-023, W-041, W-052
  const showcaseWorkerCodes = ['W-001', 'W-023', 'W-041', 'W-052'];
  const priorityWorkers = workers.filter(w => showcaseWorkerCodes.includes(w.code));

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 flex flex-col justify-between shadow-xl text-[#F8FAFC]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold tracking-widest text-slate-100 uppercase font-mono">
                  WORKER SAFETY & TRACKING
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                  RFID LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Smart Helmet IoT Telemetry & Subsurface Geolocation
              </p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">TOTAL DEPLOYED</span>
            <span className="text-sm font-black text-slate-100">{total} Operatives</span>
          </div>
        </div>

        {/* Count Matrix (Safe, Caution, Danger, Offline) */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-center font-mono">
          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="text-lg font-black text-emerald-400">{safe}</div>
            <div className="text-[9px] text-emerald-500 uppercase font-bold">Safe</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="text-lg font-black text-amber-400">{caution}</div>
            <div className="text-[9px] text-amber-500 uppercase font-bold">Caution</div>
          </div>
          <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/30">
            <div className="text-lg font-black text-red-400 animate-pulse">{danger}</div>
            <div className="text-[9px] text-red-500 uppercase font-bold">Danger</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-lg font-black text-slate-400">{offline}</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold">Offline</div>
          </div>
        </div>

        {/* Worker Table (W-001, W-023, W-041, W-052) */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-mono text-slate-400 uppercase flex items-center justify-between px-1 pb-1">
            <span>OPERATIVE ID / SECTOR</span>
            <span>BIOMETRICS & STATUS</span>
          </div>

          {priorityWorkers.map((w) => {
            const isDanger = w.status === 'DANGER';
            const isCaution = w.status === 'CAUTION';

            const badgeStyle = isDanger
              ? 'bg-red-950/50 text-red-400 border-red-500/40'
              : (isCaution ? 'bg-amber-950/50 text-amber-400 border-amber-500/40' : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40');

            return (
              <div
                key={w.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-cyan-500/50 transition-all flex items-center justify-between font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-red-950/50 text-red-400' : 'bg-cyan-950/40 text-cyan-400'}`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{w.code}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded font-semibold border border-cyan-500/30">
                        {w.zone}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-sans">
                      <span className="font-semibold text-slate-200">{w.name}</span>
                      <span>•</span>
                      <span>{w.depth_m || 380}m Depth</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border ${badgeStyle}`}>
                    {w.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Heart className={`w-3 h-3 ${isDanger ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>{w.heart_rate || 78} BPM</span>
                    <span>•</span>
                    <span>CH4: 0.12%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button: OPEN WORKER SAFETY */}
      <div className="mt-3 pt-3 border-t border-slate-700/80">
        <button
          onClick={onOpenWorkerModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider transition-all active:scale-95 shadow-sm"
        >
          <span>VIEW COMPLETE UNDERGROUND WORKER ROSTER</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
