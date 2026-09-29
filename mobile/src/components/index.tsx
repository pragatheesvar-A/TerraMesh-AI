/**
 * Reusable UI components — TerraMesh mobile design system.
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../theme/colors';
import { ProvenanceBadge } from './ProvenanceBadge';

// ── StatusBadge ───────────────────────────────────────────────────────────
export function StatusBadge({ status, color }: { status: string; color?: string }) {
  const c = color || statusColor(status);
  return (
    <View style={[st.badge, { borderColor: `${c}44`, backgroundColor: `${c}18` }]}>
      <View style={[st.dot, { backgroundColor: c }]} />
      <Text style={[st.badgeText, { color: c }]}>{status}</Text>
    </View>
  );
}

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('CRITICAL') || s.includes('DANGER') || s.includes('EVACUATE')) return COLORS.CRITICAL;
  if (s.includes('WARNING') || s.includes('CAUTION')) return COLORS.WARNING;
  if (s.includes('OFFLINE') || s.includes('STALE')) return COLORS.OFFLINE;
  return COLORS.SAFE;
}

// ── SectionHeader ──────────────────────────────────────────────────────────
export function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={st.sectionHeader}>{title}</Text>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: string;
  provenance?: string;
  onPress?: () => void;
}

export function MetricCard({ label, value, unit, status, provenance, onPress }: MetricCardProps) {
  const color = status ? statusColor(status) : COLORS.TEXT_PRIMARY;
  return (
    <TouchableOpacity style={st.card} onPress={onPress} disabled={!onPress}>
      <Text style={st.metricLabel}>{label}</Text>
      <View style={st.metricRow}>
        <Text style={[st.metricValue, { color }]}>{value}</Text>
        {unit ? <Text style={st.metricUnit}> {unit}</Text> : null}
      </View>
      {status ? <StatusBadge status={status} /> : null}
      {provenance ? <ProvenanceBadge label={provenance} compact /> : null}
    </TouchableOpacity>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle, icon = '✓' }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <View style={st.emptyState}>
      <Text style={st.emptyIcon}>{icon}</Text>
      <Text style={st.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={st.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ── ErrorState ─────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={st.emptyState}>
      <Text style={st.emptyIcon}>⚠</Text>
      <Text style={st.emptyTitle}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={st.retryButton} onPress={onRetry}>
          <Text style={st.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── LoadingState ───────────────────────────────────────────────────────────
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={st.emptyState}>
      <ActivityIndicator size="large" color={COLORS.ACCENT} />
      <Text style={st.emptySubtitle}>{label}</Text>
    </View>
  );
}

// ── ConnectionIndicator ────────────────────────────────────────────────────
export function ConnectionIndicator({ state }: { state: string }) {
  const color = state === 'ONLINE' ? COLORS.SAFE : state === 'RECONNECTING' ? COLORS.INFO : COLORS.OFFLINE;
  const label = state === 'ONLINE' ? 'LIVE' : state === 'RECONNECTING' ? 'RECONNECTING' : 'OFFLINE';
  return (
    <View style={st.connectionRow}>
      <View style={[st.connectionDot, { backgroundColor: color }]} />
      <Text style={[st.connectionText, { color }]}>{label}</Text>
    </View>
  );
}

// ── OfflineBanner ──────────────────────────────────────────────────────────
export function OfflineBanner({ lastSync }: { lastSync?: Date }) {
  return (
    <View style={st.offlineBanner}>
      <Text style={st.offlineText}>
        OFFLINE — cached data{lastSync ? ` (as of ${lastSync.toLocaleTimeString()})` : ''}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.SM, borderWidth: 0.5, alignSelf: 'flex-start',
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 4 },
  badgeText: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700', letterSpacing: 0.4 },
  sectionHeader: {
    fontSize: FONT_SIZE.MICRO, fontWeight: '700',
    color: COLORS.TEXT_MUTED, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: SPACING.SM,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  metricLabel: {
    fontSize: FONT_SIZE.CAPTION, fontWeight: '600',
    color: COLORS.TEXT_MUTED, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 4,
  },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  metricValue: { fontSize: FONT_SIZE.DISPLAY, fontWeight: '300' },
  metricUnit: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED, marginLeft: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XXL },
  emptyIcon: { fontSize: 48, color: COLORS.TEXT_FAINT, marginBottom: SPACING.MD },
  emptyTitle: { fontSize: FONT_SIZE.BODY, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  emptySubtitle: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED, textAlign: 'center' },
  retryButton: {
    marginTop: SPACING.LG, paddingHorizontal: SPACING.XL, paddingVertical: SPACING.SM,
    borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.ACCENT_BORDER,
  },
  retryText: { color: COLORS.ACCENT, fontWeight: '600' },
  connectionRow: { flexDirection: 'row', alignItems: 'center' },
  connectionDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  connectionText: { fontSize: FONT_SIZE.MICRO, fontWeight: '700', letterSpacing: 0.5 },
  offlineBanner: {
    backgroundColor: '#7C2D12', paddingHorizontal: SPACING.LG, paddingVertical: 6,
  },
  offlineText: { color: '#FFF', fontSize: FONT_SIZE.MICRO, fontWeight: '600', textAlign: 'center' },
});
