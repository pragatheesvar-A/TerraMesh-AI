import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { LineChart as LineChartIcon, Activity, TrendingUp, AlertTriangle, ShieldCheck, Download, Layers } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function AnalyticsView() {
  const { zones } = useMineData();
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'DISPLACEMENT', label: 'Displacement' },
    { id: 'TILT', label: 'Tilt Angle' },
    { id: 'VIBRATION', label: 'Micro-Seismic' },
    { id: 'CRACKS', label: 'Crack Width' },
    { id: 'RISK', label: 'Risk Acceleration' }
  ];

  const subsidenceData = [
    { day: "Day 1", zoneA: 0.2, zoneB: 0.8, zoneC: 0.4, zoneD: 0.1 },
    { day: "Day 2", zoneA: 0.3, zoneB: 1.2, zoneC: 0.5, zoneD: 0.2 },
    { day: "Day 3", zoneA: 0.2, zoneB: 1.8, zoneC: 0.7, zoneD: 0.1 },
    { day: "Day 4", zoneA: 0.4, zoneB: 2.6, zoneC: 0.9, zoneD: 0.2 },
    { day: "Day 5", zoneA: 0.3, zoneB: 3.4, zoneC: 1.1, zoneD: 0.2 },
    { day: "Day 6", zoneA: 0.4, zoneB: 3.9, zoneC: 1.3, zoneD: 0.3 },
    { day: "Day 7", zoneA: 0.4, zoneB: 4.8, zoneC: 1.4, zoneD: 0.2 },
  ];

  const tiltData = [
    { hour: "00:00", tiltX: 0.8, tiltY: 0.4, tiltZ: 0.2 },
    { hour: "04:00", tiltX: 1.2, tiltY: 0.6, tiltZ: 0.3 },
    { hour: "08:00", tiltX: 1.8, tiltY: 0.9, tiltZ: 0.4 },
    { hour: "12:00", tiltX: 2.4, tiltY: 1.4, tiltZ: 0.6 },
    { hour: "16:00", tiltX: 3.8, tiltY: 2.1, tiltZ: 0.9 },
    { hour: "20:00", tiltX: 4.8, tiltY: 2.8, tiltZ: 1.2 },
  ];

  const microseismicData = [
    { time: "00:00", events: 2, energy: 12 },
    { time: "04:00", events: 5, energy: 28 },
    { time: "08:00", events: 9, energy: 64 },
    { time: "12:00", events: 14, energy: 110 },
    { time: "16:00", events: 22, energy: 185 },
    { time: "20:00", events: 31, energy: 240 },
  ];

  const crackData = [
    { day: "Day 1", crack1: 0.2, crack2: 0.1, crack3: 0.05 },
    { day: "Day 2", crack1: 0.4, crack2: 0.2, crack3: 0.08 },
    { day: "Day 3", crack1: 0.8, crack2: 0.3, crack3: 0.12 },
    { day: "Day 4", crack1: 1.4, crack2: 0.5, crack3: 0.18 },
    { day: "Day 5", crack1: 2.8, crack2: 0.8, crack3: 0.25 },
    { day: "Day 6", crack1: 4.9, crack2: 1.2, crack3: 0.32 },
    { day: "Day 7", crack1: 7.2, crack2: 1.8, crack3: 0.45 },
  ];

  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Timeframe', 'Zone A Subsidence (mm)', 'Zone B Subsidence (mm)', 'Zone C Subsidence (mm)', 'Zone D Subsidence (mm)'];
    const rows = subsidenceData.map(d => [
      `"${d.day}"`,
      d.zoneA,
      d.zoneB,
      d.zoneC,
      d.zoneD
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Geotechnical_Analytics_Dataset_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans flex items-center gap-2">
              GEOTECHNICAL & SUBSIDENCE ANALYTICS ENGINE
              {exportSuccess && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-mono animate-fade-in">
                  ✓ CSV Exported
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              Cross-Zone Deformation Velocity, Acoustic Emission & InSAR Correlation
            </p>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV Dataset</span>
        </button>
      </div>

      {/* Analytics Tabs (OVERVIEW, DISPLACEMENT, TILT, VIBRATION, CRACKS, RISK) */}
      <div className="flex flex-wrap items-center gap-1 bg-[#111827] p-1.5 rounded-xl border border-slate-700 shadow-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === t.id
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl">
          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Peak Subsidence Velocity</span>
          <div className="text-2xl font-extrabold text-red-400 mt-1">4.8 mm/day</div>
          <span className="text-[10px] text-red-400 font-bold">&uarr; Zone B Depillaring</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl">
          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Acoustic Events (24h)</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">83 Pulses</div>
          <span className="text-[10px] text-amber-400 font-bold">&uarr; Micro-seismic tremor</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl">
          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Mean Angular Tilt</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">4.80°</div>
          <span className="text-[10px] text-slate-400">Limit: 3.0° (Exceeded)</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl">
          <span className="text-slate-400 text-[10px] uppercase block font-semibold">AI Forecasting Accuracy</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">94.7%</div>
          <span className="text-[10px] text-emerald-400 font-bold">R² = 0.968 Correlation</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & DISPLACEMENT */}
      {(activeTab === 'OVERVIEW' || activeTab === 'DISPLACEMENT') && (
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                7-DAY SUBSIDENCE VELOCITY BY MINING SECTOR (mm/day)
              </h3>
              <p className="text-[10px] text-slate-400">
                Zone B exhibiting exponential acceleration consistent with roof delamination
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Zone B (Depillaring)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Zone C (Drift)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Zone A (Longwall)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={subsidenceData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', color: '#F8FAFC', fontSize: '11px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
                />
                <Area type="monotone" dataKey="zoneB" stroke="#EF4444" fill="#EF4444" fillOpacity={0.25} strokeWidth={2.5} />
                <Area type="monotone" dataKey="zoneC" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={1.5} />
                <Area type="monotone" dataKey="zoneA" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: TILT ANGLE */}
      {activeTab === 'TILT' && (
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            3-AXIS ANGULAR TILT VECTOR PROGRESSION (MPU6050)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tiltData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', color: '#F8FAFC', fontSize: '11px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                <Line type="monotone" dataKey="tiltX" name="Tilt X-Axis (°)" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="tiltY" name="Tilt Y-Axis (°)" stroke="#06B6D4" strokeWidth={2} />
                <Line type="monotone" dataKey="tiltZ" name="Tilt Z-Axis (°)" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: VIBRATION */}
      {(activeTab === 'OVERVIEW' || activeTab === 'VIBRATION') && (
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            MICRO-SEISMIC ACOUSTIC EMISSION CLUSTERING & ENERGY (JOULES)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={microseismicData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', color: '#F8FAFC', fontSize: '11px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                <Bar dataKey="events" name="Event Pulse Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: CRACKS */}
      {activeTab === 'CRACKS' && (
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            TENSION CRACK EXTENSOMETER DILATION TIME-SERIES (mm)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crackData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', color: '#F8FAFC', fontSize: '11px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                <Area type="monotone" dataKey="crack1" name="Crack Probe 01 (mm)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.25} strokeWidth={2} />
                <Area type="monotone" dataKey="crack2" name="Crack Probe 02 (mm)" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 5: RISK ACCELERATION */}
      {activeTab === 'RISK' && (
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            CROSS-SECTOR GEOTECHNICAL RISK ACCELERATION VECTORS
          </h3>
          <p className="text-[10px] text-slate-400">
            Zone B has exceeded the second derivative acceleration limit (+18% delta in past 6 hours).
          </p>
        </div>
      )}

    </div>
  );
}

