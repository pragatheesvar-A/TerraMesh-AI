import React, { useState } from 'react';
import { 
  ShieldAlert, Activity, AlertTriangle, CheckCircle2, 
  MapPin, Layers, Download, Compass, Box 
} from 'lucide-react';
import InfrastructureRisk from '../dashboard/InfrastructureRisk';
import DigitalTwinPreview from '../dashboard/DigitalTwinPreview';

export default function RiskAnalysisView({ onOpenDigitalTwin }) {
  const [selectedSector, setSelectedSector] = useState('Sector 7 — Longwall 04');

  const sectorRisks = [
    {
      id: 'sec-7',
      name: 'Sector 7 — Longwall Panel 04',
      status: 'CRITICAL',
      riskScore: 87.0,
      displacement: '14.2 mm',
      subsidenceRate: '4.8 mm/day',
      strata: 'Overlying Sandstone Bed Separation',
      workers: 7,
      faultLine: '12m from Damodar Fault F-3'
    },
    {
      id: 'sec-3',
      name: 'Sector 3 — North Bord & Pillar Goaf',
      status: 'WARNING',
      riskScore: 68.5,
      displacement: '3.8 mm',
      subsidenceRate: '1.2 mm/day',
      strata: 'Pillar Rib Spalling',
      workers: 18,
      faultLine: '45m from Fault F-1'
    },
    {
      id: 'sec-1',
      name: 'Sector 1 — Main Incline Haulage Drift',
      status: 'SAFE',
      riskScore: 8.8,
      displacement: '0.4 mm',
      subsidenceRate: '0.1 mm/day',
      strata: 'Competent Shale Roof Support',
      workers: 42,
      faultLine: 'Stable Basal Granite'
    },
    {
      id: 'sec-5',
      name: 'Sector 5 — West Ventilation Intake',
      status: 'SAFE',
      riskScore: 12.4,
      displacement: '0.6 mm',
      subsidenceRate: '0.2 mm/day',
      strata: 'Bolted Mesh Support Arch',
      workers: 24,
      faultLine: 'Nominal'
    }
  ];

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-950/50 border border-red-500/40 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans">
              GEOTECHNICAL RISK ANALYSIS & STRATA STABILITY
            </h2>
            <p className="text-[10px] text-slate-400">
              Cross-Sector Convergence, Bord-and-Pillar Goaf Cavity & Surface Infrastructure Impact
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDigitalTwin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <Box className="w-3.5 h-3.5" />
          <span>OPEN 3D DIGITAL TWIN</span>
        </button>
      </div>

      {/* Sector Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {sectorRisks.map((sec) => {
          const isCrit = sec.status === 'CRITICAL';
          const isWarn = sec.status === 'WARNING';

          const badgeColor = isCrit
            ? 'bg-red-950/50 text-red-400 border-red-500/40'
            : (isWarn ? 'bg-amber-950/50 text-amber-400 border-amber-500/40' : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40');

          return (
            <div 
              key={sec.id}
              className={`p-4 rounded-xl bg-[#111827] border transition-all space-y-3 shadow-xl ${
                isCrit ? 'border-red-500/50 bg-red-950/20' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-100">{sec.name}</h3>
                  <span className="text-[10px] text-slate-400">{sec.strata}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded border uppercase ${badgeColor}`}>
                  {sec.status}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-700/70 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Index:</span>
                  <span className={isCrit ? 'font-bold text-red-400' : 'font-bold text-slate-100'}>
                    {sec.riskScore} / 100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Displacement:</span>
                  <span className={isCrit ? 'font-bold text-red-400' : 'text-slate-200'}>{sec.displacement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subsidence Velocity:</span>
                  <span className="text-amber-400 font-semibold">{sec.subsidenceRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fault Line:</span>
                  <span className="text-slate-300">{sec.faultLine}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700/60">
                  <span className="text-slate-400">Miners Deployed:</span>
                  <span className={isCrit ? 'font-bold text-red-400' : 'text-emerald-400 font-medium'}>{sec.workers} Personnel</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surface Infrastructure Risk Impact */}
      <InfrastructureRisk onOpenImpactMap={onOpenDigitalTwin} />

    </div>
  );
}
