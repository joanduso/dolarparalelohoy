import { describe, expect, it } from 'vitest';
import { normalizeRaw } from '../lib/ingest/normalize';

describe('normalizeRaw', () => {
  it('normalizes raw payload', () => {
    const result = normalizeRaw({
      kind: 'PARALELO',
      timestamp: '2024-01-01T00:00:00Z',
      buy: 10,
      sell: 11,
      source: 'mock',
      currencyPair: 'USD/BOB',
      country: 'BO',
      raw: { ok: true }
    });

    expect(result.kind).toBe('PARALELO');
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.buy).toBe(10);
    expect(result.sell).toBe(11);
    expect(result.currency_pair).toBe('USD/BOB');
  });
});
