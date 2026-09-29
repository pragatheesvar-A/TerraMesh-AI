import React from 'react';
import { 
  X, AlertOctagon, AlertTriangle, ShieldAlert, Check, 
  MapPin, Clock, ArrowRight, UserCheck, Flame, Cpu, Eye 
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function IncidentDetailDrawer({ alertItem, isOpen, onClose, onLocateZone, onStartEvacuation }) {
  const { acknowledgeAlert } = useMineData();

  if (!isOpen || !alertItem) return null;

  const isCrit = alertItem.severity === 'CRITICAL';
  const isWarn = alertItem.severity === 'WARNING';

  const badgeColor = isCrit 
    ? 'bg-red-950/80 text-red-400 border-red-800' 
    : (isWarn ? 'bg-amber-950/80 text-amber-400 border-amber-800' : 'bg-yellow-950/80 text-yellow-400 border-yellow-800');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fade-in flex justify-end font-mono">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-md bg-[#111827] border-l border-slate-700 h-full flex flex-col shadow-2xl animate-slide-left z-10 text-[#F8FAFC]">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${isCrit ? 'bg-red-950/60 border-red-800 text-red-400' : 'bg-amber-950/60 border-amber-800 text-amber-400'}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${badgeColor}`}>
                  {alertItem.severity}
                </span>
                <span className="text-xs font-bold text-[#F8FAFC]">
                  {alertItem.id}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Geotechnical Safety Incident Report
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
          
          {/* Main Title & Description */}
          <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2">
            <h3 className="text-sm font-bold text-[#F8FAFC] leading-snug font-sans">
              {alertItem.title}
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {alertItem.description}
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Logged: {alertItem.timestamp}</span>
              <span className="text-[#06B6D4] font-semibold">Sensor: {alertItem.sensor_id || 'NODE-017'}</span>
            </div>
          </div>

          {/* Telemetry Limit Breach Card */}
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
              Statutory Threshold Breach (Project Standard 112)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#111827] border border-red-900/80 shadow-sm">
                <span className="text-[10px] text-slate-400 block">Measured Value</span>
                <span className="text-lg font-black text-red-400 block">
                  {alertItem.measured || '14.2 mm'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-700 shadow-sm">
                <span className="text-[10px] text-slate-400 block">Safety Threshold</span>
                <span className="text-lg font-black text-slate-300 block">
                  {alertItem.threshold || '5.0 mm'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 text-amber-400">
              <span>AI Algorithm Confidence:</span>
              <span className="font-bold text-[#06B6D4]">94.7% Cross-Validated</span>
            </div>
          </div>

          {/* Affected Personnel & Location */}
          <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Affected Mine Sector & Personnel
            </span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#06B6D4]" />
                Target Sector:
              </span>
              <span className="font-bold text-[#F8FAFC]">{alertItem.zone}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-red-400" />
                Operatives in Risk Zone:
              </span>
              <span className="font-bold text-red-400">7 Underground Miners</span>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Standard Operating Procedure (SOP)
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              1. Sound localized evacuation beacon.<br />
              2. Divert personnel through East Drift intake gallery towards Shaft 3.<br />
              3. Dispatch geotechnical emergency stabilization crew.
            </p>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F17] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (onLocateZone) onLocateZone(alertItem.zone);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#162235] hover:bg-[#1E293B] border border-slate-700 text-[#F8FAFC] font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>PIN ZONE</span>
            </button>

            <button
              onClick={() => {
                acknowledgeAlert(alertItem.id);
                onClose();
              }}
              disabled={alertItem.acknowledged}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                alertItem.acknowledged
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-600 active:scale-95 shadow-sm'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{alertItem.acknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}</span>
            </button>
          </div>

          {isCrit && onStartEvacuation && (
            <button
              onClick={() => {
                onStartEvacuation();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>INITIATE EMERGENCY EVACUATION</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
