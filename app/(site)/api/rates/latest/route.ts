import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { getApiKeyAuth } from '@/lib/auth/apiKey';
import { computeLatest } from '@/lib/engine/priceEngine';
import { prisma } from '@/lib/db';
import { getLatestRun } from '@/lib/engine/store';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const auth = getApiKeyAuth();
  const limit = auth.ok ? 120 : 60;
  const limiter = rateLimit(`latest:${auth.key ?? ip}`, limit, 60_000);
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

  let result;
  try {
    result = (await computeLatest()).result;
  } catch (error) {
    const latestRun = await getLatestRun(prisma);
    if (latestRun) {
      result = {
        timestampUtc: latestRun.timestampUtc,
        officialBcb: latestRun.officialBcb,
        parallel: {
          buy: latestRun.parallelBuy,
          sell: latestRun.parallelSell,
          mid: latestRun.parallelMid,
          range: {
            buy: { min: latestRun.minBuy, max: latestRun.maxBuy },
            sell: { min: latestRun.minSell, max: latestRun.maxSell }
          }
        },
        delta: { vs_5m: null, vs_24h: null },
        quality: {
          confidence: latestRun.confidence,
          sample_size: { buy: latestRun.sampleSizeBuy, sell: latestRun.sampleSizeSell },
          sources_used: latestRun.sourcesUsed,
          status: 'DEGRADED',
          notes: 'Fallback al ultimo valor persistido.'
        },
        errors: [{ source: 'BCB', reason: String(error) }]
      };
    } else {
      result = {
        timestampUtc: new Date(),
        officialBcb: null,
        parallel: {
          buy: null,
          sell: null,
          mid: null,
          range: { buy: { min: null, max: null }, sell: { min: null, max: null } }
        },
        delta: { vs_5m: null, vs_24h: null },
        quality: {
          confidence: 'LOW',
          sample_size: { buy: 0, sell: 0 },
          sources_used: [],
          status: 'ERROR',
          notes: 'No fue posible obtener datos validos de las fuentes.'
        },
        errors: [{ source: 'BCB', reason: String(error) }]
      };
    }
  }

  return NextResponse.json({
    timestamp_utc: result.timestampUtc.toISOString(),
    official_bcb: result.officialBcb,
    parallel: {
      buy: result.parallel.buy,
      sell: result.parallel.sell,
      mid: result.parallel.mid,
      range: {
        buy: { min: result.parallel.range.buy.min, max: result.parallel.range.buy.max },
        sell: { min: result.parallel.range.sell.min, max: result.parallel.range.sell.max }
      }
    },
    delta: result.delta,
    quality: result.quality,
    errors: result.errors,
    // Legacy fields to avoid breaking current frontend.
    updatedAt: result.timestampUtc.toISOString(),
    paralelo: result.parallel.mid
      ? {
          buy: result.parallel.buy,
          sell: result.parallel.sell,
          timestamp: result.timestampUtc.toISOString(),
          sourcesCount: result.quality.sample_size.sell
        }
      : null,
    oficial: result.officialBcb
      ? {
          buy: result.officialBcb,
          sell: result.officialBcb,
          timestamp: result.timestampUtc.toISOString(),
          sourcesCount: result.quality.sources_used.includes('BCB') ? 1 : 0
        }
      : null
  }, { headers: rateHeaders });
}
