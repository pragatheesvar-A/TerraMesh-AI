import React from 'react';
import { Cpu, Radio, Server, Brain, Activity, Wifi, Layers, CheckCircle2 } from 'lucide-react';

export default function HardwareArchitecture() {
  const pipelineSteps = [
    {
      id: 'nodes',
      title: 'Heltec ESP32 LoRa 32 V3',
      subtitle: 'In-Situ Borehole Telemetry',
      icon: Cpu,
      status: '98.4% Operational',
      details: ['MPU6050 6-DOF IMU', 'Linear Potentiometer Extensometer', 'SX1262 LoRa 868MHz Transceiver', 'LiFePO4 Solar/Battery Backup'],
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/40'
    },
    {
      id: 'mesh',
      title: 'Underground LoRa Mesh',
      subtitle: 'Multi-Hop Relay Protocol',
      icon: Radio,
      status: 'Mesh Active (14 Relays)',
      details: ['Dynamic Ad-Hoc Topology', '100ms Packet Latency', 'Sub-GHz Penetration Through Coal', 'AES-128 Hardware Encrypted'],
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/40'
    },
    {
      id: 'gateway',
      title: 'Central Surface Gateway',
      subtitle: 'Shaft-Head Concentrator',
      icon: Wifi,
      status: 'Dual-Uplink Online',
      details: ['SX1302 8-Channel Concentrator', 'Fiber Optic Surface Trunk', 'Cellular 4G LTE Failover', 'Edge Buffer & NTP Sync'],
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/40'
    },
    {
      id: 'backend',
      title: 'TerraMesh Backend Server',
      subtitle: 'High-Throughput Ingestion',
      icon: Server,
      status: '12ms Processing Time',
      details: ['TimescaleDB Sensor Store', 'WebSocket Real-Time Dispatch', 'Threshold Compliance Rule Evaluator', 'Role-Based Operator Audit'],
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/40'
    },
    {
      id: 'ai',
      title: 'AI Subsidence Engine',
      subtitle: 'Deep Geotechnical Predictor',
      icon: Brain,
      status: '94.7% Inference Accuracy',
      details: ['Strata Convergence AI Model', 'Explainable AI Feature Weights', '6H / 24H Subsidence Forecast', 'Dynamic Escape Route Solver'],
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/40'
    }
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-[#111827] p-4 shadow-xl font-mono text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-widest text-slate-100 uppercase">
                HARDWARE & MESH TELEMETRY PIPELINE
              </h3>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                END-TO-END VERIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              In-Situ Subsurface Sensor Transducers to AI Geotechnical Decision Engine
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400">
          <span>Protocol: <strong className="text-slate-200">LoRaWAN / Mesh 868 MHz</strong></span>
        </div>
      </div>

      {/* 5-Step Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative flex flex-col justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-cyan-500/50 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${step.bg} ${step.border} border ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">0{idx + 1}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 mb-0.5">
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-400 mb-2.5 font-sans">
                  {step.subtitle}
                </p>

                <div className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-md mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{step.status}</span>
                </div>

                <ul className="space-y-1 text-[10px] text-slate-400 pt-2 border-t border-slate-700/60">
                  {step.details.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 font-sans">
                      <span className="text-cyan-400 text-xs leading-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Specs */}
      <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
        <div>
          <span>Borehole Nodes: <strong className="text-slate-200">18 / 18 Synced</strong></span>
          <span className="mx-2">•</span>
          <span>Mesh Topology: <strong className="text-slate-200">Self-Healing AODV-LoRa</strong></span>
        </div>
        <span className="text-cyan-400 font-bold">Project Standard 112 & 124 Compliant Ingress</span>
      </div>
    </div>
  );
}
