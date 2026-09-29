import React, { useState } from 'react';
import { Maximize2, Layers } from 'lucide-react';

export default function MineSiteMapCard({ onOpenFullMap, onSelectSensor }) {
  const [viewMode, setViewMode] = useState('3D'); // '2D' | '3D'

  // Markers matching the reference image:
  // North Shaft (Green), Sensor-03 (Red with pulse), Main Tunnel (Amber), West Zone (Green), East Zone (Green), South Shaft (Green)
  const markers = [
    { id: 'north-shaft', name: 'North Shaft', status: 'normal', color: 'bg-emerald-500', top: '22%', left: '26%' },
    { id: 'sensor-03', name: 'Sensor-03', status: 'alert', color: 'bg-red-500', top: '38%', left: '42%', isAlert: true },
    { id: 'main-tunnel', name: 'Main Tunnel', status: 'watch', color: 'bg-amber-500', top: '56%', left: '33%' },
    { id: 'west-zone', name: 'West Zone', status: 'normal', color: 'bg-emerald-500', top: '70%', left: '25%' },
    { id: 'east-zone', name: 'East Zone', status: 'normal', color: 'bg-emerald-500', top: '64%', left: '55%' },
    { id: 'south-shaft', name: 'South Shaft', status: 'normal', color: 'bg-emerald-500', top: '80%', left: '46%' },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden shadow-xl flex flex-col justify-between relative font-sans h-full">
      
      {/* Top Header Bar */}
      <div className="p-3.5 pb-2 flex items-center justify-between z-10">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          Mine Site Map
        </h3>

        {/* Controls: [2D] [3D] [Layers] [⛶] + North Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium">
          <div className="flex bg-[#0B0F17] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                viewMode === '2D' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                viewMode === '3D' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D
            </button>
          </div>

          <button
            onClick={onOpenFullMap}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Layers</span>
          </button>



          {/* North Indicator */}
          <div className="flex items-center gap-0.5 pl-1.5 text-[11px] text-slate-400 font-bold font-mono">
            <span>N</span>
            <span className="text-cyan-400">↑</span>
          </div>
        </div>
      </div>

      {/* Main Map Visual Viewport */}
      <div className="relative flex-1 min-h-[360px] lg:min-h-[420px] bg-[#07090e] overflow-hidden select-none">
        
        {/* 3D Pit Aerial Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/mine-site-map-3d.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-transparent to-transparent pointer-events-none" />

        {/* Concentric Radar Ping Rings on Sensor-03 */}
        <div className="absolute top-[38%] left-[42%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-28 h-28 rounded-full border border-red-500/60 bg-red-500/10 animate-ping" />
          <div className="absolute inset-0 w-20 h-20 m-auto rounded-full border border-red-500/80 animate-pulse" />
        </div>

        {/* Overlay Markers */}
        {markers.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectSensor && onSelectSensor(m)}
            className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: m.top, left: m.left }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 shadow-2xl transition-all group-hover:scale-110 group-hover:border-cyan-400">
              <span className={`w-2 h-2 rounded-full ${m.color} ${m.isAlert ? 'animate-pulse ring-4 ring-red-500/40' : ''}`} />
              <span className="text-[10px] font-bold text-white whitespace-nowrap">
                {m.name}
              </span>
            </div>
          </div>
        ))}

        {/* Bottom Left Map Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-[#0B0F17]/85 backdrop-blur border border-slate-800 p-2.5 rounded-xl text-[10px] font-medium space-y-1 text-slate-300 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Watch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Alert</span>
          </div>
        </div>

      </div>

    </div>
  );
}
