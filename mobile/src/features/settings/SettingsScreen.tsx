/**
 * Settings screen — language, connection, auth info.
 */
import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { useI18n, LOCALES, LOCALE_NAMES, type Locale } from '../../i18n';

import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';
import { SectionHeader } from '../../components';

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [connectionState] = React.useState('OFFLINE');

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      <SectionHeader title="OPERATOR" />
      <View style={st.card}>
        <View style={st.userInfo}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{user?.email?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.email}>{user?.email || 'Not signed in'}</Text>
            <Text style={st.role}>{user?.role || '—'} · {user?.authMode || '—'}</Text>
          </View>
          <TouchableOpacity style={st.logoutButton} onPress={logout}>
            <Text style={st.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SectionHeader title="LANGUAGE" />
      <View style={st.card}>
        {LOCALES.map((code: Locale) => (
          <TouchableOpacity
            key={code}
            style={st.langRow}
            onPress={() => setLocale(code)}
            accessibilityRole="button"
            accessibilityLabel={`Language: ${LOCALE_NAMES[code]}`}
            accessibilityState={{ selected: locale === code }}
          >
            <Text style={[st.langName, locale === code && st.langActive]}>
              {LOCALE_NAMES[code]}
            </Text>
            {locale === code ? <Text style={st.langCheck}>✓</Text> : null}
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="CONNECTION" />
      <View style={st.card}>
        <Row label="State" value={connectionState} />
        <Row label="WebSocket" value={connectionState === 'ONLINE' ? 'Connected' : 'Disconnected'} />
        <Row label="Data Quality" value={connectionState === 'ONLINE' ? 'LIVE' : 'CACHED DATA'} />
      </View>

      <SectionHeader title="NOTIFICATIONS" />
      <View style={st.card}>
        <Row label="FCM Status" value="BLOCKED" />
        <Text style={st.fcmNote}>
          FCM push delivery requires Firebase credentials to be provisioned.
          Local notifications are used for in-app alerts.
        </Text>
      </View>

      <SectionHeader title="ABOUT" />
      <View style={st.card}>
        <Row label="Version" value="1.0.0 (SIH26025)" />
        <Row label="Framework" value="React Native + TypeScript" />
        <Row label="Backend" value="TerraMesh AI FastAPI" />
        <Row label="Provenance" value="6-class labelling enforced" />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.row}>
      <Text style={st.rowLabel}>{label}</Text>
      <Text style={st.rowValue}>{value}</Text>
    </View>
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
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.MD,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  avatarText: { fontSize: FONT_SIZE.BODY, fontWeight: '700', color: COLORS.ACCENT },
  email: { fontSize: FONT_SIZE.SMALL, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  role: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_MUTED },
  logoutButton: {
    paddingHorizontal: SPACING.LG, paddingVertical: 6,
    borderRadius: RADIUS.MD, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { fontSize: FONT_SIZE.MICRO, color: COLORS.CRITICAL, fontWeight: '600' },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, minHeight: 44,
  },
  langName: { fontSize: FONT_SIZE.BODY, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  langActive: { color: COLORS.ACCENT },
  langCheck: { fontSize: FONT_SIZE.BODY, color: COLORS.ACCENT, fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 6 },
  rowLabel: { width: 120, fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED },
  rowValue: { flex: 1, fontSize: FONT_SIZE.SMALL, fontWeight: '500', color: COLORS.TEXT_PRIMARY },
  fcmNote: { fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_FAINT, marginTop: 4, fontStyle: 'italic' },
});
