import React, { useState } from 'react';
import {
  ShieldAlert, Mail, Lock, Key, ChevronRight, AlertCircle,
  Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles, Activity
} from 'lucide-react';
import { useAuth, ADMIN_ACCOUNTS } from '../../context/AuthContext';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@terramesh.gov.in');
  const [password, setPassword] = useState('admin');
  const [role, setRole] = useState('Chief Mine Safety Controller');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    const result = await login(email, password, role);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMessage(result.error || 'Invalid email or password. Access Denied.');
    }
    setIsLoading(false);
  };

  const handleSelectAccount = (account) => {
    setEmail(account.email);
    setPassword('admin');
    setRole(account.role);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #030608 0%, #060C17 40%, #080E1C 100%)' }}
    >
      {/* Dot-grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Radial glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] pointer-events-none -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px pointer-events-none animate-scan-down opacity-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }} />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Header brand block */}
        <div className="text-center mb-7 animate-fade-in-up">
          {/* Icon with rotating ring */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 rounded-full border border-cyan-400/20 animate-soft-pulse" />
            <div className="absolute w-16 h-16 rounded-full border border-cyan-400/10" style={{ animation: 'rotateGlow 8s linear infinite' }} />
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center animate-float"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%)',
                border: '1px solid rgba(0,212,255,0.35)',
                boxShadow: '0 0 24px rgba(0,212,255,0.18), inset 0 1px 0 rgba(0,212,255,0.2)'
              }}
            >
              <ShieldAlert className="w-8 h-8" style={{ color: '#00D4FF' }} />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
            TERRA<span style={{ color: '#00D4FF' }}>MESH</span> <span className="text-slate-300">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
            Mine Subsidence Early Warning &amp; Safety Command Center
          </p>

          {/* SIH badge */}
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-[10px] font-bold"
            style={{
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#94a3b8'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
            <span style={{ color: '#00D4FF' }}>SMART INDIA HACKATHON 2026</span>
            <span className="text-slate-600">•</span>
            <span style={{ color: '#F59E0B' }}>SIH26025</span>
          </div>
        </div>

        {/* Login card */}
        <div className="relative rounded-2xl overflow-hidden animate-fade-in-up stagger-1"
          style={{
            background: 'linear-gradient(135deg, rgba(11,18,32,0.95) 0%, rgba(15,26,46,0.95) 100%)',
            border: '1px solid rgba(26,40,68,0.9)',
            boxShadow: '0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6) 50%, transparent)' }} />

          <div className="p-6">
            {/* Card header */}
            <div className="flex items-center justify-between pb-3.5 mb-4"
              style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}
            >
              <span className="text-xs font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" style={{ color: '#00D4FF' }} />
                Secure Admin Portal
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#10B981' }}>
                <span className="live-dot bg-emerald-400" style={{ width: 7, height: 7 }} />
                PORTAL ACTIVE
              </span>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5 animate-fade-in-down text-xs"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5'
                }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300 text-[11px]">Authentication Failed</p>
                  <p className="text-[10px] text-red-300/80 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {isSuccess && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2.5 animate-fade-in-scale text-xs"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#6ee7b7'
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-[11px]">Authorization confirmed — entering command center...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="animate-fade-in-up stagger-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    placeholder="admin@terramesh.gov.in"
                    className="input-glow w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(5,10,20,0.8)',
                      border: errorMessage ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(30,48,72,0.9)',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="animate-fade-in-up stagger-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    placeholder="Enter administrator password"
                    className="input-glow w-full pl-9 pr-10 py-2.5 rounded-xl text-white placeholder-slate-600 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(5,10,20,0.8)',
                      border: errorMessage ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(30,48,72,0.9)',
                      fontSize: '13px'
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="animate-fade-in-up stagger-4">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Command Role & Clearance
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-glow w-full p-2.5 rounded-xl text-white outline-none cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(5,10,20,0.8)',
                    border: '1px solid rgba(30,48,72,0.9)',
                    fontSize: '13px'
                  }}
                >
                  <option value="Chief Mine Safety Controller">Chief Mine Safety Controller (Level 5)</option>
                  <option value="Principal Geotechnical Engineer">Principal Geotechnical Engineer (Level 4)</option>
                  <option value="Emergency Response Commander">Emergency Response Commander (Level 5)</option>
                  <option value="Safety Auditor">Safety Auditor (Level 5 Audit)</option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="btn-press w-full py-3 rounded-xl font-black text-[13px] tracking-wider flex items-center justify-center gap-2 mt-1 cursor-pointer relative overflow-hidden group transition-all duration-200"
                style={{
                  background: isLoading || isSuccess
                    ? 'rgba(0,180,216,0.4)'
                    : 'linear-gradient(135deg, #00C4EE 0%, #0097B2 100%)',
                  color: '#020c14',
                  boxShadow: isLoading || isSuccess ? 'none' : '0 0 28px rgba(0,212,255,0.35), 0 4px 16px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(0,212,255,0.4)'
                }}
              >
                {/* Shimmer on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', transform: 'skewX(-20deg)' }}
                />
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900/50 border-t-slate-900 rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>ENTER COMMAND CENTER</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick accounts */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Evaluator Quick Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_ACCOUNTS.map((acc) => {
                  const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className="btn-press p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer relative overflow-hidden"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,212,255,0.04) 100%)'
                          : 'rgba(5,10,20,0.6)',
                        border: isSelected ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(30,48,72,0.8)',
                        boxShadow: isSelected ? '0 0 12px rgba(0,212,255,0.1)' : 'none'
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-px"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }} />
                      )}
                      <div className="text-[11px] font-bold truncate" style={{ color: isSelected ? '#00D4FF' : '#94a3b8' }}>
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate mt-0.5">{acc.email}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3) 50%, transparent)' }} />
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-[10px] text-slate-600 animate-fade-in-up stagger-4">
          Coal Mines Regulations 2017 &bull; Real-time IoT Telemetry &bull; AI Subsidence Prediction
        </div>
      </div>
    </div>
  );
}
