import React, { useState } from 'react';
import { X, Settings, ShieldAlert, Sliders, Bell, Server, Radio, Check } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { soundEnabled, setSoundEnabled } = useMineData();
  const [tiltThreshold, setTiltThreshold] = useState(3.0);
  const [displacementRate, setDisplacementRate] = useState(2.5);
  const [backendUrl, setBackendUrl] = useState(import.meta.env.VITE_API_BASE || 'http://localhost:8000');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-6 font-mono text-xs text-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-[#F8FAFC]">
                COMMAND ROOM THRESHOLD SETTINGS
              </h2>
              <p className="text-xs text-slate-400">
                Early Warning Triggers & Telemetry Bus Configuration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#162235] border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved ? (
          <div className="py-8 text-center space-y-3">
            <Check className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-[#F8FAFC]">THRESHOLDS UPDATED SUCCESSFULLY</div>
            <p className="text-xs text-slate-400">Parameters committed to Local Controller & LoRa Gateway.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Geotechnical Thresholds */}
            <div>
              <span className="font-bold text-[#06B6D4] uppercase tracking-wider block mb-2">
                1. Geotechnical Warning Limits
              </span>
              <div className="space-y-3 p-3 rounded-xl bg-[#162235] border border-slate-700">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Critical Angular Tilt Limit:</span>
                    <span className="font-bold text-[#06B6D4]">{tiltThreshold}°</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={tiltThreshold}
                    onChange={(e) => setTiltThreshold(Number(e.target.value))}
                    className="w-full accent-[#06B6D4] bg-slate-800 rounded h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Max Allowable Displacement Velocity:</span>
                    <span className="font-bold text-red-400">{displacementRate} mm/hr</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.5"
                    value={displacementRate}
                    onChange={(e) => setDisplacementRate(Number(e.target.value))}
                    className="w-full accent-red-500 bg-slate-800 rounded h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Audio Alarm */}
            <div>
              <span className="font-bold text-[#06B6D4] uppercase tracking-wider block mb-2">
                2. Alarm Sound & Notification
              </span>
              <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#F8FAFC]">Synthesized Industrial Siren Audio</div>
                  <div className="text-[10px] text-slate-400">Emits 880Hz emergency tones during critical anomalies</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs cursor-pointer ${
                    soundEnabled ? 'bg-cyan-950/80 text-[#06B6D4] border-[#06B6D4]/50 shadow-sm' : 'bg-[#111827] text-slate-400 border-slate-700'
                  }`}
                >
                  {soundEnabled ? 'ENABLED' : 'MUTED'}
                </button>
              </div>
            </div>

            {/* Backend connection */}
            <div>
              <span className="font-bold text-[#06B6D4] uppercase tracking-wider block mb-2">
                3. FastAPI Production Server Link
              </span>
              <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#111827] border border-slate-700 text-[#F8FAFC] focus:border-[#06B6D4] outline-none"
                />
                <div className="text-[10px] text-emerald-400 font-semibold">
                  WebSocket endpoint: ws://localhost:8000/ws/live-monitoring
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#162235] border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold shadow-md cursor-pointer"
              >
                Save Settings
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
