import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { getApiKeyAuth } from '@/lib/auth/apiKey';
import { computeLatest } from '@/lib/engine/priceEngine';
import { prisma } from '@/lib/db';
import { getLatestRun } from '@/lib/engine/store';

export const revalidate = 600;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function toNumber(x: any): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (typeof x === 'string') {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof x === 'object') {
    if (typeof x.toNumber === 'function') return x.toNumber();
    if (typeof x.toString === 'function') {
      const n = Number(x.toString());
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function toIso(d: any): string {
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

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
  let responseStatus = 200;
  try {
    result = (await computeLatest()).result;
  } catch (error) {
    console.error('[rates/latest] computeLatest failed', { error: String(error) });
    try {
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
          errors: [{ source: 'ENGINE', reason: String(error) }]
        };
      } else {
        responseStatus = 503;
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
          errors: [{ source: 'ENGINE', reason: String(error) }]
        };
      }
    } catch (fallbackError) {
      console.error('[rates/latest] fallback failed', { error: String(fallbackError) });
      responseStatus = 503;
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
        errors: [
          { source: 'ENGINE', reason: String(error) },
          { source: 'FALLBACK', reason: String(fallbackError) }
        ]
      };
    }
  }

  const timestampIso = toIso(result.timestampUtc);
  const officialBcb = toNumber(result.officialBcb);
  const parallelBuy = toNumber(result.parallel.buy);
  const parallelSell = toNumber(result.parallel.sell);
  const parallelMid = toNumber(result.parallel.mid);
  const rangeBuyMin = toNumber(result.parallel.range.buy.min);
  const rangeBuyMax = toNumber(result.parallel.range.buy.max);
  const rangeSellMin = toNumber(result.parallel.range.sell.min);
  const rangeSellMax = toNumber(result.parallel.range.sell.max);
  const sampleBuy = toNumber(result.quality.sample_size.buy) ?? 0;
  const sampleSell = toNumber(result.quality.sample_size.sell) ?? 0;

  return NextResponse.json({
    timestamp_utc: timestampIso,
    official_bcb: officialBcb,
    parallel: {
      buy: parallelBuy,
      sell: parallelSell,
      mid: parallelMid,
      range: {
        buy: { min: rangeBuyMin, max: rangeBuyMax },
        sell: { min: rangeSellMin, max: rangeSellMax }
      }
    },
    delta: result.delta,
    quality: {
      confidence: result.quality.confidence,
      sample_size: { buy: sampleBuy, sell: sampleSell },
      sources_used: result.quality.sources_used,
      status: result.quality.status,
      notes: result.quality.notes
    },
    errors: result.errors,
    // Legacy fields to avoid breaking current frontend.
    updatedAt: timestampIso,
    paralelo: parallelMid
      ? {
          buy: parallelBuy,
          sell: parallelSell,
          timestamp: timestampIso,
          sourcesCount: sampleSell
        }
      : null,
    oficial: officialBcb
      ? {
          buy: officialBcb,
          sell: officialBcb,
          timestamp: timestampIso,
          sourcesCount: result.quality.sources_used.includes('BCB') ? 1 : 0
        }
      : null
  }, { status: responseStatus, headers: rateHeaders });
}
