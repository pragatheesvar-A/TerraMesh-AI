import React, { useState } from 'react';
import { 
  AlertOctagon, Check, Eye, Radio, CheckCircle2, AlertTriangle, ShieldCheck, MapPin
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function AlertCenter({ onOpenBroadcast, onSelectAlertZone }) {
  const { alerts, acknowledgeAlert } = useMineData();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [unackOnly, setUnackOnly] = useState(false);

  const filteredAlerts = (alerts || []).filter(a => {
    if (unackOnly && a.acknowledged) return false;
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const pendingCount = (alerts || []).filter(a => !a.acknowledged).length;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon className="w-3 h-3 text-red-400" />,
          label: 'Critical',
          className: 'bg-red-950/70 border-red-800 text-red-400 font-bold'
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'Warning',
          className: 'bg-amber-950/70 border-amber-800 text-amber-400 font-medium'
        };
      default:
        return {
          icon: <ShieldCheck className="w-3 h-3 text-cyan-400" />,
          label: 'Caution',
          className: 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400'
        };
    }
  };

  return (
    <div className="flex flex-col space-y-4 font-sans text-xs text-slate-100 w-full">
      
      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D1524] border border-slate-800 rounded-lg p-3 shadow-md">
        
        {/* Left: Summary */}
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
            Operational Incident &amp; Alert Registry
          </h2>
          {pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-800 text-red-400 font-mono-data text-[10px] font-bold">
              {pendingCount} Pending Ack
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 font-mono-data text-[10px]">
              All Acknowledged
            </span>
          )}
        </div>

        {/* Right: Unacknowledged Toggle & Severity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setUnackOnly(!unackOnly)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              unackOnly 
                ? 'bg-amber-950/70 border-amber-600 text-amber-300' 
                : 'bg-[#131E33] border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Pending Ack Only
          </button>

          <div className="flex items-center bg-[#131E33] p-0.5 rounded-md border border-slate-700 text-[11px]">
            {['ALL', 'CRITICAL', 'WARNING', 'CAUTION'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterSeverity === sev 
                    ? 'bg-cyan-500/20 text-cyan-400 font-medium' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMPACT OPERATIONAL ALERT TABLE ──────────────────────────────── */}
      <div className="ops-table-container max-h-[640px] overflow-y-auto">
        <table className="ops-table" aria-label="Incident and safety alerts table">
          <thead>
            <tr>
              <th className="w-24">Severity</th>
              <th>Incident &amp; Anomaly</th>
              <th className="w-28">Sector / Node</th>
              <th className="w-36">Telemetry Reading</th>
              <th className="w-36">Time &amp; Owner</th>
              <th className="text-right sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-200">No active incidents matching criteria</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">All monitored parameters are within nominal safety thresholds.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alt) => {
                const badge = getSeverityBadge(alt.severity);
                const isCrit = alt.severity === 'CRITICAL';

                return (
                  <tr 
                    key={alt.id}
                    className={`transition-colors ${alt.acknowledged ? 'opacity-65' : ''}`}
                  >
                    <td className="cell-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${badge.className}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-100 text-xs">{alt.title}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5 max-w-xl">{alt.description}</div>
                    </td>
                    <td className="cell-nowrap text-slate-300">
                      <div className="font-medium text-slate-200">{alt.zone || 'Zone B'}</div>
                      <div className="text-[10px] text-slate-400 font-mono-data">{alt.sensor_id || 'NODE-017'}</div>
                    </td>
                    <td className="cell-nowrap">
                      <span className={`font-mono-data text-[11px] font-semibold ${isCrit ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {/* Real reading/limit from the alert record — previously hardcoded */}
                        {(alt.reading != null || alt.detected_value != null)
                          ? `${alt.reading ?? alt.detected_value}${alt.limit ? ` / ${alt.limit} limit` : ''}`
                          : '—'}
                      </span>
                    </td>
                    <td className="cell-nowrap text-slate-300">
                      <div className="font-mono-data text-slate-200 text-[11px]">{alt.timestamp}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{alt.owner || 'Control Room Lead'}</div>
                    </td>
                    <td className="text-right sticky-action">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {alt.acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/40">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acked</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => acknowledgeAlert(alt.id)}
                            className="px-2.5 py-1 rounded bg-[#162235] hover:bg-emerald-950 border border-slate-700 hover:border-emerald-700 text-emerald-400 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Mark Ack
                          </button>
                        )}
                        <button
                          onClick={() => onSelectAlertZone && onSelectAlertZone(alt.zone)}
                          className="px-2 py-1 rounded hover:bg-slate-800 text-cyan-400 border border-transparent hover:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                          title="Locate zone on GIS Map"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Locate</span>
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

      {/* Emergency Operational Trigger */}
      <div className="p-3 bg-[#0D1524] border border-slate-800 rounded-lg flex items-center justify-between">
        <span className="text-slate-400 text-xs">Require broader emergency alert transmission?</span>
        <button
          onClick={onOpenBroadcast}
          className="px-3 py-1.5 rounded-md bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-red-400" />
          <span>Dispatch Emergency Warning Broadcast &rarr;</span>
        </button>
      </div>

    </div>
  );
}
