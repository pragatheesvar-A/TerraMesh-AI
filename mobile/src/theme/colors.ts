/**
 * Theme — industrial command-center dark palette.
 * Matches the React web frontend's design tokens.
 */
export const COLORS = {
  // Surfaces
  BG: '#070B12',
  SURFACE: '#0D1524',
  SURFACE_ELEVATED: '#131E33',
  BORDER: '#1E293B',
  BORDER_SUBTLE: '#152236',

  // Text
  TEXT_PRIMARY: '#F1F5F9',
  TEXT_SECONDARY: '#CBD5E1',
  TEXT_MUTED: '#94A3B8',
  TEXT_FAINT: '#64748B',

  // Accent
  ACCENT: '#22D3EE',
  ACCENT_DIM: 'rgba(34, 211, 238, 0.12)',
  ACCENT_BORDER: 'rgba(34, 211, 238, 0.35)',

  // Status
  SAFE: '#10B981',
  SAFE_DIM: 'rgba(16, 185, 129, 0.12)',
  WARNING: '#F59E0B',
  WARNING_DIM: 'rgba(245, 158, 11, 0.12)',
  CRITICAL: '#EF4444',
  CRITICAL_DIM: 'rgba(239, 68, 68, 0.12)',
  CAUTION: '#EAB308',
  INFO: '#38BDF8',
  OFFLINE: '#64748B',

  // Emergency
  EVACUATE: '#DC2626',
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
} as const;

export const RADIUS = {
  SM: 4,
  MD: 6,
  LG: 8,
  XL: 12,
  FULL: 999,
} as const;

export const FONT_SIZE = {
  CAPTION: 10,
  MICRO: 11,
  SMALL: 13,
  BODY: 15,
  LARGE: 18,
  XL: 22,
  DISPLAY: 32,
  HERO: 42,
} as const;
