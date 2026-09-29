import React from 'react';

/**
 * DataBadge — Data Provenance Label Component
 * ============================================
 * Per system principles, all data in the TerraMesh UI must be clearly labeled
 * to distinguish its origin. This component renders a small, colored badge.
 *
 * Variants:
 *   measured    — MEASURED DATA (physical sensor reading)
 *   model       — MODEL OUTPUT (XGBoost, Isolation Forest, Forecaster, Kalman)
 *   simulation  — SIMULATION (synthetic packets, demo scenario injection)
 *   satellite   — SATELLITE OBSERVATION (InSAR / Sentinel-1)
 *   engineering — ENGINEERING CALCULATION (Sheorey/NCB physics)
 *   operator    — OPERATOR ACTION (manual alert, evacuation trigger)
 */

const BADGE_CONFIG = {
  measured: {
    label: 'MEASURED DATA',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    text: '#10b981',
    dot: '#10b981',
    tooltip: 'Raw physical sensor reading from hardware node',
  },
  model: {
    label: 'MODEL OUTPUT',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    text: '#3b82f6',
    dot: '#3b82f6',
    tooltip: 'Output from AI/ML model inference (XGBoost, Isolation Forest, Forecaster)',
  },
  simulation: {
    label: 'SIMULATION',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#f59e0b',
    dot: '#f59e0b',
    tooltip: 'Synthetically generated data for demonstration or testing',
  },
  satellite: {
    label: 'SATELLITE OBS.',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.4)',
    text: '#8b5cf6',
    dot: '#8b5cf6',
    tooltip: 'Remote sensing data from satellite observation (InSAR / Sentinel-1)',
  },
  engineering: {
    label: 'ENG. CALCULATION',
    bg: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.4)',
    text: '#14b8a6',
    dot: '#14b8a6',
    tooltip: 'Result of physics-based engineering formula (Sheorey/NCB subsidence model)',
  },
  operator: {
    label: 'OPERATOR ACTION',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    text: '#f97316',
    dot: '#f97316',
    tooltip: 'Action initiated by a human operator (manual alert, evacuation trigger)',
  },
};

export default function DataBadge({ variant = 'model', className = '', style = {} }) {
  const cfg = BADGE_CONFIG[variant] || BADGE_CONFIG.model;

  return (
    <span
      title={cfg.tooltip}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 7px',
        borderRadius: '4px',
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: cfg.text,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        userSelect: 'none',
        cursor: 'help',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
          boxShadow: `0 0 4px ${cfg.dot}`,
        }}
      />
      {cfg.label}
    </span>
  );
}
