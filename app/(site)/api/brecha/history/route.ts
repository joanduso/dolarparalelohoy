import { NextResponse } from 'next/server';
import { getBrechaHistory } from '@/lib/queries';
import { prisma } from '@/lib/db';
import { ensureFreshRates } from '@/lib/ingest/ensureFresh';
import { getPublicOficialHistory, getPublicParallelHistory } from '@/lib/sources/publicHistory';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

type BrechaRow = {
  date: string;
  official_sell: number;
  paralelo_sell: number;
  gap_abs: number;
  gap_pct: number;
};

export async function GET(request: Request) {
  await ensureFreshRates(prisma, 10 * 60_000);
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('days') ?? '365');
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 365;

  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const [oficialHistory, paraleloHistory, localData] = await Promise.all([
    getPublicOficialHistory(from, to),
    getPublicParallelHistory(from, to),
    getBrechaHistory(days)
  ]);

  const oficialByDay = new Map(oficialHistory.map((row) => [row.date.slice(0, 10), row.sell_avg]));
  const paraleloByDay = new Map(paraleloHistory.map((row) => [row.date.slice(0, 10), row.sell_avg]));

  const publicRows = new Map<string, BrechaRow>();
  for (const [day, officialSell] of oficialByDay) {
    const parallelSell = paraleloByDay.get(day);
    if (!parallelSell || officialSell <= 0) continue;
    const gapAbs = parallelSell - officialSell;
    publicRows.set(day, {
      date: new Date(`${day}T00:00:00.000Z`).toISOString(),
      official_sell: officialSell,
      paralelo_sell: parallelSell,
      gap_abs: gapAbs,
      gap_pct: (gapAbs / officialSell) * 100
    });
  }

  // Local rows come from live intraday snapshots and take precedence over
  // the reconstructed public series when both cover the same calendar day.
  for (const row of localData) {
    const day = row.date.toISOString().slice(0, 10);
    publicRows.set(day, {
      date: row.date.toISOString(),
      official_sell: row.official_sell,
      paralelo_sell: row.paralelo_sell,
      gap_abs: row.gap_abs,
      gap_pct: row.gap_pct
    });
  }

  const data = Array.from(publicRows.values()).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    days,
    count: data.length,
    data
  });
}
