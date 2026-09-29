import React, { useState, useMemo } from 'react';
import { 
  Users, MapPin, Radio, Search, 
  CheckCircle2, AlertTriangle, ShieldAlert, HeartPulse, AlertOctagon, UserCheck
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import WorkerDetailDrawer from '../common/WorkerDetailDrawer';

export default function WorkerSafetyView({ onOpenBroadcast, onOpenEvacuation, onLocateWorkerOnMap }) {
  const { workers } = useMineData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [riskOnly, setRiskOnly] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const total = workers?.length || 126;
  const safeCount = workers?.filter(w => w.status === 'SAFE').length || 109;
  const cautionCount = workers?.filter(w => w.status === 'CAUTION').length || 10;
  const dangerCount = workers?.filter(w => w.status === 'DANGER').length || 7;

  const filtered = useMemo(() => {
    return (workers || []).filter(w => {
      const matchesSearch = w.name?.toLowerCase().includes(search.toLowerCase()) || 
                            w.code?.toLowerCase().includes(search.toLowerCase()) ||
                            w.zone?.toLowerCase().includes(search.toLowerCase());
      
      if (riskOnly && w.status !== 'DANGER' && w.status !== 'CAUTION') return false;
      const matchesStatus = filterStatus === 'ALL' || w.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [workers, search, filterStatus, riskOnly]);

  const handleOpenWorker = (worker) => {
    setSelectedWorker(worker);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DANGER':
        return {
          icon: <AlertOctagon className="w-3 h-3 text-red-400" />,
          label: 'Danger (Zone B)',
          className: 'bg-red-950/70 border-red-800 text-red-400 font-bold'
        };
      case 'CAUTION':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'Caution',
          className: 'bg-amber-950/70 border-amber-800 text-amber-400 font-medium'
        };
      default:
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
          label: 'Safe',
          className: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
        };
    }
  };

  return (
    <div className="space-y-4 w-full font-sans text-xs text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Worker Subsurface Accountability
            </h1>
            <p className="text-[11px] text-slate-400">
              Smart helmet RFID beacon telemetry, physiological vitals &amp; hazardous zone avoidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBroadcast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950/70 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Broadcast to Personnel</span>
          </button>
        </div>
      </div>

      {/* Summary Band: 126 Total | 109 Safe | 10 Caution | 7 Danger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 shadow">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Underground Total</span>
          <div className="text-xl font-bold text-slate-100 font-mono-data mt-0.5">{total}</div>
          <span className="text-[10px] text-cyan-400">All beacons active</span>
        </div>

        <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 shadow">
          <span className="text-[10px] text-emerald-400 uppercase block font-semibold">Confirmed Safe</span>
          <div className="text-xl font-bold text-emerald-400 font-mono-data mt-0.5">{safeCount}</div>
          <span className="text-[10px] text-slate-400">Nominal sectors</span>
        </div>

        <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 shadow">
          <span className="text-[10px] text-amber-400 uppercase block font-semibold">Caution Watch</span>
          <div className="text-xl font-bold text-amber-400 font-mono-data mt-0.5">{cautionCount}</div>
          <span className="text-[10px] text-slate-400">Pillar proximity</span>
        </div>

        <div className="p-3 rounded-lg bg-[#0D1524] border border-red-950/80 shadow">
          <span className="text-[10px] text-red-400 uppercase block font-semibold">Danger Priority</span>
          <div className="text-xl font-bold text-red-400 font-mono-data mt-0.5">{dangerCount}</div>
          <span className="text-[10px] text-red-400 font-semibold">Zone B sag area</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker name, ID, zone..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#131E33] border border-slate-700 text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Priority Risk Only Toggle */}
          <button
            onClick={() => setRiskOnly(!riskOnly)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              riskOnly 
                ? 'bg-amber-950/70 border-amber-600 text-amber-300' 
                : 'bg-[#131E33] border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Workers at Risk Only</span>
          </button>

          <div className="flex items-center gap-1 bg-[#131E33] p-0.5 rounded-md border border-slate-700 text-[11px]">
            {['ALL', 'DANGER', 'CAUTION', 'SAFE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-cyan-500/20 text-cyan-400 font-medium' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Worker Table with Sticky Header */}
      <div className="ops-table-container max-h-[640px] overflow-y-auto">
        <table className="ops-table" aria-label="Worker safety roster table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Worker ID</th>
              <th>Name &amp; Role</th>
              <th>Assigned Sector</th>
              <th>Vitals (Pulse/SpO2)</th>
              <th>Nearest Exit Corridor</th>
              <th>Last Ping</th>
              <th className="sticky-action text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No workers found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((w) => {
                const badge = getStatusBadge(w.status);
                const isCrit = w.status === 'DANGER';

                return (
                  <tr 
                    key={w.id || w.code}
                    onClick={() => handleOpenWorker(w)}
                    className="cursor-pointer"
                  >
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${badge.className}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td>
                      <span className="font-mono-data font-semibold text-slate-100">
                        {w.code || w.id}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{w.name}</div>
                      <div className="text-[10px] text-slate-400">{w.role || 'Continuous Miner Op'}</div>
                    </td>
                    <td className="text-slate-300">
                      <div>{w.zone || 'Zone B'}</div>
                      <div className="text-[10px] text-slate-400 font-mono-data">{w.location || 'Panel 17-B / Cut 4'}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-mono-data text-slate-200">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                        <span>{w.heartRate || 76} bpm &bull; {w.spo2 || 98}%</span>
                      </div>
                    </td>
                    <td className="text-slate-300">
                      {isCrit ? (
                        <span className="text-emerald-400 font-medium">Route B (East Airway)</span>
                      ) : (
                        <span className="text-slate-400">Main Haulage Ramp</span>
                      )}
                    </td>
                    <td className="text-slate-400 font-mono-data text-[11px]">
                      {w.lastSeen || '1s ago'}
                    </td>
                    <td className="sticky-action text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onLocateWorkerOnMap) onLocateWorkerOnMap(w);
                          }}
                          className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-cyan-400 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Locate on spatial map"
                        >
                          <MapPin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWorker(w);
                          }}
                          className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Vitals
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <WorkerDetailDrawer
        worker={selectedWorker}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLocateOnMap={onLocateWorkerOnMap}
        onOpenEvacuation={onOpenEvacuation}
      />

    </div>
  );
}
