import { beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchTcoAlerts = vi.fn();

vi.mock('@/lib/dispatchTcoAlerts', () => ({ dispatchTcoAlerts }));

describe('TCO alert cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    dispatchTcoAlerts.mockResolvedValue({
      cutoffDate: '2026-10-02',
      eligible: 2,
      sent: 2,
      skipped: 0,
      reasons: ['TCO_CHANGE']
    });
  });

  it('runs the protected TCO monitor', async () => {
    const { GET } = await import('../app/api/cron/tco/route');
    const response = await GET(new Request('http://localhost/api/cron/tco', {
      headers: { authorization: 'Bearer test-cron-secret' }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, alerts: { sent: 2 } });
    expect(dispatchTcoAlerts).toHaveBeenCalledOnce();
  });

  it('rejects requests without the cron secret', async () => {
    const { GET } = await import('../app/api/cron/tco/route');
    const response = await GET(new Request('http://localhost/api/cron/tco'));

    expect(response.status).toBe(401);
    expect(dispatchTcoAlerts).not.toHaveBeenCalled();
  });
});
