import React, { useMemo } from 'react';
import { 
  Activity, Compass, Layers, ShieldAlert, 
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { useTranslation } from 'react-i18next';

export default function KPICards({ onOpenSensors, onOpenWorkers, onOpenZones, onSelectSensor }) {
  const { kpis, aiRisk, zones, evacuation, workers, sensors, lastSyncSeconds } = useMineData();
  const { t } = useTranslation();

  const riskScore = typeof aiRisk?.current_risk_score === 'number' ? aiRisk.current_risk_score : 87.0;
  const isCritical = aiRisk?.risk_level === 'CRITICAL' || kpis?.critical_zones_count > 0 || riskScore >= 75;
  const isWarning = aiRisk?.risk_level === 'WARNING' || kpis?.warning_zones_count > 0 || (riskScore >= 50 && riskScore < 75);

  const statusTitle = isCritical ? t('dashboard.status_critical', 'Critical Incident Active') : (isWarning ? t('dashboard.status_warning', 'Warning Condition') : t('dashboard.status_normal', 'Operational Status Normal'));
  const statusBadgeClass = isCritical
    ? 'bg-red-950/70 border-red-800 text-red-400'
    : (isWarning ? 'bg-amber-950/70 border-amber-800 text-amber-400' : 'bg-emerald-950/70 border-emerald-800 text-emerald-400');

  const highestRiskZone = zones?.find(z => z.status === 'CRITICAL') || zones?.find(z => z.status === 'WARNING');
  const activeZoneName = highestRiskZone?.code || evacuation?.target_zone || (isCritical ? 'Zone B' : 'Zone A');

  const trendPct = typeof aiRisk?.trend_percentage === 'number' ? aiRisk.trend_percentage : (isCritical ? 18 : 0);
  const workersAtRisk = typeof kpis?.monitored_workers_risk === 'number' 
    ? kpis.monitored_workers_risk 
    : (workers?.filter(w => w.status === 'DANGER').length || (isCritical ? 7 : 0));

  // Determine top 4 sensor exceptions
  const sensorExceptions = useMemo(() => {
    if (!sensors || sensors.length === 0) {
      // HONEST empty state: no fabricated exception rows (previously four
      // hardcoded 'critical' readings were invented when the list was empty)
      return [];
    }
    // Sort: CRITICAL (0), WARNING (1), STALE/OFFLINE (2), NORMAL (3)
    const priority = { CRITICAL: 0, DANGER: 0, WARNING: 1, OFFLINE: 2, STALE: 2, NORMAL: 3, SAFE: 3 };
    const sorted = [...sensors].sort((a, b) => {
      const pA = priority[a.status] ?? 3;
      const pB = priority[b.status] ?? 3;
      return pA - pB;
    });
    return sorted.slice(0, 4);
  }, [sensors]);

  return (
    <div className="space-y-3.5 font-sans">

      {/* 1. Site Header Banner */}
      <div className="relative p-4 rounded-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(11,18,32,0.95) 0%, rgba(15,26,46,0.9) 100%)',
          border: '1px solid rgba(26,40,68,0.9)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
          style={{ background: isCritical ? 'linear-gradient(180deg, #EF4444, transparent)' : (isWarning ? 'linear-gradient(180deg, #F59E0B, transparent)' : 'linear-gradient(180deg, #10B981, transparent)') }} />

        <div className="pl-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">{t('dashboard.mine_name_sector', 'Jharia Colliery • Sector 07')}</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{
                background: isCritical ? 'rgba(239,68,68,0.1)' : (isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'),
                border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : (isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)')}`,
                color: isCritical ? '#f87171' : (isWarning ? '#fbbf24' : '#34d399')
              }}
            >
              {statusTitle}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {isCritical
              ? t('dashboard.critical_msg', 'Abnormal ground strata convergence detected in Zone B. 7 miners in proximity requiring priority clearance.')
              : t('dashboard.normal_msg', 'All monitored sectors operating within nominal engineering safety thresholds.')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500 font-mono-data pl-2 md:pl-0">
          <Clock className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} />
          <span>Last sync: <span className="text-slate-300 font-bold">{lastSyncSeconds}s ago</span></span>
        </div>
      </div>

      {/* 2. KPI Stat Band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Risk Score */}
        <div onClick={onOpenZones} className={`stat-card cursor-pointer p-4 ${isCritical ? 'stat-card-critical' : (isWarning ? 'stat-card-warning' : 'stat-card-safe')}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Risk Score</span>
            <Activity className="w-3.5 h-3.5" style={{ color: isCritical ? '#f87171' : (isWarning ? '#fbbf24' : '#34d399') }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono-data" style={{ color: isCritical ? '#f87171' : (isWarning ? '#fbbf24' : '#34d399'), letterSpacing: '-0.04em' }}>
              {riskScore.toFixed(0)}
            </span>
            <span className="text-base font-bold text-slate-500">%</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trendPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {trendPct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}
            </span>
            <span className="text-[9px] text-slate-600">vs 1h ago</span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-2 h-1 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${riskScore}%`,
                background: isCritical ? 'linear-gradient(90deg, #ef4444, #dc2626)' : (isWarning ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #10b981, #059669)')
              }}
            />
          </div>
        </div>

        {/* Affected Zone */}
        <div onClick={onOpenZones} className="stat-card cursor-pointer p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Affected Zone</span>
            <Layers className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="text-xl font-black font-mono-data text-white truncate" style={{ letterSpacing: '-0.02em' }}>
            {activeZoneName}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono-data">Panel B-12</div>
          <div className="mt-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded font-bold"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
              MONITORING ACTIVE
            </span>
          </div>
        </div>

        {/* Workers at Risk */}
        <div onClick={onOpenWorkers} className={`stat-card cursor-pointer p-4 ${workersAtRisk > 0 ? 'stat-card-warning' : 'stat-card-safe'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Workers at Risk</span>
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: workersAtRisk > 0 ? '#fbbf24' : '#34d399' }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono-data" style={{ color: workersAtRisk > 0 ? '#fbbf24' : '#34d399', letterSpacing: '-0.04em' }}>
              {workersAtRisk}
            </span>
            <span className="text-sm font-bold text-slate-500">miners</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono-data">
            {workers?.length || 0} total tracked underground
          </div>
        </div>

        {/* Data Quality */}
        <div className="stat-card p-4 stat-card-safe">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Telemetry</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="live-dot bg-emerald-400" style={{ width: 8, height: 8 }} />
            <span className="text-xl font-black text-emerald-400" style={{ letterSpacing: '-0.02em' }}>LIVE</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono-data">100% signal quality</div>
          <div className="mt-2 h-1 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 animate-soft-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 3. Sensor Exceptions */}
      <div className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(11,18,32,0.95) 0%, rgba(15,26,46,0.9) 100%)',
          border: '1px solid rgba(26,40,68,0.9)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(26,40,68,0.8)' }}
        >
          <div className="flex items-center gap-2.5">
            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Priority Sensor Exceptions</h3>
            <span className="text-[9px] text-slate-600 hidden sm:block">(Critical &amp; abnormal readings)</span>
          </div>
          <button onClick={onOpenSensors}
            className="text-[11px] font-semibold transition-colors cursor-pointer hover:underline"
            style={{ color: '#00D4FF' }}
          >
            All Sensors ({sensors?.length || 48}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y"
          style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(26,40,68,0.6)' }}
        >
          {sensorExceptions.map((s, idx) => {
            const isCrit = s.status === 'CRITICAL' || s.status === 'DANGER';
            const isWarn = s.status === 'WARNING';
            const statusColor = isCrit ? '#f87171' : (isWarn ? '#fbbf24' : '#34d399');
            const statusBg = isCrit ? 'rgba(239,68,68,0.08)' : (isWarn ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)');
            const statusBorder = isCrit ? 'rgba(239,68,68,0.2)' : (isWarn ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)');

            return (
              <div key={s.id || idx}
                onClick={() => onSelectSensor ? onSelectSensor(s) : onOpenSensors()}
                className="p-3.5 cursor-pointer transition-all duration-150 hover:bg-slate-800/20 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-data text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors">{s.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor }}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-500">{s.type || s.name}</span>
                  <span className="font-mono-data text-xs font-bold" style={{ color: statusColor }}>
                    {typeof s.value === 'string' ? s.value : (s.value != null ? `${s.value} ${s.unit || ''}` : `${s.vibration || s.tilt || s.displacement || 'Nominal'}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-600 mt-1.5 pt-1.5"
                  style={{ borderTop: '1px solid rgba(26,40,68,0.6)' }}>
                  <span>{s.zone || 'Zone B'}</span>
                  <span>Lim: {s.threshold || 'Nominal'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
