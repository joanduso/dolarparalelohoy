import { describe, expect, it } from 'vitest';
import { validatePoint } from '../lib/ingest/validate';

const base = {
  kind: 'PARALELO' as const,
  timestamp: new Date('2024-01-01T00:00:00Z'),
  buy: 10,
  sell: 11,
  source: 'mock',
  currency_pair: 'USD/BOB',
  country: 'BO'
};

describe('validatePoint', () => {
  it('rejects non positive values', () => {
    const result = validatePoint({ ...base, buy: 0 });
    expect(result.ok).toBe(false);
  });

  it('accepts small changes', () => {
    const next = {
      ...base,
      timestamp: new Date('2024-01-01T00:05:00Z'),
      buy: 10.1,
      sell: 11.1
    };
    const result = validatePoint(next, base, 1);
    expect(result.ok).toBe(true);
  });

  it('requires confirmation on outliers', () => {
    const next = {
      ...base,
      timestamp: new Date('2024-01-01T00:05:00Z'),
      buy: 12,
      sell: 13
    };
    const result = validatePoint(next, base, 1);
    expect(result.ok).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
  });
});
