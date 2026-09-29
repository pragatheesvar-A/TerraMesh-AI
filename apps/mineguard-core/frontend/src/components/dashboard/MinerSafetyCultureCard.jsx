import React from 'react';

export default function MinerSafetyCultureCard() {
  return (
    <div className="relative rounded-2xl border border-slate-800 overflow-hidden shadow-xl bg-[#111827] h-full min-h-[140px] flex items-center justify-end p-5 font-sans group">
      {/* Background Image: Miner facing sunset */}
      <div 
        className="absolute inset-0 bg-cover bg-left bg-no-repeat opacity-80 transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('/images/miner-safety-banner.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B0F17]/40 to-[#0B0F17]/90 pointer-events-none" />

      {/* Slogan Text */}
      <div className="relative z-10 text-right space-y-0.5 leading-snug">
        <div className="text-sm font-bold text-white drop-shadow">
          People Safe
        </div>
        <div className="text-xs font-semibold text-slate-200 drop-shadow">
          Mines Sustainable
        </div>
        <div className="text-xs font-black text-amber-400 drop-shadow mt-0.5">
          India Stronger
        </div>
      </div>
    </div>
  );
}
