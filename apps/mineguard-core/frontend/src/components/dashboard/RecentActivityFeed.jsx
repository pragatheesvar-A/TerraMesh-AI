import React from 'react';
import { Clock, ShieldAlert, Cpu, CheckCircle2, UserCheck, RefreshCw, ArrowRight } from 'lucide-react';

export default function RecentActivityFeed({ onOpenAlerts, onOpenSensors, onOpenWorkers }) {
  const activities = [
    {
      id: 1,
      time: '11:42:15 IST',
      type: 'ALARM',
      title: 'Roof Convergence Alert Triggered',
      desc: 'Node MG-03 recorded 14.2mm roof displacement in Sector 7.',
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-950/50',
      border: 'border-red-500/30',
      action: onOpenAlerts
    },
    {
      id: 2,
      time: '11:40:02 IST',
      type: 'AI_PREDICT',
      title: 'AI Risk Forecast Updated',
      desc: '6-Hour horizon convergence probability adjusted to 94.7%.',
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-500/30',
    },
    {
      id: 3,
      time: '11:35:48 IST',
      type: 'WORKER',
      title: 'Shift Changeover RFID Check-In',
      desc: '142 underground miners registered at Incline Portal #3.',
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/30',
      action: onOpenWorkers
    },
    {
      id: 4,
      time: '11:30:10 IST',
      type: 'MESH',
      title: 'LoRa Mesh Self-Healing Sync',
      desc: '18 In-situ borehole telemetry nodes confirmed healthy route.',
      icon: RefreshCw,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/30',
      action: onOpenSensors
    }
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 flex flex-col justify-between shadow-xl font-mono text-[#F8FAFC]">
      <div>
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-slate-100 uppercase font-sans">
                RECENT GEOTECHNICAL ACTIVITY LOG
              </h3>
              <p className="text-[10px] text-slate-400">
                Real-Time Telemetry & Safety Event Sequence
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
            LIVE FEED
          </span>
        </div>

        <div className="space-y-2">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div 
                key={act.id}
                onClick={act.action}
                className={`p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-start gap-2.5 transition-all ${
                  act.action ? 'hover:border-cyan-500/50 hover:bg-slate-900/90 cursor-pointer shadow-sm' : ''
                }`}
              >
                <div className={`p-1.5 rounded-lg ${act.bg} ${act.color} shrink-0 mt-0.5 border ${act.border || 'border-slate-700'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-sans">
                    {act.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-700/80 mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Audit Trail: <strong className="text-slate-200">Safety Log</strong></span>
        <button 
          onClick={onOpenAlerts}
          className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-bold"
        >
          <span>View All Logs</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
