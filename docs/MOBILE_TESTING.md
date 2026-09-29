# TerraMesh AI — Mobile Testing

> Updated: 2026-09-25 — all results below are from executed commands this session.

## Test Runner

Configured in `mobile/package.json`:

```json
"scripts": {
  "test": "jest",
  "typecheck": "tsc --noEmit"
},
"jest": {
  "preset": "jest-expo",
  "setupFiles": ["./jest.setup.ts"],
  "testMatch": ["**/__tests__/**/*.test.ts?(x)"]
}
```

`mobile/jest.setup.ts` mocks the native AsyncStorage module with the official
`@react-native-async-storage/async-storage/jest/async-storage-mock`.

Dependencies: `jest-expo@~57.0.3`, `jest@~29.7.0`,
`@testing-library/react-native@14.0.1` (devDependencies).

## Executed Results (fresh, this session)

Command: `cd mobile && npm test`

```text
Test Suites: 4 passed, 4 total
Tests:       33 passed, 33 total
Skipped:     0
Failed:      0
Duration:    ~1.7–11 s per run (multiple executions)
```

Command: `cd mobile && npx tsc --noEmit`

```text
TSC_PASS — 0 errors (strict mode)
```

## Test Suites

### `__tests__/api.test.ts` (12 tests)
- API contract: the mobile client maps to exactly the real FastAPI endpoints
  (`/api/login`, `/api/dashboard/overview`, `/api/sensors`, `/api/workers`,
  `/api/zones`, `/api/alerts`, `/api/risk`, `/api/evacuation`, `/health`,
  `/api/alerts/{id}/acknowledge`, `/api/notifications/register-token`) plus
  `/api/evacuation/broadcast` — no invented endpoints.
- WebSocket URL matches `/ws/live-monitoring`.
- No hardcoded production secret.
- Model types match backend Pydantic schemas (provenance fields present).

### `__tests__/provenance.test.ts` (6 tests)
- 7 provenance classes defined; SIMULATED never relabelled as MEASURED;
  cached data never labelled LIVE; worker/evacuation provenance preserved.

### `__tests__/i18n.test.ts` (13 tests)
- Exactly 5 locales: en, hi, bn, ta, sat.
- All 5 flattened key sets identical (41 keys × 5 locales).
- Every key resolves in every locale → **0 unintended fallbacks**.
- No empty values; SIMULATED and LIVE terminology preserved in all locales.
- Nested dot-key resolution verified (en/hi/sat).
- `translate()` returns `undefined` for missing keys (no silent fabrication).

### `__tests__/components.test.tsx` (11 tests)
- StatusBadge always renders textual status (never color-only) —
  CRITICAL, OFFLINE.
- ConnectionIndicator renders LIVE / RECONNECTING / OFFLINE as text.
- OfflineBanner says "OFFLINE — cached data (as of <time>)" and never
  contains "LIVE".
- LoadingState / EmptyState / ErrorState render labels (no blank screens).
- I18nProvider: defaults to English, translates, and switching to Hindi
  re-renders translated strings immediately.

## 5-Locale Parity (machine-verifiable summary)

```text
Locales discovered: 5
Expected locales: 5
Missing locales: 0
Missing required keys: 0
Unexpected fallback keys: 0
Placeholder mismatches: 0
Result: PASS
```

(Parity is enforced per execution by `i18n.test.ts`; the summary above
reflects the last executed run.)

## Android Build

`cd mobile/android && gradlew.bat assembleDebug` → **BUILD SUCCESSFUL**.
APK: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
(180,120,529 bytes). Full NDK diagnosis: see `MOBILE_ANDROID_BUILD.md`.

## Runtime

`adb devices` → no device/emulator attached. Runtime smoke test:
**NOT EXECUTED — NO DEVICE/EMULATOR AVAILABLE.**

## Regression (fresh evidence)

| Suite | Command | Result |
|---|---|---|
| Backend | `python -m pytest -q` (apps/mineguard-core/backend) | **112 passed, 19 skipped**, 0 failed |
| Frontend (web) | `npm run build` (apps/mineguard-core/frontend) | **PASS** (built in 6.87s) |
| Mobile | `npm test` | **33 passed, 0 failed, 0 skipped** |
| Mobile typecheck | `npx tsc --noEmit` | **PASS** |
| Mobile Android | `gradlew.bat assembleDebug` | **PASS** |
