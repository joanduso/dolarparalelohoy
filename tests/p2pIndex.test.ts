import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getParallelQuote,
  isP2PIndexFresh,
  P2P_INDEX_MAX_AGE_MS
} from '../lib/p2pIndex';

const computeLatestMock = vi.fn();

vi.mock('../lib/engine/priceEngine', () => ({
  computeLatest: computeLatestMock
}));

const NOW = Date.parse('2026-07-29T04:00:00.000Z');

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  computeLatestMock.mockReset();
});

describe('isP2PIndexFresh', () => {
  it('accepts a quote inside the freshness window', () => {
    expect(
      isP2PIndexFresh({ timestamp: '2026-07-29T03:50:00.000Z' }, NOW)
    ).toBe(true);
  });

  it('accepts a quote exactly at the freshness limit', () => {
    expect(
      isP2PIndexFresh(
        { timestamp: new Date(NOW - P2P_INDEX_MAX_AGE_MS).toISOString() },
        NOW
      )
    ).toBe(true);
  });

  it('rejects a stale quote so callers can use the live fallback', () => {
    expect(
      isP2PIndexFresh({ timestamp: '2026-07-26T19:12:27.843Z' }, NOW)
    ).toBe(false);
  });

  it('rejects invalid timestamps and excessive future clock skew', () => {
    expect(isP2PIndexFresh({ timestamp: 'invalid' }, NOW)).toBe(false);
    expect(
      isP2PIndexFresh({ timestamp: '2026-07-29T04:06:00.000Z' }, NOW)
    ).toBe(false);
  });
});

describe('getParallelQuote', () => {
  it('uses the own live quote when the multi-exchange index is stale', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timestamp: '2026-07-25T21:10:48.903Z',
        buy: 11.59,
        sell: 11.47,
        median: 11.53,
        sourceCount: 2
      })
    }));
    computeLatestMock.mockResolvedValue({
      result: {
        timestampUtc: new Date(NOW - 5 * 60 * 1000),
        parallel: { buy: 11.98, sell: 11.82 },
        quality: { sources_used: ['BINANCE'] }
      }
    });

    await expect(getParallelQuote()).resolves.toEqual({
      buy: 11.98,
      sell: 11.82,
      updatedAt: new Date(NOW - 5 * 60 * 1000).toISOString(),
      sourceCount: 1
    });
  });

  it('still rejects an own fallback quote that is also stale', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    computeLatestMock.mockResolvedValue({
      result: {
        timestampUtc: new Date(NOW - P2P_INDEX_MAX_AGE_MS - 1),
        parallel: { buy: 11.98, sell: 11.82 },
        quality: { sources_used: ['BINANCE'] }
      }
    });

    await expect(getParallelQuote()).resolves.toBeNull();
  });
});
