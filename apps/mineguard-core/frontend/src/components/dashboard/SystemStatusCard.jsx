import React from 'react';
import { Cpu, Bot, RefreshCw, Radio, BatteryCharging, CheckCircle2 } from 'lucide-react';

export default function SystemStatusCard() {
  const items = [
    { label: 'Sensors', icon: Cpu, status: 'Online' },
    { label: 'AI Model', icon: Bot, status: 'Online' },
    { label: 'Data Sync', icon: RefreshCw, status: 'Online' },
    { label: 'Communication', icon: Radio, status: 'Online' },
    { label: 'Power Backup', icon: BatteryCharging, status: 'Online' },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          System Status
        </h3>
        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
          <span>All Systems Operational</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        </span>
      </div>

      {/* Status List */}
      <div className="space-y-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{it.label}</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {it.status}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
