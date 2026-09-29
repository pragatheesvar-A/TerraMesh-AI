import React, { useState, useEffect } from 'react';
import { 
  X, Radio, AlertTriangle, Send, CheckCircle2, Volume2, 
  Flame, Bell, VolumeX, Users, ArrowRight, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';

export default function BroadcastModal({ isOpen, onClose, prefilledBroadcastId }) {
  const { 
    broadcastEmergency, 
    playAlertSound, 
    playEmergencySiren, 
    stopEmergencySiren,
    isSirenActive,
    sirenCountdown
  } = useMineData();

  // Wizard State
  const [step, setStep] = useState(1); // 1: Compose, 2: Review, 3: Sent
  
  // Data State
  const [broadcastGroups, setBroadcastGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [message, setMessage] = useState('Subsidence acceleration anomaly detected. All personnel report to nearest refuge station immediately.');
  const [playingLevel, setPlayingLevel] = useState(null);
  
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMessage(
        severity === 'CRITICAL' ? 'EVACUATION ORDER: Immediate subsidence risk detected. Proceed to nearest safe zone immediately.' : 
        severity === 'WARNING' ? 'WARNING: Elevated gas levels detected. Secure operations and stand by for instructions.' :
        severity === 'CAUTION' ? 'CAUTION: Equipment malfunction reported in Sector 4. Proceed with care.' :
        'ALL CLEAR: Normal operations may resume.'
      );
      fetchBroadcasts();
    } else {
      setStep(1);
      setPlayingLevel(null);
      stopEmergencySiren();
    }
  }, [isOpen, severity]);

  const fetchBroadcasts = async () => {
    try {
      const res = await apiFetch(`/api/broadcasts`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastGroups(data);
        if (prefilledBroadcastId) {
          setSelectedGroupId(prefilledBroadcastId);
        } else if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Sound triggers
  const handleTestSound = (level, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (playingLevel === level || (level === 'CRITICAL' && isSirenActive)) {
      stopEmergencySiren();
      setPlayingLevel(null);
      return;
    }

    setPlayingLevel(level);
    if (level === 'CRITICAL') {
      playEmergencySiren();
    } else {
      playAlertSound(level);
      setTimeout(() => setPlayingLevel(null), 2000);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    const selectedGroup = broadcastGroups.find(g => g.id === selectedGroupId);
    // Payload matches the backend /api/alerts/broadcast contract
    // (BroadcastAlertPayload in backend/schemas.py)
    const payload = {
      broadcast_id: selectedGroupId,
      alert_type: severity === 'CRITICAL' ? 'EMERGENCY' : 'WARNING',
      zone: 'All Zones',
      hazard_type: 'Operational Alert',
      risk_level: severity,
      detected_value: 'N/A',
      threshold: 'N/A',
      trend: 'Stable',
      channels: { sms_enabled: true, email_enabled: true, dashboard_enabled: true },
      message_content: message,
      sender: 'System Administrator'
    };

    try {
      const res = await apiFetch(`/api/alerts/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      setStats({
        success: result.recipients_notified || (selectedGroup ? selectedGroup.recipient_count : 0),
        failed: 0
      });
      
      if (severity === 'CRITICAL') {
        broadcastEmergency(message);
      } else {
        playAlertSound(severity);
      }
      
      setStep(3); // Go to Sent screen
    } catch (err) {
      console.error(err);
      alert('Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const selectedGroup = broadcastGroups.find(g => g.id === selectedGroupId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-[#000000]/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-[#0B0F17] rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${
          severity === 'CRITICAL' ? 'bg-red-950/40 border-red-900/50' :
          severity === 'WARNING' ? 'bg-amber-950/40 border-amber-900/50' :
          severity === 'CAUTION' ? 'bg-yellow-950/40 border-yellow-900/50' :
          'bg-emerald-950/40 border-emerald-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              severity === 'CRITICAL' ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' :
              severity === 'WARNING' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
              severity === 'CAUTION' ? 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' :
              'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}>
              {severity === 'CRITICAL' ? <Flame className="w-6 h-6 text-white" /> : 
               severity === 'WARNING' ? <AlertTriangle className="w-6 h-6 text-black" /> :
               severity === 'CAUTION' ? <Bell className="w-6 h-6 text-black" /> :
               <CheckCircle2 className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className={`text-2xl font-bold uppercase tracking-widest font-mono ${
                severity === 'CRITICAL' ? 'text-red-500' :
                severity === 'WARNING' ? 'text-amber-500' :
                severity === 'CAUTION' ? 'text-yellow-500' :
                'text-emerald-500'
              }`}>
                Emergency Composer
              </h2>
              <p className="text-sm font-bold text-slate-400">TerraMesh AI Broadcast System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">1. Select Alert Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'CRITICAL', icon: ShieldAlert, label: 'Evacuation', color: 'red' },
                    { id: 'WARNING', icon: AlertTriangle, label: 'Warning', color: 'amber' },
                    { id: 'CAUTION', icon: Bell, label: 'Caution', color: 'yellow' },
                    { id: 'ALL_CLEAR', icon: CheckCircle2, label: 'All Clear', color: 'emerald' },
                  ].map(type => (
                    <div 
                      key={type.id}
                      onClick={() => setSeverity(type.id)}
                      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        severity === type.id 
                          ? `bg-${type.color}-950/30 border-${type.color}-500 shadow-lg shadow-${type.color}-900/20 scale-[1.02]` 
                          : 'bg-[#111827] border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <type.icon className={`w-8 h-8 ${severity === type.id ? `text-${type.color}-500` : 'text-slate-500'}`} />
                        <span className={`font-bold uppercase tracking-wider ${severity === type.id ? `text-${type.color}-400` : 'text-slate-400'}`}>{type.label}</span>
                      </div>
                      
                      {/* Sound toggle inline */}
                      <button 
                        onClick={(e) => handleTestSound(type.id, e)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
                          (playingLevel === type.id || (type.id === 'CRITICAL' && isSirenActive))
                            ? `bg-${type.color}-500 text-white animate-pulse` 
                            : 'bg-slate-800 text-slate-500 hover:text-white'
                        }`}
                        title="Preview Alarm Sound"
                      >
                        {(playingLevel === type.id || (type.id === 'CRITICAL' && isSirenActive)) ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">2. Target Audience</label>
                <div className="relative">
                  <select 
                    value={selectedGroupId} 
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl p-4 text-white font-bold text-lg appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="" disabled>Select a Broadcast Group...</option>
                    {broadcastGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.recipient_count} Recipients)</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <Users className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
                {selectedGroup && (
                  <div className="mt-3 flex gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
                      SMS: {selectedGroup.channels.sms_enabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
                      EMAIL: {selectedGroup.channels.email_enabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
                      DASHBOARD: {selectedGroup.channels.dashboard_enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Composer */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex justify-between">
                  <span>3. Alert Message</span>
                  <span className={`${message.length > 160 ? 'text-amber-500' : 'text-slate-500'}`}>{message.length} / 160 chars (SMS limit)</span>
                </label>
                <div className={`p-1 rounded-2xl border-2 transition-colors ${
                  severity === 'CRITICAL' ? 'bg-red-950/20 border-red-900/50 focus-within:border-red-500' :
                  severity === 'WARNING' ? 'bg-amber-950/20 border-amber-900/50 focus-within:border-amber-500' :
                  severity === 'CAUTION' ? 'bg-yellow-950/20 border-yellow-900/50 focus-within:border-yellow-500' :
                  'bg-emerald-950/20 border-emerald-900/50 focus-within:border-emerald-500'
                }`}>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-32 bg-transparent p-4 text-white font-mono text-lg resize-none focus:outline-none"
                    placeholder="Enter alert message..."
                  />
                  <div className="px-4 pb-3 flex gap-2">
                     {/* Suggestion Chips */}
                     <button onClick={() => setMessage(message + " Evacuate via Route A.")} className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">Evac via Route A</button>
                     <button onClick={() => setMessage(message + " Muster at Surface Station 1.")} className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">Muster at Surface</button>
                     <button onClick={() => setMessage(message + " Do NOT use heavy machinery.")} className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">Halt Machinery</button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-500 text-center">
              <ShieldAlert className={`w-24 h-24 mx-auto mb-6 ${
                severity === 'CRITICAL' ? 'text-red-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-pulse' :
                severity === 'WARNING' ? 'text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]' :
                severity === 'CAUTION' ? 'text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]' :
                'text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]'
              }`} />
              <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-widest mb-2">Confirm Dispatch</h2>
              <p className="text-slate-400 mb-10">You are about to broadcast a {severity} alert to {selectedGroup?.recipient_count || 0} personnel.</p>
              
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 text-left mb-10 inline-block w-full">
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payload Preview</div>
                 <div className="font-mono text-white text-lg border-l-4 border-cyan-500 pl-4 py-2 bg-slate-900/50">{message}</div>
              </div>

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel & Edit
                </button>
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className={`px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-xl transition-all ${
                    severity === 'CRITICAL' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50 hover:shadow-red-500/50 animate-pulse' :
                    severity === 'WARNING' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/50' :
                    severity === 'CAUTION' ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50' :
                    'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50'
                  }`}
                >
                  {isSending ? 'DISPATCHING...' : 'AUTHORIZE & DISPATCH'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-xl mx-auto py-12 animate-in zoom-in-95 duration-500 text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-widest mb-2">Alert Dispatched</h2>
              <p className="text-slate-400 mb-10">The broadcast has been successfully sent to the network.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
                  <div className="text-4xl font-bold font-mono text-emerald-400 mb-1">{stats?.success || 0}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delivered</div>
                </div>
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
                  <div className="text-4xl font-bold font-mono text-red-400 mb-1">{stats?.failed || 0}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Failed</div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}

        </div>

        {/* Footer for Step 1 */}
        {step === 1 && (
          <div className="p-6 border-t border-slate-800 bg-[#111827] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">System Ready</span>
            </div>
            
            <button 
              onClick={() => {
                if (!selectedGroupId) {
                  alert('Please select a target audience.');
                  return;
                }
                if (!message.trim()) {
                  alert('Please enter a message.');
                  return;
                }
                setStep(2);
              }}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-900/40 flex items-center gap-2"
            >
              Review Alert <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
