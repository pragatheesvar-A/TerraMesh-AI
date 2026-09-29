/**
 * TerraMesh AI — React Native Mobile Application entry point.
 * Consumes the existing FastAPI backend; one source of truth.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { I18nProvider } from './src/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
