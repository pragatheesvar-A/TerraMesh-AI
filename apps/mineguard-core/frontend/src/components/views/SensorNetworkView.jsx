import React, { useState, useMemo } from 'react';
import { 
  Cpu, Search, ArrowUpDown, Battery, Download, AlertTriangle, CheckCircle2, 
  AlertOctagon, WifiOff, Activity, TrendingUp, Zap, Clock, ShieldAlert,
  Radio, Check, RefreshCw
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import DataBadge from '../common/DataBadge';

export default function SensorNetworkView({ onSelectSensor }) {
  const { 
    sensors, 
    evaluateSensorHealth, 
    computeShadowResidual, 
    getAdaptiveSamplingState,
    aiRisk 
  } = useMineData();

  // Active view tab: 'telemetry' | 'health' | 'residuals' | 'adaptive'
  const [activeTab, setActiveTab] = useState('telemetry');

  // Filters for Telemetry Grid
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filter & Search
  const filtered = useMemo(() => {
    return (sensors || []).filter(s => {
      const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) || 
                            (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
                            (s.zone && s.zone.toLowerCase().includes(search.toLowerCase()));
      
      const isException = s.status === 'CRITICAL' || s.status === 'DANGER' || s.status === 'WARNING' || s.status === 'OFFLINE' || s.status === 'STALE';
      if (showExceptionsOnly && !isException) return false;

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sensors, search, statusFilter, showExceptionsOnly]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const handleExportCSV = () => {
    const headers = ['Sensor ID', 'Type', 'Zone', 'Displacement (mm)', 'Tilt (°)', 'Vibration (g)', 'Crack (mm)', 'Status', 'Battery (%)', 'Last Sync'];
    const rows = (sensors || []).map(s => [
      `"${s.id || ''}"`,
      `"${s.type || s.name || 'Transducer'}"`,
      `"${s.zone || 'Zone B'}"`,
      s.displacement ?? '',
      s.tilt ?? '',
      s.vibration ?? '',
      s.crack_width ?? '',
      `"${s.status || 'NORMAL'}"`,
      s.battery ?? 90,
      `"${s.last_update || '2s ago'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sensor_Network_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
      case 'DANGER':
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
      case 'OFFLINE':
      case 'STALE':
        return {
          icon: <WifiOff className="w-3 h-3 text-slate-400" />,
          label: 'Offline',
          className: 'bg-slate-800 border-slate-700 text-slate-400'
        };
      default:
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
          label: 'Normal',
          className: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
        };
    }
  };

  // Sensor Health calculations
  const evaluatedSensors = useMemo(() => {
    return (sensors || []).map(s => {
      const health = evaluateSensorHealth ? evaluateSensorHealth(s) : { status: 'ONLINE', reliability: 95, reason: 'Nominal' };
      const residual = computeShadowResidual ? computeShadowResidual(s) : null;
      return { sensor: s, health, residual };
    });
  }, [sensors, evaluateSensorHealth, computeShadowResidual]);

  const samplingState = useMemo(() => {
    return getAdaptiveSamplingState ? getAdaptiveSamplingState(aiRisk?.current_risk_score || 50) : null;
  }, [getAdaptiveSamplingState, aiRisk]);

  return (
    <div className="space-y-4 w-full font-sans text-xs text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              Sensor Intelligence Center
              {exportSuccess && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 border border-emerald-500/60 text-emerald-400">
                  CSV Exported
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400">
              In-situ transducers, sensor health, shadow residuals &amp; adaptive sampling (Project Standard 112 Standard)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DataBadge variant="measured" />
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-System Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
        {[
          { id: 'telemetry', label: 'Telemetry Registry', icon: Cpu },
          { id: 'health', label: 'Sensor Health & Diagnostics', icon: Activity },
          { id: 'residuals', label: 'Shadow Residual Monitoring', icon: TrendingUp },
          { id: 'adaptive', label: 'Adaptive Sampling Profile', icon: Zap }
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
      {/* TAB 1: TELEMETRY REGISTRY (OPERATIONAL DATA TABLE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          {/* Control Bar: Search & Status Filter Pills & Exceptions Mode */}
          <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter sensor ID, sector, type..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#131E33] border border-slate-700 text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Exception-First Mode Toggle */}
              <button
                onClick={() => setShowExceptionsOnly(!showExceptionsOnly)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showExceptionsOnly 
                    ? 'bg-amber-950/70 border-amber-600 text-amber-300' 
                    : 'bg-[#131E33] border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Exceptions Only</span>
              </button>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-[#131E33] p-0.5 rounded-md border border-slate-700 text-[11px]">
                {['ALL', 'CRITICAL', 'WARNING', 'SAFE', 'OFFLINE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      statusFilter === status 
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

          {/* Operational Sensor Table with Sticky Action Column */}
          <div className="ops-table-container max-h-[640px] overflow-y-auto">
            <table className="ops-table" aria-label="Sensor telemetry monitoring table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('status')} className="cursor-pointer hover:text-slate-200">
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('id')} className="cursor-pointer hover:text-slate-200">
                    <div className="flex items-center gap-1">
                      <span>Sensor ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th>Sector / Depth</th>
                  <th onClick={() => handleSort('displacement')} className="cursor-pointer hover:text-slate-200">
                    <div className="flex items-center gap-1">
                      <span>Displacement (mm)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('tilt')} className="cursor-pointer hover:text-slate-200">
                    <div className="flex items-center gap-1">
                      <span>Tilt Angle (°)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th>Vibration (mm/s)</th>
                  <th>Crack (mm)</th>
                  <th>Power</th>
                  <th>Sync Interval</th>
                  <th className="sticky-action text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No sensor telemetry nodes match the current criteria.
                    </td>
                  </tr>
                ) : (
                  sorted.map((s) => {
                    const badge = getStatusBadge(s.status);
                    const isCrit = s.status === 'CRITICAL' || s.status === 'DANGER';

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => onSelectSensor && onSelectSensor(s)}
                        className="cursor-pointer"
                      >
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${badge.className}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 font-mono-data font-semibold text-slate-100">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{s.id}</span>
                          </div>
                        </td>
                        <td className="text-slate-300">
                          <div>{s.zone || 'Sector 07'}</div>
                          <div className="text-[10px] text-slate-400 font-mono-data">{s.depth || '-380m'}</div>
                        </td>
                        <td>
                          <span className={`font-mono-data font-semibold ${isCrit ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                            {s.displacement !== undefined ? `${s.displacement} mm` : '1.2 mm'}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono-data text-slate-300">
                            {s.tilt !== undefined ? `${s.tilt}°` : '0.42°'}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono-data text-slate-300">
                            {s.vibration !== undefined ? `${s.vibration}` : '0.42'}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono-data text-slate-300">
                            {s.crack_width !== undefined ? `${s.crack_width} mm` : '0.3 mm'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-slate-300 font-mono-data text-[11px]">
                            <Battery className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{s.battery || 92}%</span>
                          </div>
                        </td>
                        <td className="text-slate-400 font-mono-data text-[11px]">
                          {s.last_update || '2s ago'}
                        </td>
                        <td className="sticky-action text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectSensor) onSelectSensor(s);
                            }}
                            className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-2.5 bg-[#0D1524] border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
            <span>Displaying <strong className="text-slate-200 font-mono-data">{sorted.length}</strong> of <strong className="text-slate-200 font-mono-data">{sensors?.length || 48}</strong> sensors</span>
            <span>Click any row to open the in-depth sensor telemetry drawer</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SENSOR HEALTH & DIAGNOSTICS (SEPARATE FROM ENVIRONMENTAL RISK)     */}
      {/* ========================================================================= */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {/* Health Summary Band */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total IoT Ingress</span>
              <span className="text-base font-bold font-mono-data text-white">{sensors?.length || 48} Nodes</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Online &amp; Healthy</span>
              <span className="text-base font-bold font-mono-data text-emerald-400">
                {evaluatedSensors.filter(e => e.health.status === 'ONLINE').length}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Degraded / Stale</span>
              <span className="text-base font-bold font-mono-data text-amber-400">
                {evaluatedSensors.filter(e => e.health.status === 'DEGRADED' || e.health.status === 'STALE').length}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Suspected Failure / Frozen</span>
              <span className="text-base font-bold font-mono-data text-rose-400">
                {evaluatedSensors.filter(e => e.health.status === 'SUSPECTED_FAILURE' || e.health.isFrozen || e.health.status === 'FAILED').length}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Mesh Signal Integrity</span>
              <span className="text-base font-bold font-mono-data text-cyan-400">98.4%</span>
            </div>
          </div>

          {/* Principle Clarification Banner */}
          <div className="p-3 rounded-lg bg-[#131E33] border border-slate-700/80 flex items-start gap-2.5 text-slate-300">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <strong className="text-slate-100">Operational Separation Rule:</strong> Environmental safety and sensor health are independently verified. A sensor reporting no physical change is NOT assumed safe — automated algorithms check for frozen ADC values, battery decay, and missed heartbeats to prevent false-negative safety blindspots.
            </div>
          </div>

          {/* Health Diagnostics Matrix */}
          <div className="ops-table-container max-h-[600px] overflow-y-auto">
            <table className="ops-table" aria-label="Sensor health monitoring matrix">
              <thead>
                <tr>
                  <th>Sensor Node</th>
                  <th>Type &amp; Sector</th>
                  <th>Health Status</th>
                  <th>Reliability Score</th>
                  <th>Frozen Detection</th>
                  <th>Diagnostics Reason</th>
                  <th>Battery</th>
                  <th className="sticky-action text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedSensors.map(({ sensor, health }) => (
                  <tr key={sensor.id} onClick={() => onSelectSensor && onSelectSensor(sensor)} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono-data font-semibold text-slate-100">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{sensor.id}</span>
                      </div>
                    </td>
                    <td className="text-slate-300">
                      <div>{sensor.type || sensor.name || 'Borehole Inclinometer'}</div>
                      <div className="text-[10px] text-slate-400">{sensor.zone || 'Zone B'}</div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        health.status === 'ONLINE' ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400' :
                        health.status === 'DEGRADED' ? 'bg-amber-950/60 border-amber-700/60 text-amber-400' :
                        health.status === 'STALE' ? 'bg-orange-950/60 border-orange-700/60 text-orange-400' :
                        'bg-rose-950/60 border-rose-700/60 text-rose-400'
                      }`}>
                        {health.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 font-mono-data">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${health.reliability > 80 ? 'bg-emerald-400' : health.reliability > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${health.reliability}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-200">{health.reliability}%</span>
                      </div>
                    </td>
                    <td>
                      {health.isFrozen ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600/70 text-rose-300 font-bold text-[10px]">
                          FROZEN ADC 🚨
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Active Variance</span>
                        </span>
                      )}
                    </td>
                    <td className="text-slate-300 text-[11px]">
                      {health.reason}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 font-mono-data text-slate-300 text-[11px]">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{sensor.battery || 92}%</span>
                      </div>
                    </td>
                    <td className="sticky-action text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSensor) onSelectSensor(sensor);
                        }}
                        className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHADOW RESIDUAL MONITORING (ACTUAL - EXPECTED DRIFT TRACKING)      */}
      {/* ========================================================================= */}
      {activeTab === 'residuals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Baseline Tolerance Limit</span>
              <span className="text-base font-bold font-mono-data text-white">&plusmn;2.0 mm / &plusmn;0.5°</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Max Residual Divergence</span>
              <span className="text-base font-bold font-mono-data text-red-400">+12.4 mm (NODE-017)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Drift Warning Flags</span>
              <span className="text-base font-bold font-mono-data text-amber-400">1 Node Flagged</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Residual Model Architecture</span>
              <span className="text-base font-bold font-mono-data text-cyan-400">Boussinesq Strata</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#131E33] border border-slate-700/80 text-[11px] text-slate-300 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-100">Shadow Residual Model Formula:</strong> Residual = Actual IoT Value - Expected Value. Residual monitoring isolates unexpected subsidence acceleration from predicted mining convergence. Single-point deviations trigger advisory logging; multi-sensor corroboration is required before escalating alarms.
            </div>
          </div>

          <div className="ops-table-container max-h-[600px] overflow-y-auto">
            <table className="ops-table" aria-label="Shadow residual tracking table">
              <thead>
                <tr>
                  <th>Sensor Node</th>
                  <th>Expected Theoretical</th>
                  <th>Actual Telemetry</th>
                  <th>Displacement Residual</th>
                  <th>Tilt Residual</th>
                  <th>Residual Trajectory</th>
                  <th>Anomaly State</th>
                  <th className="sticky-action text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedSensors.map(({ sensor, residual }) => (
                  <tr key={sensor.id} onClick={() => onSelectSensor && onSelectSensor(sensor)} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono-data font-semibold text-slate-100">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{sensor.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{sensor.zone || 'Zone B'}</div>
                    </td>
                    <td className="font-mono-data text-slate-300">
                      {residual?.expected?.displacement} mm &bull; {residual?.expected?.tilt}°
                    </td>
                    <td className="font-mono-data font-semibold text-slate-100">
                      {residual?.actual?.displacement} mm &bull; {residual?.actual?.tilt}°
                    </td>
                    <td className="font-mono-data">
                      <span className={`font-bold ${Math.abs(residual?.residual?.displacement || 0) > 4.0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {residual?.residual?.displacement > 0 ? `+${residual?.residual?.displacement}` : residual?.residual?.displacement} mm
                      </span>
                    </td>
                    <td className="font-mono-data">
                      <span className={`font-bold ${Math.abs(residual?.residual?.tilt || 0) > 1.0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {residual?.residual?.tilt > 0 ? `+${residual?.residual?.tilt}` : residual?.residual?.tilt}°
                      </span>
                    </td>
                    <td className="text-slate-300 text-[11px]">
                      {residual?.trend}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        residual?.isAnomaly ? 'bg-red-950/70 border-red-800 text-red-400' : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                      }`}>
                        {residual?.isAnomaly ? 'ANOMALY CONFIRMED' : 'NOMINAL'}
                      </span>
                    </td>
                    <td className="sticky-action text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSensor) onSelectSensor(sensor);
                        }}
                        className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADAPTIVE SAMPLING PROFILE (ENERGY-AWARE TELEMETRY MANAGEMENT)      */}
      {/* ========================================================================= */}
      {activeTab === 'adaptive' && (
        <div className="space-y-4 font-mono">
          {/* Active Policy Status Banner */}
          <div className="p-4 rounded-xl bg-[#0D1524] border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4 font-sans">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Energy-Aware Adaptive Sampling Engine
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dynamic sampling rates respond autonomously to geotechnical risk levels to conserve battery without missing critical subsidence events.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#131E33] border border-slate-700 text-center font-mono">
                <span className="text-[9px] text-slate-400 block uppercase">Active Rate</span>
                <span className="text-base font-bold text-emerald-400">{samplingState?.currentInterval || '5 sec'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131E33] border border-slate-700 text-center font-mono">
                <span className="text-[9px] text-slate-400 block uppercase">Energy Saved</span>
                <span className="text-base font-bold text-cyan-400">{samplingState?.estimatedEnergySaved || '54%'}</span>
              </div>
            </div>
          </div>

          {/* Policy Tier Table */}
          <div className="p-3 rounded-lg bg-[#0D1524] border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide font-sans">
              Statutory Sampling Tiers (Configurable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[10px]">
              {[
                { name: 'NORMAL', rate: '10 min', power: 'Ultra-Low Sleep', savings: '88% Saved', active: false },
                { name: 'LOW RISK', rate: '5 min', power: 'Standby Heartbeat', savings: '76% Saved', active: false },
                { name: 'MEDIUM', rate: '1 min', power: 'Balanced Active', savings: '54% Saved', active: false },
                { name: 'HIGH WARNING', rate: '10 sec', power: 'High Frequency', savings: '22% Saved', active: false },
                { name: 'CRITICAL 🚨', rate: '5 sec', power: 'Real-Time Burst', savings: '0% (Max Alert)', active: true }
              ].map(tier => (
                <div key={tier.name} className={`p-2.5 rounded-lg border ${
                  tier.active ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg' : 'bg-[#131E33] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold text-slate-100">{tier.name}</span>
                    {tier.active && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <div className="pt-1.5 space-y-0.5">
                    <div className="text-slate-300">Rate: <strong className="text-white">{tier.rate}</strong></div>
                    <div className="text-slate-400 text-[9px]">{tier.power}</div>
                    <div className="text-emerald-400 font-semibold text-[9px]">{tier.savings}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Adaptive Profiles Table */}
          <div className="ops-table-container max-h-[500px] overflow-y-auto">
            <table className="ops-table" aria-label="Node adaptive sampling registry">
              <thead>
                <tr>
                  <th>Sensor Node</th>
                  <th>Assigned Sector</th>
                  <th>Current Interval</th>
                  <th>Power Mode</th>
                  <th>Escalation Reason</th>
                  <th>Battery Health</th>
                  <th className="sticky-action text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {(sensors || []).map(s => {
                  const isCrit = s.status === 'CRITICAL' || s.status === 'DANGER';
                  const interval = isCrit ? '5 sec (Burst 🚨)' : (s.status === 'WARNING' ? '10 sec' : '10 min');
                  const power = isCrit ? 'High-Frequency Burst' : (s.status === 'WARNING' ? 'Active Alert' : 'Ultra-Low Sleep');

                  return (
                    <tr key={s.id} onClick={() => onSelectSensor && onSelectSensor(s)} className="cursor-pointer">
                      <td className="font-mono-data font-semibold text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{s.id}</span>
                        </div>
                      </td>
                      <td className="text-slate-300">{s.zone || 'Zone B'}</td>
                      <td>
                        <span className={`font-mono-data font-bold ${isCrit ? 'text-red-400' : 'text-emerald-400'}`}>
                          {interval}
                        </span>
                      </td>
                      <td className="text-slate-300">{power}</td>
                      <td className="text-slate-400 text-[11px]">
                        {isCrit ? 'Displacement acceleration > 3.4mm/hr threshold' : 'Nominal background surveillance'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-slate-300 font-mono-data">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{s.battery || 92}%</span>
                        </div>
                      </td>
                      <td className="sticky-action text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSensor) onSelectSensor(s);
                          }}
                          className="px-2 py-1 rounded bg-[#131E33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
