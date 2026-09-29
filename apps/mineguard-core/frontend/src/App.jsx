import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import SystemStatus from './components/common/SystemStatus';
import SensorDetailDrawer from './components/common/SensorDetailDrawer';
import IncidentDetailDrawer from './components/common/IncidentDetailDrawer';

// Full Featured Dashboard Widgets
import KPICards from './components/dashboard/KPICard';
import RiskMap from './components/dashboard/RiskMap';
import AIRiskPanel from './components/dashboard/AIRiskPanel';
import EvacuationPanel from './components/dashboard/EvacuationPanel';
import RiskTrendChart from './components/dashboard/RiskTrendChart';
import DigitalTwinPreview from './components/dashboard/DigitalTwinPreview';
import MinerSafetyCultureCard from './components/dashboard/MinerSafetyCultureCard';

// Dedicated Views
import SensorNetworkView from './components/views/SensorNetworkView';
import WorkerSafetyView from './components/views/WorkerSafetyView';
import AIPredictionView from './components/views/AIPredictionView';
import DynamicEvacuationView from './components/views/DynamicEvacuationView';
import AlertCenterView from './components/views/AlertCenterView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';
import LoginView from './components/views/LoginView';
import DigitalTwinView from './components/views/DigitalTwinView';
import BroadcastManagementView from './components/views/BroadcastManagementView';

// Modals
import EvacuationModal from './components/modals/EvacuationModal';
import BroadcastModal from './components/modals/BroadcastModal';
import ManualSmsModal from './components/modals/ManualSmsModal';
import ReportModal from './components/modals/ReportModal';
import DiagnosticsModal from './components/modals/DiagnosticsModal';
import WorkerSafetyModal from './components/modals/WorkerSafetyModal';
import DigitalTwinModal from './components/modals/DigitalTwinModal';
import SettingsModal from './components/modals/SettingsModal';

import { useAuth } from './context/AuthContext';
import { useMineData } from './context/MineDataContext';

