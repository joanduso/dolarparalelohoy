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
export const maxDuration = 30;

type HistoryDataRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
  sources_count: number;
};

type PublicParallelHistory = {
  points?: Array<{ t: string; v: number }>;
};

async function getPublicParallelHistory(from: Date, to: Date): Promise<HistoryDataRow[]> {
  try {
    const response = await fetch('https://paralelo.bo/api/v1/historical.json', {
      next: { revalidate: 60 * 60 }
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as PublicParallelHistory;
    return (payload.points ?? [])
      .filter((point) => {
        const timestamp = new Date(point.t).getTime();
        return Number.isFinite(point.v) && point.v > 0 && timestamp >= from.getTime() && timestamp <= to.getTime();
      })
      .map((point) => ({
        date: point.t,
        buy_avg: point.v,
        sell_avg: point.v,
        sources_count: 1
      }));
  } catch (error) {
    console.warn('[rates-history] public parallel history unavailable', String(error));
    return [];
  }
}

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

  let { from, to, interval } = parsed.value;
  const daysParam = Number(url.searchParams.get('days'));
  if (Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 1000) {
    from = new Date(to.getTime() - daysParam * 24 * 60 * 60 * 1000);
  }

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

  // The local database is intentionally sparse (it stores recent snapshots).
  // Always use the licensed public daily series as the base for the parallel
  // chart, then let local and live values override matching calendar days.
  const publicHistory =
    kindParam === 'PARALELO'
      ? await getPublicParallelHistory(from, to)
      : [];

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
  const data = dailyRows([...publicHistory, ...storedData, ...liveRow]);

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    interval,
    series,
    // Legacy fields to avoid breaking current frontend.
    kind: kindParam,
    count: data.length,
    data,
    source:
      publicHistory.length > 0 && storedData.length > 0
        ? 'paralelo.bo (CC-BY-4.0) + local'
        : publicHistory.length > 0
          ? 'paralelo.bo (CC-BY-4.0)'
          : 'local'
  }, { headers: rateHeaders });
}
