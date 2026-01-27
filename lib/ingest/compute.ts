import type { PrismaClient, RateKind } from '@prisma/client';

const BASE_SOURCE = 'base-median';

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function computeDailyAggregates(
  prisma: PrismaClient,
  kind: RateKind,
  days = 120
) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const points = await prisma.ratePoint.findMany({
    where: { kind, source: { not: BASE_SOURCE }, timestamp: { gte: from } },
    orderBy: { timestamp: 'asc' }
  });

  const grouped = new Map<string, typeof points>();
  points.forEach((point) => {
    const key = dateKey(point.timestamp);
    const existing = grouped.get(key) ?? [];
    existing.push(point);
    grouped.set(key, existing);
  });

  for (const [key, rows] of grouped.entries()) {
    const buys: number[] = rows.map((row) => row.buy);
    const sells: number[] = rows.map((row) => row.sell);
    const sources = new Set(rows.map((row) => row.source));

    const buy_avg = buys.reduce((a: number, b: number) => a + b, 0) / buys.length;
    const sell_avg = sells.reduce((a: number, b: number) => a + b, 0) / sells.length;

    await prisma.dailyAggregate.upsert({
      where: {
        kind_date: {
          kind,
          date: startOfDay(new Date(key))
        }
      },
      update: {
        buy_avg,
        sell_avg,
        buy_min: Math.min(...buys),
        buy_max: Math.max(...buys),
        sell_min: Math.min(...sells),
        sell_max: Math.max(...sells),
        sources_count: sources.size
      },
      create: {
        kind,
        date: startOfDay(new Date(key)),
        buy_avg,
        sell_avg,
        buy_min: Math.min(...buys),
        buy_max: Math.max(...buys),
        sell_min: Math.min(...sells),
        sell_max: Math.max(...sells),
        sources_count: sources.size
      }
    });
  }
}

export async function computeBrecha(prisma: PrismaClient, days = 120) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const paralelo = await prisma.dailyAggregate.findMany({
    where: { kind: 'PARALELO', date: { gte: from } }
  });
  const oficial = await prisma.dailyAggregate.findMany({
    where: { kind: 'OFICIAL', date: { gte: from } }
  });

  const officialMap = new Map(oficial.map((row) => [dateKey(row.date), row]));

  for (const row of paralelo) {
    const match = officialMap.get(dateKey(row.date));
    if (!match) continue;

    const gap_abs = row.sell_avg - match.sell_avg;
    const gap_pct = (gap_abs / match.sell_avg) * 100;

    await prisma.breachDaily.upsert({
      where: { date: row.date },
      update: {
        official_sell: match.sell_avg,
        paralelo_sell: row.sell_avg,
        gap_abs,
        gap_pct
      },
      create: {
        date: row.date,
        official_sell: match.sell_avg,
        paralelo_sell: row.sell_avg,
        gap_abs,
        gap_pct
      }
    });
  }
}
