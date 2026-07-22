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

type HistoryDataRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
  sources_count: number;
};

function dailyRows(rows: HistoryDataRow[]) {
  const byDay = new Map<string, HistoryDataRow>();
  for (const row of rows) {
    if (row.buy_avg <= 0 || row.sell_avg <= 0) continue;
    byDay.set(row.date.slice(0, 10), row);
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

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

  const { result: latest } = await computeLatest();

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

  let rows: RateHistoryRow[] = [];
  try {
    rows = await getHistory(prisma, from, to, interval);
  } catch (error) {
    console.warn('[rates-history] persistent history unavailable', String(error));
  }
  const series = rows.map((row: RateHistoryRow) => ({
    t: row.timestampUtc.toISOString(),
    official_bcb: row.officialBcb,
    parallel_mid: row.parallelMid,
    parallel_buy: row.parallelBuy,
    parallel_sell: row.parallelSell
  }));

  const storedData = rows.map((row: RateHistoryRow) => ({
    date: row.timestampUtc.toISOString(),
    buy_avg: kindParam === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelBuy ?? 0,
    sell_avg: kindParam === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelSell ?? 0,
    sources_count: row.sampleSizeSell ?? 0
  }));

  const liveBuy = kindParam === 'OFICIAL' ? latest.officialBcb : latest.parallel.buy;
  const liveSell = kindParam === 'OFICIAL' ? latest.officialBcb : latest.parallel.sell;
  const liveRow: HistoryDataRow[] =
    liveBuy !== null && liveSell !== null
      ? [{
          date: latest.timestampUtc.toISOString(),
          buy_avg: liveBuy,
          sell_avg: liveSell,
          sources_count:
            kindParam === 'OFICIAL' ? 1 : Math.max(latest.quality.sample_size.buy, latest.quality.sample_size.sell)
        }]
      : [];
  const data = dailyRows([...storedData, ...liveRow]);

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
