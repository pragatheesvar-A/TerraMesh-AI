import React, { useState } from 'react';
import { 
  X, User, MapPin, ShieldAlert, 
  CheckCircle2, Compass, Navigation, Radio, BellRing 
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function WorkerDetailDrawer({ worker, isOpen, onClose, onLocateOnMap, onEvacuate }) {
  const { selectWorkerNode, broadcastEmergency, playEmergencySiren } = useMineData();
  const [alertSent, setAlertSent] = useState(false);

  if (!isOpen || !worker) return null;

  const isDanger = worker.status === 'DANGER';
  const isCaution = worker.status === 'CAUTION';

  const badgeColor = isDanger
    ? 'bg-red-950/80 text-red-400 border-red-800'
    : (isCaution ? 'bg-amber-950/80 text-amber-400 border-amber-800' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800');

  const handleLocate = () => {
    selectWorkerNode(worker);
    if (onLocateOnMap) onLocateOnMap(worker);
    onClose();
  };

  const handleDispatchWorkerAlert = () => {
    setAlertSent(true);
    const safeRoute = worker.zone === 'Zone B' ? 'Route B (East Drift)' : 'Route 1 (Main Incline)';
    const msg = `WORKER EMERGENCY ALERT: Haptic alarm & siren dispatched to ${worker.name} (${worker.code}) in ${worker.zone}. Immediate evacuation instructed via ${safeRoute}.`;
    broadcastEmergency(worker.zone, msg, 'CRITICAL');
    if (playEmergencySiren) playEmergencySiren(15);
    if (onEvacuate) onEvacuate(worker);
    setTimeout(() => {
      setAlertSent(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in font-mono">
      {/* Backdrop overlay click to close */}
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[#111827] border-l border-slate-700 h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left text-xs text-[#F8FAFC]">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F8FAFC] font-sans">
                  {worker.name}
                </h3>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${badgeColor}`}>
                  {worker.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                ID: {worker.code} • {worker.role || 'Underground Operator'}
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

        {/* Drawer Body */}
        <div className="p-4 space-y-4 flex-1">
          
          {/* Location & Sector Card */}
          <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2.5">
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span>LOCATION & DEPTH</span>
              <span className="text-[#06B6D4]">RFID SYNCED</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Current Sector</span>
                <span className="font-bold text-[#F8FAFC] text-sm">{worker.zone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Depth Level</span>
                <span className="font-bold text-[#06B6D4] text-sm">{worker.depth_m || 380} m</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Smart Helmet ID</span>
                <span className="font-bold text-[#F8FAFC]">{worker.helmet_id || `HLM-${worker.code}`}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Nearest Node</span>
                <span className="font-bold text-amber-400">{worker.nearest_node || 'NODE-003 (Zone B)'}</span>
              </div>
            </div>
          </div>



          {/* Nearest Safe Route */}
          <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2">
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider border-b border-slate-800 pb-1.5">
              RECOMMENDED ESCAPE CORRIDOR
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-400 block">
                    {worker.zone === 'Zone B' ? 'Route B — East Drift' : 'Route 1 — Main Incline'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Clear of active subsidence shear
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600 text-[10px] font-bold">
                SAFE
              </span>
            </div>
          </div>

        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F17] grid grid-cols-2 gap-2">
          <button
            onClick={handleLocate}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#162235] hover:bg-[#1E293B] border border-cyan-500/50 hover:border-cyan-400 text-[#F8FAFC] text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-[#06B6D4] animate-bounce" />
            <span>LOCATE ON MAP</span>
          </button>

          <button
            onClick={handleDispatchWorkerAlert}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 ${
              alertSent ? 'bg-emerald-600 border border-emerald-400' : 'bg-red-600 hover:bg-red-500 border border-red-500'
            }`}
          >
            {alertSent ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ALERT SENT!</span>
              </>
            ) : (
              <>
                <BellRing className="w-3.5 h-3.5 animate-pulse" />
                <span>WORKERS ALERT</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
