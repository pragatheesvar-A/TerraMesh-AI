/**
 * SensorDetail screen — individual sensor with live values, Kalman status,
 * and provenance. Consumes /api/sensors/{id} and /api/kalman/node/{id}.
 */
import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { SectionHeader, LoadingState, ErrorState, StatusBadge } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { SensorNode } from '../../types/models';

interface KalmanState {
  filtered_value?: number;
  kalman_gain?: number;
  innovation?: number;
  num_updates?: number;
  [key: string]: unknown;
}

function sensorColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'CRITICAL': case 'DANGER': return COLORS.CRITICAL;
    case 'WARNING': case 'CAUTION': return COLORS.WARNING;
    case 'OFFLINE': case 'STALE': return COLORS.OFFLINE;
    default: return COLORS.SAFE;
  }
}

export function SensorDetailScreen({ route }: { route: any }) {
  const { sensorId } = route?.params || {};
  const [sensor, setSensor] = useState<SensorNode | null>(null);
  const [kalman, setKalman] = useState<KalmanState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const sensors = await api.getSensors();
      const found = sensors.find(s => s.id === sensorId);
      setSensor(found || null);
      if (found) {
        try { setKalman(await api.getKalmanState(found.id)); } catch { /* kalman not available */ }
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [sensorId]);

  React.useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <LoadingState label="Loading sensor..." />;
  if (!sensor) return <ErrorState message={`Sensor ${sensorId} not found`} />;

  const color = sensorColor(sensor.status);
  const isOffline = sensor.status === 'OFFLINE' || sensor.status === 'STALE';

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={st.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
    >
      {/* Header */}
      <View style={[st.headerCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        <View style={st.row}>
          <Text style={st.sensorId}>{sensor.id}</Text>
          <View style={{ flex: 1 }} />
          <StatusBadge status={sensor.status} />
        </View>
        <Text style={st.sensorName}>{sensor.name}</Text>
        <Text style={st.sensorZone}>{sensor.zone}</Text>
        {isOffline && (
          <Text style={st.offlineNote}>NODE FAULT — sensor offline ≠ ground risk</Text>
        )}
        <ProvenanceBadge label={sensor.provenance || 'MEASURED DATA'} />
      </View>

      {/* Current telemetry */}
      <SectionHeader title="CURRENT TELEMETRY" />
      <View style={st.card}>
        <MetricRow label="Tilt" value={`${sensor.tilt?.toFixed(3) ?? '—'}°`} />
        <MetricRow label="Displacement" value={`${sensor.displacement?.toFixed(2) ?? '—'} mm`} />
        <MetricRow label="Crack Width" value={`${sensor.crack_width?.toFixed(2) ?? '—'} mm`} />
        <MetricRow label="Vibration" value={sensor.vibration || '—'} />
        <MetricRow label="AI Risk Score" value={sensor.ai_risk_score?.toString() ?? '—'} color={color} />
        <MetricRow label="Risk Label" value={sensor.risk_label || '—'} />
      </View>

      {/* Kalman status */}
      {kalman && (
        <>
          <SectionHeader title="KALMAN FILTER STATUS" />
          <View style={st.card}>
            {Object.entries(kalman).map(([key, value]) => (
              <MetricRow key={key} label={key.replace(/_/g, ' ')} value={
                typeof value === 'number' ? value.toFixed(4) : String(value ?? '—')
              } />
            ))}
            <ProvenanceBadge label="MODEL OUTPUT" />
          </View>
        </>
      )}

      {/* Hardware status */}
      <SectionHeader title="HARDWARE STATUS" />
      <View style={st.card}>
        <MetricRow label="Battery" value={`${sensor.battery ?? '—'}%`}
          color={(sensor.battery ?? 100) < 20 ? COLORS.WARNING : COLORS.SAFE} />
        <MetricRow label="LoRa Signal" value={`${sensor.lora_signal ?? '—'}%`}
          color={(sensor.lora_signal ?? 100) < 50 ? COLORS.WARNING : COLORS.SAFE} />
        <MetricRow label="Last Update" value={sensor.last_update || '—'} />
      </View>

      {/* Health note */}
      <View style={st.noteCard}>
        <Text style={st.noteText}>
          Sensor health (battery, connectivity, calibration) is tracked
          separately from physical mine risk. An offline or degraded sensor
          does NOT indicate ground instability.
        </Text>
      </View>
    </ScrollView>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={st.metricRow}>
      <Text style={st.metricLabel}>{label}</Text>
      <Text style={[st.metricValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.LG },
  headerCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginBottom: SPACING.MD,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sensorId: { fontSize: FONT_SIZE.BODY, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  sensorName: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_SECONDARY, marginBottom: 2 },
  sensorZone: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED, marginBottom: 6 },
  offlineNote: { fontSize: FONT_SIZE.CAPTION, color: COLORS.OFFLINE, fontWeight: '600', marginBottom: 6, fontStyle: 'italic' },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginBottom: SPACING.SM,
  },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metricLabel: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED },
  metricValue: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_PRIMARY, fontWeight: '600', fontFamily: 'monospace' },
  noteCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginTop: SPACING.SM,
  },
  noteText: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED, lineHeight: 16 },
});
