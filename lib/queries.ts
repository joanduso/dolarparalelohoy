import { unstable_cache } from 'next/cache';
import { prisma } from './db';
import type { RateKind, DeclaredSide, DeclaredRate } from '@/lib/types';
import { confidenceLevel, median } from './declared';

const BASE_SOURCE = 'base-median';

export type LatestRate = {
  kind: RateKind;
  timestamp: Date;
  buy: number;
  sell: number;
  sourcesCount: number;
};

export type DeclaredSnapshot = {
  median: number | null;
  count: number;
  updatedAt: Date | null;
  confidence: string;
};

export type DeclaredAggregate = {
  buy: number | null;
  sell: number | null;
  sampleSize: number;
  updatedAt: Date | null;
};

const DECLARED_WINDOW_MS = 24 * 60 * 60 * 1000;
const DECLARED_LIMIT = 200;

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getLatestRate(kind: RateKind): Promise<LatestRate | null> {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        const latest = await prisma.ratePoint.findFirst({
          where: { kind, source: BASE_SOURCE },
          orderBy: { timestamp: 'desc' }
        });
        if (!latest) return null;

        const raw = latest.raw as { sources_used?: string[] } | null;
        let sourcesCount = raw?.sources_used?.length ?? 0;

        if (!sourcesCount) {
          const sources = await prisma.ratePoint.findMany({
            where: {
              kind,
              source: { not: BASE_SOURCE },
              timestamp: {
                gte: new Date(latest.timestamp.getTime() - 2 * 60 * 60 * 1000)
              }
            },
            select: { source: true },
            distinct: ['source']
          });
          sourcesCount = sources.length;
        }

        return {
          kind,
          timestamp: latest.timestamp,
          buy: latest.buy,
          sell: latest.sell,
          sourcesCount
        };
      }, null);
    },
    ['latest-rate', kind],
    { revalidate: 60 }
  );

  return cached();
}

export async function getDailyHistory(kind: RateKind, days: number) {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        return prisma.dailyAggregate.findMany({
          where: { kind, date: { gte: fromDate } },
          orderBy: { date: 'asc' }
        });
      }, []);
    },
    ['daily-history', kind, String(days)],
    { revalidate: 300 }
  );

  return cached();
}

export async function getBrechaHistory(days: number) {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        return prisma.breachDaily.findMany({
          where: { date: { gte: fromDate } },
          orderBy: { date: 'asc' }
        });
      }, []);
    },
    ['brecha-history', String(days)],
    { revalidate: 300 }
  );

  return cached();
}

export async function getLatestBrecha() {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        return prisma.breachDaily.findFirst({
          orderBy: { date: 'desc' }
        });
      }, null);
    },
    ['brecha-latest'],
    { revalidate: 60 }
  );

  return cached();
}

export async function getMiniTable(kind: RateKind, days = 14) {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        return prisma.dailyAggregate.findMany({
          where: { kind, date: { gte: fromDate } },
          orderBy: { date: 'desc' }
        });
      }, []);
    },
    ['mini-table', kind, String(days)],
    { revalidate: 300 }
  );

  return cached();
}

export async function getLatestSnapshot() {
  const [paralelo, oficial, brecha] = await Promise.all([
    getLatestRate('PARALELO'),
    getLatestRate('OFICIAL'),
    getLatestBrecha()
  ]);

  return { paralelo, oficial, brecha };
}

export async function getDeclaredLatest(side: DeclaredSide = 'SELL'): Promise<DeclaredSnapshot> {
  const cached = unstable_cache(
    async () => {
      return safeQuery<DeclaredSnapshot>(async () => {
        const since = new Date(Date.now() - DECLARED_WINDOW_MS);
        const rows: DeclaredRate[] = await prisma.declaredRate.findMany({
          where: {
            kind: 'PARALELO',
            side,
            status: 'ACCEPTED',
            created_at: { gte: since }
          },
          orderBy: { created_at: 'desc' },
          take: DECLARED_LIMIT
        });

        const values = rows.map((row: DeclaredRate) => row.value);
        const medianValue = median(values);
        const updatedAt = rows.length ? rows[0].created_at : null;

        return {
          median: medianValue,
          count: rows.length,
          updatedAt,
          confidence: confidenceLevel(rows.length)
        };
      }, { median: null, count: 0, updatedAt: null, confidence: 'insuficiente' });
    },
    ['declared-latest', side],
    { revalidate: 60 }
  );

  return cached();
}

export async function getDeclaredAggregate(kind: RateKind = 'PARALELO'): Promise<DeclaredAggregate> {
  const cached = unstable_cache(
    async () => {
      return safeQuery(async () => {
        const since = new Date(Date.now() - DECLARED_WINDOW_MS);
        const [buyRows, sellRows] = await Promise.all([
          prisma.declaredRate.findMany({
            where: {
              kind,
              side: 'BUY',
              status: 'ACCEPTED',
              created_at: { gte: since }
            },
            orderBy: { created_at: 'desc' },
            take: DECLARED_LIMIT,
            select: { value: true, created_at: true }
          }),
          prisma.declaredRate.findMany({
            where: {
              kind,
              side: 'SELL',
              status: 'ACCEPTED',
              created_at: { gte: since }
            },
            orderBy: { created_at: 'desc' },
            take: DECLARED_LIMIT,
            select: { value: true, created_at: true }
          })
        ]);

        const buyMedian = median(buyRows.map((row) => row.value));
        const sellMedian = median(sellRows.map((row) => row.value));
        const updatedAtCandidates = [buyRows[0]?.created_at, sellRows[0]?.created_at]
          .filter((value): value is Date => Boolean(value))
          .sort((a, b) => b.getTime() - a.getTime());
        const updatedAt: Date | null = updatedAtCandidates.length ? updatedAtCandidates[0] : null;

        return {
          buy: buyMedian,
          sell: sellMedian,
          sampleSize: buyRows.length + sellRows.length,
          updatedAt
        };
      }, { buy: null, sell: null, sampleSize: 0, updatedAt: null });
    },
    ['declared-aggregate', kind],
    { revalidate: 60 }
  );

  return cached();
}
