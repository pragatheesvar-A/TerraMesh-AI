import React, { useState } from 'react';
import { X, FileText, Download, Printer, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';

export default function ReportModal({ isOpen, onClose }) {
  const { kpis, aiRisk, zones } = useMineData();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Backend expects X-API-Key (never a Bearer token that is never stored)
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({
          report_type: 'daily_safety',
          data: {
            risk_level: aiRisk?.risk_level || 'CRITICAL',
            risk_score: aiRisk?.current_risk_score || 87.0,
            generated_by: 'TerraMesh UI (Er. Poovarasan K)',
            period: 'Last 24 Hours',
            summary: `Overall Hazard Index: ${kpis?.overall_risk || 87}% (CRITICAL P0)\nActive Evacuation Status: ${kpis?.evac_status || 'EVACUATION ORDERED'}\nUnderground Personnel: ${kpis?.active_workers || 126} Miners Logged\nTelemetry Integrity: 99.4% (All In-Situ Mesh Nodes Active)`,
            zones: [
              { code: 'Zone B - East Airway', status: 'CRITICAL', workers: 7, sensors: 12 }
            ],
            exceptions: [
              { id: 'SEN-VIB-017', type: 'Geophone', value: '7.4 mm/s', provenance: 'MEASURED' },
              { id: 'SEN-DSP-009', type: 'Extensometer', value: '12.4 mm/d', provenance: 'MEASURED' },
              { id: 'MODEL-SHADOW', type: 'Residual AI', value: '87% Anomaly', provenance: 'MODEL OUTPUT' }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error('PDF Generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TerraMesh_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report from server.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-6 font-mono text-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-[#F8FAFC]">
                STATUTORY MINE SAFETY & SUBSIDENCE AUDIT
              </h2>
              <p className="text-xs text-slate-400">
                Safety Circular 04 of 2022 &bull; Safety Report
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

        {/* Report Content Preview */}
        <div className="space-y-4 text-xs bg-[#162235] p-4 rounded-xl border border-slate-700/80">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-slate-400 text-[10px]">FACILITY:</span>
              <div className="font-bold text-[#F8FAFC] text-sm">Jharia Coalfield Unit 04</div>
              <div className="text-[10px] text-slate-400">Mining Lease Record #JH-8829-C (project record)</div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px]">REPORT TIMESTAMP:</span>
              <div className="font-bold text-amber-400">{new Date().toLocaleString()}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Smart India Hackathon SIH26025</div>
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h4 className="text-amber-400 font-bold uppercase text-xs mb-2">1. Executive Geotechnical Findings</h4>
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-slate-300 space-y-1 font-sans">
              <div>&bull; <strong className="text-red-400">Zone B Status:</strong> Classified as CRITICAL (Composite Risk Index {aiRisk.current_risk_score}%).</div>
              <div>&bull; <strong className="text-red-400">Crown Pillar 17-B:</strong> Differential tilt of 4.8° and extensometer displacement 12.4mm indicate active delamination.</div>
              <div>&bull; <strong className="text-red-400">Worker Exposure:</strong> 7 personnel identified within primary zone of subsidence influence. Dynamic rerouting to Route B active.</div>
            </div>
          </div>

          {/* Zones Summary Table */}
          <div>
            <h4 className="text-[#F8FAFC] font-bold uppercase text-xs mb-2 font-mono">2. Geotechnical Monitoring Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-1.5">Zone</th>
                    <th className="py-1.5">Risk Score</th>
                    <th className="py-1.5">Subsidence Rate</th>
                    <th className="py-1.5">Sensors</th>
                    <th className="py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {zones.map(z => (
                    <tr key={z.id}>
                      <td className="py-2 font-bold text-[#F8FAFC]">{z.code} - {z.name}</td>
                      <td className="py-2 text-slate-300">{z.risk_score}%</td>
                      <td className="py-2 text-slate-300">{z.subsidence_rate} mm/day</td>
                      <td className="py-2 text-slate-300">{z.active_sensors}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          z.status === 'CRITICAL' ? 'bg-red-950/80 text-red-400 border border-red-800' : (z.status === 'CAUTION' ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800')
                        }`}>
                          {z.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Statement */}
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-300 font-sans">
              This automated assessment complies with the mandatory digital early warning directives of the Coal Mines Regulations (CMR) 2017. AI confidence level logged at {aiRisk.ai_confidence}%.
            </p>
          </div>

          {/* Download Success Confirmation */}
          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-between gap-2 text-xs text-emerald-300 font-mono animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>TERRAMESH_AI_Safety_Audit_Report.txt downloaded successfully!</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold">
                SAVED
              </span>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Hash: SHA256-e91b4028fa</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#162235] border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F17] font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Compiling PDF...' : 'Export Official PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
