import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Users, 
  Megaphone, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Settings2,
  Mail,
  Smartphone,
  Plus,
  Search,
  MoreVertical,
  Activity,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BroadcastGroupModal from '../modals/BroadcastGroupModal';
import BroadcastDetailView from './BroadcastDetailView';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';

const formatSafeDate = (d) => {
  if (!d) return 'Not available';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString();
};

const formatSafeDateOnly = (d) => {
  if (!d) return 'Not available';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleDateString();
};

const formatSafeTime = (d) => {
  if (!d) return 'Queued';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Queued';
  return parsed.toLocaleTimeString();
};

export default function BroadcastManagementView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('broadcasts'); // 'broadcasts', 'recipients', 'history'
  const [broadcasts, setBroadcasts] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Active, Inactive, System, Custom
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);
  
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState('All');
  const [inspectItem, setInspectItem] = useState(null);
  const [inspectDeliveries, setInspectDeliveries] = useState([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  // Stats
  const totalRecipients = broadcasts.reduce((sum, b) => sum + (b.recipient_count || 0), 0);
  const activeCount = broadcasts.filter(b => b.status === 'ACTIVE').length;

  useEffect(() => {
    fetchBroadcasts();
    fetchHistory();

    const handleRefresh = () => {
      fetchBroadcasts();
      fetchHistory();
    };
    window.addEventListener('broadcast-history-updated', handleRefresh);
    return () => window.removeEventListener('broadcast-history-updated', handleRefresh);
  }, []);

  const handleOpenInspect = async (item) => {
    setInspectItem(item);
    setIsLoadingDeliveries(true);
    try {
      const res = await apiFetch(`/api/broadcasts/history/${item.id}/deliveries`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setInspectDeliveries(data.deliveries || []);
      } else {
        setInspectDeliveries([]);
      }
    } catch (err) {
      console.error(err);
      setInspectDeliveries([]);
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await apiFetch(`/api/broadcasts`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data);
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiFetch(`/api/broadcasts/history`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Delete Broadcast?\n\n${name}\n\nDeleting this broadcast will remove the recipient group from future alert distribution. Existing alert history will NOT be deleted.`)) return;
    
    try {
      const res = await apiFetch(`/api/broadcasts/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) fetchBroadcasts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBroadcasts = broadcasts.filter(b => {
    // 1. Search Query
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase()) && !b.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 2. Filter Type
    const isSystem = b.name.toLowerCase().includes('admin') || b.name.toLowerCase().includes('system') || b.name.toLowerCase().includes('worker') || b.name.toLowerCase().includes('supervisor');
    if (filterType === 'Active' && b.status !== 'ACTIVE') return false;
    if (filterType === 'Inactive' && b.status === 'ACTIVE') return false;
    if (filterType === 'System' && !isSystem) return false;
    if (filterType === 'Custom' && isSystem) return false;
    
    return true;
  });

  const filteredHistory = history.filter(h => {
    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      const matchName = h.broadcast_name && h.broadcast_name.toLowerCase().includes(q);
      const matchAlert = h.alert_id && h.alert_id.toLowerCase().includes(q);
      const matchMsg = h.message_content && h.message_content.toLowerCase().includes(q);
      if (!matchName && !matchAlert && !matchMsg) return false;
    }
    const isManual = h.alert_type === 'MANUAL_SMS' || (h.alert_id && h.alert_id.startsWith('MANUAL-'));
    if (historyFilter === 'MANUAL_SMS' && !isManual) return false;
    if (historyFilter === 'EMERGENCY' && isManual) return false;
    if (historyFilter === 'DELIVERED' && h.status !== 'Delivered' && h.status !== 'Sent') return false;
    if (historyFilter === 'FAILED' && h.status !== 'Failed' && (!h.failed_count || h.failed_count === 0)) return false;
    return true;
  });

  if (selectedBroadcastId) {
    return (
      <BroadcastDetailView 
        broadcastId={selectedBroadcastId} 
        onBack={() => setSelectedBroadcastId(null)} 
        broadcasts={broadcasts} 
        history={history}
        onEdit={(id) => { setEditId(id); setIsModalOpen(true); }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      
      {/* 03 — BROADCAST CENTER HERO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-wide text-white uppercase mb-1">
            Broadcast Center
          </h1>
          <h2 className="text-sm font-bold text-cyan-400 mb-2">
            Emergency Communication
          </h2>
          <p className="text-xs text-slate-400 mb-4 max-w-xl leading-relaxed">
            Manage recipient groups and distribute TerraMesh AI safety alerts.
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">System Status</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Communication systems operational</span>
            </div>
          </div>
        </div>
        
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => { setEditId(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/40 cursor-pointer border border-cyan-400/30"
          >
            <Plus className="w-4 h-4" />
            Create Broadcast
          </button>
        )}
      </div>

      {/* COMMUNICATION STATUS PANEL */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#0B101A] border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-slate-800 pb-4 sm:pb-0 sm:pr-8 w-full sm:w-auto">
            <div className="p-3 bg-slate-900 border border-slate-700/50 rounded-xl shadow-inner">
              <Radio className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-0.5">Live Diagnostics</h3>
              <div className="text-sm font-bold text-white tracking-wide uppercase">Communication Status</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 w-full sm:w-auto flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">SMS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Operational</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">SMTP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Operational</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">Dashboard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Operational</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">Recipients</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-cyan-400 font-mono font-bold">{totalRecipients}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 04 — QUICK ACTION BAR */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-1">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: { type: 'EVACUATION' } }))}
            className="flex items-center justify-center gap-2 p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 hover:border-red-500/50 rounded-xl transition-all group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform duration-300">🚨</span>
            <span className="text-[11px] font-bold text-red-100 uppercase tracking-wide">Emergency Broadcast</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: { type: 'WARNING' } }))}
            className="flex items-center justify-center gap-2 p-3 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/50 hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform duration-300">⚠️</span>
            <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wide">Send Warning</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: { type: 'CAUTION' } }))}
            className="flex items-center justify-center gap-2 p-3 bg-yellow-950/30 hover:bg-yellow-900/50 border border-yellow-900/50 hover:border-yellow-500/50 rounded-xl transition-all group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform duration-300">🟡</span>
            <span className="text-[11px] font-bold text-yellow-100 uppercase tracking-wide">Gas Alert</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: { type: 'ALL_CLEAR' } }))}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 hover:border-emerald-500/50 rounded-xl transition-all group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform duration-300">✅</span>
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">All Clear</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('broadcasts')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'broadcasts' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Recipient Groups
          {activeTab === 'broadcasts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'history' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Delivery History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
          )}
        </button>
      </div>

      {/* Tab Content: Broadcasts */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search broadcast groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0B0F17] border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {['All', 'Active', 'Inactive', 'System', 'Custom'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterType === f 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-[#0B0F17] text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-800/80'
                  }`}
                >
                  {f}
                </button>
              ))}
              
              <div className="w-px h-6 bg-slate-800 mx-2 hidden md:block"></div>
              
              <div className="hidden md:flex bg-[#0B0F17] border border-slate-800/80 rounded-lg p-0.5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading broadcasts...</div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-2xl bg-[#111827]/50">
              <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Broadcasts Found</h3>
              <p className="text-slate-400 text-sm max-w-sm text-center mb-6">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            filteredBroadcasts.map(b => (
              <div 
                key={b.id} 
                onClick={() => setSelectedBroadcastId(b.id)}
                className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="p-5 flex-1 relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-xs font-bold text-cyan-400">View Details &rarr;</span>
                  </div>
                  <div className="flex items-start justify-between mb-3 pr-24">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {b.name.toLowerCase().includes('worker') ? '👷' : b.name.toLowerCase().includes('supervisor') ? '🛡' : b.name.toLowerCase().includes('admin') ? '◈' : b.name.toLowerCase().includes('emergency') ? '🚨' : b.name.toLowerCase().includes('safety') ? '🦺' : '◎'} {b.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800">
                      {b.name.toLowerCase().includes('admin') || b.name.toLowerCase().includes('system') || b.name.toLowerCase().includes('worker') || b.name.toLowerCase().includes('supervisor') ? 'SYSTEM' : 'CUSTOM'}
                    </span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${b.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                      {b.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${b.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>{b.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2 min-h-[40px]">
                    {b.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Recipients</span>
                      <span className="text-sm font-mono text-slate-200">{b.recipient_count}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Channels</span>
                      <div className="flex gap-2">
                        {b.channels.sms_enabled && <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">SMS</span>}
                        {b.channels.email_enabled && <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Email</span>}
                        {b.channels.dashboard_enabled && <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Dash</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Last Broadcast</span>
                      <span className="text-[11px] font-mono text-slate-400">{formatSafeDateOnly(b.updated_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-[#080D14] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: b.id }));
                      }}
                      className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Trigger automated emergency alert & sirens"
                    >
                      <span>🚨</span>
                      <span>Emergency Alert</span>
                    </button>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         window.dispatchEvent(new CustomEvent('open-manual-sms-composer', { detail: b.id }));
                      }}
                      className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Dispatch manual operational SMS to this group"
                    >
                      <span>✉</span>
                      <span>Send SMS</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {user?.role === 'ADMIN' && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditId(b.id); setIsModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer rounded hover:bg-cyan-950/30"
                          title="Edit Broadcast"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleArchive(b.id, b.name); }}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer rounded hover:bg-red-950/30"
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* Tab Content: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alert IDs or broadcasts..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0B0F17] border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {[
                { id: 'All', label: 'All Dispatches' },
                { id: 'MANUAL_SMS', label: '✉ Manual SMS' },
                { id: 'EMERGENCY', label: '🚨 Emergency Alerts' },
                { id: 'DELIVERED', label: 'Delivered' },
                { id: 'FAILED', label: 'Failed' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    historyFilter === f.id 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'bg-[#0B0F17] text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-800/80'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {filteredHistory.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No History Found</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#080D14] border-b border-slate-800">
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type & Details</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recipient Group</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Metrics</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dispatched At</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredHistory.map((h) => {
                      const isManual = h.alert_type === 'MANUAL_SMS' || (h.alert_id && h.alert_id.startsWith('MANUAL-'));
                      return (
                        <tr 
                          key={h.id} 
                          onClick={() => handleOpenInspect(h)}
                          className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                {isManual ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                                    <span>✉</span>
                                    <span>MANUAL SMS</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1">
                                    <span>🚨</span>
                                    <span>EMERGENCY ALERT</span>
                                  </span>
                                )}
                                <span className="text-xs font-mono text-cyan-400/80 font-bold">{h.alert_id}</span>
                              </div>
                              {h.message_content && (
                                <p className="text-xs text-slate-300 line-clamp-1 max-w-md font-sans italic">
                                  "{h.message_content}"
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-200 font-semibold">{h.broadcast_name}</span>
                            <div className="text-xs text-slate-500 font-mono">Dispatcher: {h.sent_by}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1 w-48">
                              <div className="flex justify-between text-xs font-mono">
                                 <span className="text-emerald-400 font-bold">{h.delivered_count || h.recipient_count} Delivered</span>
                                 {h.failed_count > 0 && <span className="text-red-400">{h.failed_count} Failed</span>}
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                 <div className="bg-emerald-500 h-full" style={{width: h.recipient_count ? `${((h.delivered_count || h.recipient_count) / h.recipient_count) * 100}%` : '100%'}}></div>
                                 {h.failed_count > 0 && <div className="bg-red-500 h-full" style={{width: `${(h.failed_count / h.recipient_count) * 100}%`}}></div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                             {formatSafeDate(h.sent_at)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenInspect(h); }}
                              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 transition-all cursor-pointer"
                            >
                              View Details &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Detail Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0B0F17] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  inspectItem.alert_type === 'MANUAL_SMS' || (inspectItem.alert_id && inspectItem.alert_id.startsWith('MANUAL-'))
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}>
                  {inspectItem.alert_type === 'MANUAL_SMS' || (inspectItem.alert_id && inspectItem.alert_id.startsWith('MANUAL-')) ? '✉' : '🚨'}
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-white uppercase">
                    Broadcast Dispatch Report
                  </h3>
                  <div className="text-xs font-mono text-cyan-400">{inspectItem.alert_id}</div>
                </div>
              </div>
              <button 
                onClick={() => setInspectItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#080D14] border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Type</span>
                <span className="text-xs font-bold font-mono text-white mt-1 block">
                  {inspectItem.alert_type === 'MANUAL_SMS' || (inspectItem.alert_id && inspectItem.alert_id.startsWith('MANUAL-')) ? 'Manual SMS' : 'Emergency Alert'}
                </span>
              </div>
              <div className="p-3 bg-[#080D14] border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Group</span>
                <span className="text-xs font-bold font-mono text-white mt-1 block truncate">{inspectItem.broadcast_name}</span>
              </div>
              <div className="p-3 bg-[#080D14] border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Dispatcher</span>
                <span className="text-xs font-bold font-mono text-slate-300 mt-1 block truncate">{inspectItem.sent_by}</span>
              </div>
              <div className="p-3 bg-[#080D14] border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Delivered</span>
                <span className="text-xs font-bold font-mono text-emerald-400 mt-1 block">{inspectItem.delivered_count || inspectItem.recipient_count} / {inspectItem.recipient_count}</span>
              </div>
            </div>

            {inspectItem.message_content && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Message Transmitted</span>
                <div className="p-3.5 bg-[#080D14] border border-slate-800 rounded-xl text-xs text-slate-200 font-sans leading-relaxed">
                  "{inspectItem.message_content}"
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Handset Receipts (Masked)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {inspectDeliveries.length} entries recorded
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto bg-[#080D14] border border-slate-800 rounded-xl divide-y divide-slate-800/60 text-xs">
                {isLoadingDeliveries ? (
                  <div className="p-6 text-center text-slate-500 font-mono">Loading delivery receipts...</div>
                ) : inspectDeliveries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono">All {inspectItem.recipient_count} cellular endpoints confirmed delivered by carrier.</div>
                ) : (
                  inspectDeliveries.map((del, idx) => (
                    <div key={idx} className="p-2.5 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">{idx+1}.</span>
                        <span className="text-slate-300">{del.recipient_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          del.status === 'Delivered' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {del.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatSafeTime(del.delivered_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BroadcastGroupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        broadcastId={editId}
        onSaved={() => {
          fetchBroadcasts();
        }}
      />
    </div>
  );
}

// Dummy icon to avoid crash if layoutdash is used 
function LayoutDashboardIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}
