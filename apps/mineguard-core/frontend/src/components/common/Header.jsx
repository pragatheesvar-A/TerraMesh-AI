import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bell, Settings, User, Volume2, VolumeX,
  ChevronDown, LogOut, Search, X, Radio, Clock, Menu, Globe
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Header({ 
  onOpenSettings, 
  onOpenBroadcast, 
  onNavigate, 
  onSelectSensor, 
  onSelectIncident,
  onToggleMobileNav
}) {
  const {
    lastSyncSeconds,
    currentTime,
    soundEnabled,
    setSoundEnabled,
    alerts,
    sensors,
    workers,
    isSirenActive,
    sirenCountdown,
    stopEmergencySiren,
    config
  } = useMineData();

  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [selectedSite, setSelectedSite] = useState('Sector 7 - Borehole 03');
  const [showSiteMenu, setShowSiteMenu] = useState(false);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Acknowledged Alerts State (Local UI state for "Mark as Read")
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  const handleAcknowledgeAlert = (e, id) => {
    e.stopPropagation();
    setAcknowledgedAlerts(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Click Outside & Escape Key Listeners
  const alertRef = useRef(null);
  const profileRef = useRef(null);
  const siteRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setShowAlertMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (siteRef.current && !siteRef.current.contains(event.target)) {
        setShowSiteMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowAlertMenu(false);
        setShowProfileMenu(false);
        setShowSiteMenu(false);
        setShowSearchResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    const results = [];

    const sitesList = [
      'Sector 1 - Main Decline',
      'Sector 2 - West Intake Shaft',
      'Sector 3 - East Return Shaft',
      'Sector 4 - Longwall Panel 01',
      'Sector 5 - Depillaring Section',
      'Sector 6 - Underground Workshop',
      'Sector 7 - Borehole 03',
      'Sector 8 - Main Conveyor Drift'
    ];

    sitesList.forEach(site => {
      if (site.toLowerCase().includes(q)) {
        results.push({
          type: 'SITE',
          title: site,
          subtitle: 'Mining Sector',
          status: 'ACTIVE',
          badgeColor: 'bg-indigo-950/60 text-indigo-400 border-indigo-800',
          action: () => { setSelectedSite(site); }
        });
      }
    });

    (sensors || []).forEach(s => {
      if (
        s.id.toLowerCase().includes(q) || 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.zone && s.zone.toLowerCase().includes(q)) ||
        (s.type && s.type.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'SENSOR',
          title: s.id,
          subtitle: `${s.zone || 'Zone B'} • ${s.type || 'Sensor'}`,
          status: s.status,
          badgeColor: s.status === 'CRITICAL' ? 'bg-red-950/60 text-red-400 border-red-800' : 'bg-cyan-950/60 text-cyan-400 border-cyan-800',
          action: () => { if (onSelectSensor) onSelectSensor(s); }
        });
      }
    });

    (workers || []).forEach(w => {
      if (
        (w.name && w.name.toLowerCase().includes(q)) || 
        (w.code && w.code.toLowerCase().includes(q)) || 
        (w.zone && w.zone.toLowerCase().includes(q)) ||
        (w.role && w.role.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'WORKER',
          title: w.code,
          subtitle: `${w.name} • ${w.zone}`,
          status: w.status,
          badgeColor: w.status === 'DANGER' ? 'bg-red-950/60 text-red-400 border-red-800' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
          action: () => { if (onNavigate) onNavigate('workers'); }
        });
      }
    });

    (alerts || []).forEach(a => {
      if (
        (a.type && a.type.toLowerCase().includes(q)) || 
        (a.zone && a.zone.toLowerCase().includes(q)) ||
        (a.message && a.message.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'ALERT',
          title: a.type || 'Alert',
          subtitle: a.zone || 'System',
          status: a.severity,
          badgeColor: a.severity === 'CRITICAL' ? 'bg-red-950/60 text-red-400 border-red-800' : 'bg-amber-950/60 text-amber-400 border-amber-800',
          action: () => { if (onSelectIncident) onSelectIncident(a); }
        });
      }
    });

    return results.slice(0, 6);
  }, [globalSearch, sensors, workers, onSelectSensor, onNavigate]);

  const unreadAlerts = (alerts || []).filter(a => !a.acknowledged && !acknowledgedAlerts.has(a.id));
  const utcString = currentTime.toISOString().substring(11, 19) + ' UTC';

  const sites = [
    'Sector 1 - Main Decline',
    'Sector 2 - West Intake Shaft',
    'Sector 3 - East Return Shaft',
    'Sector 4 - Longwall Panel 01',
    'Sector 5 - Depillaring Section',
    'Sector 6 - Underground Workshop',
    'Sector 7 - Borehole 03',
    'Sector 8 - Main Conveyor Drift'
  ];

  return (
    <div className="w-full flex flex-col select-none">
      {/* Emergency Siren Banner */}
      {isSirenActive && (
        <div 
          role="alert" 
          className="w-full bg-red-900/90 text-white px-4 py-1.5 flex items-center justify-between border-b border-red-700 shadow-lg text-xs"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-300 animate-pulse shrink-0" aria-hidden="true" />
            <span className="font-semibold tracking-wide">
              Critical Evacuation Alarm Active &mdash; <span className="font-mono-data text-amber-300 font-bold">{sirenCountdown}s</span> remaining
            </span>
          </div>
          <button
            onClick={stopEmergencySiren}
            className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-200 border border-red-600 font-medium transition-colors text-xs cursor-pointer"
          >
            Silence Alarm
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="h-14 px-3 md:px-5 flex items-center justify-between gap-3 w-full header-premium relative"
        style={{
          background: 'linear-gradient(180deg, rgba(8,13,22,0.98) 0%, rgba(6,10,18,0.95) 100%)',
          borderBottom: '1px solid rgba(20,32,52,0.9)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
        }}
      >
        {/* Left: Mobile Nav Toggle + Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile Hamburger */}
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Go to Overview dashboard"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate && onNavigate('dashboard'); }}
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%)',
                border: '1px solid rgba(0,212,255,0.3)',
                boxShadow: '0 0 12px rgba(0,212,255,0.12)'
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
                <path d="M4 14h6" strokeWidth="1.5" stroke="#00D4FF" opacity="0.6" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-sm font-black text-white tracking-tight">TerraMesh</span>
                <span className="text-sm font-black" style={{ color: '#00D4FF' }}>AI</span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal leading-tight truncate max-w-[160px] sm:max-w-[220px]">
                {config?.general?.identity?.mineName || 'Mine-Safety Command Center'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar + Sector Selector */}
        <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-lg mx-3 relative">
          <div ref={searchRef} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (globalSearch.trim().length > 0) setShowSearchResults(true);
              }}
              placeholder="Search sensors, workers, zones, alerts..."
              className="input-glow w-full pl-8 pr-7 py-1.5 rounded-md bg-[#0D1524] border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 text-slate-200 placeholder-slate-400 text-xs focus:outline-none transition-all duration-200"
              aria-label="Global system search"
            />
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Instant Search Results Dropdown */}
            {showSearchResults && (
              <div
                className="dropdown-content absolute left-0 right-0 top-full mt-1.5 rounded-lg bg-[#0D1524] border border-slate-700/90 shadow-2xl p-1.5 z-50 text-xs space-y-1"
                role="listbox"
              >
                <div className="px-2 py-1 text-[10px] text-slate-400 font-semibold border-b border-slate-800 flex justify-between">
                  <span>Results</span>
                  <span className="text-cyan-400 font-mono-data">{searchResults.length}</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No results found for "{globalSearch}"
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.action) item.action();
                        setShowSearchResults(false);
                        setGlobalSearch('');
                      }}
                      className="p-1.5 rounded hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-all duration-150 hover:translate-x-0.5"
                      role="option"
                      aria-selected="false"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${item.badgeColor}`}>
                          {item.type}
                        </span>
                        <span className="font-medium text-slate-100 text-xs">{item.title}</span>
                        <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-medium font-mono-data">{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sector Selector */}
          <div ref={siteRef} className="relative shrink-0">
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0D1524] border border-slate-700/80 text-xs text-slate-200 hover:border-slate-600 transition-colors cursor-pointer"
              aria-haspopup="listbox"
              aria-expanded={showSiteMenu}
            >
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Sector:</span>
              <span className="font-medium text-slate-200 truncate max-w-[130px]">{selectedSite}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSiteMenu && (
              <div
                className="dropdown-content absolute left-0 mt-1 w-52 rounded-md bg-[#0D1524] border border-slate-700/90 shadow-2xl p-1 z-50 text-xs"
                role="listbox"
              >
                {sites.map(site => (
                  <button
                    key={site}
                    onClick={() => { setSelectedSite(site); setShowSiteMenu(false); }}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs cursor-pointer ${
                      selectedSite === site 
                        ? 'bg-cyan-500/10 text-cyan-400 font-medium' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    role="option"
                    aria-selected={selectedSite === site}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Telemetry Clock, Audio Toggle, Alert Bell, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* UTC & IST Synchronized Timestamps (Monospace) */}
          <div className="hidden lg:flex flex-col text-right font-mono-data leading-none">
            <span className="text-xs font-semibold text-slate-200">{utcString}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })} IST &bull; Sync {lastSyncSeconds}s
            </span>
          </div>

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                 const langs = ['en', 'hi', 'bn', 'ta', 'sat'];
                 const currentIdx = langs.indexOf(i18n.language || 'en');
                 const nextIdx = (currentIdx + 1) % langs.length;
                 i18n.changeLanguage(langs[nextIdx]);
                 localStorage.setItem('i18nextLng', langs[nextIdx]);
              }}
              className="flex items-center gap-1 p-1.5 px-2 rounded-md border bg-[#0D1524] border-slate-700/80 text-cyan-400 hover:bg-cyan-950/20 hover:border-cyan-800 transition-colors cursor-pointer text-[10px] font-bold uppercase"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              {i18n.language || 'en'}
            </button>
          </div>

          {/* Sound Alarm Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`btn-press p-1.5 rounded-md border transition-all duration-200 cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/80'
                : 'bg-[#0D1524] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
            title={soundEnabled ? "Audio Alarms Active" : "Audio Alarms Muted"}
            aria-label={soundEnabled ? "Mute audio alarms" : "Unmute audio alarms"}
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4 transition-transform duration-150 hover:scale-110" />
              : <VolumeX  className="w-4 h-4 transition-transform duration-150 hover:scale-110" />
            }
          </button>

          {/* Alert Center Trigger */}
          <div ref={alertRef} className="relative">
            <button
              onClick={() => setShowAlertMenu(!showAlertMenu)}
              className="btn-press relative p-1.5 rounded-md bg-[#0D1524] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 transition-all duration-200 cursor-pointer"
              title="Active Safety Alerts"
              aria-label={`Active Safety Alerts: ${unreadAlerts.length} unread`}
              aria-haspopup="dialog"
              aria-expanded={showAlertMenu}
            >
              <Bell className={`w-4 h-4 transition-transform duration-200 ${unreadAlerts.length > 0 ? 'text-amber-400' : ''}`} />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white font-mono-data animate-soft-pulse">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertMenu && (
              <div
                className="dropdown-content absolute right-0 mt-1.5 w-72 sm:w-80 rounded-lg bg-[#0D1524] border border-slate-700/90 shadow-2xl p-3 z-50 text-xs"
                role="dialog"
                aria-label="Active alerts panel"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="font-semibold text-slate-200 text-xs">
                    Active Alerts ({unreadAlerts.length})
                  </span>
                  <div className="flex items-center gap-2.5">
                    {unreadAlerts.length > 0 && (
                      <button 
                        onClick={() => {
                          setAcknowledgedAlerts(prev => {
                            const next = new Set(prev);
                            unreadAlerts.forEach(a => next.add(a.id));
                            return next;
                          });
                        }} 
                        className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        Acknowledge All
                      </button>
                    )}
                    <button 
                      onClick={() => { onOpenBroadcast && onOpenBroadcast(); setShowAlertMenu(false); }} 
                      className="text-[10px] text-cyan-400 font-medium hover:underline cursor-pointer"
                    >
                      Broadcast
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {unreadAlerts.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">No active unacknowledged alerts</div>
                  ) : (
                    unreadAlerts.slice(0, 4).map(alt => (
                      <div key={alt.id} className="p-2 rounded bg-[#131E33] border border-slate-800 text-xs group relative transition-colors duration-150 hover:border-slate-700 hover:bg-[#162235]">
                        <div className="font-medium text-red-400 pr-14 text-xs">{alt.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono-data">{alt.zone} &bull; {alt.timestamp}</div>
                        <button 
                          onClick={(e) => handleAcknowledgeAlert(e, alt.id)}
                          className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-medium transition-colors cursor-pointer"
                        >
                          Ack
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-label="Operator user menu"
            >
              <div className="w-7 h-7 rounded-md bg-[#131E33] border border-slate-700 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {user?.name || 'Er. Poovarasan K'}
                </p>
                <p className="text-[10px] text-slate-400 max-w-[120px] truncate">
                  {user?.role || 'Safety Controller'}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div
                className="dropdown-content absolute right-0 mt-1.5 w-52 rounded-lg bg-[#0D1524] border border-slate-700/90 shadow-2xl p-1.5 z-50 text-xs"
                role="menu"
              >
                <div className="p-2 border-b border-slate-800 mb-1">
                  <p className="font-semibold text-slate-200">{user?.name || 'Er. Poovarasan K'}</p>
                  <p className="text-[10px] text-cyan-400 mt-0.5">{user?.role || 'Safety Controller'}</p>
                  <p className="text-[10px] text-slate-400 font-mono-data mt-0.5">{user?.email || 'admin@terramesh.gov.in'}</p>
                </div>
                <button
                  onClick={() => { onOpenSettings && onOpenSettings(); setShowProfileMenu(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-slate-300 hover:bg-slate-800/70 hover:text-white rounded transition-all duration-150 cursor-pointer group"
                  role="menuitem"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-45" />
                  <span>Control Settings</span>
                </button>
                <button
                  onClick={() => { logout && logout(); setShowProfileMenu(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded transition-all duration-150 cursor-pointer group"
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
