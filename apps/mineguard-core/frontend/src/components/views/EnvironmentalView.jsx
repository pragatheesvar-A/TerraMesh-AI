import React, { useState } from 'react';
import { 
  Wind, Flame, Droplets, Thermometer, Gauge, AlertTriangle, 
  ShieldCheck, Activity, Download, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function EnvironmentalView() {
  const [selectedZone, setSelectedZone] = useState('Sector 7 — Longwall 04');

  const gasTrends = [
    { time: '06:00', ch4: 0.08, co: 4, o2: 20.9, temp: 24.2, pressure: 1.12 },
    { time: '07:00', ch4: 0.09, co: 5, o2: 20.8, temp: 24.5, pressure: 1.14 },
    { time: '08:00', ch4: 0.11, co: 6, o2: 20.8, temp: 25.1, pressure: 1.18 },
    { time: '09:00', ch4: 0.12, co: 8, o2: 20.7, temp: 25.4, pressure: 1.22 },
    { time: '10:00', ch4: 0.15, co: 9, o2: 20.6, temp: 26.0, pressure: 1.29 },
    { time: '11:00', ch4: 0.18, co: 12, o2: 20.5, temp: 26.4, pressure: 1.35 },
  ];

  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Time', 'CH4 Methane (% vol)', 'CO Carbon Monoxide (ppm)', 'O2 Oxygen (%)', 'Temp (°C)', 'Pressure (bar)'];
    const rows = gasTrends.map(d => [
      `"${d.time}"`,
      d.ch4,
      d.co,
      d.o2,
      d.temp,
      d.pressure
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Environmental_Gas_Telemetry_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans flex items-center gap-2">
              UNDERGROUND ENVIRONMENTAL & ATMOSPHERIC TELEMETRY
              {exportSuccess && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-mono animate-fade-in">
                  ✓ CSV Exported
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              Multi-Gas Monitoring, Airflow Velocity & Hydrostatic Pore Pressure Transducers
            </p>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Gas Logs</span>
        </button>
      </div>

      {/* 5 Core Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Methane CH4 */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Methane (CH₄)
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
              SAFE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            0.18 <span className="text-xs text-slate-400 font-normal">% vol</span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1">
            Threshold: 0.75% (Project Standard 124)
          </div>
        </div>

        {/* Carbon Monoxide CO */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold flex items-center gap-1 text-amber-400">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Carbon Monoxide (CO)
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
              SAFE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            12.0 <span className="text-xs text-slate-400 font-normal">PPM</span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1">
            Limit: 50.0 PPM
          </div>
        </div>

        {/* Oxygen O2 */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold flex items-center gap-1 text-cyan-400">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Oxygen (O₂)
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
              NOMINAL
            </span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-400">
            20.5 <span className="text-xs text-slate-400 font-normal">% vol</span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1">
            Min Requirement: &gt; 19.0%
          </div>
        </div>

        {/* Airflow Velocity */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold flex items-center gap-1 text-emerald-400">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Airflow Velocity
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
              OPTIMAL
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            4.2 <span className="text-xs text-slate-400 font-normal">m/s</span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1">
            Intake Gallery: 98% Flow
          </div>
        </div>

        {/* Hydrostatic Pore Pressure */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-red-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold flex items-center gap-1 text-red-400">
              <Droplets className="w-3.5 h-3.5 text-red-400" />
              Pore Pressure (Piezometer)
            </span>
            <span className="text-[9px] text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
              ELEVATED
            </span>
          </div>
          <div className="text-2xl font-extrabold text-red-400">
            1.35 <span className="text-xs text-slate-400 font-normal">MPa</span>
          </div>
          <div className="text-[10px] text-red-400 border-t border-red-500/20 pt-1 font-semibold">
            Delta: +14% (Overlying Strata Bed)
          </div>
        </div>

      </div>

      {/* Atmospheric Time-Series Graph */}
      <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              MULTI-GAS CONCENTRATION & PORE PRESSURE TRENDS (6-HOUR HORIZON)
            </h3>
            <p className="text-[10px] text-slate-400">
              Automated Intake & Return Airway Sensing Array
            </p>
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold">Sampling: 10-sec intervals</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={gasTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', color: '#F8FAFC', fontSize: '11px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
              />
              <Area type="monotone" dataKey="ch4" name="CH₄ (% vol)" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="pressure" name="Pore Pressure (MPa)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
