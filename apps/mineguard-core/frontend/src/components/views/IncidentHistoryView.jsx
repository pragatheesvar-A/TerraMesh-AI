import React, { useState } from 'react';
import { 
  History, Clock, AlertTriangle, ShieldCheck, CheckCircle2, 
  Search, Filter, Download, ArrowRight, MapPin, Eye 
} from 'lucide-react';

export default function IncidentHistoryView({ onSelectIncident }) {
  const [search, setSearch] = useState('');

  const pastIncidents = [
    {
      id: 'INC-2026-084',
      date: '2026-09-10 16:42 IST',
      zone: 'Sector 7 — Longwall 04',
      type: 'Roof Delamination Sag',
      severity: 'CRITICAL',
      peakValue: '14.2 mm',
      duration: '45 mins',
      status: 'RESOLVED',
      resolution: 'Hydraulic chocks reinforced. Route B bypass deployed.'
    },
    {
      id: 'INC-2026-083',
      date: '2026-09-08 09:15 IST',
      zone: 'Sector 3 — North Pillar 12',
      type: 'Micro-Seismic Tremor',
      severity: 'WARNING',
      peakValue: '240 Joules',
      duration: '12 mins',
      status: 'RESOLVED',
      resolution: 'Extraction paused for 2 hours until acoustic emissions stabilized.'
    },
    {
      id: 'INC-2026-082',
      date: '2026-09-04 14:05 IST',
      zone: 'Sector 5 — West Intake Portal',
      type: 'Ventilation Flow Dip',
      severity: 'CAUTION',
      peakValue: '88% Flow',
      duration: '20 mins',
      status: 'RESOLVED',
      resolution: 'Auxiliary fan duct cleared of coal dust accumulation.'
    },
    {
      id: 'INC-2026-081',
      date: '2026-08-28 22:30 IST',
      zone: 'Sector 2 — Main Shaft Sump',
      type: 'Pore Water Pressure Spike',
      severity: 'WARNING',
      peakValue: '1.42 MPa',
      duration: '3 hours',
      status: 'RESOLVED',
      resolution: 'Submersible dewatering pumps activated; hydrostatic head normalized.'
    }
  ];

  const filtered = pastIncidents.filter(inc => {
    return inc.id.toLowerCase().includes(search.toLowerCase()) ||
           inc.zone.toLowerCase().includes(search.toLowerCase()) ||
           inc.type.toLowerCase().includes(search.toLowerCase());
  });

  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportDossier = () => {
    const headers = ['Incident ID', 'Date & Time', 'Zone', 'Anomaly Type', 'Severity', 'Peak Measurement', 'Duration', 'Status', 'Remedial Action'];
    const rows = filtered.map(inc => [
      `"${inc.id}"`,
      `"${inc.date}"`,
      `"${inc.zone}"`,
      `"${inc.type}"`,
      `"${inc.severity}"`,
      `"${inc.peakValue}"`,
      `"${inc.duration}"`,
      `"${inc.status}"`,
      `"${inc.resolution}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident_History_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto font-mono text-xs text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-sans flex items-center gap-2">
              INCIDENT HISTORY & STATUTORY AUDIT ARCHIVE
              {exportSuccess && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-mono animate-fade-in">
                  ✓ Report Exported
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              Project Standard 112 Mandatory Geotechnical Anomaly Record
            </p>
          </div>
        </div>

        <button 
          onClick={handleExportDossier}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Incident Report</span>
        </button>
      </div>

      {/* Incident Archive Table */}
      <div className="rounded-xl border border-slate-700 bg-[#111827] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-900/80 text-[10px] text-slate-400 uppercase">
                <th className="p-3">Incident ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Mine Sector</th>
                <th className="p-3">Anomaly Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Peak Telemetry</th>
                <th className="p-3">Status & Action Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/70">
              {filtered.map((inc) => {
                const isCrit = inc.severity === 'CRITICAL';
                const isWarn = inc.severity === 'WARNING';

                const badgeColor = isCrit
                  ? 'bg-red-950/50 text-red-400 border-red-500/40'
                  : (isWarn ? 'bg-amber-950/50 text-amber-400 border-amber-500/40' : 'bg-amber-950/40 text-amber-300 border-amber-500/30');

                return (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-100">
                      {inc.id}
                    </td>
                    <td className="p-3 text-slate-400">{inc.date}</td>
                    <td className="p-3 text-cyan-400 font-semibold">{inc.zone}</td>
                    <td className="p-3 font-medium text-slate-200">{inc.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded border uppercase ${badgeColor}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-red-400">
                      {inc.peakValue}
                    </td>
                    <td className="p-3">
                      <div className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{inc.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{inc.resolution}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
