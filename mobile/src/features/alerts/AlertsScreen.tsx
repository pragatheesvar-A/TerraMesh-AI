/**
 * Alerts screen — sorted by severity with acknowledge action.
 * Critical alerts stand out; warnings are distinct but less aggressive.
 */
import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { SectionHeader, EmptyState, LoadingState } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { AlertItem } from '../../types/models';

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, DANGER: 1, WARNING: 2, CAUTION: 3, INFO: 4 };

function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL': case 'DANGER': return COLORS.CRITICAL;
    case 'WARNING': return COLORS.WARNING;
    case 'CAUTION': case 'WATCH': return COLORS.CAUTION;
    default: return COLORS.INFO;
  }
}

export function AlertsScreen({ navigation }: { navigation: any }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 5) - (SEVERITY_RANK[b.severity] ?? 5)));
    } catch { /* offline */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);

  const acknowledge = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    try { await api.acknowledgeAlert(alertId); } catch { /* best-effort */ }
  }, []);

  const renderAlert = useCallback(({ item }: { item: AlertItem }) => {
    const color = severityColor(item.severity);
    const isCritical = item.severity === 'CRITICAL' || item.severity === 'DANGER';
    return (
      <TouchableOpacity
        style={[st.card, isCritical && { borderLeftColor: color, borderLeftWidth: 3 }]}
        onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
        accessibilityLabel={`${item.severity} alert: ${item.title}`}
      >
        <View style={st.header}>
          <Text style={[st.severity, { color }]}>{item.severity}</Text>
          {item.provenance ? <ProvenanceBadge label={item.provenance} compact /> : null}
        </View>
        <Text style={[st.title, item.acknowledged && { opacity: 0.5 }]}>{item.title}</Text>
        <Text style={st.meta}>{item.zone} · {item.timestamp}</Text>
        {!item.acknowledged ? (
          <TouchableOpacity style={st.ackButton} onPress={() => acknowledge(item.id)}>
            <Text style={st.ackText}>Acknowledge</Text>
          </TouchableOpacity>
        ) : (
          <Text style={st.acked}>✓ Acknowledged</Text>
        )}
      </TouchableOpacity>
    );
  }, [acknowledge, navigation]);

  if (loading) return <LoadingState label="Loading alerts..." />;

  const unacked = alerts.filter(a => !a.acknowledged);

  return (
    <View style={st.root}>
      <FlatList
        data={alerts}
        keyExtractor={a => a.id}
        renderItem={renderAlert}
        contentContainerStyle={st.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
        ListEmptyComponent={
          <EmptyState
            title="No active alerts"
            subtitle="All monitored parameters within safety thresholds."
            icon="✓"
          />
        }
        ListHeaderComponent={
          unacked.length > 0 ? <SectionHeader title={`${unacked.length} unacknowledged`} /> : null
        }
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.LG },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  severity: { fontSize: FONT_SIZE.MICRO, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 2 },
  meta: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_MUTED, marginBottom: SPACING.SM },
  ackButton: {
    alignSelf: 'flex-start', paddingHorizontal: SPACING.MD, paddingVertical: 4,
    borderRadius: RADIUS.SM, borderWidth: 1, borderColor: COLORS.ACCENT_BORDER,
  },
  ackText: { fontSize: FONT_SIZE.MICRO, color: COLORS.ACCENT, fontWeight: '600' },
  acked: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_FAINT },
});
