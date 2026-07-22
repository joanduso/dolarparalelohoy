import { beforeEach, describe, expect, it, vi } from 'vitest';

const runIngest = vi.fn();

vi.mock('@/lib/db', () => ({ prisma: {} }));
vi.mock('@/lib/ingest/run', () => ({ runIngest }));

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
  });

  it('accepts the GET request and Bearer token sent by Vercel Cron', async () => {
    const { GET } = await import('../app/api/cron/refresh/route');
    const response = await GET(new Request('http://localhost/api/cron/refresh', {
      headers: { authorization: 'Bearer test-cron-secret' }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, inserted: 4 });
    expect(runIngest).toHaveBeenCalledOnce();
  });

  it('rejects a missing or invalid token', async () => {
    const { GET } = await import('../app/api/cron/refresh/route');
    const response = await GET(new Request('http://localhost/api/cron/refresh'));

    expect(response.status).toBe(401);
    expect(runIngest).not.toHaveBeenCalled();
  });
});
