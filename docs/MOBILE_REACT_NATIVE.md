# TerraMesh AI — React Native Mobile Application

> **Framework: React Native + TypeScript** (NOT Flutter)
> The PPT deck (Slide 3) lists "React Native" under Mobile. This is the implemented framework.
> Architecture: one FastAPI backend, three clients (React/Vite PWA + React Native mobile).

## Status

| Item | State |
|---|---|
| Source code | COMPLETE — `mobile/` (Expo + TypeScript, all screens, auth, WS, provenance) |
| TypeScript compilation | **PASSES** (`npx tsc --noEmit` → 0 errors) |
| Android native project | **GENERATED** (`npx expo prebuild --platform android` → `mobile/android/`) |
| Android APK | **BUILD FAILED — native CMake/NDK compilation error** (environment issue: expo-modules-core C++ build; not a code error) |
| iOS | **NOT BUILT — requires macOS/Xcode** (Windows environment) |
| Web frontend | **UNCHANGED AND HEALTHY** (build passes, 89 backend tests pass) |

## PPT framework requirement

The PPT deck (Slide 3) tech stack says:
```
Mobile
• React Native
• Firebase Cloud Messaging
• Offline mode
• Multilingual alerts
```

This project implements **React Native** — matching the PPT exactly.

## Location

```
D:\COAL MINE\mobile\
├── App.tsx                  # Entry point
├── src/
│   ├── api/client.ts        # FastAPI consumer
│   ├── auth/AuthContext.tsx # Session + Keychain secure storage
│   ├── components/          # Design system (ProvenanceBadge, MetricCard, etc.)
│   ├── config/env.ts        # API_BASE_URL / WS_BASE_URL (dev/local/prod)
│   ├── hooks/useWebSocket.ts # WS with reconnect + AppState handling
│   ├── navigation/AppNavigator.tsx # React Navigation (auth stack + tabs)
│   ├── theme/colors.ts      # Industrial dark theme
│   ├── types/models.ts      # Canonical backend models
│   └── features/
│       ├── auth/LoginScreen.tsx
│       ├── dashboard/DashboardScreen.tsx
│       ├── alerts/AlertsScreen.tsx
│       ├── sensors/SensorsScreen.tsx
│       ├── workers/WorkersScreen.tsx
│       ├── evacuation/EvacuationScreen.tsx
│       └── settings/SettingsScreen.tsx
├── android/                 # Generated native project
├── __tests__/               # API contract + provenance tests
└── package.json
```

## Quick start

```powershell
cd mobile
npm install
npx tsc --noEmit        # typecheck (passes)
npx expo start          # dev server (use Expo Go on device/emulator)
```

For a native Android build (requires working NDK/CMake):
```powershell
npx expo prebuild --platform android
cd android
gradlew assembleDebug
```
