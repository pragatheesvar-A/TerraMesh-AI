import React from 'react';
import { 
  MapPin, Radio, Navigation, Wrench, 
  FileText, Box, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function QuickActions({ 
  onViewLiveMap, 
  onBroadcastWarning, 
  onStartEvacuation, 
  onSensorDiagnostics, 
  onGenerateReport, 
  onOpenDigitalTwin 
}) {
  const actions = [
    {
      id: 'map',
      label: 'View Live Map',
      icon: MapPin,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-400',
      border: 'border-slate-700 bg-slate-900/60',
      onClick: onViewLiveMap
    },
    {
      id: 'broadcast',
      label: 'Broadcast Warning',
      icon: Radio,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/40 text-amber-400',
      border: 'border-amber-500/30 bg-amber-950/20',
      onClick: onBroadcastWarning
    },
    {
      id: 'evacuate',
      label: 'Start Evacuation',
      icon: Navigation,
      color: 'bg-red-950/40 hover:bg-red-900/50 border-red-500/50 text-red-400 font-bold shadow-lg shadow-red-950/20',
      border: 'border-red-500/50',
      onClick: onStartEvacuation,
      isEmergency: true
    },
    {
      id: 'diagnostics',
      label: 'Sensor Diagnostics',
      icon: Wrench,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-400',
      border: 'border-slate-700 bg-slate-900/60',
      onClick: onSensorDiagnostics
    },
    {
      id: 'report',
      label: 'Generate Report',
      icon: FileText,
      color: 'hover:border-blue-500/50 hover:bg-blue-950/40 text-blue-400',
      border: 'border-slate-700 bg-slate-900/60',
      onClick: onGenerateReport
    },
    {
      id: 'twin',
      label: 'Digital Twin',
      icon: Box,
      color: 'hover:border-purple-500/50 hover:bg-purple-950/40 text-purple-400',
      border: 'border-slate-700 bg-slate-900/60',
      onClick: onOpenDigitalTwin
    },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-3 shadow-xl text-[#F8FAFC]">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-widest text-slate-100 uppercase">
            QUICK ACTIONS & COMMAND OVERRIDES
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
          Priority 1 Control Bus
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-mono text-xs font-semibold transition-all duration-200 group active:scale-95 shadow-sm hover:shadow-md ${act.border} ${act.color}`}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
