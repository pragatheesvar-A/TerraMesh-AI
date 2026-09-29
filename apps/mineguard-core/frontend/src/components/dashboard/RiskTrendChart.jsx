import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine
} from 'recharts';
import { Activity, Clock, Sparkles } from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function RiskTrendChart() {
  const [activeMetric, setActiveMetric] = useState('risk_score');
  const [timeRange, setTimeRange] = useState('6H');

  const { currentTime, kpis, sensors, aiRisk } = useMineData();

  const currentRisk = kpis?.overall_risk ?? (aiRisk?.overallRisk ?? 87);
  const dispSensor  = sensors?.find(s => s.type === 'Displacement' || s.type === 'Extensometer');
  const currentDisp = dispSensor?.value ?? 12.4;
  const tiltSensor  = sensors?.find(s => s.type === 'Tilt' || s.type === 'Inclinometer');
  const currentTilt = tiltSensor?.value ?? 4.8;
  const crackSensor = sensors?.find(s => s.type === 'Crack' || s.type === 'Crackmeter');
  const currentCrack = crackSensor?.value ?? 7.2;
  const vibSensor   = sensors?.find(s => s.type === 'Vibration' || s.type === 'Geophone');
  const currentVib  = vibSensor?.value ?? 7.4;

  const metrics = [
    { id: 'risk_score',    label: 'Risk',            unit: '%',       color: '#EF4444', threshold: 75,  thresholdLabel: 'Critical threshold (75%)' },
    { id: 'displacement',  label: 'Ground Movement', unit: 'mm/day',  color: '#F59E0B', threshold: 10.0, thresholdLabel: 'Critical (>10 mm/day)' },
    { id: 'tilt',          label: 'Tilt',            unit: '°',       color: '#06B6D4', threshold: 1.0,  thresholdLabel: 'Critical (>1.0°)' },
    { id: 'crack_growth',  label: 'Crack Width',     unit: 'mm',      color: '#F97316', threshold: 5.0,  thresholdLabel: 'Critical (>5.0 mm)' },
    { id: 'vibration',     label: 'Vibration',       unit: 'mm/s',    color: '#EC4899', threshold: 5.0,  thresholdLabel: 'Critical (>5.0 mm/s)' },
  ];

  const currentMetric = metrics.find(m => m.id === activeMetric) || metrics[0];

  const chartData = useMemo(() => {
    const baseDate = currentTime instanceof Date ? currentTime : new Date();
    const fmt = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const buildPoints = (offsets, unit, rF, dF, tF, cF, vF) =>
      offsets.map((o, i) => {
        const d = new Date(baseDate.getTime() + o * unit);
        const isPredicted = o > 0;
        const isNow = o === 0;
        const label = unit === 86400000
          ? (isNow ? 'Today' : `${d.getDate()} ${monthNames[d.getMonth()]}`)
          : fmt(d);
        return {
          time: label, isPredicted, isNow,
          risk_score:  Math.min(100, Math.max(0, Math.round(currentRisk * rF[i]))),
          displacement: +(currentDisp  * dF[i]).toFixed(1),
          tilt:         +(currentTilt  * tF[i]).toFixed(1),
          crack_growth: +(currentCrack * cF[i]).toFixed(1),
          vibration:    +(currentVib   * vF[i]).toFixed(1),
        };
      });

    if (timeRange === '1H')  return buildPoints([-50,-40,-30,-20,-10,0,15],60000, [.79,.83,.87,.92,.96,1,.04+1],[.65,.72,.79,.88,.95,1,.05+1],[.66,.73,.80,.88,.94,1,.06+1],[.66,.72,.80,.89,.96,1,.06+1],[.45,.58,.70,.82,.93,1,.07+1]);
    if (timeRange === '6H')  return buildPoints([-5,-4,-3,-2,-1,0,1],3600000, [.48,.52,.59,.67,.80,1,1.05],[.26,.31,.38,.47,.68,1,1.06],[.38,.40,.46,.55,.69,1,1.06],[.29,.34,.41,.50,.68,1,1.06],[.22,.28,.35,.48,.72,1,1.08]);
    if (timeRange === '24H') return buildPoints([-24,-20,-16,-12,-8,-4,0,4],3600000, [.32,.36,.42,.48,.58,.78,1,1.06],[.15,.18,.23,.28,.45,.72,1,1.07],[.19,.23,.29,.36,.48,.72,1,1.06],[.16,.20,.25,.30,.46,.72,1,1.06],[.12,.15,.20,.26,.42,.70,1,1.08]);
    return buildPoints([-6,-5,-4,-3,-2,-1,0],86400000, [.21,.26,.30,.38,.52,.76,1],[.08,.11,.14,.21,.35,.68,1],[.09,.13,.18,.26,.40,.68,1],[.06,.09,.13,.21,.35,.68,1],[.05,.08,.12,.19,.32,.65,1]);
  }, [timeRange, currentTime, currentRisk, currentDisp, currentTilt, currentCrack, currentVib]);

  // Split data into measured vs predicted for separate rendering
  const measuredData = chartData.map(d => ({ ...d, [activeMetric]: d.isPredicted ? null : d[activeMetric] }));
  const forecastData = chartData.map(d => ({ ...d, [activeMetric]: d.isPredicted || d.isNow ? d[activeMetric] : null }));

  // Find the "now" index for the reference line
  const nowIndex  = chartData.findIndex(d => d.isNow);
  const nowLabel  = nowIndex >= 0 ? chartData[nowIndex].time : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const val = payload[0]?.value;
    if (val == null) return null;

    let status = 'Safe', statusColor = 'text-emerald-400';
    if (currentMetric.id === 'risk_score') {
      if (val > 75)      { status = 'Critical'; statusColor = 'text-red-400'; }
      else if (val > 50) { status = 'Warning';  statusColor = 'text-orange-400'; }
      else if (val > 25) { status = 'Watch';    statusColor = 'text-amber-400'; }
    }

    return (
      <div className="p-3 rounded-xl bg-[#0B0F17] border border-slate-700 shadow-2xl font-sans text-xs text-[#F8FAFC] min-w-[160px]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" /> {d?.time}
          </span>
          {d?.isPredicted ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Forecast
            </span>
          ) : d?.isNow ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-semibold">Now</span>
          ) : (
            <span className="text-[10px] text-slate-500">Measured</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">{currentMetric.label}</span>
          <span className="font-bold" style={{ color: currentMetric.color }}>{val} {currentMetric.unit}</span>
        </div>
        {currentMetric.id === 'risk_score' && (
          <div className={`mt-1 pt-1 border-t border-slate-800/60 text-right font-semibold ${statusColor}`}>{status}</div>
        )}
      </div>
    );
  };

  const dotRenderer = (color) => (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    if (payload?.isNow)       return <circle key={`now-${cx}`} cx={cx} cy={cy} r={5.5} fill="#EF4444" stroke="#fff" strokeWidth={2} />;
    if (payload?.isPredicted) return <circle key={`pred-${cx}`} cx={cx} cy={cy} r={4} fill="#A855F7" stroke="#fff" strokeWidth={1.5} />;
    return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={3} fill={color} />;
  };

  const timeRangeLabel = { '1H': 'Last hour', '6H': 'Last 6 hours', '24H': 'Last 24 hours', '7D': 'Last 7 days' };

  return (
    <div className="relative overflow-hidden rounded-xl font-sans text-[#F8FAFC]"
      style={{
        background: 'linear-gradient(135deg, rgba(8,12,20,0.98) 0%, rgba(11,18,32,0.96) 100%)',
        border: '1px solid rgba(0,212,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5) 50%, transparent)' }} />

      <div className="p-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1 rounded" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)' }}>
              <Activity className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} />
            </div>
            <h3 className="text-sm font-black text-white tracking-tight">Ground Movement Trend</h3>
          </div>
          <p className="text-xs text-slate-500 ml-7">
            Zone B · {timeRangeLabel[timeRange]}
            <span className="ml-2 inline-flex items-center gap-1 font-semibold" style={{ color: '#10B981' }}>
              <span className="live-dot bg-emerald-400" style={{ width: 6, height: 6 }} />
              Live sync
            </span>
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {['1H', '6H', '24H', '7D'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className="px-3 py-1 rounded text-xs font-bold transition-all duration-150 cursor-pointer btn-press"
              style={timeRange === r ? {
                background: 'linear-gradient(135deg, #00C4EE, #0097B2)',
                color: '#020c14',
                boxShadow: '0 0 10px rgba(0,212,255,0.3)'
              } : {
                color: '#64748b',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metric tabs ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {metrics.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 border cursor-pointer btn-press"
            style={activeMetric === m.id ? {
              backgroundColor: m.color + '18',
              borderColor: m.color + '70',
              color: m.color,
              boxShadow: `0 0 10px ${m.color}25`
            } : {
              background: 'transparent',
              borderColor: 'rgba(255,255,255,0.06)',
              color: '#475569'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Risk level scale (only for risk_score) ──────────────── */}
      {activeMetric === 'risk_score' && (
        <div className="flex items-center gap-1 mb-4 text-[10px]">
          {[
            { label: 'Safe',     range: '0–25%',   active: false, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/50' },
            { label: 'Watch',    range: '25–50%',  active: false, color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-800/50' },
            { label: 'Warning',  range: '50–75%',  active: false, color: 'text-orange-400',  bg: 'bg-orange-950/40 border-orange-800/50' },
            { label: 'Critical', range: '>75%',    active: true,  color: 'text-red-400',     bg: 'bg-red-950/50 border-red-700/80 ring-1 ring-red-600/40' },
          ].map(lvl => (
            <div key={lvl.label} className={`flex-1 text-center py-1 rounded border ${lvl.bg} ${lvl.active ? 'font-bold' : 'opacity-50'}`}>
              <span className={`block font-bold ${lvl.color}`}>{lvl.label}</span>
              <span className="text-slate-500">{lvl.range}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────────── */}
      <div className="h-[300px] w-full" role="img" aria-label={`${currentMetric.label} trend chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="1 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="time"
              allowDuplicatedCategory={false}
              data={chartData}
              stroke="rgba(255,255,255,0.04)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.04)"
              tick={{ fill: '#475569', fontSize: 10 }}
              domain={activeMetric === 'risk_score' ? [0, 100] : ['auto', 'auto']}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Critical threshold line */}
            {currentMetric.threshold && (
              <ReferenceLine
                y={currentMetric.threshold}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: currentMetric.thresholdLabel, fill: '#EF4444', fontSize: 9, position: 'insideTopRight' }}
              />
            )}

            {/* NOW vertical reference */}
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke="#06B6D4"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: 'NOW', fill: '#06B6D4', fontSize: 9, position: 'insideTopLeft' }}
              />
            )}

            {/* Measured (solid line) */}
            <Line
              data={measuredData}
              type="monotone"
              dataKey={activeMetric}
              name="Measured"
              stroke={currentMetric.color}
              strokeWidth={2.5}
              connectNulls={false}
              dot={dotRenderer(currentMetric.color)}
              activeDot={{ r: 6 }}
            />

            {/* AI Forecast (dashed line) */}
            <Line
              data={forecastData}
              type="monotone"
              dataKey={activeMetric}
              name="AI Forecast"
              stroke="#A855F7"
              strokeWidth={2}
              strokeDasharray="6 4"
              connectNulls={false}
              dot={dotRenderer('#A855F7')}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div className="pt-3 mt-1 flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-[2px] inline-block rounded" style={{ backgroundColor: currentMetric.color, boxShadow: `0 0 4px ${currentMetric.color}` }} />
            <span>Measured</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-[2px] inline-block rounded border-t-2 border-dashed border-purple-500" style={{ background: 'none' }} />
            <span>AI Forecast</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" style={{ boxShadow: '0 0 4px rgba(239,68,68,0.7)' }} />
            <span>Current reading</span>
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(0,212,255,0.6)' }}>Zone B · Borehole Stream</span>
      </div>

      </div>
    </div>
  );
}
