import { describe, expect, it } from 'vitest';
import {
  computeParallelBenchmarks,
  HISTORIC_OFFICIAL_RATE
} from '@/lib/parallelBenchmarks';

describe('computeParallelBenchmarks', () => {
  it('compares the latest parallel quote with Bs 6.96 and the latest official quote', () => {
    const result = computeParallelBenchmarks(
      [
        { date: '2026-09-05T00:00:00.000Z', value: 12.2 },
        { date: '2026-09-06T00:00:00.000Z', value: 12.4 }
      ],
      [
        { date: '2026-09-04T00:00:00.000Z', value: 12.1 },
        { date: '2026-09-06T00:00:00.000Z', value: 12.32 }
      ]
    );

    expect(result?.historic.baseline).toBe(HISTORIC_OFFICIAL_RATE);
    expect(result?.historic.delta).toBeCloseTo(5.44);
    expect(result?.historic.percent).toBeCloseTo(78.1609);
    expect(result?.official?.baseline).toBe(12.32);
    expect(result?.official?.delta).toBeCloseTo(0.08);
    expect(result?.official?.percent).toBeCloseTo(0.6494);
  });

  it('ignores zero, invalid and older observations', () => {
    const result = computeParallelBenchmarks(
      [
        { date: '2026-09-07T00:00:00.000Z', value: 0 },
        { date: '2026-09-06T00:00:00.000Z', value: 12.4 },
        { date: 'invalid', value: 13 }
      ],
      []
    );

    expect(result?.parallel.value).toBe(12.4);
    expect(result?.official).toBeNull();
  });
});
