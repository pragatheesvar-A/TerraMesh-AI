import React, { useState } from 'react';
import { Box, Layers, Play, ArrowDown, Sliders, Sparkles, Activity, Maximize2 } from 'lucide-react';

export default function DigitalTwinPreview({ onOpenFullTwin }) {
  const [deformationOffset, setDeformationOffset] = useState(20);

  // Baseline risk is 62%, +20% deformation increases to 84% as specified in prompt
  const baseRisk = 62;
  const simulatedRisk = Math.min(99, Math.round(baseRisk + (deformationOffset * 1.1)));

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 flex flex-col justify-between shadow-xl relative overflow-hidden text-[#F8FAFC]">
      
      {/* Subtle ambient accent background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#F8FAFC] uppercase font-mono">
                DIGITAL MINE TWIN
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                3D Subsurface Geomechanical Simulation
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFullTwin}
            className="p-1.5 rounded-lg bg-[#162235] border border-slate-700 text-slate-300 hover:text-white hover:border-[#06B6D4] transition-colors shadow-sm cursor-pointer"
            title="Expand 3D Digital Twin"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stylized 3D Underground Cross-Section Preview */}
        <div className="p-3 rounded-xl bg-[#162235] border border-slate-700/80 mb-3 font-mono">
          <div className="flex flex-col gap-1.5 text-xs">
            
            {/* Layer 1: Surface */}
            <div className="relative p-2 rounded-lg bg-[#111827] border border-slate-700 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-[#F8FAFC]">1. Ground Surface</span>
              </div>
              <span className="text-[10px] text-slate-400">Elev +210m &bull; Topography</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-3 h-3 animate-bounce" />
            </div>

            {/* Layer 2: Subsidence Zone */}
            <div className={`relative p-2 rounded-lg border flex items-center justify-between transition-colors shadow-sm ${
              simulatedRisk >= 75 ? 'bg-red-950/50 border-red-800 text-red-400' : 'bg-amber-950/50 border-amber-800 text-amber-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                <span className="font-bold">2. Subsidence Zone (Trough)</span>
              </div>
              <span className="text-[10px] font-bold">
                Depression: {Math.round(12.4 * (1 + deformationOffset / 100))} mm
              </span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-3 h-3" />
            </div>

            {/* Layer 3: Underground Mine Panels */}
            <div className="relative p-2 rounded-lg bg-[#111827] border border-slate-700 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                <span className="font-bold text-[#F8FAFC]">3. Underground Panels</span>
              </div>
              <span className="text-[10px] text-slate-400">Panel 17-B &bull; Depth -145m</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-3 h-3" />
            </div>

            {/* Layer 4: Tunnel Network */}
            <div className="relative p-2 rounded-lg bg-[#111827] border border-slate-700 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="font-bold text-[#F8FAFC]">4. Tunnel Network</span>
              </div>
              <span className="text-[10px] text-slate-400">Haulage Incline & Airway Drift</span>
            </div>

          </div>
        </div>

        {/* WHAT-IF SIMULATION Interactive Slider */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/80 font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>WHAT-IF SIMULATION</span>
            </div>
            <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-700">
              +{deformationOffset}% Deformation
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={deformationOffset}
            onChange={(e) => setDeformationOffset(Number(e.target.value))}
            className="w-full accent-[#F59E0B] bg-slate-800 rounded-lg cursor-pointer h-1.5 mb-2"
          />

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-900/60">
            <span className="text-slate-400 text-[11px]">Resulting Risk Impact:</span>
            <span className="font-bold text-[#F8FAFC]">
              <span className="text-slate-400">{baseRisk}%</span>
              <span className="text-amber-400 mx-1">&rarr;</span>
              <span className={`${simulatedRisk >= 75 ? 'text-red-400 font-extrabold' : 'text-amber-400'}`}>
                {simulatedRisk}%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Button: OPEN DIGITAL TWIN */}
      <div className="pt-3 border-t border-slate-800 mt-3">
        <button
          onClick={onOpenFullTwin}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-950/50 hover:bg-cyan-950/80 border border-[#06B6D4]/40 text-[#06B6D4] text-xs font-mono font-bold tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Box className="w-3.5 h-3.5" />
          <span>OPEN DIGITAL TWIN (3D VIEW)</span>
        </button>
      </div>

    </div>
  );
}
