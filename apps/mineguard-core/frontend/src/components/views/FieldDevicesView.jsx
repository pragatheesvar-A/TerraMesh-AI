import React, { useState } from 'react';
import { 
  HardDrive, Radio, Wifi, Battery, RefreshCw, Power, 
  Settings, CheckCircle2, AlertTriangle, Cpu, Layers, Download 
} from 'lucide-react';
import HardwareArchitecture from '../dashboard/HardwareArchitecture';

export default function FieldDevicesView() {
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [actionFeedback, setActionFeedback] = useState({});

  const handleDeviceAction = (deviceId, actionName) => {
    setActionFeedback(prev => ({ ...prev, [deviceId]: actionName }));
    setTimeout(() => {
      setActionFeedback(prev => ({ ...prev, [deviceId]: null }));
    }, 3000);
  };

  const devices = [
    {
      id: 'NODE-GW-01',
      name: 'Main Shaft Surface Gateway Concentrator',
      type: 'SX1302 8-Channel LoRa Concentrator',
      location: 'Shaft-Head Surface Substation',
      status: 'ONLINE',
      battery: 100,
      power: 'Mains 230V + UPS',
      signal: '-42 dBm (Fiber Uplink)',
      lastSync: '1 sec ago',
      connectedNodes: 18
    },
    {
      id: 'NODE-REP-01',
      name: 'Mid-Shaft Mesh Relay 01',
      type: 'Heltec ESP32 LoRa 32 V3 Router',
      location: 'Level 2 Cross-Cut (-180m)',
      status: 'ONLINE',
      battery: 94,
      power: 'Solar/POE Line',
      signal: '-58 dBm',
      lastSync: '2 sec ago',
      connectedNodes: 6
    },
    {
      id: 'NODE-REP-02',
      name: 'Incline Drift Mesh Relay 02',
      type: 'Heltec ESP32 LoRa 32 V3 Router',
      location: 'East Drift Junction (-280m)',
      status: 'ONLINE',
      battery: 88,
      power: 'LiFePO4 12V Battery Pack',
      signal: '-64 dBm',
      lastSync: '3 sec ago',
      connectedNodes: 8
    },
    {
      id: 'NODE-REP-03',
      name: 'Pillar 17-B Wireless Micro-Gateway',
      type: 'Sub-GHz Mesh Concentrator IP68',
      location: 'Zone B Active Heading (-340m)',
      status: 'WARNING',
      battery: 76,
      power: 'Intrinsically Safe Battery',
      signal: '-78 dBm (High Attenuation)',
      lastSync: '5 sec ago',
      connectedNodes: 4
    }
  ];

  const filtered = devices.filter(d => {
    if (deviceFilter === 'ALL') return true;
    return d.status === deviceFilter;
  });

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans">
              FIELD HARDWARE, GATEWAYS & MESH ROUTERS
            </h2>
            <p className="text-[10px] text-slate-400">
              SX1302 Concentrators, Heltec V3 Repeater Relays & Intrinsic Underground Gateways
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-700 text-[10px]">
          {['ALL', 'ONLINE', 'WARNING', 'OFFLINE'].map((status) => (
            <button
              key={status}
              onClick={() => setDeviceFilter(status)}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                deviceFilter === status
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Architecture Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <HardwareArchitecture />
        </div>
        
        {/* TinyML Edge Computing Profile */}
        <div className="p-4 rounded-xl bg-[#0D1524] border border-slate-700 flex flex-col space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-[#8b5cf6]" />
            <h3 className="font-bold text-slate-200">Edge ML Architecture (TinyML)</h3>
          </div>
          
          <div className="space-y-3 flex-1 text-xs text-slate-300">
            <p>Smart sensor nodes execute quantized ONNX models locally via Cortex-M4 DSP.</p>
            
            <div className="bg-[#111827] p-2.5 rounded border border-slate-700/80">
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#8b5cf6]">vibration_anomaly_v1.onnx</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono-data">
                <span>Model Size: 48 KB</span>
                <span>Inference Latency: 14.5 ms</span>
              </div>
            </div>

            <div className="bg-[#111827] p-2.5 rounded border border-slate-700/80">
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#8b5cf6]">gas_drift_v2.onnx</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono-data">
                <span>Model Size: 24 KB</span>
                <span>Inference Latency: 8.2 ms</span>
              </div>
            </div>

            <div className="mt-auto pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Edge Payload Bandwidth:</span>
                <span className="font-bold text-cyan-400 font-mono-data">~32 bytes / hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((d) => {
          const feedback = actionFeedback[d.id];
          return (
            <div 
              key={d.id}
              className="p-3.5 rounded-xl bg-[#111827] border border-slate-700 shadow-xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{d.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        d.status === 'ONLINE' ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400' : 'bg-amber-950 border border-amber-500/50 text-amber-400'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{d.name}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model / Type:</span>
                    <span className="text-slate-200 truncate max-w-[150px]">{d.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Physical Location:</span>
                    <span className="text-cyan-400 truncate max-w-[150px]">{d.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power Source:</span>
                    <span className="text-slate-200">{d.power}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Battery State:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-400" />
                    {d.battery}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">LoRa RF Signal:</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    {d.signal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telemetry Sync:</span>
                  <span className="text-slate-300">{d.lastSync}</span>
                </div>

                {feedback && (
                  <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold text-center animate-fade-in">
                    ✓ {feedback}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleDeviceAction(d.id, `Ping ACK (12ms) received`)}
                  className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 text-[10px] text-center transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  Ping
                </button>
                <button
                  onClick={() => handleDeviceAction(d.id, `Config parameters synchronized`)}
                  className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 text-[10px] text-center transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  Configure
                </button>
                <button
                  onClick={() => handleDeviceAction(d.id, `Reboot command sent via LoRa`)}
                  className="py-1.5 rounded bg-slate-800 hover:bg-red-950/50 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-[10px] text-center transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  Restart
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
