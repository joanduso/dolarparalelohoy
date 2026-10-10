import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const computeLatestMock = vi.fn();
const getHistoryMock = vi.fn();
const getLatestRunMock = vi.fn();
const getPublicParallelHistoryMock = vi.fn();
const getPublicOficialHistoryMock = vi.fn();

vi.mock('next/cache', () => ({
  unstable_cache: (callback: (...args: unknown[]) => unknown) => callback
}));

vi.mock('@/lib/db', () => ({ prisma: {} }));

vi.mock('@/lib/engine/priceEngine', () => ({
  computeLatest: (...args: unknown[]) => computeLatestMock(...args)
}));

vi.mock('@/lib/engine/store', () => ({
  getHistory: (...args: unknown[]) => getHistoryMock(...args),
  getLatestRun: (...args: unknown[]) => getLatestRunMock(...args)
}));

vi.mock('@/lib/sources/publicHistory', () => ({
  getPublicParallelHistory: (...args: unknown[]) => getPublicParallelHistoryMock(...args),
  getPublicOficialHistory: (...args: unknown[]) => getPublicOficialHistoryMock(...args)
}));

function latestResult(officialBcb: number | null) {
  return {
    cached: false,
    result: {
      timestampUtc: new Date('2026-10-10T12:00:00.000Z'),
      officialBcb,
      parallel: {
        buy: 11.7,
        sell: 11.8,
        mid: 11.75,
        range: {
          buy: { min: 11.6, max: 11.8 },
          sell: { min: 11.7, max: 11.9 }
        }
      },
      delta: { vs_5m: null, vs_24h: null },
      quality: {
        confidence: 'HIGH',
        sample_size: { buy: 20, sell: 20 },
        sources_used: ['BCB', 'BINANCE'],
        status: 'OK',
        notes: null
      },
      errors: []
    }
  };
}

describe('site data during production builds', () => {
  beforeEach(() => {
    process.env.NEXT_PHASE = 'phase-production-build';
    vi.resetModules();
    computeLatestMock.mockReset();
    getHistoryMock.mockReset();
    getLatestRunMock.mockReset();
    getPublicParallelHistoryMock.mockReset();
    getPublicOficialHistoryMock.mockReset();
    getPublicParallelHistoryMock.mockResolvedValue([
      {
        date: '2026-10-09T00:00:00.000Z',
        buy_avg: 11.7,
        sell_avg: 11.8,
        sources_count: 3
      }
    ]);
    getPublicOficialHistoryMock.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.NEXT_PHASE;
  });

  it('builds historical pages from public data without Prisma or a live quote', async () => {
    const { getRateHistoryData } = await import('../lib/siteData');
    const result = await getRateHistoryData('PARALELO', 30);

    expect(result.data).toHaveLength(1);
    expect(getHistoryMock).not.toHaveBeenCalled();
    expect(computeLatestMock).not.toHaveBeenCalled();
    expect(getLatestRunMock).not.toHaveBeenCalled();
  });

  it('does not query the persisted fallback when a build-time source is incomplete', async () => {
    computeLatestMock.mockResolvedValue(latestResult(null));
    getLatestRunMock.mockResolvedValue({ officialBcb: 6.96 });

    const { getCurrentRatesData } = await import('../lib/siteData');
    const result = await getCurrentRatesData();

    expect(result.oficial?.sell).toBeNull();
    expect(result.paralelo?.sell).toBe(11.8);
    expect(getLatestRunMock).not.toHaveBeenCalled();
  });
});
