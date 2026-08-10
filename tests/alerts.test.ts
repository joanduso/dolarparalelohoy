import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  parseAlertPreferences,
  shouldSendAlert
} from '../lib/alerts';

describe('alert subscription helpers', () => {
  it('normalizes valid emails and rejects invalid input', () => {
    expect(normalizeEmail(' Persona@Example.COM ')).toBe('persona@example.com');
    expect(normalizeEmail('sin-arroba')).toBeNull();
  });

  it('accepts daily and supported threshold preferences', () => {
    expect(parseAlertPreferences({ frequency: 'DAILY' })).toEqual({
      frequency: 'DAILY',
      thresholdPct: null
    });
    expect(parseAlertPreferences({ frequency: 'THRESHOLD', thresholdPct: '5' })).toEqual({
      frequency: 'THRESHOLD',
      thresholdPct: 5
    });
    expect(parseAlertPreferences({ frequency: 'THRESHOLD', thresholdPct: 4 })).toBeNull();
  });

  it('sends at most once per Bolivia calendar day', () => {
    expect(shouldSendAlert({
      frequency: 'DAILY',
      thresholdPct: null,
      changePct: 1,
      lastSentAt: new Date('2026-08-10T13:00:00Z'),
      now: new Date('2026-08-10T20:00:00Z')
    })).toBe(false);
  });

  it('respects the selected percentage threshold', () => {
    expect(shouldSendAlert({
      frequency: 'THRESHOLD',
      thresholdPct: 3,
      changePct: -3.2,
      lastSentAt: null,
      now: new Date('2026-08-10T12:00:00Z')
    })).toBe(true);
    expect(shouldSendAlert({
      frequency: 'THRESHOLD',
      thresholdPct: 3,
      changePct: 2.9,
      lastSentAt: null,
      now: new Date('2026-08-10T12:00:00Z')
    })).toBe(false);
  });
});
