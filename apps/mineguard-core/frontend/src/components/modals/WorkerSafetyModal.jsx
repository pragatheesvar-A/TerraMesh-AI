import React, { useState } from 'react';
import { X, Users, Search, Heart, Activity, MapPin, Radio, AlertTriangle } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function WorkerSafetyModal({ isOpen, onClose, onLocateWorker }) {
  const { workers, broadcastEmergency } = useMineData();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.code.toLowerCase().includes(search.toLowerCase()) ||
                          w.name.toLowerCase().includes(search.toLowerCase());
    const matchesZone = zoneFilter === 'ALL' || w.zone === zoneFilter;
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesZone && matchesStatus;
  });

  const [pingStatus, setPingStatus] = useState(null);

  const handlePingWorker = (w) => {
    setPingStatus(`Vibrating emergency haptic alert dispatched to ${w.code} (${w.name})`);
    setTimeout(() => setPingStatus(null), 3500);
  };

  const handleLocateWorker = (w) => {
    if (onLocateWorker) {
      onLocateWorker(w);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-6 font-mono text-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-[#F8FAFC]">
                WORKER BIOMETRIC & SAFETY TRACKING ROSTER
              </h2>
              <p className="text-xs text-slate-400">
                126 Underground Coal Mine Operatives &bull; RFID Smart Helmets
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

        {/* Live Action Status Banner */}
        {pingStatus && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold text-center animate-fade-in">
            ✓ {pingStatus}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Worker ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#162235] border border-slate-700 text-[#F8FAFC] placeholder-slate-400 focus:border-[#06B6D4] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-[#162235] border border-slate-700 text-[#F8FAFC]"
            >
              <option value="ALL">All Zones</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B (High Risk)</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D">Zone D</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-[#162235] border border-slate-700 text-[#F8FAFC]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DANGER">DANGER (7)</option>
              <option value="CAUTION">CAUTION (10)</option>
              <option value="SAFE">SAFE (109)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border border-slate-700/80 rounded-xl bg-[#111827] text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#162235] border-b border-slate-800 text-[11px] text-slate-400">
              <tr>
                <th className="p-2.5">ID / Name</th>
                <th className="p-2.5">Assigned Zone</th>
                <th className="p-2.5 text-center">Depth</th>
                <th className="p-2.5 text-center">Heart Rate</th>
                <th className="p-2.5 text-center">SpO2</th>
                <th className="p-2.5 text-center">Last Sync</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredWorkers.map((w) => {
                const isDanger = w.status === 'DANGER';
                const isCaution = w.status === 'CAUTION';
                const badgeColor = isDanger
                  ? 'bg-red-950/80 text-red-400 border-red-800 animate-pulse'
                  : (isCaution ? 'bg-amber-950/80 text-amber-400 border-amber-800' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800');

                return (
                  <tr key={w.id} className="hover:bg-[#162235] transition-colors">
                    <td className="p-2.5">
                      <div className="font-bold text-[#F8FAFC]">{w.code}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{w.name}</div>
                    </td>
                    <td className="p-2.5 text-[#F8FAFC]">{w.zone}</td>
                    <td className="p-2.5 text-center text-slate-400">-{w.depth_m}m</td>
                    <td className="p-2.5 text-center">
                      <span className={`font-bold flex items-center justify-center gap-1 ${isDanger ? 'text-red-400' : 'text-[#F8FAFC]'}`}>
                        <Heart className="w-3 h-3 text-red-400" />
                        {w.heart_rate} bpm
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-[#06B6D4]">{w.spo2}%</td>
                    <td className="p-2.5 text-center text-slate-400">{w.last_update}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${badgeColor}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLocateWorker(w)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-[#06B6D4] hover:text-[#0B0F17] text-[#06B6D4] border border-[#06B6D4]/40 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                          title="Locate Worker on Map"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Map</span>
                        </button>
                        <button
                          onClick={() => handlePingWorker(w)}
                          className="px-2.5 py-1 rounded-lg bg-[#162235] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-colors shadow-sm cursor-pointer"
                        >
                          Ping Pager
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredWorkers.length} of {workers.length} tracked operatives</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
