/**
 * Map screen — consumes the existing PostGIS-backed spatial APIs.
 * Displays zones with seeded geometry + provenance, sensors with coordinates,
 * and evacuation routes. Ready for a map library overlay.
 */
import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { SectionHeader, LoadingState, EmptyState, StatusBadge } from '../../components';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import type { ZoneInfo, SensorNode, EvacuationStatus } from '../../types/models';

function zoneColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'CRITICAL': return COLORS.CRITICAL;
    case 'WARNING': return COLORS.WARNING;
    case 'CAUTION': return COLORS.CAUTION;
    default: return COLORS.SAFE;
  }
}

export function MapScreen() {
  const [zones, setZones] = useState<ZoneInfo[]>([]);
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [evacuation, setEvacuation] = useState<EvacuationStatus | null>(null);
  const [engineering, setEngineering] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [z, s, ev, eng] = await Promise.all([
        api.getZones(), api.getSensors(), api.getEvacuation(), api.getEngineeringLayers(),
      ]);
      setZones(z); setSensors(s); setEvacuation(ev); setEngineering(eng);
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <LoadingState label="Loading spatial data..." />;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={st.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.ACCENT} />}
    >
      {/* Zones with seeded PostGIS geometry */}
      <SectionHeader title="RISK ZONES" />
      {zones.map(zone => (
        <View key={zone.id} style={st.zoneCard}>
          <View style={st.zoneRow}>
            <View style={[st.zoneDot, { backgroundColor: zoneColor(zone.status) }]} />
            <Text style={st.zoneCode}>{zone.code}</Text>
            <View style={{ flex: 1 }} />
            <StatusBadge status={zone.status} />
          </View>
          <Text style={st.zoneName}>{zone.name}</Text>
          <Text style={st.zoneMeta}>
            Risk: {zone.risk_score.toFixed(0)}% · Workers: {zone.active_workers} · Sensors: {zone.active_sensors}
          </Text>
          <Text style={st.zoneMeta}>Subsidence: {zone.subsidence_rate} mm/day</Text>
          <View style={st.provRow}>
            {zone.provenance?.geometry ? <ProvenanceBadge label={zone.provenance.geometry} /> : null}
            {zone.provenance?.status ? <ProvenanceBadge label={zone.provenance.status} /> : null}
          </View>
        </View>
      ))}

      {/* Sensor positions */}
      <SectionHeader title="SENSOR POSITIONS" />
      {sensors.filter(s => s.lat && s.lng).slice(0, 10).map(sensor => (
        <View key={sensor.id} style={st.sensorRow}>
          <Text style={st.sensorId}>{sensor.id}</Text>
          <Text style={st.sensorPos}>
            {sensor.lat?.toFixed(4)}°N {sensor.lng?.toFixed(4)}°E
          </Text>
          <Text style={[st.sensorStatus, { color: zoneColor(sensor.status) }]}>{sensor.status}</Text>
        </View>
      ))}

      {/* Evacuation routes */}
      {evacuation?.routes && evacuation.routes.length > 0 && (
        <>
          <SectionHeader title="EVACUATION ROUTES" />
          {evacuation.routes.map(route => (
            <View key={route.route_id} style={st.routeCard}>
              <View style={st.zoneRow}>
                <Text style={st.routeName}>{route.name}</Text>
                <StatusBadge status={route.status} />
              </View>
              {route.waypoints && (
                <Text style={st.zoneMeta}>
                  {route.waypoints.length} waypoints defined
                </Text>
              )}
            </View>
          ))}
        </>
      )}

      {/* Spatial data note */}
      <View style={st.noteCard}>
        <Text style={st.noteTitle}>SPATIAL DATA</Text>
        <Text style={st.noteText}>
          Zone geometry served from the seeded PostGIS risk_zones table via the
          spatial API. Sensor positions from /api/sensors. Evacuation routes
          from /api/evacuation. All layers consume the canonical backend —
          the mobile app creates no independent spatial data.
        </Text>
        <Text style={st.noteSim}>
          A map rendering library (react-native-maps) should be added when
          native builds are available. The spatial API data is ready.
        </Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: SPACING.MD },
  zoneCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  zoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  zoneDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  zoneCode: { fontSize: FONT_SIZE.SMALL, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  zoneName: { fontSize: FONT_SIZE.MICRO, color: COLORS.TEXT_MUTED, marginBottom: 4 },
  zoneMeta: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: 2 },
  provRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  sensorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.SM,
    borderWidth: 1, borderColor: COLORS.BORDER,
    paddingHorizontal: SPACING.MD, paddingVertical: 8, marginBottom: 4,
  },
  sensorId: { fontSize: FONT_SIZE.CAPTION, fontWeight: '600', color: COLORS.TEXT_PRIMARY, width: 100 },
  sensorPos: { flex: 1, fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED, fontFamily: 'monospace' },
  sensorStatus: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700' },
  routeCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.MD, marginBottom: SPACING.SM,
  },
  routeName: { flex: 1, fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  noteCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: RADIUS.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
    padding: SPACING.LG, marginTop: SPACING.LG,
  },
  noteTitle: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700', color: COLORS.TEXT_MUTED, letterSpacing: 1, marginBottom: 6 },
  noteText: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_SECONDARY, lineHeight: 16, marginBottom: 6 },
  noteSim: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_FAINT, fontStyle: 'italic' },
});
