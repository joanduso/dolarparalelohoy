import { beforeEach, describe, expect, it, vi } from 'vitest';

const computeLatestMock = vi.fn();
const getLatestRunMock = vi.fn();

vi.mock('@/lib/engine/priceEngine', () => ({
  computeLatest: () => computeLatestMock()
}));

vi.mock('@/lib/engine/store', () => ({
  getLatestRun: (...args: unknown[]) => getLatestRunMock(...args)
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: () => ({
    ok: true,
    remaining: 59,
    resetAt: Date.now() + 60_000,
    limit: 60
  })
}));

vi.mock('@/lib/auth/apiKey', () => ({
  getApiKeyAuth: () => ({ ok: false })
}));

vi.mock('next/headers', () => ({
  headers: () => new Headers({ 'x-forwarded-for': '127.0.0.1' })
}));

vi.mock('@/lib/db', () => ({ prisma: {} }));

beforeEach(() => {
  vi.resetModules();
  computeLatestMock.mockReset();
  getLatestRunMock.mockReset();
});

describe('/api/rates/latest fallback behavior', () => {
  it('returns 503 with JSON when computeLatest throws and DB fallback fails', async () => {
    computeLatestMock.mockRejectedValue(new Error('engine down'));
    getLatestRunMock.mockRejectedValue(new Error('db down'));

    const { GET } = await import('../app/(site)/api/rates/latest/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.quality.status).toBe('ERROR');
    expect(Array.isArray(payload.errors)).toBe(true);
  });

  it('returns 200 DEGRADED when computeLatest throws and DB fallback succeeds', async () => {
    computeLatestMock.mockRejectedValue(new Error('engine down'));
    getLatestRunMock.mockResolvedValue({
      timestampUtc: new Date('2024-01-01T00:00:00Z'),
      officialBcb: 6.96,
      parallelBuy: 7.0,
      parallelSell: 7.1,
      parallelMid: 7.05,
      minBuy: 6.9,
      maxBuy: 7.1,
      minSell: 7.0,
      maxSell: 7.2,
      confidence: 'MEDIUM',
      sampleSizeBuy: 10,
      sampleSizeSell: 11,
      sourcesUsed: ['BCB', 'BINANCE']
    });

    const { GET } = await import('../app/(site)/api/rates/latest/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.quality.status).toBe('DEGRADED');
  });
});
