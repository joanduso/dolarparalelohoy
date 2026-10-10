import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computeBrecha, toNumberOrNull } from '../lib/rates/normalize';

const findFirstMock = vi.fn();
const computeLatestMock = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    ratesHistory: {
      findFirst: (...args: unknown[]) => findFirstMock(...args)
    }
  }
}));

vi.mock('@/lib/engine/priceEngine', () => ({
  computeLatest: (...args: unknown[]) => computeLatestMock(...args)
}));

vi.mock('@/lib/rates/normalize', async () => {
  const actual = await import('../lib/rates/normalize');
  return actual;
});

beforeEach(() => {
  vi.resetModules();
  findFirstMock.mockReset();
  computeLatestMock.mockReset();
});

describe('toNumberOrNull', () => {
  it('handles empty and invalid values safely', () => {
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull('   ')).toBeNull();
    expect(toNumberOrNull('6.96')).toBe(6.96);
    expect(toNumberOrNull('abc')).toBeNull();
    expect(toNumberOrNull(Number.NaN)).toBeNull();
  });
});

describe('computeBrecha', () => {
  it('computes gap_abs and gap_pct with correct direction', () => {
    const result = computeBrecha(9.07, 6.96);
    expect(result.gapAbs).toBeCloseTo(2.11, 2);
    expect(result.gapPct).toBeCloseTo(30.316, 3);
  });

  it('returns nulls when values are missing', () => {
    expect(computeBrecha(undefined, 6.96)).toEqual({ gapAbs: null, gapPct: null });
    expect(computeBrecha(9.07, '')).toEqual({ gapAbs: null, gapPct: null });
  });
});

describe('/api/rates/current', () => {
  it('ignores invalid official outlier instead of returning absurd brecha', async () => {
    computeLatestMock.mockResolvedValue({
      cached: false,
      result: {
        timestampUtc: new Date('2026-02-12T12:00:00Z'),
        officialBcb: 25,
        parallel: {
          buy: 9.01,
          sell: 9.07,
          mid: 9.04,
          range: {
            buy: { min: 9, max: 9.02 },
            sell: { min: 9.06, max: 9.08 }
          }
        },
        delta: { vs_5m: null, vs_24h: null },
        quality: {
          confidence: 'HIGH',
          sample_size: { buy: 18, sell: 19 },
          sources_used: ['BCB', 'BINANCE'],
          status: 'DEGRADED',
          notes: 'test result'
        },
        errors: []
      }
    });
    findFirstMock.mockResolvedValue({
      timestampUtc: new Date('2026-02-12T12:00:00Z'),
      status: 'DEGRADED',
      sourcesUsed: ['BCB', 'BINANCE_P2P'],
      officialBcb: 25,
      parallelBuy: 9.01,
      parallelSell: 9.07,
      sampleSizeBuy: 18,
      sampleSizeSell: 19,
      notes: 'test row'
    });

    const { GET } = await import('../app/api/rates/current/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.oficial.buy).toBeNull();
    expect(payload.oficial.sell).toBeNull();
    expect(payload.brecha.gap_abs).toBeNull();
    expect(payload.brecha.gap_pct).toBeNull();
    expect(payload.paralelo.sell).toBeCloseTo(9.07, 2);
  });
});
