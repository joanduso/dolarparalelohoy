import { fetchBCB, type BcbResult } from './sources/bcb';
import { fetchBinanceP2P } from './sources/binance';
import { aggregateSide } from './aggregate';
import { outlierFilter, sanityFilter, minSampleThreshold } from './filters';
import type { LatestRateResult, Sample, PriceSource } from './types';
import { getCache, setCache } from './cache';
import { logError, logInfo, logWarn } from './logger';
import { prisma } from '@/lib/db';
import { getLatestRun, getRun24hAgo, saveRun } from './store';

const SOURCE_TTL_MS = 90_000;
const LATEST_TTL_MS = 60_000;

type SourceResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function fetchBCBSource(): Promise<SourceResult<BcbResult>> {
  try {
    const data = await fetchBCB();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function fetchBinanceSource(): Promise<SourceResult<Sample[]>> {
  try {
    const data = await fetchBinanceP2P();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function computeLatest() {
  const cached = getCache<LatestRateResult>('latest');
  if (cached) {
    return { result: cached, cached: true };
  }

  const start = Date.now();
  const errors: Array<{ source: PriceSource; reason: string }> = [];

  const bcbCached = getCache<Awaited<ReturnType<typeof fetchBCB>> | null>('bcb');
  const binanceCached = getCache<Sample[] | null>('binance');

  const [bcbResult, binanceResult]: [SourceResult<BcbResult>, SourceResult<Sample[]>] =
    await Promise.all([
      bcbCached ? { ok: true, data: bcbCached, error: undefined } : fetchBCBSource(),
      binanceCached ? { ok: true, data: binanceCached, error: undefined } : fetchBinanceSource()
    ]);

  if (!bcbCached && bcbResult.ok) {
    setCache('bcb', bcbResult.data, SOURCE_TTL_MS);
  }
  if (!binanceCached && binanceResult.ok) {
    setCache('binance', binanceResult.data, SOURCE_TTL_MS);
  }

  const officialBcb = bcbResult.ok && bcbResult.data ? bcbResult.data.official_rate : null;
  if (!officialBcb) {
    errors.push({ source: 'BCB', reason: bcbResult.error ?? 'no_data' });
  }

  const rawSamples = binanceResult.ok && binanceResult.data ? binanceResult.data : [];
  if (rawSamples.length === 0) {
    errors.push({ source: 'BINANCE', reason: binanceResult.error ?? 'no_data' });
  }

  const cleanSamples = outlierFilter(sanityFilter(rawSamples));
  const buySamples = cleanSamples.filter((sample) => sample.side === 'buy');
  const sellSamples = cleanSamples.filter((sample) => sample.side === 'sell');

  const buyAgg = aggregateSide(buySamples);
  const sellAgg = aggregateSide(sellSamples);

  const parallelBuy = buyAgg?.median ?? null;
  const parallelSell = sellAgg?.median ?? null;
  const parallelMid =
    parallelBuy !== null && parallelSell !== null ? (parallelBuy + parallelSell) / 2 : null;

  const minBuy = buyAgg?.min ?? null;
  const maxBuy = buyAgg?.max ?? null;
  const minSell = sellAgg?.min ?? null;
  const maxSell = sellAgg?.max ?? null;

  const sampleSizeBuy = buyAgg?.n ?? 0;
  const sampleSizeSell = sellAgg?.n ?? 0;

  const hasEnoughSamples =
    minSampleThreshold(buySamples) && minSampleThreshold(sellSamples);

  let status: LatestRateResult['quality']['status'] = 'OK';
  if (!officialBcb && !parallelMid) {
    status = 'ERROR';
  } else if (!officialBcb || !hasEnoughSamples) {
    status = 'DEGRADED';
  }

  let confidence: LatestRateResult['quality']['confidence'] = 'LOW';
  if (status === 'OK' && sampleSizeBuy >= 20 && sampleSizeSell >= 20) {
    confidence = 'HIGH';
  } else if (status !== 'ERROR' && sampleSizeBuy >= 8 && sampleSizeSell >= 8) {
    confidence = 'MEDIUM';
  }

  const sourcesUsed: PriceSource[] = [];
  if (officialBcb) sourcesUsed.push('BCB');
  if (sampleSizeBuy || sampleSizeSell) sourcesUsed.push('BINANCE');

  const latestRun = await getLatestRun(prisma);
  const run24h = await getRun24hAgo(prisma);

  const deltaVsLatest =
    latestRun?.parallelMid && parallelMid
      ? ((parallelMid - latestRun.parallelMid) / latestRun.parallelMid) * 100
      : null;

  const deltaVs24h =
    run24h?.parallelMid && parallelMid
      ? ((parallelMid - run24h.parallelMid) / run24h.parallelMid) * 100
      : null;

  const notes =
    status === 'DEGRADED'
      ? 'Fuentes incompletas o pocas muestras válidas.'
      : status === 'ERROR'
        ? 'No fue posible obtener datos válidos de las fuentes.'
        : null;

  if (status === 'ERROR' && latestRun) {
    const fallback: LatestRateResult = {
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
      delta: {
        vs_5m: null,
        vs_24h: null
      },
      quality: {
        confidence: latestRun.confidence as LatestRateResult['quality']['confidence'],
        sample_size: {
          buy: latestRun.sampleSizeBuy,
          sell: latestRun.sampleSizeSell
        },
        sources_used: latestRun.sourcesUsed as PriceSource[],
        status: 'DEGRADED',
        notes: 'Fallback al último valor persistido.'
      },
      errors
    };
    setCache('latest', fallback, LATEST_TTL_MS);
    logWarn('priceEngine fallback', { errors });
    return { result: fallback, cached: false };
  }

  const result: LatestRateResult = {
    timestampUtc: new Date(),
    officialBcb,
    parallel: {
      buy: parallelBuy,
      sell: parallelSell,
      mid: parallelMid,
      range: {
        buy: { min: minBuy, max: maxBuy },
        sell: { min: minSell, max: maxSell }
      }
    },
    delta: {
      vs_5m: deltaVsLatest,
      vs_24h: deltaVs24h
    },
    quality: {
      confidence,
      sample_size: { buy: sampleSizeBuy, sell: sampleSizeSell },
      sources_used: sourcesUsed,
      status,
      notes
    },
    errors
  };

  await saveRun(prisma, result);
  setCache('latest', result, LATEST_TTL_MS);

  const durationMs = Date.now() - start;
  if (status === 'OK') {
    logInfo('priceEngine OK', { durationMs, sampleSizeBuy, sampleSizeSell });
  } else if (status === 'DEGRADED') {
    logWarn('priceEngine DEGRADED', { durationMs, sampleSizeBuy, sampleSizeSell, errors });
  } else {
    logError('priceEngine ERROR', { durationMs, errors });
  }

  return { result, cached: false };
}
