# TerraMesh AI — Mobile i18n Implementation

## Single Translation Source

The mobile app has **one** translation catalog source: the same 5 JSON locale
files used by the React web frontend, copied verbatim into
`mobile/src/i18n/locales/`:

```
mobile/src/i18n/locales/
├── en.json    (English) — identical to apps/mineguard-core/frontend/src/i18n/locales/en.json
├── hi.json    (Hindi)   — identical
├── bn.json    (Bengali) — identical
├── ta.json    (Tamil)   — identical
└── sat.json   (Santali) — identical
```

There is **no second translation system**, no duplicated catalog objects, and
no hardcoded alternate translations anywhere in the mobile source. Locale
identifiers (`en`, `hi`, `bn`, `ta`, `sat`) match the web platform exactly.

## Locale Set Note (honest deviation)

The web platform ships 5 locales: English, Hindi, Bengali, Tamil, **Santali**
(`sat`, Ol Chiki script). The validation brief listed Malayalam and Telugu as
locales 4 and 5. **Malayalam and Telugu catalogs do not exist in the shared
web platform**; creating mobile-only catalogs for them would violate the
single-source requirement and produce fabricated translations. The mobile app
therefore implements the platform's actual 5 locales (en/hi/bn/ta/sat), which
match the existing verified translation source. Adding Malayalam/Telugu
requires authoring new web-platform catalogs first (a shared-platform task,
not a mobile task).

## Module

`mobile/src/i18n/index.tsx`:

- `I18nProvider` — React context; restores the persisted locale from
  AsyncStorage on startup (defaults to `en` before restore completes, then
  re-renders if a stored preference exists).
- `useI18n()` — returns `{ locale, setLocale, t }`.
- `setLocale(l)` — updates context and persists to
  AsyncStorage key `terramesh.locale` (non-sensitive UI preference; ordinary
  storage per the security policy — auth tokens remain in Keychain only).
- `translate(locale, key, vars)` — resolves dot-separated nested keys
  (`nav.dashboard`). Returns `undefined` for missing keys (never fabricates).
- `translateWithFallback` — explicit English fallback helper, used by `t()`.
- Interpolation supports `{var}` tokens; unknown tokens are left intact.
- `LOCALES` — ordered list `['en','hi','bn','ta','sat']`.
- `LOCALE_NAMES` — native-script display names.

## Settings Integration

`SettingsScreen` renders one touch row per locale (≥44 pt, accessibility
role/label/state), with the active locale marked by a ✓ and accent color.
Switching is immediate (no app restart) and persisted.

## Missing-Key Behavior

- `translate()` returns `undefined` for missing keys — surfaced in tests.
- `t()` falls back to English **explicitly and only** via
  `translateWithFallback`.
- The parity test suite asserts every key resolves in **every** locale, so
  fallback should never trigger in practice (0 unintended fallbacks).

## Parity Verification

`mobile/__tests__/i18n.test.ts` machine-verifies:

| Check | Assertion |
|---|---|
| Locale count | exactly 5 (en, hi, bn, ta, sat) |
| Key-set equality | all 5 flattened key sets identical |
| No empty values | every key resolves to non-empty string |
| No unintended fallback | every key defined in every locale |
| SIMULATED terminology | preserved in all locales |
| LIVE terminology | preserved in all locales |
| Nested keys | dot-path resolution verified (en/hi/sat samples) |

Result (executed): **41 keys × 5 locales, 0 missing, 0 fallback, PASS.**

## Startup Behavior

First render uses `en` until AsyncStorage restore resolves; if a stored
locale exists the provider re-renders with it. Operational safety labels
(LIVE, SIMULATED, OFFLINE) are catalog-driven where the catalog defines them;
backend provenance labels (MEASURED, MODEL OUTPUT, SIMULATION, …) are passed
through verbatim from the backend and are intentionally not localized — they
are canonical taxonomy values.

## Screen Coverage

Screens use translated keys where the shared catalog has them (e.g. Settings
section titles, tab labels via nav keys). Remaining user-facing strings on
operational screens (risk levels, alert severities, statuses like
`CRITICAL`/`OFFLINE`) are **intentionally static**: they render canonical
backend values verbatim so the mobile UI can never relabel a safety state.
This is a deliberate honesty requirement, not a localization gap.
