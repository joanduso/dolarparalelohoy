import { beforeEach, describe, expect, it, vi } from 'vitest';

const runIngest = vi.fn();
const dispatchRateAlerts = vi.fn();

vi.mock('@/lib/db', () => ({ prisma: {} }));
vi.mock('@/lib/ingest/run', () => ({ runIngest }));
vi.mock('@/lib/dispatchAlerts', () => ({ dispatchRateAlerts }));

describe('cron refresh route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    runIngest.mockResolvedValue({
      runId: 'run-1',
      inserted: 4,
      status: 'OK',
      sourcesUsed: ['BCB', 'BINANCE_P2P'],
      errors: []
    });
    dispatchRateAlerts.mockResolvedValue({ eligible: 2, sent: 2, skipped: 0 });
  });

  it('accepts the GET request and Bearer token sent by Vercel Cron', async () => {
    const { GET } = await import('../app/api/cron/refresh/route');
    const response = await GET(new Request('http://localhost/api/cron/refresh', {
      headers: { authorization: 'Bearer test-cron-secret' }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, inserted: 4 });
    expect(runIngest).toHaveBeenCalledOnce();
    expect(dispatchRateAlerts).toHaveBeenCalledOnce();
  });

  it('rejects a missing or invalid token', async () => {
    const { GET } = await import('../app/api/cron/refresh/route');
    const response = await GET(new Request('http://localhost/api/cron/refresh'));

    expect(response.status).toBe(401);
    expect(runIngest).not.toHaveBeenCalled();
    expect(dispatchRateAlerts).not.toHaveBeenCalled();
  });
});
