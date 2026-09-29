import React, { useState } from 'react';
import { 
  Sliders, Play, RotateCcw, AlertTriangle, ShieldCheck, 
  Cpu, Radio, Navigation, CheckCircle2, ArrowRight, Zap, Layers 
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import DataBadge from '../common/DataBadge';

export default function SimulationLabView({ onOpenEvacuationModal }) {
  const { isSimulating, activeScenario, runScenario, resetSimulation } = useMineData();
  const [selectedScenario, setSelectedScenario] = useState('CRITICAL');

  const scenarios = [
    {
      id: 'NORMAL',
      title: 'Normal Operational Baseline',
      desc: 'All transducers nominal. Ground displacement < 0.8mm. Normal 10-min eco packet sync.',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
      badge: 'SAFE',
      displacement: '0.4 mm',
      tilt: '0.2°',
      risk: '8.8%',
      aiVerdict: 'Stable Strata Equilibrium'
    },
    {
      id: 'WATCH',
      title: 'Minor Micro-Seismic Shift (Watch)',
      desc: 'Slight pillar rib convergence and micro-fractures during extraction changeover.',
      color: 'border-amber-500/30 text-amber-400 bg-amber-950/40',
      badge: 'WATCH',
      displacement: '2.1 mm',
      tilt: '1.4°',
      risk: '35.4%',
      aiVerdict: 'Elevate Surveillance to 1-Min Intervals'
    },
    {
      id: 'WARNING',
      title: 'Roof Bed Separation (Warning)',
      desc: 'Rapid displacement rate +2.8mm/day in depillaring section. Acoustic pulse spikes.',
      color: 'border-orange-500/30 text-orange-400 bg-orange-950/40',
      badge: 'WARNING',
      displacement: '4.9 mm',
      tilt: '3.1°',
      risk: '68.2%',
      aiVerdict: 'Tighten Support & Alert Section Overman'
    },
    {
      id: 'CRITICAL',
      title: 'Imminent Goaf Collapse (Critical Level 4)',
      desc: 'Critical roof sag (14.2mm) with tension crack dilation. Route A blocked by rockfall.',
      color: 'border-red-500/40 text-red-400 bg-red-950/50',
      badge: 'CRITICAL',
      displacement: '14.2 mm',
      tilt: '4.8°',
      risk: '87.0%',
      aiVerdict: 'Immediate Worker Evacuation Protocol'
    }
  ];

  const currentScen = scenarios.find(s => s.id === selectedScenario) || scenarios[3];

  const handleRun = () => {
    runScenario(selectedScenario);
  };

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans">
              GEOTECHNICAL SIMULATION LAB &amp; STRESS BENCH
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-400">
                Synthetic Multi-Transducer Fault Injection &amp; Emergency Response Validation
              </p>
              <DataBadge variant="simulation" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((scen) => {
          const isSelected = selectedScenario === scen.id;
          return (
            <div
              key={scen.id}
              onClick={() => setSelectedScenario(scen.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                isSelected 
                  ? 'border-cyan-500 bg-cyan-950/30 shadow-xl ring-1 ring-cyan-500/50' 
                  : 'border-slate-700 bg-[#111827] hover:border-slate-600 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${scen.color}`}>
                  {scen.badge}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>

              <h3 className="font-bold text-xs text-slate-100">{scen.title}</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">{scen.desc}</p>

              <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                <div>Displ: <strong className="text-slate-100">{scen.displacement}</strong></div>
                <div>Risk: <strong className="text-red-400">{scen.risk}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual 6-Stage Pipeline Flow */}
      <div className="p-4 rounded-xl bg-[#111827] border border-slate-700 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            ACTIVE SIMULATION 6-STAGE CAUSAL PIPELINE
          </h3>
          <span className="text-[10px] text-cyan-400 font-semibold">State: {selectedScenario} SCENARIO LOADED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* Step 1: Input */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/70 space-y-1">
            <span className="text-[9px] text-slate-400 block font-bold">STAGE 01</span>
            <h4 className="font-bold text-slate-100">Input Fault</h4>
            <p className="text-[10px] text-slate-400">Strata stress injection in Sector 7</p>
          </div>

          {/* Step 2: Sensor Response */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/70 space-y-1">
            <span className="text-[9px] text-slate-400 block font-bold">STAGE 02</span>
            <h4 className="font-bold text-cyan-400">Sensor Telemetry</h4>
            <p className="text-[10px] text-slate-400">MG-03 detects {currentScen.displacement} sag & {currentScen.tilt} tilt</p>
          </div>

          {/* Step 3: AI Analysis */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/70 space-y-1">
            <span className="text-[9px] text-slate-400 block font-bold">STAGE 03</span>
            <h4 className="font-bold text-amber-400">AI Inference</h4>
            <p className="text-[10px] text-slate-400">AI confidence 94.7% convergence rate</p>
          </div>

          {/* Step 4: Risk Level */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/70 space-y-1">
            <span className="text-[9px] text-slate-400 block font-bold">STAGE 04</span>
            <h4 className="font-bold text-red-400">Risk Rating</h4>
            <p className="text-[10px] text-slate-400">Global Index: {currentScen.risk} ({currentScen.badge})</p>
          </div>

          {/* Step 5: Alert Dispatch */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/70 space-y-1">
            <span className="text-[9px] text-slate-400 block font-bold">STAGE 05</span>
            <h4 className="font-bold text-red-400">Alarm Beacon</h4>
            <p className="text-[10px] text-slate-400">Continuous 880Hz audio siren triggered</p>
          </div>

          {/* Step 6: Dynamic Evacuation */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-emerald-500/30 space-y-1">
            <span className="text-[9px] text-emerald-400 block font-bold">STAGE 06</span>
            <h4 className="font-bold text-emerald-400">Dynamic Evac</h4>
            <p className="text-[10px] text-slate-400">Divert miners via East Drift Route B</p>
          </div>
        </div>

        {selectedScenario === 'CRITICAL' && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs text-red-300 font-bold">
                Critical Level 4 emergency protocol engaged. 7 underground workers in immediate danger.
              </span>
            </div>
            {onOpenEvacuationModal && (
              <button
                onClick={onOpenEvacuationModal}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-900/30"
              >
                Open Evacuation Dispatch
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
