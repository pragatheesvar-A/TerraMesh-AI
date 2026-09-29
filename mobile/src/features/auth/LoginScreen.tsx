/**
 * Login screen — consumes the existing backend /api/login.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../theme/colors';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError(null);
    const ok = await login(email.trim(), password);
    if (!ok) setError('Invalid email or password');
    setLoading(false);
  };

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>TerraMesh AI</Text>
        <Text style={st.subtitle}>Mine Safety Command Center</Text>
      </View>
      <View style={st.form}>
        <TextInput
          style={st.input}
          placeholder="Email"
          placeholderTextColor={COLORS.TEXT_FAINT}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email input"
        />
        <TextInput
          style={st.input}
          placeholder="Password"
          placeholderTextColor={COLORS.TEXT_FAINT}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password input"
        />
        {error ? <Text style={st.error}>{error}</Text> : null}
        <TouchableOpacity style={st.button} onPress={handleLogin} disabled={loading}
          accessibilityLabel="Login button">
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.BG} />
          ) : (
            <Text style={st.buttonText}>LOGIN TO COMMAND CENTER</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={st.footer}>Project Standard 112 · Real-time IoT Ingress</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG, justifyContent: 'center', padding: SPACING.XXL },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: FONT_SIZE.XL, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  subtitle: { fontSize: FONT_SIZE.SMALL, color: COLORS.TEXT_MUTED, marginTop: 4 },
  form: {},
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1, borderColor: COLORS.BORDER,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.LG, paddingVertical: 12,
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZE.BODY,
    marginBottom: SPACING.MD,
  },
  error: { color: COLORS.CRITICAL, fontSize: FONT_SIZE.SMALL, marginBottom: SPACING.SM },
  button: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: RADIUS.MD,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.BG, fontSize: FONT_SIZE.BODY, fontWeight: '800', letterSpacing: 0.5 },
  footer: { textAlign: 'center', fontSize: FONT_SIZE.CAPTION, color: COLORS.TEXT_FAINT, marginTop: 48 },
});
