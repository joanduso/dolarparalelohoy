import { beforeEach, describe, expect, it, vi } from 'vitest';

const computeLatestMock = vi.fn();
const getHistoryMock = vi.fn();

vi.mock('@/lib/engine/priceEngine', () => ({
  computeLatest: () => computeLatestMock()
}));

vi.mock('@/lib/engine/store', () => ({
  getHistory: (...args: unknown[]) => getHistoryMock(...args)
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: () => ({
    ok: true,
    remaining: 29,
    resetAt: Date.now() + 60_000,
    limit: 30
  })
}));

vi.mock('@/lib/auth/apiKey', () => ({
  getApiKeyAuth: () => ({ ok: false })
}));

vi.mock('next/headers', () => ({
  headers: () => new Headers({ 'x-forwarded-for': '127.0.0.1' })
}));

vi.mock('@/lib/db', () => ({ prisma: {} }));

vi.mock('@/lib/engine/query', () => ({
  parseHistoryParams: (url: URL) => ({
    ok: true,
    value: {
      from: new Date(url.searchParams.get('from') ?? '2026-07-01T00:00:00.000Z'),
      to: new Date(url.searchParams.get('to') ?? '2026-07-31T00:00:00.000Z'),
      interval: '10m'
    }
  })
}));

describe('/api/rates/history parallel history', () => {
  beforeEach(() => {
    vi.resetModules();
    computeLatestMock.mockReset();
    getHistoryMock.mockReset();

    computeLatestMock.mockResolvedValue({
      result: {
        timestampUtc: new Date('2026-07-22T18:00:00.000Z'),
        officialBcb: 6.96,
        parallel: { buy: 11.6, sell: 11.5 },
        quality: { sample_size: { buy: 20, sell: 20 } }
      }
    });

    getHistoryMock.mockResolvedValue([
      {
        timestampUtc: new Date('2026-07-22T12:00:00.000Z'),
        officialBcb: 6.96,
        parallelMid: 11.45,
        parallelBuy: 11.55,
        parallelSell: 11.4,
        sampleSizeSell: 20
      }
    ]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        points: [
          { t: '2026-07-20T12:00:00.000Z', v: 11.2 },
          { t: '2026-07-21T12:00:00.000Z', v: 11.3 },
          { t: '2026-07-22T10:00:00.000Z', v: 11.35 }
        ]
      }), { status: 200 })
    ));
  });

  it('fills sparse local data with the public daily series and keeps the live value for today', async () => {
    const { GET } = await import('../app/(site)/api/rates/history/route');
    const response = await GET(new Request(
      'https://example.test/api/rates/history?kind=PARALELO&from=2026-07-01&to=2026-07-31'
    ));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.count).toBe(3);
    expect(payload.source).toBe('paralelo.bo (CC-BY-4.0) + local');
    expect(payload.data.map((row: { date: string }) => row.date.slice(0, 10))).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22'
    ]);
    expect(payload.data[2].sell_avg).toBe(11.5);
  });
});
