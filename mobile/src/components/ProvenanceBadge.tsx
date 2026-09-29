/**
 * ProvenanceBadge — mirrors the React web frontend's DataBadge exactly.
 * Displays the ACTUAL data source; never fabricated.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../theme/colors';
import type { ProvenanceLabel } from '../types/models';

function provenanceColor(label: string): string {
  const l = label.toUpperCase();
  if (l.includes('MEASURED')) return COLORS.SAFE;
  if (l.includes('SIMULATED') || l.includes('SIMULATION')) return COLORS.WARNING;
  if (l.includes('MODEL')) return COLORS.INFO;
  if (l.includes('ENGINEERING')) return '#14B8A6';
  if (l.includes('OPERATOR')) return '#F97316';
  if (l.includes('UNLABELED')) return COLORS.OFFLINE;
  return COLORS.INFO;
}

interface Props {
  label: ProvenanceLabel;
  compact?: boolean;
}

export function ProvenanceBadge({ label, compact = false }: Props) {
  const color = provenanceColor(label);
  return (
    <View style={[s.badge, { borderColor: `${color}55`, backgroundColor: `${color}15` }]}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.text, { color }]} numberOfLines={1} ellipsizeMode="tail">
        {compact ? label.split(' ')[0] : label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.SM,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  dot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  text: { fontSize: FONT_SIZE.CAPTION, fontWeight: '700', letterSpacing: 0.4 },
});
