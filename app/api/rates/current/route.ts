import { NextResponse } from 'next/server';
import { computeLatest } from '@/lib/engine/priceEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

export async function GET() {
  try {
    // Current quotes come directly from the public sources. Persistence is
    // best-effort inside the engine, so a paused history database cannot leave
    // the homepage serving a stale snapshot indefinitely.
    const { result: latest } = await computeLatest();
    const sourcesUsed = Array.isArray(latest.quality.sources_used)
      ? latest.quality.sources_used
      : [];
    const bcbOk = sourcesUsed.includes('BCB');
    const binanceOk = sourcesUsed.includes('BINANCE');

    const officialValue = latest.officialBcb ?? null;
    const parallelSell = latest.parallel.sell ?? null;
    const parallelBuy = latest.parallel.buy ?? null;

    const gapAbs = officialValue !== null && parallelSell !== null
      ? parallelSell - officialValue
      : null;
    const gapPct = officialValue !== null && gapAbs !== null
      ? (gapAbs / officialValue) * 100
      : null;

    return NextResponse.json({
      updatedAt: latest.timestampUtc.toISOString(),
      status: latest.quality.status,
      sources: {
        bcb: bcbOk ? 'OK' : 'ERROR',
        binance_p2p: binanceOk ? 'OK' : 'ERROR'
      },
      paralelo: {
        buy: parallelBuy,
        sell: parallelSell,
        sources_count: binanceOk ? 1 : 0,
        sampleSize: Math.max(
          latest.quality.sample_size.buy ?? 0,
          latest.quality.sample_size.sell ?? 0
        )
      },
      oficial: {
        buy: officialValue,
        sell: officialValue,
        sources_count: bcbOk ? 1 : 0
      },
      brecha: {
        gap_abs: gapAbs,
        gap_pct: gapPct
      },
      notes: latest.quality.notes,
      errors: latest.errors
    });
  } catch (error) {
    console.error('[rates/current] failed', errorDetails(error));
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
