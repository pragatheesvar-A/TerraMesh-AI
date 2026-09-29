import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function RecentAlertsCard({ onOpenAlerts }) {
  const alerts = [
    {
      id: 1,
      title: 'High vibration detected',
      location: 'Sensor-03 (Main Tunnel)',
      time: '10:12 AM',
      type: 'critical',
      icon: AlertCircle,
      iconColor: 'text-red-400 bg-red-950/60 border-red-800',
    },
    {
      id: 2,
      title: 'Displacement threshold reached',
      location: 'North Shaft',
      time: '09:48 AM',
      type: 'warning',
      icon: AlertTriangle,
      iconColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    },
    {
      id: 3,
      title: 'Unusual crack activity',
      location: 'East Zone',
      time: '08:30 AM',
      type: 'info',
      icon: Info,
      iconColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    },
    {
      id: 4,
      title: 'Temperature rising',
      location: 'West Zone',
      time: '07:15 AM',
      type: 'warning',
      icon: AlertTriangle,
      iconColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          Recent Alerts
        </h3>
        <button 
          onClick={onOpenAlerts}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Alert items */}
      <div className="space-y-2.5">
        {alerts.map((alt) => {
          const Icon = alt.icon;
          return (
            <div key={alt.id} className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-full border shrink-0 mt-0.5 ${alt.iconColor}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white">
                    {alt.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {alt.location}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {alt.time}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
