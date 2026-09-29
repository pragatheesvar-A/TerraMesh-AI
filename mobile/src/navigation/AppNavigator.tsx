/**
 * Navigation — Auth stack + Bottom tabs + Detail stacks.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { COLORS } from '../theme/colors';

import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { AlertsScreen } from '../features/alerts/AlertsScreen';
import { AlertDetailScreen } from '../features/alerts/AlertDetailScreen';
import { SensorsScreen } from '../features/sensors/SensorsScreen';
import { SensorDetailScreen } from '../features/sensors/SensorDetailScreen';
import { WorkersScreen } from '../features/workers/WorkersScreen';
import { EvacuationScreen } from '../features/evacuation/EvacuationScreen';
import { MapScreen } from '../features/map/MapScreen';
import { ReportsScreen } from '../features/reports/ReportsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { LoginScreen } from '../features/auth/LoginScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AlertDetail: { alertId: string };
  SensorDetail: { sensorId: string };
  Evacuation: undefined;
  Reports: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused, icon }: { label: string; focused: boolean; icon: string }) {
  return (
    <Text style={{ fontSize: 18, color: focused ? COLORS.ACCENT : COLORS.TEXT_FAINT }}>{icon}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.SURFACE },
        headerTintColor: COLORS.TEXT_PRIMARY,
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopColor: COLORS.BORDER,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.ACCENT,
        tabBarInactiveTintColor: COLORS.TEXT_FAINT,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} icon="◉" /> }} />
      <Tab.Screen name="Alerts" component={AlertsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Alerts" focused={focused} icon="!" /> }} />
      <Tab.Screen name="Map" component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Map" focused={focused} icon="⬡" /> }} />
      <Tab.Screen name="Sensors" component={SensorsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Sensors" focused={focused} icon="≈" /> }} />
      <Tab.Screen name="Workers" component={WorkersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Workers" focused={focused} icon="◍" /> }} />
      <Tab.Screen name="More" component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="More" focused={focused} icon="⋯" /> }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Splash while restoring session

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
            <Stack.Screen name="SensorDetail" component={SensorDetailScreen} />
            <Stack.Screen name="Evacuation" component={EvacuationScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
