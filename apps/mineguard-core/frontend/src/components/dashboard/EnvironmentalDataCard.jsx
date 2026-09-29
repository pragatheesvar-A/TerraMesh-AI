import React from 'react';
import { Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';

export default function EnvironmentalDataCard() {
  const metrics = [
    { label: 'Temperature', value: '28', unit: '°C', icon: Thermometer, color: 'text-amber-400' },
    { label: 'Humidity', value: '72', unit: '%', icon: Droplets, color: 'text-cyan-400' },
    { label: 'Wind Speed', value: '12', unit: 'km/h', icon: Wind, color: 'text-teal-400' },
    { label: 'Rainfall', value: '0', unit: 'mm', icon: CloudRain, color: 'text-blue-400' },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-2 mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          Environmental Data
        </h3>
      </div>

      {/* 4 Columns */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="space-y-1">
              <Icon className={`w-5 h-5 mx-auto ${m.color}`} />
              <div className="text-sm sm:text-base font-black text-white">
                {m.value} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
