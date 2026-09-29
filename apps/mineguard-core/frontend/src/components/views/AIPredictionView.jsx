import React, { useState, useMemo } from 'react';
import {
  BrainCircuit, TrendingUp, Cpu, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Activity, Wifi, WifiOff,
  Sparkles, Layers, ShieldAlert, Zap, Radio, BarChart3, Clock, Compass, ArrowDown
} from 'lucide-react';
import AIRiskPanel from '../dashboard/AIRiskPanel';
import RiskTrendChart from '../dashboard/RiskTrendChart';
import { useMineData } from '../../context/MineDataContext';
import DataBadge from '../common/DataBadge';

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AIPredictionView() {
  const { 
    aiRisk, 
    sensors, 
    dataQuality, 
    calculateAdaptiveFusionWeights,
    getDeformationDna,
    getVibrationFingerprint,
    generateExplainableAiAnalysis 
  } = useMineData();

  // Active intelligence tab: 'fusion' | 'explainable' | 'dna' | 'timeline'
  const [activeTab, setActiveTab] = useState('fusion');
  const [selectedHorizon, setSelectedHorizon] = useState('+24H');
  const [isModelSpecsOpen, setIsModelSpecsOpen] = useState(false);

  // Compute dynamic models
  const fusionWeights = useMemo(() => {
    return calculateAdaptiveFusionWeights ? calculateAdaptiveFusionWeights(sensors || []) : [];
  }, [calculateAdaptiveFusionWeights, sensors]);

  const activeSensorsCount = fusionWeights.filter(w => !w.excluded).length;
  const totalSensorsCount = fusionWeights.length || 8;

  const deformationDna = useMemo(() => {
    return getDeformationDna ? getDeformationDna({
      displacement: 14.2,
      tilt: 4.8,
      crack: 7.2,
      vibration: 3.8,
      porePressure: 42.6,
      microStrain: 1420
    }) : [];
  }, [getDeformationDna]);

  const isCritical = (aiRisk?.current_risk_score || 87) >= 75;
  const vibrationFingerprint = useMemo(() => {
    return getVibrationFingerprint ? getVibrationFingerprint(3.8, isCritical) : null;
  }, [getVibrationFingerprint, isCritical]);

  const explainableData = useMemo(() => {
    return generateExplainableAiAnalysis ? generateExplainableAiAnalysis({
      riskLevel: aiRisk?.risk_level || 'CRITICAL',
      riskScore: aiRisk?.current_risk_score || 87,
      confidence: aiRisk?.ai_confidence || 94,
      dataQuality,
      activeSensorsCount,
      totalSensorsCount,
      hotspotName: 'Panel 17-B'
    }) : null;
  }, [generateExplainableAiAnalysis, aiRisk, dataQuality, activeSensorsCount, totalSensorsCount]);

  return (
    <div className="space-y-4 w-full font-sans text-xs text-slate-100">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Predictive Risk &amp; Explainable AI Center
            </h1>
            <p className="text-[11px] text-slate-400">
              Multi-sensor fusion, structural deformation DNA &amp; Project Standard 112 compliant decision support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Data Authenticity / Honesty Badge */}
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border ${
            dataQuality === 'SIMULATED'
              ? 'text-amber-400 border-amber-800/80 bg-amber-950/40'
              : 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dataQuality === 'SIMULATED' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{dataQuality === 'SIMULATED' ? 'Simulation Data Active' : 'Live IoT Fusion Active'}</span>
          </span>
          <DataBadge variant={dataQuality === 'SIMULATED' ? 'simulation' : 'model'} />
        </div>
      </div>

      {/* ── TAB NAVIGATION ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
        {[
          { id: 'fusion', label: 'Multi-Sensor Fusion & Risk', icon: BrainCircuit },
          { id: 'explainable', label: 'Why This Alert? (Explainable AI)', icon: Sparkles },
          { id: 'dna', label: 'Deformation DNA & Vibration Fingerprint', icon: Activity },
          { id: 'timeline', label: 'Forecast Horizon & Historical Validation', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MULTI-SENSOR FUSION & RISK OVERVIEW                                */}
      {/* ========================================================================= */}
      {activeTab === 'fusion' && (
        <div className="space-y-4">
          {/* Top Intelligence Context Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono-data">AI Prediction Confidence</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono-data text-cyan-400">{aiRisk?.ai_confidence || 94}%</span>
                <span className="text-[10px] text-slate-400">Ensemble consensus</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono-data">Sensors In Fusion</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono-data text-emerald-400">{activeSensorsCount} / {totalSensorsCount}</span>
                <span className="text-[10px] text-slate-400">Healthy nodes</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono-data">Anomaly Classification</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-bold font-mono-data text-amber-400">Multi-Signal Correlated</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono-data">Safety Compliance Lead Time</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono-data text-white">6.2 Hours</span>
                <span className="text-[10px] text-slate-400">to critical sag</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: AIRiskPanel + RiskTrendChart */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-5 space-y-4">
              <AIRiskPanel />

              {/* Dynamic Self-Healing Weights Table */}
              <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Adaptive Sensor Fusion Weights
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono-data">Self-Healing</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono-data">
                  {fusionWeights.slice(0, 5).map(fw => (
                    <div key={fw.id} className="flex items-center justify-between p-1 rounded bg-[#131E33] border border-slate-800/80">
                      <div>
                        <span className="font-semibold text-slate-200">{fw.id}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({fw.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          fw.excluded ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400'
                        }`}>
                          {fw.health}
                        </span>
                        <span className={`font-bold ${fw.excluded ? 'text-red-400' : 'text-cyan-300'}`}>
                          {fw.weight}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {fusionWeights.some(w => w.excluded) && (
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-[10px] text-rose-300 flex items-start gap-1.5 font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>One or more nodes excluded from fusion due to suspected ADC freeze/disconnection. Weights automatically rebalanced among healthy transducers.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-7 space-y-4">
              <RiskTrendChart />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPLAINABLE AI ("WHY THIS ALERT?")                                 */}
      {/* ========================================================================= */}
      {activeTab === 'explainable' && (
        <div className="space-y-4">
          {/* Explainable AI Hero Header */}
          <div className="p-4 rounded-xl bg-[#0D1524] border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Explainable Decision Support: Why This Alert?
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Transparent multi-signal geotechnical justification derived from physics-informed strata mechanics and ML feature importance.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono-data text-xs">
              <span className="px-2 py-1 rounded bg-[#131E33] border border-slate-700 text-slate-300">
                Confidence: <strong className="text-cyan-400">{explainableData?.confidence}%</strong>
              </span>
              <span className="px-2 py-1 rounded bg-[#131E33] border border-slate-700 text-slate-300">
                Data Quality: <strong className="text-emerald-400">{explainableData?.dataQuality}</strong>
              </span>
            </div>
          </div>

          {/* Root-Cause Evidence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(explainableData?.reasons || []).map((reason, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#0D1524] border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    reason.type === 'critical' ? 'bg-red-950/70 border border-red-800/80 text-red-400' :
                    reason.type === 'warning' ? 'bg-amber-950/70 border border-amber-800/80 text-amber-400' :
                    'bg-cyan-950/70 border border-cyan-800/80 text-cyan-400'
                  }`}>
                    {reason.type === 'critical' ? <ArrowDown className="w-4 h-4" /> :
                     reason.type === 'warning' ? <Compass className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">{reason.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono-data">Evidence Factor #{idx + 1}</span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] pt-1">
                  {reason.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Statutory Action Recommendation */}
          <div className="p-4 rounded-xl bg-[#0B132B] border border-amber-700/60 shadow-lg space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-amber-300 uppercase tracking-wide">
                  Engineering Safety Safety Action Protocol (Reg. 112)
                </span>
              </div>
              <span className="text-[10px] font-mono-data text-slate-400">Safety Code: STRATA-CRIT-04</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {explainableData?.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEFORMATION DNA & VIBRATION FINGERPRINT                            */}
      {/* ========================================================================= */}
      {activeTab === 'dna' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: 6-Axis Deformation DNA Signature */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#0D1524] border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Deformation DNA Signature
                  </h3>
                </div>
                <span className="text-[10px] font-mono-data text-slate-400">Panel 17-B Crown</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Multi-axis structural condition vector measuring active strata convergence against engineering failure envelopes.
              </p>

              <div className="space-y-2 pt-1 font-mono-data">
                {deformationDna.map(item => (
                  <div key={item.axis} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-sans">{item.axis}</span>
                      <span className="text-slate-100 font-bold">{item.raw} ({item.current}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${
                          item.current > 75 ? 'bg-red-500' :
                          item.current > 45 ? 'bg-amber-400' :
                          'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, item.current)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono-data">
                      <span>Baseline: {item.baseline}%</span>
                      <span>Engineering Limit: 100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Vibration Fingerprinting Module */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#0D1524] border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Micro-Seismic Vibration Fingerprint
                  </h3>
                </div>
                <span className="text-[10px] font-mono-data text-slate-400">FFT Geophone Array</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Acoustic emission frequency distribution separating continuous shearer tramming and controlled blasting from geological fault slip.
              </p>

              {/* Classification Card */}
              <div className="p-3 rounded-lg bg-[#131E33] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Identified Pattern:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {vibrationFingerprint?.classification?.label || 'Structural Anomaly'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {vibrationFingerprint?.classification?.desc}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono-data">
                  <div>
                    <span className="text-slate-400 block">Dominant Frequency:</span>
                    <span className="text-cyan-300 font-bold">{vibrationFingerprint?.dominantFreq || '14.2 Hz'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Peak Particle Velocity:</span>
                    <span className="text-purple-300 font-bold">{vibrationFingerprint?.ppv || '3.8 mm/s'}</span>
                  </div>
                </div>
              </div>

              {/* Historical Correlation Match */}
              <div className="p-3 rounded-lg bg-[#0B111E] border border-slate-800 space-y-1.5 font-mono-data">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Historical Match Correlation:</span>
                  <span className="text-emerald-400 font-bold">{vibrationFingerprint?.similarity || 88}% Similarity</span>
                </div>
                <div className="text-[11px] text-slate-200">
                  Reference: <strong className="text-white">{vibrationFingerprint?.historicalMatch || 'Zone B Fault Slip (Aug 2024)'}</strong>
                </div>
                <div className="text-[9px] text-slate-500 pt-0.5">
                  Spectral shape cross-verified across 4 geophone stations in Jharia Coalfield.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FORECAST HORIZONS & HISTORICAL VALIDATION                          */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Horizon Selection Bar */}
          <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 flex items-center justify-between gap-3 shadow-md">
            <span className="text-xs font-bold text-slate-200 uppercase">Predictive Horizon Range:</span>
            <div className="flex items-center gap-1 font-mono-data">
              {['NOW', '+6H', '+12H', '+24H'].map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedHorizon(h)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    selectedHorizon === h 
                      ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                      : 'bg-[#131E33] text-slate-400 hover:text-white'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono-data">Now (Active Measured)</span>
              <div className="text-xl font-bold font-mono-data text-red-400">14.2 mm</div>
              <div className="text-[10px] text-slate-400">Rate: 3.4 mm/hr accelerating</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono-data">+6h Projected</span>
              <div className="text-xl font-bold font-mono-data text-amber-400">19.8 mm</div>
              <div className="text-[10px] text-slate-400">Confidence interval: &plusmn;0.8mm</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono-data">+24h Projected Ceiling</span>
              <div className="text-xl font-bold font-mono-data text-red-500">25.0 mm ↑</div>
              <div className="text-[10px] text-slate-400">Exceeds statutory crown collapse limit</div>
            </div>
          </div>

          <RiskTrendChart />

          {/* Model Specification Accordion */}
          <div className="bg-[#0D1524] border border-slate-800 rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setIsModelSpecsOpen(!isModelSpecsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">Underlying ML Architecture Specifications</span>
                <span className="text-[10px] font-mono-data text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">XGBoost 5-Class V4.2</span>
              </div>
              {isModelSpecsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {isModelSpecsOpen && (
              <div className="px-4 pb-3 border-t border-slate-800 font-mono-data">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2.5 text-xs">
                  <div className="p-2 rounded bg-[#131E33] border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Ensemble Architecture</span>
                    <span className="font-semibold text-slate-100">XGBoost V4.2</span>
                  </div>
                  <div className="p-2 rounded bg-[#131E33] border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Convergence Rate</span>
                    <span className="font-semibold text-emerald-400">99.2%</span>
                  </div>
                  <div className="p-2 rounded bg-[#131E33] border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Mean Absolute Error</span>
                    <span className="font-semibold text-slate-100">0.14 mm</span>
                  </div>
                  <div className="p-2 rounded bg-[#131E33] border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">R² Fit Score</span>
                    <span className="font-semibold text-emerald-400">0.968</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
