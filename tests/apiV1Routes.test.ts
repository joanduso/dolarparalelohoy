import { describe, expect, it } from 'vitest';
import { GET as currentGet } from '@/app/api/rates/current/route';
import { GET as currentV1Get } from '@/app/api/v1/rates/current/route';
import { GET as historyGet } from '@/app/(site)/api/rates/history/route';
import { GET as historyV1Get } from '@/app/api/v1/rates/history/route';
import { GET as statisticsGet } from '@/app/api/rates/statistics/route';
import { GET as statisticsV1Get } from '@/app/api/v1/rates/statistics/route';

describe('public API v1 routes', () => {
  it('exposes the documented endpoints through the existing handlers', () => {
    expect(currentV1Get).toBe(currentGet);
    expect(historyV1Get).toBe(historyGet);
    expect(statisticsV1Get).toBe(statisticsGet);
  });
});
