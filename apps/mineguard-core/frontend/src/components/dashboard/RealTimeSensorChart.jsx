import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function RealTimeSensorChart() {
  const [timeRange, setTimeRange] = useState('Last 1 Hour');
  const { currentTime, sensors } = useMineData();

  // Extract live sensor values
  const vibVal = sensors?.find(s => s.type === 'Vibration' || s.type === 'Geophone')?.value ?? 7.4;
  const dispVal = sensors?.find(s => s.type === 'Displacement' || s.type === 'Extensometer')?.value ?? 2.8;
  const crackVal = sensors?.find(s => s.type === 'Crack' || s.type === 'Crackmeter')?.value ?? 2.1;
  const tempVal = 26.4;

  const data = useMemo(() => {
    const baseDate = currentTime instanceof Date ? currentTime : new Date();
    const formatHHMM = (d) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    const offsets = [-45, -30, -15, -5, 0];
    const factors = [0.75, 0.82, 0.89, 0.95, 1.0];

    return offsets.map((mins, idx) => {
      const pDate = new Date(baseDate.getTime() + mins * 60 * 1000);
      return {
        time: formatHHMM(pDate),
        vibration: +(vibVal * (factors[idx] * (0.9 + Math.random() * 0.1))).toFixed(1),
        displacement: +(dispVal * factors[idx]).toFixed(1),
        crack: +(crackVal * factors[idx]).toFixed(1),
        temperature: +(tempVal + (idx * 0.2)).toFixed(1)
      };
    });
  }, [currentTime, vibVal, dispVal, crackVal]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header with Time Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
          Sensor Readings (Real-time)
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </h3>

        <div className="relative">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F17] border border-slate-700 text-[11px] text-slate-300 font-medium hover:border-slate-500 transition-colors cursor-pointer">
            <span>{timeRange}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Multi-line chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              stroke="#475569" 
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              domain={[0, 10]}
              ticks={[0, 2.5, 5.0, 7.5, 10.0]}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
            />
            
            {/* 4 Colored Lines with dots */}
            <Line type="monotone" dataKey="vibration" stroke="#A855F7" strokeWidth={2} dot={{ r: 3, fill: '#A855F7' }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="displacement" stroke="#EAB308" strokeWidth={2} dot={{ r: 3, fill: '#EAB308' }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="crack" stroke="#00B4D8" strokeWidth={2} dot={{ r: 3, fill: '#00B4D8' }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="temperature" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
          <span>Vibration (mm/s)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
          <span>Displacement (mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00B4D8]" />
          <span>Crack Index</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Temperature (°C)</span>
        </div>
      </div>

    </div>
  );
}
