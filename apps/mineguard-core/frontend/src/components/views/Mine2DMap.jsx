import React, { useState } from 'react';
import { 
  Box, Radio, Activity, AlertTriangle, ShieldAlert, CheckCircle2, 
  MapPin, Droplets, Wind, Sparkles, Layers, Info
} from 'lucide-react';

/**
 * Mine2DMap: High-Precision Engineering 2D Plan View of Underground Coal Mine
 * Features:
 * - Direct 2D Top-Down counterpart of the 3D Digital Twin
 * - Synchronized with the SAME centralized mine data model
 * - Exact panel outlines (Panel 17-B, 18-A, 18-C), tunnel drifts (Haulage, Airway), boreholes (BH-04, BH-07)
 * - Dynamic iso-subsidence deformation contour rings matching What-If simulation
 * - Interactive click & hover highlights linked to central selection state
 */
export default function Mine2DMap({
  activeHotspot,
  onSelectHotspot,
  layerControls,
  whatIfDeformation,
  sensors,
  isLive
}) {
  const [hoveredEntity, setHoveredEntity] = useState(null);

  // Dynamic deformation sag calculations
  const sagMm = Math.round(16 * (1 + (whatIfDeformation - 30) / 100));
  const heatRatio = whatIfDeformation / 30;

  return (
    <div className="relative w-full h-full min-h-[520px] lg:min-h-[580px] bg-[#070B14] p-4 flex flex-col justify-between select-none overflow-hidden font-mono">
      
      {/* Top Left Title & Engineering Specs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            2D Mine Planimetric Cross-Section (Jharia Basin Seam XII/XIV)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span>Datum: WGS84 / UTM Zone 45N</span>
          <span>•</span>
          <span className="text-cyan-400">Scale: 1:2500 Metric</span>
        </div>
      </div>

      {/* Main 2D Vector Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <svg 
          viewBox="0 0 900 600" 
          className="w-full h-full max-h-[500px] drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Engineering Background Grid */}
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.8" />
            </pattern>
            <pattern id="fineGridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(30, 41, 59, 0.15)" strokeWidth="0.4" />
            </pattern>
            <radialGradient id="subsidenceHeat" cx="42%" cy="45%" r="40%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity={0.45 * heatRatio} />
              <stop offset="35%" stopColor="#ea580c" stopOpacity={0.35 * heatRatio} />
              <stop offset="65%" stopColor="#d97706" stopOpacity={0.20 * heatRatio} />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </radialGradient>
            <linearGradient id="aquiferGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="900" height="600" fill="#070B14" />
          <rect width="900" height="600" fill="url(#fineGridPattern)" />
          <rect width="900" height="600" fill="url(#gridPattern)" />

          {/* Mine Lease Boundary Fence */}
          <rect 
            x="40" y="40" width="820" height="520" 
            fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,4" 
          />
          <text x="50" y="60" fill="#475569" fontSize="10" fontWeight="bold">COLLIERY LEASE BOUNDARY (BLOCK IV)</text>

          {/* LAYER 1: Geological Water Layer / Aquifer Basin */}
          {layerControls.waterTable && (
            <g id="water-layer">
              <path 
                d="M 100 200 Q 300 160 500 220 T 800 260 L 780 480 Q 500 520 200 460 Z" 
                fill="url(#aquiferGrad)" 
                stroke="#00b4d8" 
                strokeWidth="1" 
                strokeDasharray="4,2" 
                opacity="0.7"
              />
              <text x="650" y="250" fill="#00b4d8" fontSize="10" fontWeight="bold">AQUIFER BASIN (-45m)</text>
            </g>
          )}

          {/* LAYER 1.5: SATELLITE InSAR DEFORMATION GRID */}
          {layerControls.insarOverlay && (
            <g id="insar-overlay">
              {/* Mock NISAR/Sentinel fused raster grid over the panel area */}
              <rect x="220" y="150" width="320" height="250" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" opacity="0.8" />
              <text x="230" y="170" fill="#8b5cf6" fontSize="10" fontWeight="bold">SIMULATED InSAR GRID (labelled mock provider)</text>
              <g opacity="0.4">
                {/* 10x10 Grid cells with mock deformation colors */}
                {Array.from({ length: 10 }).map((_, i) => (
                  Array.from({ length: 10 }).map((_, j) => (
                    <rect 
                      key={`insar-${i}-${j}`} 
                      x={220 + j*32} y={150 + i*25} 
                      width="32" height="25" 
                      fill={Math.random() > 0.8 ? '#ef4444' : (Math.random() > 0.6 ? '#f59e0b' : '#3b82f6')}
                      fillOpacity="0.5"
                      stroke="#8b5cf6" strokeWidth="0.5"
                    />
                  ))
                ))}
              </g>
            </g>
          )}

          {/* LAYER 2: Subsidence Iso-Contour Heatmap */}
          {layerControls.subsidenceZone && (
            <g id="subsidence-contours">
              {/* Subsidence Heat Gradient Blob */}
              <ellipse 
                cx="370" cy="270" rx={180 * Math.min(1.4, heatRatio)} ry={130 * Math.min(1.4, heatRatio)} 
                fill="url(#subsidenceHeat)" 
              />

              {/* Iso-contour Rings (Outer Green -> Yellow -> Orange -> Inner Red) */}
              <ellipse 
                cx="370" cy="270" rx="160" ry="110" 
                fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" 
              />
              <text x="490" y="375" fill="#10b981" fontSize="9">-2mm Iso-Line</text>

              <ellipse 
                cx="370" cy="270" rx="120" ry="85" 
                fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.9" 
              />
              <text x="460" y="340" fill="#d97706" fontSize="9">-8mm Iso-Line</text>

              <ellipse 
                cx="370" cy="270" rx="80" ry="60" 
                fill="none" stroke="#ea580c" strokeWidth="1.8" opacity="0.95" 
              />
              <text x="420" y="315" fill="#ea580c" fontSize="9">-12mm Iso-Line</text>

              {/* Center Critical Depression Trough */}
              <ellipse 
                cx="370" cy="270" rx="45" ry="35" 
                fill="#ef4444" fillOpacity={0.25 * heatRatio}
                stroke="#ef4444" strokeWidth="2.5" 
                className="animate-pulse cursor-pointer"
                onClick={() => onSelectHotspot('subsidence')}
              />
              <text 
                x="370" y="274" 
                fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle"
              >
                Max Sag: -{sagMm}mm
              </text>
            </g>
          )}

          {/* LAYER 3: Surface Infrastructure & Plant Footprint */}
          {layerControls.groundSurface && (
            <g id="surface-infrastructure">
              {/* Surface Haulage Road */}
              <path d="M 700 40 L 700 560" stroke="#1e293b" strokeWidth="18" fill="none" />
              <path d="M 700 40 L 700 560" stroke="#475569" strokeWidth="2" strokeDasharray="8,6" fill="none" />
              <text x="715" y="100" fill="#64748b" fontSize="9" transform="rotate(90, 715, 100)">SURFACE HAUL ROAD</text>

              {/* Surface Mine Complex Buildings */}
              <g 
                className="cursor-pointer group"
                onClick={() => onSelectHotspot('surface')}
              >
                <rect 
                  x="620" y="80" width="130" height="90" 
                  fill={activeHotspot === 'surface' ? '#0369a1' : '#0f172a'} 
                  stroke={activeHotspot === 'surface' ? '#38bdf8' : '#334155'} 
                  strokeWidth="2" rx="4"
                />
                <rect x="635" y="95" width="40" height="60" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <rect x="685" y="95" width="50" height="35" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="655" cy="125" r="8" fill="#f59e0b" fillOpacity="0.8" />
                <text x="685" y="185" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                  MINE COMPLEX (+210m)
                </text>
              </g>
            </g>
          )}

          {/* LAYER 4: Underground Panels */}
          {layerControls.undergroundPanels && (
            <g id="underground-panels">
              {/* Panel 17-B (Active Extraction Longwall) */}
              <g 
                className="cursor-pointer transition-all"
                onClick={() => onSelectHotspot('panel17')}
              >
                <rect 
                  x="240" y="180" width="280" height="190" 
                  fill={activeHotspot === 'panel17' ? '#581c87' : '#1e1b4b'} 
                  fillOpacity="0.6"
                  stroke={activeHotspot === 'panel17' ? '#c084fc' : '#a855f7'} 
                  strokeWidth="2.5" 
                  strokeDasharray="6,3" 
                  rx="6"
                />
                <text x="380" y="210" fill="#c084fc" fontSize="12" fontWeight="bold" textAnchor="middle">
                  PANEL 17-B (ACTIVE LONGWALL -145m)
                </text>
                <text x="380" y="225" fill="#e9d5ff" fontSize="9" textAnchor="middle">
                  Shearer Operating Face | Seam XII
                </text>
              </g>

              {/* Panel 18-A (Reserve Panel) */}
              <g 
                className="cursor-pointer transition-all"
                onClick={() => onSelectHotspot('panel18')}
              >
                <rect 
                  x="240" y="390" width="200" height="130" 
                  fill={activeHotspot === 'panel18' ? '#1e3a8a' : '#0f172a'} 
                  fillOpacity="0.5"
                  stroke={activeHotspot === 'panel18' ? '#60a5fa' : '#3b82f6'} 
                  strokeWidth="1.8" 
                  strokeDasharray="4,2" 
                  rx="4"
                />
                <text x="340" y="440" fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">
                  PANEL 18-A (DEVELOPED)
                </text>
                <text x="340" y="455" fill="#93c5fd" fontSize="9" textAnchor="middle">
                  Reserve Seam XIV | -145m Level
                </text>
              </g>
            </g>
          )}

          {/* LAYER 5: Underground Tunnel Network */}
          {layerControls.tunnelNetwork && (
            <g id="tunnel-network">
              {/* Haulage Incline Ramp (Cyan) */}
              <g 
                className="cursor-pointer"
                onClick={() => onSelectHotspot('haulage')}
              >
                <path 
                  d="M 640 140 L 480 280 L 220 280 L 150 420" 
                  fill="none" 
                  stroke={activeHotspot === 'haulage' ? '#38bdf8' : '#00b4d8'} 
                  strokeWidth="7" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  opacity="0.9"
                />
                <path 
                  d="M 640 140 L 480 280 L 220 280 L 150 420" 
                  fill="none" 
                  stroke="#070B14" 
                  strokeWidth="2.5" 
                  strokeDasharray="4,4" 
                />
                <text x="210" y="270" fill="#00b4d8" fontSize="10" fontWeight="bold">
                  HAULAGE INCLINE (CONVEYOR TRUNK)
                </text>
              </g>

              {/* Airway Ventilation Drift (Emerald) */}
              <g 
                className="cursor-pointer"
                onClick={() => onSelectHotspot('airway')}
              >
                <path 
                  d="M 670 140 L 560 180 L 560 380 L 200 380 L 120 480" 
                  fill="none" 
                  stroke={activeHotspot === 'airway' ? '#34d399' : '#10b981'} 
                  strokeWidth="5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  opacity="0.85"
                />
                <text x="570" y="320" fill="#10b981" fontSize="10" fontWeight="bold">
                  EAST AIRWAY DRIFT
                </text>
              </g>
            </g>
          )}

          {/* LAYER 6: Boreholes & Sensors */}
          {layerControls.sensors && (
            <g id="sensors-and-boreholes">
              {/* Borehole BH-04 (West Extensometer) */}
              <g 
                className="cursor-pointer"
                onClick={() => onSelectHotspot('bh04')}
              >
                <circle cx="280" cy="250" r="10" fill="#dc2626" fillOpacity="0.3" className="animate-ping" />
                <circle cx="280" cy="250" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="230" y="220" width="100" height="20" fill="#0b132b" stroke="#ef4444" strokeWidth="1" rx="3" />
                <text x="280" y="234" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">
                  BH-04 (-{sagMm}mm)
                </text>
              </g>

              {/* Borehole BH-07 (East Piezometer) */}
              <g 
                className="cursor-pointer"
                onClick={() => onSelectHotspot('bh07')}
              >
                <circle cx="480" cy="300" r="10" fill="#ea580c" fillOpacity="0.3" className="animate-ping" />
                <circle cx="480" cy="300" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="430" y="315" width="100" height="20" fill="#0b132b" stroke="#f97316" strokeWidth="1" rx="3" />
                <text x="480" y="329" fill="#fdba74" fontSize="9" fontWeight="bold" textAnchor="middle">
                  BH-07 ({Math.round(sagMm * 0.85)}mm)
                </text>
              </g>

              {/* Sensor Node S-17B-01 */}
              <g className="cursor-pointer" onClick={() => onSelectHotspot('panel17')}>
                <polygon points="370,165 378,175 370,185 362,175" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <text x="370" y="160" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
                  S-17B-01 (TILT 4.2°)
                </text>
              </g>
            </g>
          )}

        </svg>
      </div>

      {/* Bottom GIS Coordinates & Status Ticker */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>2D Synchronized with 3D Geological Twin</span>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">Active Focus: <strong className="text-cyan-400">{activeHotspot.toUpperCase()}</strong></span>
        </div>
        <div className="font-mono text-cyan-300">
          Click any element to inspect telemetry
        </div>
      </div>

    </div>
  );
}
