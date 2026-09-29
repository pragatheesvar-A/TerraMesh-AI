import React, { useState } from 'react';
import { 
  Activity, CheckCircle2, Server, Database, Radio, 
  Brain, Bell, Wifi, RefreshCw, Layers, Terminal 
} from 'lucide-react';
import SensorHealth from '../dashboard/SensorHealth';
import HardwareArchitecture from '../dashboard/HardwareArchitecture';

export default function SystemHealthView({ onOpenDiagnostics }) {
  const [activeLogTab, setActiveLogTab] = useState('ALL');

  const services = [
    { name: 'REST & WebSocket API', status: 'HEALTHY', latency: '12ms', uptime: '99.98%', icon: Server, color: 'text-emerald-400' },
    { name: 'TimescaleDB Sensor Store', status: 'HEALTHY', latency: '4ms', uptime: '100%', icon: Database, color: 'text-emerald-400' },
    { name: 'LoRaWAN Underground Mesh', status: 'HEALTHY', latency: '100ms', uptime: '99.4%', icon: Radio, color: 'text-emerald-400' },
    { name: 'AI Subsidence Engine', status: 'HEALTHY', latency: '48ms', uptime: '99.9%', icon: Brain, color: 'text-emerald-400' },
    { name: 'Shaft-Head Gateway SX1302', status: 'HEALTHY', latency: '8ms', uptime: '100%', icon: Wifi, color: 'text-emerald-400' },
    { name: 'Emergency Dispatch Audio Service', status: 'HEALTHY', latency: '1ms', uptime: '100%', icon: Bell, color: 'text-emerald-400' }
  ];

  const recentLogs = [
    { time: '11:45:02', level: 'INFO', msg: '[TIMESCALEDB] Ingested 18 borehole packets from LoRa Gateway 01.' },
    { time: '11:44:30', level: 'AI_INFERENCE', msg: '[AI_ENGINE] Strata convergence inference pass completed in 42ms (Loss: 0.014).' },
    { time: '11:42:15', level: 'WARN', msg: '[RISK_RULE_ENGINE] MG-03 displacement 14.2mm exceeded engineering limit (5.0mm).' },
    { time: '11:40:00', level: 'INFO', msg: '[LORA_MESH] Route discovery packet broadcast; 18 mesh relays acknowledged.' },
    { time: '11:35:12', level: 'INFO', msg: '[WEBSOCKET] Client authenticated: SUKSHMA Lead Controller (127.0.0.1).' }
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMsg('System health diagnostics synchronized (All 6 services HEALTHY)');
      setTimeout(() => setRefreshMsg(''), 3500);
    }, 600);
  };

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans flex items-center gap-2">
              SYSTEM HEALTH & HARDWARE ARCHITECTURE
              {refreshMsg && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-mono animate-fade-in">
                  ✓ Synced
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              Microservices Status, LoRa Mesh Transceiver Link & Live Production Logs
            </p>
          </div>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Checking...' : 'Refresh Services'}</span>
        </button>
      </div>

      {/* 6 Core Service Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <div key={srv.name} className="p-3 rounded-xl bg-[#111827] border border-slate-700 shadow-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  {srv.status}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-100 truncate">{srv.name}</h4>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Latency: {srv.latency}</span>
                <span>{srv.uptime}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware Architecture Component */}
      <HardwareArchitecture />

      {/* Live System Console Logs */}
      <div className="rounded-xl border border-slate-700 bg-[#0B0F17] p-4 space-y-2 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              SYSTEM EVENT LOG STREAM
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SOCKET CONNECTED
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px] max-h-48 overflow-y-auto">
          {recentLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 py-0.5 text-slate-400 hover:bg-slate-800/60 px-1 rounded transition-colors">
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span className={`font-bold shrink-0 ${
                log.level === 'WARN' ? 'text-red-400' : (log.level === 'AI_INFERENCE' ? 'text-cyan-400' : 'text-emerald-400')
              }`}>
                [{log.level}]
              </span>
              <span className="text-slate-200">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Health Diagnostic Matrix */}
      <SensorHealth onOpenDiagnostics={onOpenDiagnostics} />

    </div>
  );
}
