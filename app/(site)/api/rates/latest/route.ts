import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/apiRateLimit';
import { computeLatest } from '@/lib/engine/priceEngine';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const limiter = rateLimit(`latest:${ip}`, 60, 60_000);

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  const { result } = await computeLatest();

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
  });
}
