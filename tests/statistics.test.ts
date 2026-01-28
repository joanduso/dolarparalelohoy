import { describe, expect, it } from 'vitest';
import { computeStatistics } from '../lib/engine/statistics';

describe('computeStatistics', () => {
  it('computes min, max, avg and change_percent', () => {
    const data = [
      { t: new Date('2024-01-01T00:00:00Z'), parallel_mid: 10 },
      { t: new Date('2024-01-02T00:00:00Z'), parallel_mid: 12 },
      { t: new Date('2024-01-03T00:00:00Z'), parallel_mid: 11 }
    ];

    const result = computeStatistics(data);

    expect(result.min).toBe(10);
    expect(result.max).toBe(12);
    expect(result.avg).toBeCloseTo(11, 5);
    expect(result.change_percent).toBeCloseTo(10, 5);
    expect(result.count).toBe(3);
  });

  it('handles empty dataset', () => {
    const result = computeStatistics([]);
    expect(result.min).toBeNull();
    expect(result.max).toBeNull();
    expect(result.avg).toBeNull();
    expect(result.change_percent).toBeNull();
    expect(result.count).toBe(0);
  });
});
