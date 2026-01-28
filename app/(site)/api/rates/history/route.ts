import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/apiRateLimit';
import { getHistory, type RateHistoryRow } from '@/lib/engine/store';
import { computeLatest } from '@/lib/engine/priceEngine';
import { prisma } from '@/lib/db';

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
  const limiter = rateLimit(`history:${ip}`, 30, 60_000);

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  await computeLatest();

  const url = new URL(request.url);
  const kindParam = url.searchParams.get('kind')?.toUpperCase() ?? 'PARALELO';
  if (!['PARALELO', 'OFICIAL'].includes(kindParam)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }

  const interval = url.searchParams.get('interval') ?? '10m';
  if (!/^\d+(m|h)$/i.test(interval)) {
    return NextResponse.json({ error: 'invalid_interval' }, { status: 400 });
  }

  let to = parseDate(url.searchParams.get('to'), new Date());
  const daysParam = Number(url.searchParams.get('days') ?? '');
  const defaultFrom = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  let from = parseDate(url.searchParams.get('from'), defaultFrom);

  if (!Number.isNaN(daysParam) && daysParam > 0) {
    from = new Date(to.getTime() - daysParam * 24 * 60 * 60 * 1000);
  }

  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }

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
  });
}
