import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from '../lib/engine/cache';
import type { Sample } from '../lib/engine/types';

const fetchBCBMock = vi.fn();
const fetchBinanceP2PMock = vi.fn();
const getLatestRunMock = vi.fn();
const getRun24hAgoMock = vi.fn();
const saveRunMock = vi.fn();

vi.mock('../lib/engine/sources/bcb', () => ({
  fetchBCB: (...args: unknown[]) => fetchBCBMock(...args)
}));

vi.mock('../lib/engine/sources/binance', () => ({
  fetchBinanceP2P: (...args: unknown[]) => fetchBinanceP2PMock(...args)
}));

vi.mock('../lib/engine/store', () => ({
  getLatestRun: (...args: unknown[]) => getLatestRunMock(...args),
  getRun24hAgo: (...args: unknown[]) => getRun24hAgoMock(...args),
  saveRun: (...args: unknown[]) => saveRunMock(...args)
}));

vi.mock('@/lib/db', () => ({ prisma: {} }));

function makeSamples(side: Sample['side'], count: number, priceBase: number): Sample[] {
  return Array.from({ length: count }, (_, idx) => ({
    price: priceBase + idx * 0.01,
    side,
    source: 'BINANCE',
    timestamp: new Date('2024-01-01T00:00:00Z')
  }));
}

beforeEach(() => {
  clearCache('latest');
  clearCache('bcb');
  clearCache('binance');
  fetchBCBMock.mockReset();
  fetchBinanceP2PMock.mockReset();
  getLatestRunMock.mockReset();
  getRun24hAgoMock.mockReset();
  saveRunMock.mockReset();
});

describe('computeLatest (DB down)', () => {
  it('returns result without throwing, with null deltas and DEGRADED status when DB fails', async () => {
    fetchBCBMock.mockResolvedValue({
      official_rate: 6.96,
      timestamp: new Date('2024-01-01T00:00:00Z'),
      source: 'BCB',
      meta: { dateText: null, compraText: null, ventaText: null }
    });
    fetchBinanceP2PMock.mockResolvedValue([
      ...makeSamples('buy', 8, 7.0),
      ...makeSamples('sell', 8, 7.1)
    ]);
    getLatestRunMock.mockRejectedValue(new Error('db down'));
    getRun24hAgoMock.mockRejectedValue(new Error('db down'));

    const { computeLatest } = await import('../lib/engine/priceEngine');
    const { result } = await computeLatest();

    expect(result.delta.vs_5m).toBeNull();
    expect(result.delta.vs_24h).toBeNull();
    expect(result.quality.status).toBe('DEGRADED');
    expect(result.quality.notes ?? '').toContain('DB unavailable');
  });
});
