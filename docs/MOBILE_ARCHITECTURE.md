# TerraMesh AI — Mobile Architecture

## One Backend, Three Clients

```
                 TERRAMESH AI
                       │
              FastAPI Backend
                       │
        ┌──────────────┼──────────────┐
        │              │              │
 PostgreSQL         Redis          MQTT
 TimescaleDB
 PostGIS
        │
        └──────────────┬──────────────┐
                       │              │
                React/Vite        React Native
                   PWA               Mobile
```

The React Native app consumes the SAME backend APIs and WebSocket as the web
frontend. There is no second backend, no second database, no second risk
engine, and no mobile-only telemetry.

## Internal architecture

```
mobile/src/
├── config/env.ts           → API_BASE_URL, WS_BASE_URL (dev/local/prod)
├── api/client.ts           → fetch-based API consumer (mirrors web api.js)
├── auth/AuthContext.tsx    → session state, Keychain token storage
├── hooks/useWebSocket.ts   → WS + exponential-backoff + AppState lifecycle
├── types/models.ts         → canonical TypeScript interfaces (mirror Pydantic)
├── theme/colors.ts         → industrial dark theme tokens
├── components/index.tsx    → StatusBadge, MetricCard, EmptyState, etc.
├── components/ProvenanceBadge.tsx → provenance label (mirrors web DataBadge)
├── navigation/AppNavigator.tsx    → auth stack → bottom tabs (5)
└── features/
    ├── auth/               → LoginScreen (POST /api/login)
    ├── dashboard/          → DashboardScreen (GET /api/dashboard/overview)
    ├── alerts/             → AlertsScreen (GET /api/alerts + acknowledge)
    ├── sensors/            → SensorsScreen (GET /api/sensors + WS updates)
    ├── workers/            → WorkersScreen (GET /api/workers)
    ├── evacuation/         → EvacuationScreen (GET /api/evacuation)
    └── settings/           → SettingsScreen (connection, language, FCM status)
```

## Data flow

```
FastAPI /api/* ──fetch──→ api/client.ts ──→ React state ──→ Screens
FastAPI /ws/live-monitoring ──WebSocket──→ useWebSocket ──→ Screens (live updates)
Keychain ──secure──→ auth token (X-API-Key header)
```

## Offline-first behavior

| State | Behaviour |
|---|---|
| ONLINE | Live data + WS updates |
| OFFLINE | Cached data stays visible; OfflineBanner shows "OFFLINE — cached data (as of ...)" |
| RECONNECTING | WS exponential-backoff (2s→30s); NetInfo triggers re-fetch on reconnect |
| SYNCING | POST-restore fetch on app resume (AppState background→active) |

Cached data always displays its last-sync timestamp. Provenance is preserved
through all states — cached data is never relabelled as live.

## Secure storage

- **Auth token**: stored via `react-native-keychain` (Android Keystore / iOS
  Keychain), accessible only when device is unlocked (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`)
- **User metadata** (email/role): stored alongside the token in Keychain
- **Operational cached data**: React component state (in-memory, cleared on
  app close) — no sensitive data in AsyncStorage

## Lifecycle handling

- `AppState.active`: WS connects; data refreshes
- `AppState.background`: WS closes (saves battery); state = OFFLINE
- `AppState.active` (resume): WS reconnects; critical data re-fetched
- `NetInfo.isConnected`: triggers re-fetch when network returns
