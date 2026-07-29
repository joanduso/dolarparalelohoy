import { describe, expect, it } from 'vitest';
import { isP2PIndexFresh, P2P_INDEX_MAX_AGE_MS } from '../lib/p2pIndex';

const NOW = Date.parse('2026-07-29T04:00:00.000Z');

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
