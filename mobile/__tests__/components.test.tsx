/**
 * Component + offline-state tests using the TerraMesh mobile design system.
 * Verifies status text is never color-only and offline banner is honest.
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { I18nProvider, useI18n } from '../src/i18n';
import {
  StatusBadge,
  EmptyState,
  ErrorState,
  OfflineBanner,
  ConnectionIndicator,
  LoadingState,
} from '../src/components';

describe('StatusBadge', () => {
  it('always renders textual status (never color-only)', async () => {
    const { getByText } = await render(<StatusBadge status="CRITICAL" />);
    expect(getByText('CRITICAL')).toBeTruthy();
  });

  it('renders WARNING and OFFLINE as text', async () => {
    const { getByText } = await render(<StatusBadge status="OFFLINE" />);
    expect(getByText('OFFLINE')).toBeTruthy();
  });
});

describe('ConnectionIndicator', () => {
  it('shows LIVE when online', async () => {
    const { getByText } = await render(<ConnectionIndicator state="ONLINE" />);
    expect(getByText('LIVE')).toBeTruthy();
  });

  it('shows RECONNECTING as text, not just a spinner', async () => {
    const { getByText } = await render(<ConnectionIndicator state="RECONNECTING" />);
    expect(getByText('RECONNECTING')).toBeTruthy();
  });

  it('shows OFFLINE as text', async () => {
    const { getByText } = await render(<ConnectionIndicator state="OFFLINE" />);
    expect(getByText('OFFLINE')).toBeTruthy();
  });
});

describe('OfflineBanner', () => {
  it('states cached data, never claims live', async () => {
    const lastSync = new Date('2026-09-25T10:00:00Z');
    const { getByText } = await render(<OfflineBanner lastSync={lastSync} />);
    const text = getByText(/OFFLINE/i).props.children.join
      ? getByText(/OFFLINE/i).props.children.join('')
      : String(getByText(/OFFLINE/i).props.children);
    expect(text).toContain('OFFLINE');
    expect(text).toContain('cached');
    expect(text).not.toContain('LIVE');
  });
});

describe('Loading / Empty / Error states', () => {
  it('LoadingState renders a label (no blank screen)', async () => {
    const { getByText } = await render(<LoadingState label="Loading mine status..." />);
    expect(getByText('Loading mine status...')).toBeTruthy();
  });

  it('EmptyState renders title and subtitle', async () => {
    const { getByText } = await render(<EmptyState title="No alerts" subtitle="All clear" />);
    expect(getByText('No alerts')).toBeTruthy();
    expect(getByText('All clear')).toBeTruthy();
  });

  it('ErrorState renders message and retry', async () => {
    const { getByText } = await render(<ErrorState message="Backend unreachable" onRetry={() => {}} />);
    expect(getByText('Backend unreachable')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });
});

describe('I18nProvider', () => {
  function Probe() {
    const { locale, t, setLocale } = useI18n();
    return (
      <>
        <Text testID="loc">{locale}</Text>
        <Text testID="tr">{t('nav.alerts')}</Text>
        <Text onPress={() => setLocale('hi')}>switch</Text>
      </>
    );
  }

  it('defaults to English and translates', async () => {
    const { getByTestId, getByText } = await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(getByTestId('loc').props.children).toBe('en');
    expect(getByTestId('tr').props.children).toBe('Alerts');
  });

  it('switching locale to Hindi translates immediately', async () => {
    const { getByTestId, getByText } = await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    await act(async () => { getByText('switch').props.onPress(); });
    expect(getByTestId('tr').props.children).toBe('चेतावनी');
  });
});
