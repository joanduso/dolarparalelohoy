import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { bcbAdapter } from '../sources/bcb_adapter';
import { binanceP2PAdapter } from '../sources/binance_p2p_adapter';
import { normalizeRaw, type NormalizedRatePoint } from './normalize';
import { validatePoint } from './validate';
import { computeDailyAggregates, computeBrecha } from './compute';
import { throttle } from './rateLimit';
import { median } from '../declared';

const adapters = [bcbAdapter, binanceP2PAdapter];
const BASE_SOURCE = 'base-median';

function toNormalizedFromDb(row: {
  kind: 'PARALELO' | 'OFICIAL';
  timestamp: Date;
  buy: number;
  sell: number;
  source: string;
  currency_pair: string;
  country: string;
}): NormalizedRatePoint {
  return {
    kind: row.kind,
    timestamp: row.timestamp,
    buy: row.buy,
    sell: row.sell,
    source: row.source,
    currency_pair: row.currency_pair,
    country: row.country
  };
}

async function fallbackBase(
  prisma: PrismaClient,
  kind: 'PARALELO' | 'OFICIAL',
  last: NormalizedRatePoint | null,
  reason: string
) {
  if (!last) return;
  await prisma.ratePoint.create({
    data: {
      kind,
      timestamp: new Date(),
      buy: last.buy,
      sell: last.sell,
      source: BASE_SOURCE,
      currency_pair: last.currency_pair,
      country: last.country,
      raw: {
        fallback: true,
        reason,
        sources_used: [],
        sources_count: 0
      }
    }
  });
}

export async function runIngest(prisma: PrismaClient) {
  const runId = crypto.randomUUID();
  const startedAt = new Date();
  const errors: Array<{ adapter: string; reason: string }> = [];
  let inserted = 0;

  try {
    const results: NormalizedRatePoint[] = [];

    for (const adapter of adapters) {
      const compliance = await adapter.compliance.checkAllowed();
      if (!compliance.allowed) {
        errors.push({ adapter: adapter.id, reason: compliance.reason ?? 'compliance_blocked' });
        continue;
      }

      await throttle(adapter.id);
      const raw = await adapter.fetchLatest();
      if (!raw) {
        errors.push({ adapter: adapter.id, reason: 'no_data' });
        continue;
      }
      results.push(normalizeRaw(raw));
    }

    const grouped = results.reduce(
      (acc, row) => {
        acc[row.kind].push(row);
        return acc;
      },
      { PARALELO: [] as NormalizedRatePoint[], OFICIAL: [] as NormalizedRatePoint[] }
    );

    for (const kind of ['PARALELO', 'OFICIAL'] as const) {
      const rows = grouped[kind];
      const lastBase = await prisma.ratePoint.findFirst({
        where: { kind, source: BASE_SOURCE },
        orderBy: { timestamp: 'desc' }
      });
      const lastNormalized = lastBase ? toNormalizedFromDb(lastBase) : null;

      if (rows.length === 0) {
        errors.push({ adapter: `base:${kind}`, reason: 'no_sources_fallback' });
        await fallbackBase(prisma, kind, lastNormalized, 'no_sources');
        continue;
      }

      const validRows: NormalizedRatePoint[] = [];

      for (const row of rows) {
        const validation = validatePoint(row, lastNormalized, rows.length);

        if (!validation.ok) {
          errors.push({ adapter: row.source, reason: validation.reason ?? 'invalid' });
          continue;
        }

        validRows.push(row);

        await prisma.ratePoint.create({
          data: {
            kind: row.kind,
            timestamp: row.timestamp,
            buy: row.buy,
            sell: row.sell,
            source: row.source,
            currency_pair: row.currency_pair,
            country: row.country,
            raw: row.raw ?? undefined
          }
        });
        inserted += 1;
      }

      if (validRows.length === 0) {
        errors.push({ adapter: `base:${kind}`, reason: 'no_valid_sources_fallback' });
        await fallbackBase(prisma, kind, lastNormalized, 'no_valid_sources');
        continue;
      }

      const buyMedian = median(validRows.map((row) => row.buy));
      const sellMedian = median(validRows.map((row) => row.sell));

      if (buyMedian === null || sellMedian === null) {
        errors.push({ adapter: `base:${kind}`, reason: 'median_failed' });
        await fallbackBase(prisma, kind, lastNormalized, 'median_failed');
        continue;
      }

      await prisma.ratePoint.create({
        data: {
          kind,
          timestamp: new Date(),
          buy: buyMedian,
          sell: sellMedian,
          source: BASE_SOURCE,
          currency_pair: 'USD/BOB',
          country: 'BO',
          raw: {
            sources_used: validRows.map((row) => row.source),
            sources_count: validRows.length,
            computed: 'median'
          }
        }
      });
      inserted += 1;
    }

    await computeDailyAggregates(prisma, 'PARALELO');
    await computeDailyAggregates(prisma, 'OFICIAL');
    await computeBrecha(prisma);

    await prisma.auditLog.create({
      data: {
        run_id: runId,
        started_at: startedAt,
        ended_at: new Date(),
        status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
        errors_json: errors.length ? errors : undefined,
        inserted_count: inserted
      }
    });

    return { runId, inserted, errors };
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        run_id: runId,
        started_at: startedAt,
        ended_at: new Date(),
        status: 'FAILED',
        errors_json: [{ reason: String(error) }],
        inserted_count: inserted
      }
    });
    throw error;
  }
}
