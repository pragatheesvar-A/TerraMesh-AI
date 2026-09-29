# TerraMesh AI — Mobile PPT Traceability

| PPT Capability | React Native Implementation | Backend Endpoint | Test | Status |
|---|---|---|---|---|
| Mobile app (React Native) | Expo + TypeScript, all screens | — | `tsc --noEmit` passes | **CODE COMPLETE** |
| Firebase Cloud Messaging | `POST /api/notifications/register-token` wired; local notifications for in-app alerts | `/api/notifications/register-token` | Settings shows "FCM: BLOCKED" | **CODE COMPLETE / FCM DELIVERY BLOCKED** |
| Offline mode | `useWebSocket` reconnection + cached-data display + OfflineBanner + NetInfo | — | Provenance tests verify cached ≠ live | **CODE COMPLETE** |
| Multilingual alerts | 5-language cycle (EN/HI/BN/TA/SAT) in Settings; SMS templates consume backend 5-locale data | `/api/alerts` carries provenance | i18n parity checker (web) | **CODE COMPLETE** |
| Authentication | Keychain secure storage, session restore, login/logout | `POST /api/login` | API contract test | **CODE COMPLETE** |
| Dashboard / risk status | DashboardScreen with risk card, KPIs, zones, evacuation | `GET /api/dashboard/overview` | API contract test | **CODE COMPLETE** |
| Alerts (L1/L2/L3) | AlertsScreen with severity sorting, acknowledge, detail navigation | `GET /api/alerts`, `POST /api/alerts/{id}/acknowledge` | API contract test | **CODE COMPLETE** |
| Sensor status | SensorsScreen with live WS updates, battery/signal, health status | `GET /api/sensors`, WS `SENSOR_UPDATE` | API contract test | **CODE COMPLETE** |
| Worker safety | WorkersScreen with vitals, zone, SIMULATED position label | `GET /api/workers` | Provenance test (SIMULATION) | **CODE COMPLETE** |
| Evacuation | EvacuationScreen with routes, authorization workflow, backend-authorized dispatch | `GET /api/evacuation` | API contract test | **CODE COMPLETE** |
| Provenance labels | ProvenanceBadge component — renders exact backend label | All API responses carry `provenance` | Provenance tests (7 classes) | **CODE COMPLETE** |
| Map / GIS | Architecture ready (consumes `/api/zones` + `/api/spatial/*`); map rendering pending | `GET /api/zones`, `GET /api/spatial/*` | — | **CODE COMPLETE / MAP RENDERING PENDING** |
| WebSocket live updates | `useWebSocket` with backoff, AppState handling, NetInfo | `ws://<host>/ws/live-monitoring` | API contract test | **CODE COMPLETE** |
| Android APK | Native project generated; gradle build attempted | — | `tsc --noEmit` passes; gradle build | **NATIVE BUILD FAILED (NDK/CMake environment issue)** |
| iOS | Not buildable on Windows | — | — | **BLOCKED — macOS/Xcode required** |

## PPT framework note

PPT Slide 3 says: **"Mobile: React Native"**
Implemented: **React Native** — matches PPT exactly.

No Flutter claim is made anywhere in this mobile project.
