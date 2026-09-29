# TerraMesh AI — Mobile Setup Guide

## Prerequisites

- Node.js ≥ 20
- npm
- Android SDK (for native builds)
- Expo CLI (`npx expo`)

## Install

```powershell
cd mobile
npm install
```

## Verify

```powershell
npx tsc --noEmit           # TypeScript typecheck (must pass with 0 errors)
```

## Development

```powershell
npx expo start             # Starts Metro bundler
# Scan QR with Expo Go app on Android/iOS device
# OR: npx expo start --android (opens Android emulator)
```

The default `API_BASE_URL` is `http://10.0.2.2:8000` (Android emulator →
host machine's localhost). For a physical device on the same network,
change `src/config/env.ts` to your machine's LAN IP.

## Environment configuration

Set these as environment variables for production builds:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "https://api.terramesh.example.in"
$env:EXPO_PUBLIC_WS_BASE_URL = "wss://api.terramesh.example.in/ws/live-monitoring"
$env:EXPO_PUBLIC_ENV = "production"
```

## Android native build

The `mobile/android/` directory was generated via `npx expo prebuild --platform android`.

```powershell
cd mobile/android
gradlew assembleDebug
```

**Known issue on this Windows environment:** the build encounters a
CMake/NDK compilation error in `expo-modules-core`. This is a native
toolchain issue (NDK version / CMake configuration), not a source-code
error. TypeScript compilation and the Expo JS export both pass.

On a machine with a properly configured Android NDK:
```powershell
npx expo run:android      # Full build + install on device/emulator
```

## iOS

**BLOCKED — macOS/Xcode required.** The iOS project configuration is
created by `npx expo prebuild --platform ios` on macOS. Windows cannot
build iOS. Use `eas build --platform ios` for cloud-based iOS builds.

## Notifications

- **Local notifications**: supported via `react-native-webview` / in-app
- **FCM**: registration endpoint exists (`POST /api/notifications/register-token`);
  delivery is **BLOCKED** until Firebase credentials are provisioned
  (see `docs/INTEGRATIONS.md` §1)
- The Settings screen honestly shows "FCM Status: BLOCKED"
