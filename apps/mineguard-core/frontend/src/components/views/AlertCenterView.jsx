import React from 'react';
import { BellRing, Volume2, Radio } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import AlertCenter from '../dashboard/AlertCenter';

export default function AlertCenterView({ onOpenBroadcast, onSelectAlertZone }) {
  const { playSoundAlert } = useMineData();

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-sans text-[#F8FAFC]">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Early Warning Alert Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated Project Standard 112 Safety Anomaly Detection & Incident Logging
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => playSoundAlert && playSoundAlert('critical')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Test Critical Siren Audio"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Siren</span>
          </button>
          
          <button
            onClick={onOpenBroadcast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast New Warning</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ALERT LIST ─────────────────────────────────────────────── */}
      <AlertCenter 
        onOpenBroadcast={onOpenBroadcast}
        onSelectAlertZone={onSelectAlertZone}
      />

    </div>
  );
}
