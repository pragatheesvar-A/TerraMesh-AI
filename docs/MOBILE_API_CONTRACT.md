# TerraMesh AI — Mobile API Contract

Every endpoint the React Native app consumes maps 1:1 to the existing
FastAPI backend. No endpoints were invented; no endpoints were modified.

## Authentication

| Method | Endpoint | Mobile usage | Auth required |
|---|---|---|---|
| POST | `/api/login` | LoginScreen → `auth.login()` | No |
| — | Keychain | Token stored via `react-native-keychain` | — |
| — | `X-API-Key` header | Attached to authenticated requests from Keychain | — |

## Domain data

| Method | Endpoint | Mobile screen | Response type |
|---|---|---|---|
| GET | `/api/dashboard/overview` | DashboardScreen | `DashboardOverview` |
| GET | `/api/sensors` | SensorsScreen | `SensorNode[]` |
| GET | `/api/workers` | WorkersScreen | `Worker[]` |
| GET | `/api/zones` | (future map layer) | `ZoneInfo[]` |
| GET | `/api/alerts` | AlertsScreen | `AlertItem[]` |
| GET | `/api/risk` | DashboardScreen (risk card) | `RiskIntelligence` |
| GET | `/api/evacuation` | EvacuationScreen | `EvacuationStatus` |
| GET | `/health` | SettingsScreen (connection) | `Record<string, unknown>` |
| POST | `/api/alerts/{id}/acknowledge` | AlertsScreen (ack button) | Yes (X-API-Key) |
| POST | `/api/notifications/register-token` | Settings (FCM registration) | Yes (X-API-Key) |

## WebSocket

| Endpoint | Mobile usage |
|---|---|
| `ws://<host>/ws/live-monitoring` | `useWebSocket` hook → live updates |

Messages handled:
- `CONNECTED` → set state ONLINE
- `STATE_UPDATE` → re-fetch all data
- `SENSOR_UPDATE` → update individual sensor in state
- `ALERT_NEW` → prepend alert to list
- `TELEMETRY_UPDATE` → update sensor from pipeline decision

## Environment configuration

```typescript
// src/config/env.ts
development: API_BASE_URL = 'http://10.0.2.2:8000'  // Android emulator → host
local:        API_BASE_URL = 'http://localhost:8000'
production:    API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
```

No production secrets are hardcoded. The dev URL `10.0.2.2` is the standard
Android emulator mapping to the host machine's localhost.

## TypeScript type mappings

```
FastAPI Pydantic schema          →  mobile/src/types/models.ts
──────────────────────────────────────────────────────────────
SensorNodeSchema                 →  SensorNode
WorkerSchema                     →  Worker
AlertSchema                      →  AlertItem
ZoneSchema                       →  ZoneInfo
AIRiskIntelligence               →  RiskIntelligence
EvacuationStatus                 →  EvacuationStatus
DashboardOverview                →  DashboardOverview
LoginResponse                    →  LoginResponse
```

Every type includes a `provenance` field where the backend provides one.
The ProvenanceBadge component renders the EXACT backend label — no relabelling.
