import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { getApiKeyAuth } from '@/lib/auth/apiKey';
import { getHistory, type RateHistoryRow } from '@/lib/engine/store';
import { computeLatest } from '@/lib/engine/priceEngine';
import { prisma } from '@/lib/db';
import { parseHistoryParams } from '@/lib/engine/query';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const auth = getApiKeyAuth();
  const limit = auth.ok ? 120 : 30;
  const limiter = rateLimit(`history:${auth.key ?? ip}`, limit, 60_000);
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

  await computeLatest();

  const url = new URL(request.url);
  const kindParam = url.searchParams.get('kind')?.toUpperCase() ?? 'PARALELO';
  if (!['PARALELO', 'OFICIAL'].includes(kindParam)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400, headers: rateHeaders });
  }

  const parsed = parseHistoryParams(url);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: rateHeaders }
    );
  }

  const { from, to, interval } = parsed.value;

  const rows = await getHistory(prisma, from, to, interval);
  const series = rows.map((row: RateHistoryRow) => ({
    t: row.timestampUtc.toISOString(),
    official_bcb: row.officialBcb,
    parallel_mid: row.parallelMid,
    parallel_buy: row.parallelBuy,
    parallel_sell: row.parallelSell
  }));

  const data = rows.map((row: RateHistoryRow) => ({
    date: row.timestampUtc.toISOString(),
    buy_avg: kindParam === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelBuy ?? 0,
    sell_avg: kindParam === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelSell ?? 0,
    sources_count: row.sampleSizeSell ?? 0
  }));

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    interval,
    series,
    // Legacy fields to avoid breaking current frontend.
    kind: kindParam,
    count: data.length,
    data
  }, { headers: rateHeaders });
}
