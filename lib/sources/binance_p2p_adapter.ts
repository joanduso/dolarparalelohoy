import type { RawRatePoint, SourceAdapter } from './base';
import { getCache, setCache } from '../ingest/cache';
import { throttle } from '../ingest/rateLimit';
import { median } from '../declared';

const BINANCE_P2P_URL = process.env.BINANCE_P2P_URL ?? '';
const BINANCE_ROBOTS_URL = process.env.BINANCE_ROBOTS_URL ?? '';
const BINANCE_TERMS_URL = process.env.BINANCE_TERMS_URL ?? '';
const BINANCE_ENABLED = process.env.BINANCE_P2P_ENABLED === 'true';
const TOP_N = Number(process.env.BINANCE_P2P_TOP_N ?? 20);
const MIN_USD = Number(process.env.BINANCE_P2P_MIN_USD ?? 100);
const MAX_USD = Number(process.env.BINANCE_P2P_MAX_USD ?? 1000);
const CACHE_TTL = Number(process.env.BINANCE_P2P_CACHE_TTL_MS ?? 60_000);

async function checkRobotsAndTerms() {
  if (!BINANCE_ENABLED) {
    return { allowed: false, reason: 'binance_disabled', robotsUrl: BINANCE_ROBOTS_URL, termsUrl: BINANCE_TERMS_URL };
  }

  if (!BINANCE_P2P_URL || !BINANCE_ROBOTS_URL || !BINANCE_TERMS_URL) {
    return { allowed: false, reason: 'missing_compliance_urls', robotsUrl: BINANCE_ROBOTS_URL, termsUrl: BINANCE_TERMS_URL };
  }

  return { allowed: true, reason: 'configured', robotsUrl: BINANCE_ROBOTS_URL, termsUrl: BINANCE_TERMS_URL };
}

type BinanceListing = {
  adv?: {
    price?: string;
  };
};

type BinanceResponse = {
  data?: BinanceListing[];
};

async function fetchSide(tradeType: 'BUY' | 'SELL', controller: AbortController): Promise<number[]> {
  const response = await fetch(BINANCE_P2P_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      asset: 'USDT',
      fiat: 'BOB',
      tradeType,
      transAmount: MIN_USD,
      minAmount: MIN_USD,
      maxAmount: MAX_USD,
      page: 1,
      rows: TOP_N
    }),
    signal: controller.signal
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as BinanceResponse;
  return (payload.data ?? [])
    .map((item) => Number(item.adv?.price))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, TOP_N);
}

async function fetchBinanceP2P(): Promise<RawRatePoint | null> {
  if (!BINANCE_ENABLED || !BINANCE_P2P_URL) return null;

  const cacheKey = `binance:p2p:usdt-bob:${MIN_USD}:${MAX_USD}:${TOP_N}`;
  const cached = getCache(cacheKey);
  if (cached) return cached as RawRatePoint;

  await throttle('binance-p2p', 3000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const [buyPrices, sellPrices] = await Promise.all([
      fetchSide('BUY', controller),
      fetchSide('SELL', controller)
    ]);

    const buyMedian = median(buyPrices);
    const sellMedian = median(sellPrices);

    if (!buyMedian || !sellMedian) return null;

    const now = new Date();
    const result: RawRatePoint = {
      kind: 'PARALELO',
      timestamp: now.toISOString(),
      buy: buyMedian,
      sell: sellMedian,
      source: 'binance-p2p',
      currencyPair: 'USDT/BOB',
      country: 'BO',
      raw: {
        method: 'median',
        tradeTypes: ['BUY', 'SELL'],
        amountRangeUSD: [MIN_USD, MAX_USD],
        topN: TOP_N,
        sampleSize: { buy: buyPrices.length, sell: sellPrices.length },
        min: { buy: buyPrices.length ? Math.min(...buyPrices) : null, sell: sellPrices.length ? Math.min(...sellPrices) : null },
        max: { buy: buyPrices.length ? Math.max(...buyPrices) : null, sell: sellPrices.length ? Math.max(...sellPrices) : null }
      }
    };

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export const binanceP2PAdapter: SourceAdapter = {
  id: 'binance-p2p',
  kind: 'PARALELO',
  fetchLatest: fetchBinanceP2P,
  compliance: {
    checkAllowed: checkRobotsAndTerms
  }
};
