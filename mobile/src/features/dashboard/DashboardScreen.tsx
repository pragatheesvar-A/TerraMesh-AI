/**
 * Dashboard screen — operational mobile dashboard.
 * Prioritizes risk → alerts → zones → evacuation.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useWebSocket } from '../../hooks/useWebSocket';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { MetricCard, SectionHeader, StatusBadge, ConnectionIndicator, EmptyState, LoadingState, OfflineBanner } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { DashboardOverview, AlertItem, SensorNode, ConnectionState } from '../../types/models';

export function DashboardScreen({ navigation }: { navigation: any }) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>('OFFLINE');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ov, sn, al] = await Promise.all([
        api.getDashboardOverview(),
        api.getSensors(),
        api.getAlerts(),
      ]);
      setOverview(ov); setSensors(sn); setAlerts(al);
      setLastSync(new Date());
    } catch {
      // Offline — keep cached data
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  // WebSocket for live updates
  const ws = useWebSocket(
    useCallback((msg: Record<string, unknown>) => {
      if (msg.type === 'STATE_UPDATE' || msg.type === 'CONNECTED') fetchData();
      if (msg.type === 'ALERT_NEW' && msg.data) {
        setAlerts(prev => [msg.data as AlertItem, ...prev]);
      }
      if (msg.type === 'SENSOR_UPDATE' && msg.overview) {
        setOverview(msg.overview as DashboardOverview);
      }
    }, [fetchData]),
    useCallback((s: ConnectionState) => setConnection(s), []),
  );

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState label="Loading mine status..." />;

  const risk = overview?.risk_intelligence;
  const ev = overview?.evacuation;
  const unackedAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = unackedAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'DANGER');
  const offlineSensors = sensors.filter(s => s.status === 'OFFLINE' || s.status === 'STALE');

  const riskColor = !risk ? COLORS.TEXT_PRIMARY :
    risk.risk_level === 'CRITICAL' ? COLORS.CRITICAL :
    risk.risk_level === 'WARNING' ? COLORS.WARNING : COLORS.SAFE;

  return (
    <View style={s.root}>
      {connection === 'OFFLINE' && <OfflineBanner lastSync={lastSync ?? undefined} />}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.ACCENT} />}
      >
        {/* Header row */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>TerraMesh AI</Text>
            <Text style={s.subtitle}>Mine Safety Command Center</Text>
          </View>
          <ConnectionIndicator state={connection} />
        </View>

        {/* Risk card */}
        {risk && (
          <View style={s.riskCard}>
            <View style={s.riskHeader}>
              <Text style={s.riskLabel}>CURRENT RISK</Text>
              <ProvenanceBadge label={risk.provenance || 'MODEL OUTPUT'} />
            </View>
            <View style={s.riskRow}>
              <Text style={[s.riskValue, { color: riskColor }]}>{risk.current_risk_score.toFixed(0)}</Text>
              <Text style={s.riskUnit}>/ 100</Text>
              <View style={{ flex: 1 }} />
              <View style={[s.riskLevel, { borderColor: `${riskColor}44`, backgroundColor: `${riskColor}15` }]}>
                <Text style={[s.riskLevelText, { color: riskColor }]}>{risk.risk_level}</Text>
              </View>
            </View>
            <Text style={s.riskPrediction} numberOfLines={2}>{risk.prediction}</Text>
            <Text style={s.riskMeta}>
              Trend: {risk.trend_percentage >= 0 ? '+' : ''}{risk.trend_percentage}% · Confidence: {risk.ai_confidence}%
            </Text>
          </View>
        )}

        {/* KPI row */}
        <View style={s.kpiRow}>
          <MetricCard label="Alerts" value={unackedAlerts.length} status={criticalAlerts.length > 0 ? 'CRITICAL' : undefined}
            onPress={() => navigation.navigate('Alerts')} />
          <MetricCard label="Sensors" value={`${sensors.length - offlineSensors.length}/${sensors.length}`}
            status={offlineSensors.length > 0 ? 'WARNING' : undefined}
            onPress={() => navigation.navigate('Sensors')} />
          <MetricCard label="Workers" value={overview?.kpis?.monitored_workers_total ?? '—'}
            onPress={() => navigation.navigate('Workers')} />
        </View>

        {/* Critical alert strip */}
        {criticalAlerts.length > 0 && (
          <>
            <SectionHeader title={`Critical Alerts (${criticalAlerts.length})`} />
            {criticalAlerts.slice(0, 2).map(alert => (
              <View key={alert.id} style={[s.alertCard, { borderLeftColor: COLORS.CRITICAL, borderLeftWidth: 3 }]}>
                <Text style={s.alertTitle}>{alert.title}</Text>
                <Text style={s.alertMeta}>{alert.zone} · {alert.timestamp}</Text>
              </View>
            ))}
          </>
        )}

        {/* Zones */}
        <SectionHeader title="Zones" />
        {(overview?.kpis?.critical_zones_count as number) > 0 && (
          <View style={s.zoneCard}>
            <Text style={[s.zoneStatus, { color: COLORS.CRITICAL }]}>
              {(overview?.kpis?.critical_zones_count) as number} critical zones require immediate attention
            </Text>
          </View>
        )}

        {/* Evacuation */}
        {ev && (
          <>
            <SectionHeader title="Evacuation Status" />
            <View style={s.riskCard}>
              <View style={s.riskHeader}>
                <Text style={s.riskLabel}>{ev.target_zone}</Text>
                <ProvenanceBadge label={ev.personnel_provenance || 'SIMULATION'} compact />
              </View>
              <Text style={[s.riskPrediction, { fontWeight: '600' }]}>{ev.recommended_action}</Text>
              <Text style={s.riskMeta}>{ev.workers_at_risk} workers at risk</Text>
              <StatusBadge status={ev.zone_status} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  scroll: { flex: 1 },
  content: { padding: SPACING.LG },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.LG },
  title: { fontSize: FONT_SIZE.LARGE, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  subtitle: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_MUTED },
  riskCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.LG,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginBottom: SPACING.MD,
  },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.SM },
  riskLabel: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700', color: COLORS.TEXT_MUTED, letterSpacing: 1.2 },
  riskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.XS },
  riskValue: { fontSize: FONT_SIZE.HERO, fontWeight: '300' },
  riskUnit: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED, marginLeft: 4 },
  riskLevel: { paddingHorizontal: SPACING.MD, paddingVertical: 4, borderRadius: RADIUS.MD, borderWidth: 1 },
  riskLevelText: { fontSize: FONT_SIZE.SMALL, fontWeight: '700' },
  riskPrediction: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  riskMeta: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_MUTED },
  kpiRow: { flexDirection: 'row', gap: SPACING.SM, marginBottom: SPACING.LG },
  alertCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  alertTitle: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 2 },
  alertMeta: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_MUTED },
  zoneCard: {
    backgroundColor: COLORS.CRITICAL_DIM, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: `${COLORS.CRITICAL}44`,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  zoneStatus: { fontSize: FONT_SIZE.SMALL, fontWeight: '600' },
});
