import { beforeEach, describe, expect, it, vi } from 'vitest';

const computeLatestMock = vi.fn();

vi.mock('@/lib/engine/priceEngine', () => ({
  computeLatest: () => computeLatestMock()
}));

describe('/api/rates/current live source behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    computeLatestMock.mockReset();
  });

  it('returns live engine values without requiring the history database', async () => {
    computeLatestMock.mockResolvedValue({
      result: {
        timestampUtc: new Date('2026-07-22T16:28:17.000Z'),
        officialBcb: 11,
        parallel: {
          buy: 11.44,
          sell: 11.315,
          mid: 11.3775,
          range: {
            buy: { min: 11.38, max: 11.5 },
            sell: { min: 11.27, max: 11.36 }
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
    });

    const { GET } = await import('../app/api/rates/current/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.updatedAt).toBe('2026-07-22T16:28:17.000Z');
    expect(payload.oficial.sell).toBe(11);
    expect(payload.paralelo.buy).toBe(11.44);
    expect(payload.sources).toEqual({ bcb: 'OK', binance_p2p: 'OK' });
  });
});
