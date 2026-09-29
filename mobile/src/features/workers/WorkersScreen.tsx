/**
 * Workers screen — worker safety with vitals and location source.
 * Clearly distinguishes SIMULATOR from RFID/RTLS/UWB.
 */
import React, { useState, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { LoadingState, EmptyState } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { Worker } from '../../types/models';

function workerStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'DANGER': return COLORS.CRITICAL;
    case 'CAUTION': case 'WARNING': return COLORS.WARNING;
    case 'OFFLINE': return COLORS.OFFLINE;
    default: return COLORS.SAFE;
  }
}

export function WorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try { setWorkers(await api.getWorkers()); } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);

  const renderWorker = useCallback(({ item }: { item: Worker }) => {
    const color = workerStatusColor(item.status);
    return (
      <View style={st.card}>
        <View style={st.row}>
          <View style={[st.avatar, { borderColor: `${color}44` }]}>
            <Text style={[st.avatarText, { color }]}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{item.code} — {item.name}</Text>
            <Text style={st.meta}>{item.zone}</Text>
          </View>
          <Text style={[st.status, { color }]}>{item.status}</Text>
        </View>
        <Text style={st.vitals}>
          HR: {item.heart_rate ?? '—'} bpm · SpO₂: {item.spo2 ?? '—'}% · Depth: {item.depth_m ?? '—'}m
        </Text>
        <Text style={st.source}>
          Location: {item.provenance || 'SIMULATED POSITION'}
        </Text>
      </View>
    );
  }, []);

  if (loading) return <LoadingState label="Loading workers..." />;

  const inDanger = workers.filter(w => w.status === 'DANGER').length;

  return (
    <View style={st.root}>
      <FlatList
        data={workers}
        keyExtractor={w => w.id}
        renderItem={renderWorker}
        contentContainerStyle={st.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
        ListHeaderComponent={
          inDanger > 0 ? (
            <View style={st.dangerBanner}>
              <Text style={st.dangerText}>{inDanger} workers in DANGER zone</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState title="No worker data" subtitle="Worker roster unavailable." icon="👷" />}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.MD },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.SM,
  },
  avatarText: { fontSize: FONT_SIZE.BODY, fontWeight: '700' },
  name: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  meta: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED },
  status: { fontSize: FONT_SIZE.MICRO, fontWeight: '800', letterSpacing: 0.5 },
  vitals: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: 2 },
  source: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_FAINT, fontStyle: 'italic' },
  dangerBanner: {
    backgroundColor: COLORS.CRITICAL_DIM, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: `${COLORS.CRITICAL}44`,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  dangerText: { fontSize: FONT_SIZE.SMALL, fontWeight: '700', color: COLORS.CRITICAL },
});
