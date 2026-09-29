/**
 * Sensors screen — live sensor list with status, battery, signal.
 * Distinguishes sensor HEALTH from mine physical RISK.
 */
import React, { useState, useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, StyleSheet, RefreshControl, View } from 'react-native';
import { api } from '../../api/client';
import { useWebSocket } from '../../hooks/useWebSocket';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { LoadingState, EmptyState, StatusBadge } from '../../components';
import type { SensorNode, ConnectionState } from '../../types/models';

function sensorStatusColor(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('CRITICAL') || s.includes('DANGER')) return COLORS.CRITICAL;
  if (s.includes('WARNING') || s.includes('CAUTION')) return COLORS.WARNING;
  if (s.includes('OFFLINE') || s.includes('STALE')) return COLORS.OFFLINE;
  return COLORS.SAFE;
}

export function SensorsScreen({ navigation }: { navigation: any }) {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setConnection] = useState<ConnectionState>('OFFLINE');

  const fetch = useCallback(async () => {
    try { setSensors(await api.getSensors()); } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const ws = useWebSocket(
    useCallback((msg: Record<string, unknown>) => {
      if (msg.type === 'STATE_UPDATE' || msg.type === 'CONNECTED') fetch();
      if (msg.type === 'SENSOR_UPDATE' && msg.data) {
        const d = msg.data as Record<string, unknown>;
        const ml = msg.ml_prediction as Record<string, unknown> | undefined;
        setSensors(prev => prev.map(s => s.id === msg.node_id ? {
          ...s, ...d,
          status: (ml?.status as string) || s.status,
          ai_risk_score: (ml?.ai_risk_score as number) ?? s.ai_risk_score,
        } : s));
      }
      if (msg.type === 'TELEMETRY_UPDATE' && msg.decision) {
        const dec = msg.decision as Record<string, unknown>;
        const tier = (dec.warning_tier as string) || 'NORMAL';
        const status = tier === 'CRITICAL' ? 'CRITICAL' : tier === 'WARNING' ? 'WARNING' : tier === 'WATCH' ? 'CAUTION' : 'SAFE';
        setSensors(prev => prev.map(s => s.id === msg.node_id ? {
          ...s, status,
          ai_risk_score: Math.round((dec.composite_risk_score as number) || 0),
        } : s));
      }
    }, [fetch]),
    useCallback((s: ConnectionState) => setConnection(s), []),
  );

  React.useEffect(() => { fetch(); }, [fetch]);

  const renderSensor = useCallback(({ item }: { item: SensorNode }) => {
    const color = sensorStatusColor(item.status);
    const isOffline = item.status === 'OFFLINE' || item.status === 'STALE';
    return (
      <TouchableOpacity
        style={st.card}
        onPress={() => navigation.navigate('SensorDetail', { sensorId: item.id })}
        accessibilityLabel={`Sensor ${item.id}, status ${item.status}`}
      >
        <View style={st.row}>
          <View style={[st.dot, { backgroundColor: color }]} />
          <Text style={st.id}>{item.id}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[st.risk, { color }]}>{item.ai_risk_score ?? '—'}</Text>
          <Text style={[st.status, { color }]}>{isOffline ? 'OFFLINE' : item.status}</Text>
        </View>
        <Text style={st.zone}>{item.zone} · Tilt: {item.tilt?.toFixed(2) ?? '—'}° · Disp: {item.displacement?.toFixed(1) ?? '—'}mm</Text>
        <Text style={st.meta}>
          Batt: {item.battery ?? '—'}% · Signal: {item.lora_signal ?? '—'}%
          {isOffline ? ' · NODE FAULT (not ground risk)' : ''}
        </Text>
      </TouchableOpacity>
    );
  }, [navigation]);

  if (loading) return <LoadingState label="Loading sensors..." />;

  const online = sensors.filter(s => s.status !== 'OFFLINE' && s.status !== 'STALE').length;

  return (
    <View style={st.root}>
      <FlatList
        data={sensors}
        keyExtractor={s => s.id}
        renderItem={renderSensor}
        contentContainerStyle={st.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
        ListHeaderComponent={
          <Text style={st.header}>SENSORS — {online}/{sensors.length} online</Text>
        }
        ListEmptyComponent={<EmptyState title="No sensor data" subtitle="Sensor network unavailable." icon="📡" />}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.MD },
  header: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700', color: COLORS.TEXT_MUTED, letterSpacing: 1, marginBottom: SPACING.SM },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
  id: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  risk: { fontSize: FONT_SIZE.SMALL, fontWeight: '700', marginRight: 8 },
  status: { fontSize: FONT_SIZE.MICRO, fontWeight: '700' },
  zone: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_SECONDARY, marginBottom: 2 },
  meta: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED },
});
