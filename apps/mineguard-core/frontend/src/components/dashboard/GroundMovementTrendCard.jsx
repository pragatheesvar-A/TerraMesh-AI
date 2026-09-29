import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function GroundMovementTrendCard() {
  const data = [
    { day: 'Sep 8', value: 4.8 },
    { day: 'Sep 9', value: 3.9 },
    { day: 'Sep 10', value: 5.2 },
    { day: 'Sep 11', value: 6.8 },
    { day: 'Sep 12', value: 7.4 },
    { day: 'Sep 13', value: 8.1 },
    { day: 'Sep 14', value: 9.2 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-2 mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          Ground Movement Trend (Last 7 Days)
        </h3>
      </div>

      {/* Line Chart */}
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#475569" 
              tick={{ fill: '#94A3B8', fontSize: 9 }}
              tickLine={false}
            />
            <YAxis 
              stroke="#475569" 
              tick={{ fill: '#94A3B8', fontSize: 9 }}
              domain={[0, 15]}
              ticks={[0, 5, 10, 15]}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#00B4D8" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#00B4D8' }} 
              activeDot={{ r: 5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
