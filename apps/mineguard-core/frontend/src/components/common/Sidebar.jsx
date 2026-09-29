import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  MapPin,
  Cpu,
  Users,
  BrainCircuit,
  BellRing,
  Navigation,
  Box,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  X
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  onOpenBroadcast,
  isMobileOpen,
  setIsMobileOpen
}) {
  const { alerts, sensors, workers, kpis } = useMineData();
  const { t } = useTranslation();

  const criticalCount = (alerts || []).filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;

  // Live sensor badge: online / total
  const totalSensors = sensors?.length ?? kpis?.active_sensors_total ?? 48;
  const onlineSensors = sensors?.filter(s => s.status !== 'OFFLINE').length ?? kpis?.active_sensors_online ?? totalSensors;
  const sensorBadge = `${onlineSensors}/${totalSensors}`;

  // Live workers badge: total monitored
  const totalWorkers = workers?.length ?? kpis?.monitored_workers_total ?? 126;
  const workersBadge = `${totalWorkers}`;

  const navigationSections = [
    {
      heading: t('nav_sections.operations', 'Operations'),
      items: [
        { id: 'dashboard', label: t('nav.dashboard', 'Overview'), icon: LayoutDashboard },
        { id: 'map', label: t('nav.map', 'Live Mine Map'), icon: MapPin },
        { id: 'digital-twin', label: t('nav.digital_twin', 'Digital Twin'), icon: Box },
      ]
    },
    {
      heading: t('nav_sections.monitoring', 'Monitoring'),
      items: [
        { id: 'sensors', label: t('nav.sensors', 'Sensors'), icon: Cpu, badge: sensorBadge },
        { id: 'workers', label: t('nav.workers', 'Workers'), icon: Users, badge: workersBadge },
      ]
    },
    {
      heading: t('nav_sections.intelligence', 'Intelligence'),
      items: [
        { id: 'prediction', label: t('nav.prediction', 'Risk Prediction'), icon: BrainCircuit },
      ]
    },
    {
      heading: t('nav_sections.safety', 'Safety'),
      items: [
        { 
          id: 'alerts', 
          label: t('nav.alerts', 'Alerts'), 
          icon: BellRing, 
          badge: criticalCount > 0 ? `${criticalCount} Crit` : undefined,
          badgeColor: 'bg-red-950/70 text-red-400 border-red-800/80 font-bold'
        },
        { id: 'evacuation', label: t('nav.evacuation', 'Evacuation'), icon: Navigation },
        { id: 'broadcasts', label: t('nav.broadcasts', 'Broadcasts'), icon: Radio },
      ]
    },
    {
      heading: t('nav_sections.system', 'System'),
      items: [
        { id: 'reports', label: t('nav.reports', 'Reports'), icon: FileText },
        { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
      ]
    }
  ];

  const handleSelectNav = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full select-none">
      {/* Sidebar Header / Collapse Toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800/80 shrink-0 h-12">
        {!isCollapsed ? (
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations Menu
          </span>
        ) : (
          <span className="w-4" />
        )}
        
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded bg-[#111827] border border-slate-700/80 text-slate-400 hover:text-white hover:border-cyan-600/50 hover:bg-cyan-950/30 transition-all duration-200 cursor-pointer btn-press"
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
            : <ChevronLeft  className="w-3.5 h-3.5 transition-transform duration-200" />
          }
        </button>

        {/* Close Button for Mobile Drawer */}
        <button
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded bg-[#111827] border border-slate-700 text-slate-400 hover:text-white"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav 
        className="flex-1 overflow-y-auto py-3 px-2 space-y-3 focus:outline-none"
        aria-label="Sidebar Navigation"
      >
        {navigationSections.map((sec) => (
          <div key={sec.heading} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {sec.heading}
              </div>
            )}

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`nav-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs relative group cursor-pointer ${
                    isActive
                      ? 'nav-active-premium text-slate-100 font-semibold'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border-l-2 border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-all duration-150 ${
                      isActive ? 'scale-105' : 'text-slate-600 group-hover:text-slate-300 group-hover:scale-110'
                    }`}
                    style={isActive ? { color: '#00D4FF' } : {}}
                    aria-hidden="true"
                  />

                  {!isCollapsed && (
                    <span className="truncate text-left flex-1 transition-colors duration-150">
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono-data shrink-0 transition-colors duration-150 ${
                      item.badgeColor || (isActive ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/60')
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip in collapsed state */}
                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className="dropdown-content absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F1824] border border-slate-700/80 text-slate-100 text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50"
                    >
                      {item.label}
                      {item.badge && <span className="ml-1.5 text-cyan-400">({item.badge})</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Emergency Operational Dispatch Action */}
      <div className="p-2.5 shrink-0" style={{ borderTop: '1px solid rgba(20,32,52,0.9)', background: 'rgba(5,8,15,0.8)' }}>
        <button
          onClick={() => {
            if (onOpenBroadcast) onOpenBroadcast();
            if (setIsMobileOpen) setIsMobileOpen(false);
          }}
          className={`btn-press w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'px-1' : 'px-2.5'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.06) 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            boxShadow: '0 0 12px rgba(239,68,68,0.08)'
          }}
          title={t('common.emergency_dispatch', 'Emergency Dispatch')}
          aria-label={t('common.emergency_dispatch', 'Emergency Dispatch')}
        >
          <Radio className="w-3.5 h-3.5 text-red-400 shrink-0 animate-soft-pulse" aria-hidden="true" />
          {!isCollapsed && <span>{t('common.emergency_dispatch', 'Emergency Dispatch')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop In-flow Sidebar */}
      <aside
        aria-label="Primary Navigation"
        className={`hidden md:flex shrink-0 flex-col transition-[width] duration-200 z-20 h-full ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(7,11,20,0.98) 0%, rgba(6,10,18,0.95) 100%)',
          borderRight: '1px solid rgba(20,32,52,0.9)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Navigation (Tablet / Mobile < 768px) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-64 max-w-[80vw] bg-[#090E17] border-r border-slate-800 h-full shadow-2xl z-10 flex flex-col">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
