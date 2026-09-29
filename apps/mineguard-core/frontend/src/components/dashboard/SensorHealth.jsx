import React from 'react';
import { Cpu, Radio, Battery, Server, CheckCircle2, AlertTriangle, ArrowRight, Gauge, Zap, Sun } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function SensorHealth({ onOpenDiagnostics }) {
  const { sensorHealth, sensors } = useMineData();

  // Compute adaptive sampling counts from actual sensors
  const criticalCount = sensors.filter(s => s.status === 'CRITICAL').length || 1;
  const warningCautionCount = sensors.filter(s => s.status === 'WARNING' || s.status === 'CAUTION').length || 4;
  const safeCount = sensors.filter(s => s.status === 'SAFE').length || 42;

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 flex flex-col justify-between shadow-xl text-[#F8FAFC]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-slate-100 uppercase font-mono">
                SENSOR NETWORK HEALTH
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Wireless LoRa Mesh Infrastructure
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Mesh Stable
          </span>
        </div>

        {/* 4 Sensor Categories */}
        <div className="space-y-2 mb-3">
          {sensorHealth.categories.map((cat) => {
            const pct = Math.round((cat.online / cat.total) * 100);
            const isFull = cat.online === cat.total;
            const isDegraded = !isFull && cat.online >= 46;
            const statusColor = isFull ? 'text-emerald-400' : (isDegraded ? 'text-amber-400' : 'text-orange-400');
            const barColor = isFull ? '#10B981' : (isDegraded ? '#F59E0B' : '#F97316');

            return (
              <div key={cat.name} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/70 font-mono">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">{cat.name}:</span>
                  <span className={`font-bold ${statusColor}`}>
                    {cat.online} / {cat.total} Online
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 🔋 Energy-Aware Adaptive Sampling Engine */}
        <div className="mb-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔋</span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Energy-Aware Adaptive Sampling
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold">
              Autonomous AI
            </span>
          </div>

          <p className="text-[10px] text-emerald-300/90 mb-2 leading-relaxed italic font-sans">
            👉 &ldquo;Sensors work slowly when safe and faster when danger is detected.&rdquo;
          </p>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] mb-2">
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 shadow-sm">
              <span className="text-emerald-400 font-bold block">10 Minutes</span>
              <span className="text-slate-400 text-[9px]">{safeCount} Nodes (Normal 🔋)</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-amber-500/30 shadow-sm">
              <span className="text-amber-400 font-bold block">30s &ndash; 1 min</span>
              <span className="text-slate-400 text-[9px]">{warningCautionCount} Nodes (Elevated ⚠️)</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-red-500/30 shadow-sm">
              <span className="text-red-400 font-bold block">5 Seconds</span>
              <span className="text-slate-400 text-[9px]">{criticalCount} Nodes (Critical 🚨)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-emerald-500/20">
            <span>Battery & Solar-Harvest Aware</span>
            <span className="text-emerald-400 font-bold">+68% Lifespan Extension</span>
          </div>
        </div>

        {/* Subsystem Health Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/70">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>LoRa Network</span>
            </div>
            <div className="text-base font-black text-cyan-400">
              {sensorHealth.lora_network_pct}%
            </div>
            <div className="text-[9px] text-emerald-400 font-bold">Healthy</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/70">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Server className="w-3 h-3 text-amber-400" />
              <span>Gateway</span>
            </div>
            <div className="text-base font-black text-emerald-400">
              {sensorHealth.gateway_status}
            </div>
            <div className="text-[9px] text-slate-400">Ch 868 MHz</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/70">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Battery className="w-3 h-3 text-emerald-400" />
              <span>Battery</span>
            </div>
            <div className="text-base font-black text-emerald-400">
              {sensorHealth.battery_health_pct}%
            </div>
            <div className="text-[9px] text-emerald-400 font-bold">Optimal</div>
          </div>
        </div>
      </div>

      {/* Button: NODE HEALTH DETAILS */}
      <div className="pt-3 border-t border-slate-700/80">
        <button
          onClick={onOpenDiagnostics}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider transition-colors shadow-sm"
        >
          <span>NODE HEALTH & ADAPTIVE SAMPLING MATRIX</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
