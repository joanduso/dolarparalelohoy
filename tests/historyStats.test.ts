import { describe, expect, it } from 'vitest';
import { computeHistoryStats } from '@/lib/historyStats';

describe('computeHistoryStats', () => {
  it('computes coverage, extremes, average and change in date order', () => {
    const result = computeHistoryStats([
      { date: '2026-01-03T00:00:00.000Z', value: 12 },
      { date: '2026-01-01T00:00:00.000Z', value: 10 },
      { date: '2026-01-02T00:00:00.000Z', value: 8 }
    ]);

    expect(result).toMatchObject({
      count: 3,
      firstValue: 10,
      lastValue: 12,
      minValue: 8,
      minDate: '2026-01-02T00:00:00.000Z',
      maxValue: 12,
      maxDate: '2026-01-03T00:00:00.000Z',
      averageValue: 10,
      changeAbs: 2,
      changePct: 20
    });
  });

  it('ignores invalid values and keeps the last value for a duplicate day', () => {
    const result = computeHistoryStats([
      { date: '2026-01-01T00:00:00.000Z', value: 10 },
      { date: '2026-01-01T12:00:00.000Z', value: 11 },
      { date: 'not-a-date', value: 20 },
      { date: '2026-01-02T00:00:00.000Z', value: 0 },
      { date: '2026-01-03T00:00:00.000Z', value: 12 }
    ]);

    expect(result).toMatchObject({
      count: 2,
      firstValue: 11,
      lastValue: 12
    });
  });

  it('returns null when fewer than two valid days remain', () => {
    expect(computeHistoryStats([{ date: '2026-01-01', value: 10 }])).toBeNull();
  });
});
