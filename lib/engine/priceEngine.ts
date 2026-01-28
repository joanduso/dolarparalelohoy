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

export async function computeLatest() {
  const cached = getCache<LatestRateResult>('latest');
  if (cached) {
    return { result: cached, cached: true };
  }

  const start = Date.now();
  const errors: Array<{ source: PriceSource; reason: string }> = [];

  const bcbCached = getCache<BcbResult | null>('bcb');
  const binanceCached = getCache<Sample[] | null>('binance');

  let bcbData: BcbResult | null = bcbCached ?? null;
  let binanceSamples: Sample[] = binanceCached ?? [];

  if (!bcbCached) {
    try {
      bcbData = await fetchBCB();
      setCache('bcb', bcbData, SOURCE_TTL_MS);
    } catch (error) {
      errors.push({ source: 'BCB', reason: String(error) });
    }
  }

  if (!binanceCached) {
    try {
      binanceSamples = await fetchBinanceP2P();
      setCache('binance', binanceSamples, SOURCE_TTL_MS);
    } catch (error) {
      errors.push({ source: 'BINANCE', reason: String(error) });
    }
  }

  const officialBcb = bcbData ? bcbData.official_rate : null;
  if (!officialBcb) {
    errors.push({ source: 'BCB', reason: 'no_data' });
  }

  const rawSamples = binanceSamples ?? [];
  if (rawSamples.length === 0) {
    errors.push({ source: 'BINANCE', reason: 'no_data' });
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

  let latestRun = null;
  let run24h = null;
  let dbUnavailable = false;

  try {
    latestRun = await getLatestRun(prisma);
    run24h = await getRun24hAgo(prisma);
  } catch (dbErr) {
    dbUnavailable = true;
    logWarn('priceEngine db unavailable', { message: String(dbErr) });
  }

  const deltaVsLatest =
    latestRun?.parallelMid && parallelMid
      ? ((parallelMid - latestRun.parallelMid) / latestRun.parallelMid) * 100
      : null;

  const deltaVs24h =
    run24h?.parallelMid && parallelMid
      ? ((parallelMid - run24h.parallelMid) / run24h.parallelMid) * 100
      : null;

  if (dbUnavailable && status !== 'ERROR') {
    status = 'DEGRADED';
  }

  let notes: LatestRateResult['quality']['notes'] = null;
  if (status === 'DEGRADED') {
    notes = 'Fuentes incompletas o pocas muestras validas.';
  } else if (status === 'ERROR') {
    notes = 'No fue posible obtener datos validos de las fuentes.';
  }

  if (dbUnavailable && status === 'DEGRADED') {
    notes = notes
      ? `${notes} DB unavailable, deltas disabled.`
      : 'DB unavailable, deltas disabled.';
  }

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
        notes: 'Fallback al ultimo valor persistido.'
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
      vs_5m: latestRun ? deltaVsLatest : null,
      vs_24h: run24h ? deltaVs24h : null
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

  try {
    await saveRun(prisma, result);
  } catch (error) {
    logWarn('priceEngine save failed', { error: String(error) });
  }

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
