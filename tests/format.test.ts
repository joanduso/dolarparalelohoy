import { describe, expect, it } from 'vitest';
import { formatCalendarDate, formatDateTime, toCalendarDateString } from '../lib/format';

describe('formatCalendarDate', () => {
  it('formats a midnight-UTC calendar date without shifting a day (regression: America/La_Paz is UTC-4)', () => {
    // Midnight UTC on 2026-07-28 must display as July 28th, not the 27th.
    expect(formatCalendarDate('2026-07-28T00:00:00.000Z')).toBe('28 de julio de 2026');
  });

  it('formats a plain YYYY-MM-DD string', () => {
    expect(formatCalendarDate('2026-07-28')).toBe('28 de julio de 2026');
  });

  it('handles a month boundary correctly', () => {
    expect(formatCalendarDate('2026-08-01T00:00:00.000Z')).toBe('1 de agosto de 2026');
  });

  it('handles a year boundary correctly', () => {
    expect(formatCalendarDate('2025-12-31T00:00:00.000Z')).toBe('31 de diciembre de 2025');
  });

  it('accepts a Date instance directly', () => {
    expect(formatCalendarDate(new Date('2026-07-28T00:00:00.000Z'))).toBe('28 de julio de 2026');
  });
});

describe('toCalendarDateString', () => {
  it('returns a stable YYYY-MM-DD for temporalCoverage/dateModified', () => {
    expect(toCalendarDateString('2026-07-28T00:00:00.000Z')).toBe('2026-07-28');
    expect(toCalendarDateString('2026-07-28')).toBe('2026-07-28');
  });
});

describe('formatDateTime (real timestamps, unaffected by the calendar-date fix)', () => {
  it('converts a real update instant to America/La_Paz (UTC-4)', () => {
    // 2026-07-28T02:00:00Z is still July 27th at 22:00 in Bolivia (UTC-4).
    expect(formatDateTime('2026-07-28T02:00:00.000Z')).toBe('27 de julio de 2026, 22:00');
  });

  it('does not collapse a real timestamp to a calendar date (proves the two are distinct utilities)', () => {
    const asCalendar = formatCalendarDate('2026-07-28T02:00:00.000Z');
    const asTimestamp = formatDateTime('2026-07-28T02:00:00.000Z');
    expect(asCalendar).toBe('28 de julio de 2026');
    expect(asTimestamp).not.toContain('28 de julio');
  });
});