export default function App() {
  const { isAuthenticated } = useAuth();
  const { selectSensorNode, selectWorkerNode, selectZoneNode } = useMineData();

  // Navigation & Layout (Default: 'dashboard')
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('mineguard_active_tab') || 'dashboard';
  });
  
  useEffect(() => {
    localStorage.setItem('mineguard_active_tab', activeTab);
  }, [activeTab]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Auto-collapse sidebar on narrow desktop / tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Side Drawer States
  const [drawerSensor, setDrawerSensor] = useState(null);
  const [isSensorDrawerOpen, setIsSensorDrawerOpen] = useState(false);

  const [drawerIncident, setDrawerIncident] = useState(null);
  const [isIncidentDrawerOpen, setIsIncidentDrawerOpen] = useState(false);

  // Modal States
  const [isEvacModalOpen, setIsEvacModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isDigitalTwinModalOpen, setIsDigitalTwinModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenSensorDrawer = (sensor) => {
    setDrawerSensor(sensor);
    setIsSensorDrawerOpen(true);
  };

  const handleOpenIncidentDrawer = (incident) => {
    setDrawerIncident(incident);
    setIsIncidentDrawerOpen(true);
  };

  const handleLocateSensorOnMap = (sensor) => {
    selectSensorNode(sensor);
    setIsDiagnosticsModalOpen(false);
    setIsSensorDrawerOpen(false);
    setActiveTab('map');
  };

  const handleLocateWorkerOnMap = (worker) => {
    if (worker) selectWorkerNode(worker);
    setIsWorkerModalOpen(false);
    setActiveTab('map');
  };

  const handleLocateZoneOnMap = (zone) => {
    if (zone) selectZoneNode(zone);
    setActiveTab('map');
  };

  const [prefilledBroadcastId, setPrefilledBroadcastId] = useState(null);
  const [isManualSmsModalOpen, setIsManualSmsModalOpen] = useState(false);
  const [manualSmsBroadcastId, setManualSmsBroadcastId] = useState(null);

  useEffect(() => {
    const handleOpenComposer = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setPrefilledBroadcastId(e.detail);
      } else {
        setPrefilledBroadcastId(null);
      }
      setIsBroadcastModalOpen(true);
    };

    const handleOpenManualSms = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setManualSmsBroadcastId(e.detail);
      } else if (e.detail && e.detail.broadcastId) {
        setManualSmsBroadcastId(e.detail.broadcastId);
      } else {
        setManualSmsBroadcastId(null);
      }
      setIsManualSmsModalOpen(true);
    };
    
    window.addEventListener('open-broadcast-composer', handleOpenComposer);
    window.addEventListener('open-manual-sms-composer', handleOpenManualSms);
    return () => {
      window.removeEventListener('open-broadcast-composer', handleOpenComposer);
      window.removeEventListener('open-manual-sms-composer', handleOpenManualSms);
    };
  }, []);

  // If user is not authenticated, show LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="app-shell selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Top Header Shell */}
      <header className="shrink-0 z-30">
        <Header
          onOpenSettings={() => setActiveTab('settings')}
          onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
          onNavigate={(tabId) => setActiveTab(tabId)}
          onSelectSensor={handleOpenSensorDrawer}
          onSelectIncident={handleOpenIncidentDrawer}
          onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
        />
      </header>

      {/* Main Body Shell (In-Flow Sidebar + In-Flow Scrollable Viewport) */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileNavOpen}
          setIsMobileOpen={setIsMobileNavOpen}
          onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
        />

        {/* Scrollable Viewport: Contains internal page layouts */}
        <main
          id="main-content-region"
          tabIndex="-1"
          className="app-main-viewport p-4 md:p-6 lg:p-7 flex flex-col focus:outline-none"
        >
          <div key={activeTab} className="flex-1 w-full max-w-[1680px] mx-auto min-w-0 view-enter">
            {/* ======================================================== */}
            {/* 1. OPERATIONS: OVERVIEW DASHBOARD                        */}
            {/* ======================================================== */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-layout flex flex-col gap-5 w-full">
                
                {/* Level 1: Compact Status Band */}
                <section className="w-full">
                  <KPICards
                    onOpenSensors={() => setActiveTab('sensors')}
                    onOpenWorkers={() => setActiveTab('workers')}
                    onOpenZones={() => setActiveTab('map')}
                    onSelectSensor={handleOpenSensorDrawer}
                  />
                </section>

                {/* Priority 1 & 2: GIS Spatial Map and Risk Trend */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                  <section className="w-full xl:col-span-2">
                    <RiskMap
                      onOpenEvacuationModal={() => setIsEvacModalOpen(true)}
                      onOpenDigitalTwin={() => setIsDigitalTwinModalOpen(true)}
                    />
                  </section>
                  <section className="w-full xl:col-span-1">
                    <RiskTrendChart />
                  </section>
                </div>

                {/* Priority 3 & 4: AI Risk Assessment and Evacuation Escalation */}
                <div className="grid grid-cols-1 2xl:grid-cols-5 gap-5 items-start">
                  <section className="w-full 2xl:col-span-3">
                    <AIRiskPanel />
                  </section>

                  <section className="w-full 2xl:col-span-2">
                    <EvacuationPanel
                      onOpenEvacuationModal={() => setIsEvacModalOpen(true)}
                      onOpenMapRoute={() => setActiveTab('map')}
                    />
                  </section>
                </div>

                {/* Priority 5: Operational Culture */}
                <section className="w-full">
                  <MinerSafetyCultureCard />
                </section>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. OPERATIONS: LIVE MINE MAP (Full Screen GIS)           */}
            {/* ======================================================== */}
            {activeTab === 'map' && (
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-100">
                      Live Mine Spatial Map &mdash; Jharia Colliery
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data">
                      GIS 2D
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-3 py-1.5 rounded-md bg-[#0E1626] border border-slate-700 text-xs text-cyan-400 hover:bg-[#162235] transition-colors cursor-pointer"
                  >
                    &larr; Back to Overview
                  </button>
                </div>
                <div className="h-[740px] rounded-lg overflow-hidden border border-slate-800 shadow-xl">
                  <RiskMap onOpenEvacuationModal={() => setIsEvacModalOpen(true)} />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. OPERATIONS: 3D DIGITAL TWIN                           */}
            {/* ======================================================== */}
            {activeTab === 'digital-twin' && (
              <DigitalTwinView 
                onOpenEvacuationModal={() => setIsEvacModalOpen(true)}
                onSelectSensor={handleOpenSensorDrawer}
                onNavigate={(tabId) => setActiveTab(tabId)}
              />
            )}

            {/* ======================================================== */}
            {/* 4. MONITORING: SENSORS & WORKERS                         */}
            {/* ======================================================== */}
            {activeTab === 'sensors' && (
              <SensorNetworkView onSelectSensor={handleOpenSensorDrawer} />
            )}

            {activeTab === 'workers' && (
              <WorkerSafetyView 
                onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
                onOpenEvacuation={() => setActiveTab('evacuation')}
                onLocateWorkerOnMap={handleLocateWorkerOnMap}
              />
            )}

            {/* ======================================================== */}
            {/* 5. INTELLIGENCE: RISK PREDICTION                         */}
            {/* ======================================================== */}
            {activeTab === 'prediction' && (
              <AIPredictionView />
            )}

            {/* ======================================================== */}
            {/* 6. SAFETY: ALERTS & EVACUATION                           */}
            {/* ======================================================== */}
            {activeTab === 'alerts' && (
              <AlertCenterView 
                onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
                onSelectAlert={handleOpenIncidentDrawer}
                onSelectAlertZone={handleLocateZoneOnMap}
              />
            )}

            {activeTab === 'evacuation' && (
              <DynamicEvacuationView 
                onOpenEvacuationModal={() => setIsEvacModalOpen(true)}
                onOpenMapRoute={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'broadcasts' && (
              <BroadcastManagementView 
                 onOpenBroadcastGroup={() => {}}
              />
            )}

            {/* ======================================================== */}
            {/* 7. SYSTEM: REPORTS & SETTINGS                            */}
            {/* ======================================================== */}
            {activeTab === 'reports' && (
              <ReportsView onOpenReportModal={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Progressive Disclosure Drawers */}
      <SensorDetailDrawer
        sensor={drawerSensor}
        isOpen={isSensorDrawerOpen}
        onClose={() => setIsSensorDrawerOpen(false)}
        onLocateOnMap={handleLocateSensorOnMap}
      />

      <IncidentDetailDrawer
        alertItem={drawerIncident}
        isOpen={isIncidentDrawerOpen}
        onClose={() => setIsIncidentDrawerOpen(false)}
        onLocateZone={handleLocateZoneOnMap}
        onStartEvacuation={() => setIsEvacModalOpen(true)}
      />

      {/* Telemetry Status Footer: In-Flow Flex Child */}
      <footer className="shrink-0 z-20">
        <SystemStatus />
      </footer>

      {/* Global Interactive Modals */}
      <EvacuationModal 
        isOpen={isEvacModalOpen} 
        onClose={() => setIsEvacModalOpen(false)} 
      />

      <BroadcastModal 
        isOpen={isBroadcastModalOpen} 
        onClose={() => {
          setIsBroadcastModalOpen(false);
          setPrefilledBroadcastId(null);
        }} 
        prefilledBroadcastId={prefilledBroadcastId}
      />

      <ManualSmsModal
        isOpen={isManualSmsModalOpen}
        onClose={() => {
          setIsManualSmsModalOpen(false);
          setManualSmsBroadcastId(null);
        }}
        targetBroadcastId={manualSmsBroadcastId}
        onSentSuccess={() => {
          window.dispatchEvent(new CustomEvent('broadcast-history-updated'));
        }}
      />

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
        onLocateOnMap={handleLocateSensorOnMap}
      />

      <WorkerSafetyModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        onLocateWorker={handleLocateWorkerOnMap}
      />

      <DigitalTwinModal
        isOpen={isDigitalTwinModalOpen}
        onClose={() => setIsDigitalTwinModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

    </div>
  );
}
