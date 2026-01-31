import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { PrismaWithRatesHistory } from '@/lib/engine/store';

export const runtime = 'nodejs';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

export async function GET() {
  try {
    const client = prisma as PrismaWithRatesHistory;
    const latest = await client.ratesHistory.findFirst({
      orderBy: { timestampUtc: 'desc' }
    });

    if (!latest) {
      return NextResponse.json({
        updatedAt: null,
        status: 'ERROR',
        sources: { bcb: 'ERROR', binance_p2p: 'ERROR' },
        paralelo: null,
        oficial: null,
        brecha: null
      });
    }

    const sourcesUsed = Array.isArray(latest.sourcesUsed) ? latest.sourcesUsed : [];
    const bcbOk = sourcesUsed.includes('BCB');
    const binanceOk = sourcesUsed.includes('BINANCE_P2P');

    const officialValue = latest.officialBcb ?? null;
    const parallelSell = latest.parallelSell ?? null;
    const parallelBuy = latest.parallelBuy ?? null;

    const gapAbs = officialValue !== null && parallelSell !== null
      ? parallelSell - officialValue
      : null;
    const gapPct = officialValue !== null && gapAbs !== null
      ? (gapAbs / officialValue) * 100
      : null;

    return NextResponse.json({
      updatedAt: latest.timestampUtc.toISOString(),
      status: latest.status,
      sources: {
        bcb: bcbOk ? 'OK' : 'ERROR',
        binance_p2p: binanceOk ? 'OK' : 'ERROR'
      },
      paralelo: {
        buy: parallelBuy,
        sell: parallelSell,
        sources_count: binanceOk ? 1 : 0,
        sampleSize: Math.max(latest.sampleSizeBuy ?? 0, latest.sampleSizeSell ?? 0)
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
      notes: latest.notes
    });
  } catch (error) {
    console.error('[rates/current] failed', errorDetails(error));
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
