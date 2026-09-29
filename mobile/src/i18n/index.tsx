/**
 * TerraMesh AI — mobile i18n.
 * Reuses the SAME 5-locale JSON catalogs as the web frontend
 * (apps/mineguard-core/frontend/src/i18n/locales) verbatim — no second
 * translation system. Keys and terminology are identical to the web app.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import sat from './locales/sat.json';

export const LOCALES = ['en', 'hi', 'bn', 'ta', 'sat'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  bn: 'বাংলা (Bengali)',
  ta: 'தமிழ் (Tamil)',
  sat: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)',
};

type Catalog = typeof en;

const resources: Record<Locale, Catalog> = { en, hi, bn, ta, sat };

const STORAGE_KEY = 'terramesh.locale';

/**
 * Resolve a dot-separated key ("nav.dashboard") against a locale catalog.
 * Returns undefined (never a fabricated fallback) when the key is absent —
 * callers decide fallback behaviour explicitly, so unintended fallbacks
 * surface in tests instead of hiding.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string | undefined {
  let node: unknown = resources[locale] as unknown;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  if (typeof node !== 'string') return undefined;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (_m, v: string) =>
    v in vars ? String(vars[v]) : `{${v}}`,
  );
}

/** Translate with explicit English fallback only when the caller allows it. */
export function translateWithFallback(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return translate(locale, key, vars) ?? translate('en', key, vars) ?? key;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translateWithFallback('en', key),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Restore persisted language preference (UI preference — non-sensitive,
  // ordinary storage per the security policy; tokens stay in Keychain).
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && (LOCALES as readonly string[]).includes(saved)) {
          setLocaleState(saved as Locale);
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translateWithFallback(locale, key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
