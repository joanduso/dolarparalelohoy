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

async function fetchBinanceP2P(): Promise<RawRatePoint | null> {
  if (!BINANCE_ENABLED || !BINANCE_P2P_URL) return null;

  const cacheKey = `binance:p2p:usd-bob:${MIN_USD}:${MAX_USD}:${TOP_N}`;
  const cached = getCache(cacheKey);
  if (cached) return cached as RawRatePoint;

  await throttle('binance-p2p', 3000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        asset: 'USD',
        fiat: 'BOB',
        tradeType: 'SELL',
        transAmount: MIN_USD,
        // Provide range as metadata for transparency; API may ignore.
        minAmount: MIN_USD,
        maxAmount: MAX_USD,
        page: 1,
        rows: TOP_N
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as BinanceResponse;
    const prices = (payload.data ?? [])
      .map((item) => Number(item.adv?.price))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, TOP_N);

    const medianPrice = median(prices);
    if (!medianPrice) return null;

    const now = new Date();
    const result: RawRatePoint = {
      kind: 'PARALELO',
      timestamp: now.toISOString(),
      buy: medianPrice,
      sell: medianPrice,
      source: 'binance-p2p',
      currencyPair: 'USD/BOB',
      country: 'BO',
      raw: {
        method: 'median',
        tradeType: 'SELL',
        amountRangeUSD: [MIN_USD, MAX_USD],
        topN: TOP_N
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
