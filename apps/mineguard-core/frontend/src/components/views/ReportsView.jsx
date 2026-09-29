import React, { useState } from 'react';
import { 
  FileText, Download, ShieldCheck, Layers, Calendar, CheckCircle2
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function ReportsView({ onOpenReportModal }) {
  const { kpis } = useMineData();
  const [reportType, setReportType] = useState('PROJECT_REG_112');
  const [dateRange, setDateRange] = useState('LAST_24_HOURS');

  const reportArchives = [
    { id: 'PS112-904', title: 'Strata Control Safety Report', period: 'Past 7 Days', date: '2026-09-22 08:00 IST', standard: 'Project Standard 112' },
    { id: 'CMR-GAS-772', title: 'Atmospheric & Ventilation Log', period: 'Past 24 Hours', date: '2026-09-21 18:30 IST', standard: 'CMR 2017' },
    { id: 'SIH-INSP-012', title: 'Mining Safety Inspection Log', period: 'Past 30 Days', date: '2026-09-15 12:00 IST', standard: 'SIH-2026' },
    { id: 'PS112-903', title: 'Strata Control Safety Report', period: 'Past 7 Days', date: '2026-09-08 08:00 IST', standard: 'Project Standard 112' },
  ];

  return (
    <div className="space-y-4 w-full font-sans text-xs text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Statutory Safety &amp; Audit Reports
            </h1>
            <p className="text-[11px] text-slate-400">
              Safety Circular 04 &amp; Coal Mines Regulations (CMR 2017) Safety Reports
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Open Audit Report</span>
        </button>
      </div>

      {/* Filter & Generator Bar */}
      <div className="p-3.5 rounded-lg bg-[#0D1524] border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-slate-400 block mb-1 font-medium text-[11px]">Compliance Standard / Template:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 rounded bg-[#131E33] border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="PROJECT_REG_112">Project Standard 112 Strata Control Dossier</option>
              <option value="CMR_2017_GAS">CMR 2017 Atmospheric &amp; Ventilation Audit</option>
              <option value="SIH_INSPECTION">SIH26025 Mining Safety Inspection Log</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium text-[11px]">Observation Period:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 rounded bg-[#131E33] border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="LAST_24_HOURS">Past 24 Hours (Operational Shift)</option>
              <option value="LAST_7_DAYS">Past 7 Days (Weekly Review)</option>
              <option value="LAST_30_DAYS">Past 30 Days (Monthly Statutory Filing)</option>
            </select>
          </div>

          <div>
            <button
              onClick={onOpenReportModal}
              className="w-full py-2 px-3 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Generate Compliance PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Overview Summary */}
      <div className="p-4 rounded-lg bg-[#0D1524] border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-xs text-slate-200 uppercase tracking-wide">
              Jharia Colliery Sector 07 &bull; Statutory Compliance Summary
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono-data">
            SYSTEM VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-[#131E33] border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Sensor Array Telemetry</span>
            <div className="text-sm font-bold text-emerald-400 font-mono-data mt-0.5">48 / 48 Validated</div>
            <p className="text-[11px] text-slate-400 mt-0.5">100% LoRa mesh packet verification</p>
          </div>

          <div className="p-3 rounded bg-[#131E33] border border-slate-800">
            <span className="text-[10px] text-red-400 block">Active Strata Violation</span>
            <div className="text-sm font-bold text-red-400 font-mono-data mt-0.5">1 Triggered (Zone B)</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Roof sag 14.2mm (Evacuation SOP deployed)</p>
          </div>

          <div className="p-3 rounded bg-[#131E33] border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Safety Officer Sign-Off</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">Er. Poovarasan K</div>
            <p className="text-[11px] text-slate-400 font-mono-data mt-0.5">Audit Stamp: 2026-09-22 18:30 IST</p>
          </div>
        </div>
      </div>

      {/* Recent Generated Reports Log Table */}
      <div className="ops-table-container">
        <div className="p-3 bg-[#0B111E] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wide">Archived Safety Reports</h3>
          </div>
        </div>
        
        <table className="ops-table" aria-label="Archived compliance dossiers">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Template Standard</th>
              <th>Period Covered</th>
              <th>Generated Timestamp</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reportArchives.map((rep) => (
              <tr key={rep.id}>
                <td className="font-mono-data font-semibold text-cyan-400">{rep.id}</td>
                <td className="font-medium text-slate-200">{rep.title}</td>
                <td className="text-slate-300">{rep.period}</td>
                <td className="text-slate-400 font-mono-data">{rep.date}</td>
                <td className="text-right">
                  <button 
                    onClick={onOpenReportModal}
                    className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
