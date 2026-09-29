/**
 * Evacuation screen — operator-authorized emergency workflow.
 * Consumes the backend evacuation status; no frontend-only authorization.
 */
import React, { useState, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { api } from '../../api/client';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { LoadingState, SectionHeader, StatusBadge, EmptyState } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { EvacuationStatus } from '../../types/models';

export function EvacuationScreen() {
  const [evacuation, setEvacuation] = useState<EvacuationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try { setEvacuation(await api.getEvacuation()); } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);

  const triggerEvacuation = useCallback(() => {
    // Backend-authorized only — no frontend-only authorization
    Alert.alert(
      'Emergency Evacuation Broadcast',
      `This will dispatch an evacuation order for ${evacuation?.target_zone || 'the affected zone'}. ` +
      'The action will be recorded in the audit log.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'AUTHORIZE & DISPATCH',
          style: 'destructive',
          onPress: async () => {
            try {
              // Real backend dispatch: POST /api/evacuation/broadcast (role-gated,
              // audited). The UI shows the backend's actual response — success is
              // never assumed locally.
              const zone = evacuation?.target_zone || 'UNKNOWN';
              const result = await api.evacuationBroadcast(
                zone,
                `EVACUATE ${zone} immediately. Proceed to nearest assembly point.`,
              );
              const dispatchInfo = result && typeof result === 'object' && 'dispatch' in result
                ? JSON.stringify((result as Record<string, unknown>).dispatch)
                : 'accepted';
              Alert.alert('Dispatched', `Evacuation broadcast accepted by backend.
${dispatchInfo}`);
              fetch();
            } catch {
              Alert.alert(
                'Failed',
                'Backend did not accept the evacuation broadcast. ' +
                'Check connection and authorization, then retry. No dispatch occurred.',
              );
            }
          },
        },
      ],
    );
  }, [evacuation]);

  if (loading) return <LoadingState label="Loading evacuation status..." />;
  if (!evacuation) return <EmptyState title="No evacuation data" subtitle="Evacuation status unavailable." icon="🚨" />;

  const isCritical = evacuation.zone_status === 'CRITICAL';

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={st.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
    >
      {/* Incident status */}
      <View style={[st.card, isCritical && { borderLeftColor: COLORS.CRITICAL, borderLeftWidth: 3 }]}>
        <View style={st.row}>
          <SectionHeader title="INCIDENT" />
          <StatusBadge status={evacuation.zone_status} />
        </View>
        <Text style={st.zone}>{evacuation.target_zone}</Text>
        <Text style={st.action}>{evacuation.recommended_action}</Text>
        <Text style={st.workers}>{evacuation.workers_at_risk} workers at risk</Text>
        <ProvenanceBadge label={evacuation.personnel_provenance || 'SIMULATION'} />
      </View>

      {/* Routes */}
      <SectionHeader title="EVACUATION ROUTES" />
      {(evacuation.routes || []).map(route => (
        <View key={route.route_id} style={st.card}>
          <View style={st.row}>
            <Text style={st.routeName}>{route.name}</Text>
            <StatusBadge status={route.status} />
          </View>
        </View>
      ))}

      {/* Authorization action */}
      <SectionHeader title="OPERATOR AUTHORIZATION" />
      <TouchableOpacity
        style={[st.authorizeButton, isCritical && { backgroundColor: COLORS.CRITICAL }]}
        onPress={triggerEvacuation}
        accessibilityLabel="Authorize emergency evacuation broadcast"
      >
        <Text style={st.authorizeText}>AUTHORIZE & DISPATCH</Text>
      </TouchableOpacity>
      <Text style={st.authorizeNote}>
        Authorization is performed through the backend API and recorded in the audit log.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.LG },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginBottom: SPACING.SM,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.SM },
  zone: { fontSize: FONT_SIZE.BODY, fontWeight: '700', color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  action: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  workers: { fontSize: FONT_SIZE.SMALL, color: COLORS.WARNING, fontWeight: '600', marginBottom: SPACING.SM },
  routeName: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY, flex: 1 },
  authorizeButton: {
    backgroundColor: COLORS.WARNING, borderRadius: RADIUS.LG,
    paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.SM,
  },
  authorizeText: { color: '#FFF', fontSize: FONT_SIZE.BODY, fontWeight: '800', letterSpacing: 1 },
  authorizeNote: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED, textAlign: 'center' },
});
