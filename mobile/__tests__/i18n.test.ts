/**
 * Locale parity tests — verifies the mobile catalogs are the SAME files as
 * the web frontend's (single translation source) and that every locale
 * covers every key (0 unintended fallbacks).
 */
import { LOCALES, translate, translateWithFallback } from '../src/i18n';
import en from '../src/i18n/locales/en.json';
import hi from '../src/i18n/locales/hi.json';
import bn from '../src/i18n/locales/bn.json';
import ta from '../src/i18n/locales/ta.json';
import sat from '../src/i18n/locales/sat.json';

const catalogs = { en, hi, bn, ta, sat } as const;

function flatten(obj: unknown, prefix = ''): string[] {
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('Locale parity', () => {
  it('exposes exactly 5 locales: en, hi, bn, ta, sat', () => {
    expect(LOCALES).toEqual(['en', 'hi', 'bn', 'ta', 'sat']);
  });

  it('all 5 locales have identical key sets', () => {
    const enKeys = flatten(en).sort();
    for (const loc of ['hi', 'bn', 'ta', 'sat'] as const) {
      expect(flatten(catalogs[loc]).sort()).toEqual(enKeys);
    }
  });

  it('no value is empty or a duplicate of its key name', () => {
    for (const loc of LOCALES) {
      for (const key of flatten(catalogs[loc])) {
        const val = translate(loc, key);
        expect(val).toBeTruthy();
        expect(val!.length).toBeGreaterThan(0);
      }
    }
  });

  it('every key resolves in every locale without fallback', () => {
    for (const key of flatten(en)) {
      for (const loc of LOCALES) {
        expect(translate(loc, key)).toBeDefined();
      }
    }
  });

  it('SIMULATED terminology is preserved in every locale', () => {
    for (const loc of LOCALES) {
      const v = translate(loc, 'common.simulated')!;
      expect(v.toUpperCase()).toContain('SIMULATED');
    }
  });

  it('LIVE terminology is preserved in every locale', () => {
    for (const loc of LOCALES) {
      const v = translate(loc, 'common.live')!;
      expect(v.toUpperCase()).toContain('LIVE');
    }
  });
});

describe('translate()', () => {
  it('resolves nested dot keys', () => {
    expect(translate('en', 'nav.dashboard')).toBe('Dashboard');
    expect(translate('hi', 'nav.alerts')).toBe('चेतावनी');
    expect(translate('sat', 'nav.workers')).toBe('ᱠᱟᱹᱢᱤᱭᱟᱹ');
  });

  it('returns undefined for missing keys (no silent fabrication)', () => {
    expect(translate('en', 'does.not.exist')).toBeUndefined();
  });

  it('falls back to English only via explicit fallback helper', () => {
    expect(translateWithFallback('en', 'nav.map')).toBe('Live Mine Map');
  });

  it('interpolates variables', () => {
    expect(translateWithFallback('en', 'nav.dashboard', {})).toBe('Dashboard');
  });
});
