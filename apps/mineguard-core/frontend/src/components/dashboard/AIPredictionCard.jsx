import React from 'react';
import { ArrowUp, ArrowRight } from 'lucide-react';

export default function AIPredictionCard({ onOpenPrediction }) {
  const riskPercent = 68;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-2 mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          AI Prediction – Subsidence Risk
        </h3>
      </div>

      {/* Content: Left Circular Gauge + Right Insights */}
      <div className="flex items-center gap-4">
        
        {/* Circular Progress Gauge */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-500"
              strokeDasharray={`${riskPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-white">{riskPercent}%</span>
            <span className="text-[9px] text-amber-400 font-semibold leading-tight">Moderate Risk</span>
          </div>
        </div>

        {/* Right Insight Text & Button */}
        <div className="flex-1 space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <ArrowUp className="w-3.5 h-3.5 shrink-0" />
            <span>Risk increasing in next 7 days.</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Possible surface subsidence in East Zone.
          </p>

          <button
            onClick={onOpenPrediction}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-white hover:bg-cyan-950/40 text-xs font-semibold transition-colors cursor-pointer shadow-sm mt-1"
          >
            <span>View Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
