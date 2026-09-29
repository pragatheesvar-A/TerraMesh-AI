import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, ChevronRight, ChevronLeft, Save, Users, Smartphone, Mail, LayoutDashboardIcon, User, Filter } from 'lucide-react';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';

const MOCK_USERS = [
  { id: '1', name: 'Arun Kumar', role: 'Worker', zone: 'Panel B3', phone: '+919876543210' },
  { id: '2', name: 'Ravi Kumar', role: 'Worker', zone: 'Panel B3', phone: '+919876543211' },
  { id: '3', name: 'Suresh Kumar', role: 'Supervisor', zone: 'Panel B', phone: '+919876543212' },
  { id: '4', name: 'Anita Desai', role: 'Safety', zone: 'Surface', phone: '+919876543213' },
  { id: '5', name: 'Rajan P', role: 'Emergency', zone: 'All', phone: '+919876543214' },
  { id: '6', name: 'Deepak M', role: 'Worker', zone: 'Panel C1', phone: '+919876543215' },
  { id: '7', name: 'Vikram Singh', role: 'Supervisor', zone: 'Panel C1', phone: '+919876543216' },
  { id: '8', name: 'Priya T', role: 'Management', zone: 'HQ', phone: '+919876543217' },
];

export default function BroadcastGroupModal({ isOpen, onClose, broadcastId, onSaved }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channels, setChannels] = useState({ sms: true, email: true, dashboard: true });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  
  // Step 2 Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (broadcastId) {
        apiFetch(`/api/broadcasts/${broadcastId}`, {
          headers: { 'X-API-Key': getApiKey() }
        })
        .then(res => res.json())
        .then(data => {
          setName(data.name);
          setDescription(data.description || '');
          setChannels({ 
            sms: data.channels.sms_enabled, 
            email: data.channels.email_enabled, 
            dashboard: data.channels.dashboard_enabled 
          });
          
          if (data.recipients && data.recipients.length > 0) {
            const selectedSet = new Set();
            data.recipients.forEach(r => {
              const matchedUser = MOCK_USERS.find(mu => mu.phone === r.user_id);
              if (matchedUser) selectedSet.add(matchedUser.id);
            });
            setSelectedUsers(selectedSet);
          } else {
            setSelectedUsers(new Set());
          }
        })
        .catch(err => console.error(err));
      } else {
        setName('');
        setDescription('');
        setChannels({ sms: true, email: true, dashboard: true });
        setSelectedUsers(new Set());
      }
    }
  }, [isOpen, broadcastId]);

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(u => {
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.zone.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, roleFilter]);

  const handleToggleUser = (id) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const handleSelectAll = () => {
    if (filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id))) {
      // deselect all visible
      const next = new Set(selectedUsers);
      filteredUsers.forEach(u => next.delete(u.id));
      setSelectedUsers(next);
    } else {
      // select all visible
      const next = new Set(selectedUsers);
      filteredUsers.forEach(u => next.add(u.id));
      setSelectedUsers(next);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Map selected users back to recipient schema
    const recipients = Array.from(selectedUsers).map(id => {
      const u = MOCK_USERS.find(mu => mu.id === id);
      return { user_id: u.phone, role: u.role };
    });

    const payload = {
      id: broadcastId || null,
      name,
      description,
      status: "ACTIVE",
      channels: {
        sms_enabled: channels.sms,
        email_enabled: channels.email,
        dashboard_enabled: channels.dashboard
      },
      recipients
    };

    try {
      const res = await apiFetch(`/api/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save group', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm cursor-pointer" onClick={onClose}></div>
      
      <div className="relative w-full max-w-3xl bg-[#0B0F17] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#111827]">
          <div>
            <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              {broadcastId ? 'Edit Broadcast' : 'Create Broadcast'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure recipient group for TerraMesh AI alerts</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex px-8 py-4 border-b border-slate-800/60 bg-[#0B0F17]">
          {['GROUP', 'RECIPIENTS', 'CHANNELS', 'PREVIEW'].map((lbl, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={lbl} className="flex-1 flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 border-2 transition-colors ${isActive ? 'bg-cyan-900 border-cyan-400 text-cyan-400' : isCompleted ? 'bg-emerald-900 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : `0${stepNum}`}
                </div>
                <div className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>{lbl}</div>
                {idx < 3 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${isCompleted ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadcast Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Underground Workers"
                  className="w-full bg-[#111827] border border-slate-700 p-4 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Personnel assigned to underground areas"
                  className="w-full bg-[#111827] border border-slate-700 p-4 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Type</label>
                  <div className="bg-[#111827] border border-slate-700 rounded-xl p-1 flex">
                    <button className="flex-1 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg cursor-pointer">Custom</button>
                    <button className="flex-1 py-2 text-sm font-bold text-slate-500 cursor-pointer">Role-based</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <div className="bg-[#111827] border border-slate-700 rounded-xl p-1 flex">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-emerald-400 bg-emerald-950/30 rounded-lg border border-emerald-900/50 cursor-default">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-6 h-full">
                
                {/* Left: Recipient Selector */}
                <div className="flex-1 flex flex-col h-full bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 bg-[#0B0F17]">
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search people, roles, zones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-700 pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Worker', 'Supervisor', 'Safety', 'Emergency', 'Management'].map(role => (
                        <button
                          key={role}
                          onClick={() => setRoleFilter(role)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${roleFilter === role ? 'bg-cyan-900 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-[#0B0F17]/50">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="hidden" checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id))} onChange={handleSelectAll} />
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id)) ? 'bg-cyan-500 border-cyan-500' : 'bg-[#111827] border-slate-600 group-hover:border-slate-400'}`}>
                        {filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id)) && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <span className="text-xs text-slate-300 font-bold">Select all visible</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">{filteredUsers.length} shown</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredUsers.map(user => (
                      <label key={user.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer group ${selectedUsers.has(user.id) ? 'bg-cyan-950/20 border-cyan-900/50' : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'}`}>
                        <input type="checkbox" className="hidden" checked={selectedUsers.has(user.id)} onChange={() => handleToggleUser(user.id)} />
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${selectedUsers.has(user.id) ? 'bg-cyan-500 border-cyan-500' : 'bg-[#111827] border-slate-600 group-hover:border-slate-400'}`}>
                          {selectedUsers.has(user.id) && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm">{user.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role} &bull; {user.zone}</div>
                        </div>
                        <div className="text-xs font-mono text-slate-500">{user.phone.replace(/(\+\d{2})(\d{4})(\d{4})/, '$1 •••• $3')}</div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right: Sticky Summary */}
                <div className="w-64 bg-[#111827] border border-slate-800 rounded-xl p-5 h-fit sticky top-0 flex flex-col shadow-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected</div>
                  <div className="text-4xl font-mono font-bold text-cyan-400 mb-6">{selectedUsers.size}</div>

                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>Workers</span>
                        <span className="font-mono text-cyan-400">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Worker').length}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>Supervisors</span>
                        <span className="font-mono text-cyan-400">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Supervisor').length}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>Safety</span>
                        <span className="font-mono text-cyan-400">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Safety').length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Estimated Reach</div>
                     <div className="flex justify-between text-xs font-mono text-slate-400"><span>SMS</span> <span className="text-white">{selectedUsers.size}</span></div>
                     <div className="flex justify-between text-xs font-mono text-slate-400"><span>EMAIL</span> <span className="text-white">{selectedUsers.size}</span></div>
                     <div className="flex justify-between text-xs font-mono text-slate-400"><span>DASHBOARD</span> <span className="text-white">{selectedUsers.size}</span></div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Delivery Channels</h3>
                <p className="text-sm text-slate-400">How should alerts be delivered to this group?</p>
              </div>

              <div className="space-y-4">
                <label className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all cursor-pointer ${channels.sms ? 'bg-cyan-950/20 border-cyan-500/50' : 'bg-[#111827] border-slate-800 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${channels.sms ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">SMS</div>
                      <div className="text-xs text-slate-400">Immediate mobile notification</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${channels.sms ? 'text-cyan-400' : 'text-slate-500'}`}>{channels.sms ? 'ON' : 'OFF'}</span>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${channels.sms ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${channels.sms ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </div>
                  {/* Invisible checkbox for accessibility/logic */}
                  <input type="checkbox" className="hidden" checked={channels.sms} onChange={(e) => setChannels({...channels, sms: e.target.checked})} />
                </label>

                <label className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all cursor-pointer ${channels.email ? 'bg-cyan-950/20 border-cyan-500/50' : 'bg-[#111827] border-slate-800 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${channels.email ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">EMAIL</div>
                      <div className="text-xs text-slate-400">Detailed emergency information</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${channels.email ? 'text-cyan-400' : 'text-slate-500'}`}>{channels.email ? 'ON' : 'OFF'}</span>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${channels.email ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${channels.email ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </div>
                  <input type="checkbox" className="hidden" checked={channels.email} onChange={(e) => setChannels({...channels, email: e.target.checked})} />
                </label>

                <label className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all cursor-pointer ${channels.dashboard ? 'bg-cyan-950/20 border-cyan-500/50' : 'bg-[#111827] border-slate-800 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${channels.dashboard ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <LayoutDashboardIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">DASHBOARD</div>
                      <div className="text-xs text-slate-400">Real-time TerraMesh notification</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${channels.dashboard ? 'text-cyan-400' : 'text-slate-500'}`}>{channels.dashboard ? 'ON' : 'OFF'}</span>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${channels.dashboard ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${channels.dashboard ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </div>
                  <input type="checkbox" className="hidden" checked={channels.dashboard} onChange={(e) => setChannels({...channels, dashboard: e.target.checked})} />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Broadcast Preview</h3>
                <p className="text-sm text-slate-400">Review configuration before saving.</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-cyan-950/30 to-transparent">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold font-mono text-white uppercase tracking-wide">{name || 'Unnamed Broadcast'}</h2>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 flex items-center gap-3 shadow-inner">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xl font-bold text-white font-mono leading-none">{selectedUsers.size}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-widest">Recipients</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Audience Breakdown</div>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-bold">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Worker').length} Workers</span>
                       <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-bold">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Supervisor').length} Supervisors</span>
                       <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-bold">{Array.from(selectedUsers).filter(id => MOCK_USERS.find(u => u.id === id).role === 'Safety').length} Safety</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enabled Channels</div>
                    <div className="flex items-center gap-4">
                       {channels.sms && <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-cyan-400"/><span className="text-sm font-bold text-white">SMS</span></div>}
                       {channels.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-400"/><span className="text-sm font-bold text-white">EMAIL</span></div>}
                       {channels.dashboard && <div className="flex items-center gap-2"><LayoutDashboardIcon className="w-4 h-4 text-cyan-400"/><span className="text-sm font-bold text-white">DASHBOARD</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-[#111827] flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {step > 1 ? <><ChevronLeft className="w-4 h-4"/> Back</> : 'Cancel'}
          </button>
          
          <button 
            onClick={() => {
              if (step < 4) setStep(step + 1);
              else handleSave();
            }}
            disabled={!name && step === 1}
            className={`px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
              !name && step === 1 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : step === 4 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40' 
                  : 'bg-white hover:bg-slate-200 text-black'
            }`}
          >
            {isSaving ? (
              <><div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin"></div> Saving...</>
            ) : step === 4 ? (
              <><Save className="w-4 h-4" /> {broadcastId ? 'Update Group' : 'Create Group'}</>
            ) : (
              <>Next Step <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
