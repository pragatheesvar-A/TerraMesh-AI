import React from 'react';
import { Building2, Navigation, AlertTriangle, ArrowRight, ShieldAlert, Car, Home, Trees, Wheat } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function InfrastructureRisk({ onOpenImpactMap }) {
  const { infrastructure } = useMineData();

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road': return Car;
      case 'building': return Home;
      case 'agriculture': return Wheat;
      case 'forest': return Trees;
      default: return Building2;
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 flex flex-col justify-between shadow-xl text-[#F8FAFC]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-slate-100 uppercase font-mono">
                INFRASTRUCTURE RISK
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Surface Strain & Proximity Impact Assessment
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-red-400">
            {infrastructure.roads_at_risk + infrastructure.buildings_at_risk} Threatened
          </span>
        </div>

        {/* 4 Overview Metric Boxes */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 text-center font-mono">
          <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-500/30">
            <div className="text-base font-black text-orange-400">{infrastructure.roads_at_risk}</div>
            <div className="text-[10px] text-orange-400 uppercase font-bold">Roads</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
            <div className="text-base font-black text-amber-400">{infrastructure.buildings_at_risk}</div>
            <div className="text-[10px] text-amber-400 uppercase font-bold">Buildings</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-950/30 border border-yellow-500/30">
            <div className="text-base font-black text-yellow-400">{infrastructure.agricultural_areas}</div>
            <div className="text-[10px] text-yellow-400 uppercase font-bold">Agri</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
            <div className="text-base font-black text-emerald-400">{infrastructure.forest_areas}</div>
            <div className="text-[10px] text-emerald-400 uppercase font-bold">Forest</div>
          </div>
        </div>

        {/* List of high/medium impact items */}
        <div className="space-y-1.5 font-mono">
          <div className="text-[10px] uppercase text-slate-400 flex items-center justify-between px-1 pb-1">
            <span>Asset / Distance</span>
            <span>Risk Level</span>
          </div>

          {infrastructure.items.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isHigh = item.risk_level === 'HIGH';
            const isMed = item.risk_level === 'MEDIUM';
            const badgeColor = isHigh 
              ? 'bg-red-950/50 text-red-400 border-red-500/40' 
              : (isMed ? 'bg-amber-950/50 text-amber-400 border-amber-500/40' : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40');

            return (
              <div 
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-cyan-500/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 shadow-sm">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>Proximity: <strong>{item.distance_m}m</strong></span>
                      <span>&bull;</span>
                      <span className="text-slate-500">{item.status_note?.slice(0, 32)}...</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border ${badgeColor}`}>
                    {item.risk_level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button: VIEW IMPACT MAP */}
      <div className="pt-3 border-t border-slate-700/80 mt-3">
        <button
          onClick={onOpenImpactMap}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider transition-colors shadow-sm"
        >
          <span>VIEW IMPACT MAP</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
