import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Radio, Users, Activity, Settings, Smartphone, Mail, LayoutDashboardIcon 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

export default function BroadcastDetailView({ broadcastId, onBack, broadcasts, history, onEdit }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const broadcast = broadcasts.find(b => b.id === broadcastId);
  const broadcastHistory = history.filter(h => h.broadcast_id === broadcastId);

  if (!broadcast) return (
    <div className="p-8 text-center text-slate-400 font-mono">Broadcast not found. <button onClick={onBack} className="text-cyan-400 hover:underline">Go back</button></div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6 fade-in">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider mb-2 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Broadcast Center
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-[#111827] to-[#0B0F17] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-mono tracking-wide text-white uppercase">
              {broadcast.name.toLowerCase().includes('worker') ? '👷' : broadcast.name.toLowerCase().includes('supervisor') ? '🛡' : broadcast.name.toLowerCase().includes('admin') ? '◈' : broadcast.name.toLowerCase().includes('emergency') ? '🚨' : broadcast.name.toLowerCase().includes('safety') ? '🦺' : '◎'} {broadcast.name}
            </h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${broadcast.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
              {broadcast.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${broadcast.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>{broadcast.status}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">{broadcast.description}</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-300">{broadcast.recipient_count} Recipients</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-broadcast-composer', { detail: broadcast.id }))}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/40 border border-red-500 cursor-pointer"
          >
            🚨 Emergency Alert
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-manual-sms-composer', { detail: broadcast.id }))}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40 border border-amber-500/40 cursor-pointer"
          >
            ✉ Send SMS
          </button>
          
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => onEdit(broadcast.id)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 hover:text-white cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-800 overflow-x-auto hide-scrollbar">
        {['overview', 'recipients', 'activity', 'settings'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Recipients</span>
                <span className="text-3xl font-mono font-bold text-white">{broadcast.recipient_count}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</span>
                <span className="text-2xl font-mono font-bold text-emerald-400 uppercase">{broadcast.status}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Channels</span>
                <div className="flex gap-2 mt-2">
                  {broadcast.channels.sms_enabled && <Smartphone className="w-5 h-5 text-cyan-400" />}
                  {broadcast.channels.email_enabled && <Mail className="w-5 h-5 text-cyan-400" />}
                  {broadcast.channels.dashboard_enabled && <LayoutDashboardIcon className="w-5 h-5 text-cyan-400" />}
                </div>
              </div>
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Last Updated</span>
                <span className="text-sm font-mono font-bold text-slate-300">{formatSafeDateOnly(broadcast.updated_at)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" /> Recent Activity
              </h3>
              <div className="space-y-3">
                {broadcastHistory.length === 0 ? (
                   <div className="p-8 text-center bg-[#111827] rounded-xl border border-slate-800 text-slate-400 font-mono text-xs">No recent activity for this group.</div>
                ) : (
                  broadcastHistory.slice(0, 5).map((item, idx) => {
                    const isManual = item.alert_type === 'MANUAL_SMS' || (item.alert_id && item.alert_id.startsWith('MANUAL-'));
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111827] rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-xl mt-0.5 ${
                            isManual 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                              : item.alert_type === 'EVACUATION' 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isManual ? '✉' : item.alert_type === 'EVACUATION' ? '🚨' : item.alert_type === 'WARNING' ? '⚠️' : item.alert_type === 'CAUTION' ? '🟡' : '✅'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                                isManual 
                                  ? 'bg-amber-500/20 text-amber-300' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {isManual ? 'MANUAL SMS' : item.alert_type || 'EMERGENCY'}
                              </span>
                              <span className="text-xs font-mono text-cyan-400/80">{item.alert_id}</span>
                            </div>
                            {item.message_content && (
                              <p className="text-xs text-slate-300 italic mt-1 line-clamp-2">
                                "{item.message_content}"
                              </p>
                            )}
                            <div className="text-[11px] text-slate-500 font-mono mt-1">
                              {formatSafeDate(item.sent_at || item.created_at)} • Dispatched by {item.sent_by || 'Admin'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/20">
                            {item.delivered_count || item.recipient_count} Delivered
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white">Recipient Directory</span>
              <span className="text-xs font-bold font-mono text-cyan-400 px-2 py-1 rounded bg-cyan-950/30">{broadcast.recipient_count} TOTAL</span>
            </div>
            <div className="p-8 text-center text-slate-500 font-mono text-xs border-b border-slate-800">
               Click "Edit" to modify the recipient list for this broadcast group.
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg p-6">
            <div className="relative border-l border-slate-700 ml-4 space-y-8 pb-4">
              {broadcastHistory.length === 0 ? (
                 <div className="pl-6 text-slate-400 font-mono text-xs">No activity timeline available.</div>
              ) : (
                broadcastHistory.map((item, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#111827] border-2 border-cyan-500"></div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-cyan-400">{formatSafeDate(item.created_at)}</span>
                    </div>
                    <div className="bg-[#0B0F17] border border-slate-800 rounded-lg p-4 mt-2">
                      <h4 className="font-bold text-white mb-1">{item.alert_type} Alert Sent</h4>
                      <p className="text-xs text-slate-400 mb-3">{item.message_preview}</p>
                      <div className="flex gap-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Recipients: <span className="text-slate-300">{item.total_recipients}</span></span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Success: {item.success_count}</span>
                        <span className="text-[10px] font-bold text-red-500 uppercase">Failed: {item.failed_count}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="p-8 text-center bg-[#111827] rounded-xl border border-slate-800 text-slate-400 font-mono text-xs">
            Advanced settings are configured via the Edit modal.
          </div>
        )}
      </div>
    </div>
  );
}
