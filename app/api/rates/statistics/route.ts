import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getApiKeyAuth } from '@/lib/auth/apiKey';
import { rateLimit } from '@/lib/rateLimit';
import { parsePeriodParam } from '@/lib/engine/query';
import { prisma } from '@/lib/db';
import { getHistory } from '@/lib/engine/store';
import { computeStatistics } from '@/lib/engine/statistics';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();

  const auth = getApiKeyAuth();
  const limit = auth.ok ? 120 : 30;
  const limiter = rateLimit(`stats:${auth.key ?? ip}`, limit, 60_000);

  const rateHeaders = {
    'X-RateLimit-Limit': String(limiter.limit),
    'X-RateLimit-Remaining': String(limiter.remaining),
    'X-RateLimit-Reset': String(limiter.resetAt)
  };

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: rateHeaders }
    );
  }

  const url = new URL(request.url);
  const periodResult = parsePeriodParam(url);
  if (!periodResult.ok) {
    return NextResponse.json(
      { error: 'invalid_period', message: 'period must be 7d, 30d, 90d, or 1y' },
      { status: 400, headers: rateHeaders }
    );
  }

  const { period, days } = periodResult.value;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const rows = await getHistory(prisma, from, to, '1h');
  const series = rows.map((row) => ({ t: row.timestampUtc, parallel_mid: row.parallelMid }));
  const stats = computeStatistics(series);

  return NextResponse.json(
    {
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      period,
      change_percent: stats.change_percent,
      count: stats.count,
      timestamp_utc: new Date().toISOString()
    },
    { headers: rateHeaders }
  );
}
