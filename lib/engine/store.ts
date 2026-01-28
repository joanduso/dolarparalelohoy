import type { PrismaClient } from '@prisma/client';
import type { LatestRateResult, QualityStatus, ConfidenceLevel } from './types';

type RatesHistoryDelegate = {
  create: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<RateHistoryRow | null>;
  findMany: (args: unknown) => Promise<RateHistoryRow[]>;
};

type PrismaWithRatesHistory = PrismaClient & { ratesHistory: RatesHistoryDelegate };

export type RateHistoryRow = {
  timestampUtc: Date;
  officialBcb: number | null;
  parallelBuy: number | null;
  parallelSell: number | null;
  parallelMid: number | null;
  sampleSizeBuy: number;
  sampleSizeSell: number;
  minBuy: number | null;
  maxBuy: number | null;
  minSell: number | null;
  maxSell: number | null;
  sourcesUsed: string[];
  confidence: string;
};

export async function saveRun(prisma: PrismaClient, result: LatestRateResult) {
  const client = prisma as PrismaWithRatesHistory;
  return client.ratesHistory.create({
    data: {
      timestampUtc: result.timestampUtc,
      officialBcb: result.officialBcb,
      parallelBuy: result.parallel.buy,
      parallelSell: result.parallel.sell,
      parallelMid: result.parallel.mid,
      minBuy: result.parallel.range.buy.min,
      maxBuy: result.parallel.range.buy.max,
      minSell: result.parallel.range.sell.min,
      maxSell: result.parallel.range.sell.max,
      sampleSizeBuy: result.quality.sample_size.buy,
      sampleSizeSell: result.quality.sample_size.sell,
      sourcesUsed: result.quality.sources_used,
      confidence: result.quality.confidence as ConfidenceLevel,
      status: result.quality.status as QualityStatus,
      notes: result.quality.notes
    }
  });
}

export async function getLatestRun(prisma: PrismaClient) {
  const client = prisma as PrismaWithRatesHistory;
  return client.ratesHistory.findFirst({
    orderBy: { timestampUtc: 'desc' }
  });
}

export async function getRun24hAgo(prisma: PrismaClient) {
  const client = prisma as PrismaWithRatesHistory;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return client.ratesHistory.findFirst({
    where: { timestampUtc: { lte: since } },
    orderBy: { timestampUtc: 'desc' }
  });
}

function intervalMs(interval: string) {
  const match = interval.match(/^(\d+)(m|h)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value) || value <= 0) return null;
  return unit === 'h' ? value * 60 * 60 * 1000 : value * 60 * 1000;
}

export async function getHistory(
  prisma: PrismaClient,
  from: Date,
  to: Date,
  interval: string
) {
  const client = prisma as PrismaWithRatesHistory;
  const rows = await client.ratesHistory.findMany({
    where: { timestampUtc: { gte: from, lte: to } },
    orderBy: { timestampUtc: 'asc' }
  });

  const bucketMs = intervalMs(interval);
  if (!bucketMs) return rows;

  const buckets = new Map<number, RateHistoryRow>();
  for (const row of rows) {
    const bucket = Math.floor(row.timestampUtc.getTime() / bucketMs) * bucketMs;
    buckets.set(bucket, row);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);
}
