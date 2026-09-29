import React, { useState } from 'react';
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Activity, Layers
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import DataBadge from '../common/DataBadge';

function ArcGauge({ percent, color }) {
  const R = 64;
  const cx = 80, cy = 80;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = (angle) => cx + R * Math.cos(toRad(angle));
  const arcY = (angle) => cy + R * Math.sin(toRad(angle));

  const bgEnd = endAngle;
  const fgEnd = startAngle + (percent / 100) * totalArc;

  const bgPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${R} ${R} 0 1 1 ${arcX(bgEnd)} ${arcY(bgEnd)}`;
  const fgPath = fgEnd > startAngle
    ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${R} ${R} 0 ${(fgEnd - startAngle) > 180 ? 1 : 0} 1 ${arcX(fgEnd)} ${arcY(fgEnd)}`
    : '';

  const glowId = `gauge-glow-${percent}`;

  return (
    <svg viewBox="0 0 160 100" className="w-44 mx-auto" aria-label={`Risk gauge: ${percent}%`}>
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <path d={bgPath} fill="none" stroke="#0F1E30" strokeWidth="11" strokeLinecap="round" />
      {/* Subtle inner track */}
      <path d={bgPath} fill="none" stroke="#162035" strokeWidth="8" strokeLinecap="round" />
      {/* Glowing foreground arc */}
      {fgPath && (
        <>
          <path d={fgPath} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeOpacity="0.25" filter={`url(#${glowId})`} />
          <path d={fgPath} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" filter={`url(#${glowId})`} />
          <path d={fgPath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.9" />
        </>
      )}
      {/* Endpoint dot */}
      {fgPath && (
        <circle cx={arcX(fgEnd)} cy={arcY(fgEnd)} r="5" fill={color} opacity="0.9" filter={`url(#${glowId})`} />
      )}
    </svg>
  );
}

const FACTOR_META = {
  tilt_change: {
    title: 'Ground tilt',
    description: 'Borehole tilt sensors detect angular strata shift.',
    shortDesc: 'Higher than normal',
  },
  displacement_rate: {
    title: 'Displacement rate',
    description: 'Extensometers measure progressive ground shift rate.',
    shortDesc: 'Increasing rate',
  },
  crack_widening: {
    title: 'Surface fissure width',
    description: 'Crack gauge telemetry indicates dilation along shear plane.',
    shortDesc: 'Dilating',
  },
  vibration: {
    title: 'Acoustic micro-seismicity',
    description: 'Geophones detect micro-fracturing vibrations.',
    shortDesc: 'Elevated frequency',
  },
  historical_trend: {
    title: 'Historical void interaction',
    description: 'Overlay with abandoned seam panel workings.',
    shortDesc: 'Correlated pattern',
  },
};

export default function AIRiskPanel() {
  const { aiRisk, lastSyncSeconds } = useMineData();
  const [showTechnical, setShowTechnical] = useState(false);
  const [expandedFactor, setExpandedFactor] = useState(null);

  const riskScore   = aiRisk?.current_risk_score ?? 87;
  const confidence  = aiRisk?.ai_confidence ?? 94.7;
  const trend       = aiRisk?.trend_percentage ?? 18;
  const prediction  = aiRisk?.prediction ?? 'Strata deformation increasing along Zone B fault plane.';

  const rawFactors = aiRisk?.factors || {
    tilt_change: 32,
    displacement_rate: 27,
    crack_widening: 18,
    vibration: 10,
    historical_trend: 13,
  };

  const factors = Object.entries(rawFactors)
    .map(([key, val]) => ({
      key,
      weight: Number(val),
      ...(FACTOR_META[key] || {
        title: key.replace(/_/g, ' '),
        description: 'Anomaly detected in this metric.',
        shortDesc: 'Elevated',
      }),
    }))
    .sort((a, b) => b.weight - a.weight)
    .map((f, i) => ({ ...f, rank: i + 1 }));

  const isCritical = riskScore >= 75;
  const isWarning  = riskScore >= 50 && riskScore < 75;

  const riskColor = isCritical ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');
  const riskLabel = isCritical ? 'Critical' : (isWarning ? 'Warning' : 'Nominal');
  const dataQuality = lastSyncSeconds <= 5 ? 'LIVE (verified)' : 'STALE (degraded)';

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div className="relative overflow-hidden rounded-xl font-sans text-slate-100"
      style={{
        background: 'linear-gradient(135deg, rgba(9,14,23,0.98) 0%, rgba(13,21,36,0.96) 100%)',
        border: '1px solid rgba(0,212,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${riskColor}88 50%, transparent)` }} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.07)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <BrainCircuit className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            Predictive Risk Assessment
          </h3>
          <DataBadge variant="model" />
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">Confidence</span>
          <span className="font-mono-data font-black text-sm" style={{ color: '#00D4FF' }}>{confidence}%</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
            {dataQuality}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Gauge + Context row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="relative shrink-0 flex flex-col items-center">
            <ArcGauge percent={riskScore} color={riskColor} />
            <div className="absolute top-9 text-center pointer-events-none">
              <span className="text-4xl font-black font-mono-data leading-none"
                style={{ color: riskColor, textShadow: `0 0 20px ${riskColor}60`, letterSpacing: '-0.04em' }}>
                {riskScore}
              </span>
              <span className="text-sm font-bold text-slate-400">%</span>
              <span className="block text-[10px] uppercase font-bold mt-1 tracking-widest"
                style={{ color: riskColor }}>
                {riskLabel}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 text-xs w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 text-[11px]">24h Forecast:</span>
              <span className={`font-black flex items-center gap-1 font-mono-data text-sm ${trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}
                style={{ textShadow: trend > 0 ? '0 0 12px rgba(239,68,68,0.4)' : '0 0 12px rgba(16,185,129,0.4)' }}>
                <TrendIcon className="w-4 h-4" />
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
              <span className="text-slate-600 text-[10px]">
                {trend > 0 ? '(Increasing)' : '(Stable)'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] border-l-2 pl-3"
              style={{ borderColor: `${riskColor}60` }}>
              {prediction} Ground sensor telemetry correlates with high likelihood of crown pillar convergence within 24 hours.
            </p>
          </div>
        </div>

        {/* Evidence Factors */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Evidence Factors
            </span>
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors hover:text-cyan-300"
              style={{ color: '#00D4FF' }}
            >
              {showTechnical ? 'Collapse' : 'AI Model Details'}
              {showTechnical ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showTechnical && (
            <div className="p-2.5 mb-3 rounded-lg text-[11px] font-mono-data space-y-1"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', color: '#94a3b8' }}
            >
              <div>Model: <span style={{ color: '#00D4FF' }}>XGBoost v4.2</span> · InSAR Geodetic Fusion</div>
              <div className="text-slate-600">Zone B Panel 17-B · Realtime Sampling Rate: 1000ms</div>
            </div>
          )}

          <div className="space-y-2">
            {factors.slice(0, 3).map((factor) => {
              const barColor = factor.rank === 1 ? riskColor : (factor.rank === 2 ? '#F59E0B' : '#06B6D4');
              return (
                <div
                  key={factor.key}
                  className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: expandedFactor === factor.key ? `1px solid ${barColor}40` : '1px solid rgba(255,255,255,0.04)',
                  }}
                  onClick={() => setExpandedFactor(expandedFactor === factor.key ? null : factor.key)}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="text-[10px] font-black font-mono-data w-4 text-center shrink-0"
                      style={{ color: barColor }}>
                      #{factor.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-200 truncate">{factor.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-xs font-black font-mono-data" style={{ color: barColor }}>{factor.weight}%</span>
                          <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform duration-200 ${expandedFactor === factor.key ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {/* Gradient progress bar */}
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${factor.weight}%`,
                            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                            boxShadow: `0 0 6px ${barColor}60`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {expandedFactor === factor.key && (
                    <div className="px-3 pb-2.5 pt-0 text-[11px] text-slate-400 border-t"
                      style={{ borderColor: `${barColor}20` }}>
                      <span className="text-[10px] font-semibold uppercase tracking-wide mr-1" style={{ color: barColor }}>
                        {factor.shortDesc}
                      </span>
                      — {factor.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
