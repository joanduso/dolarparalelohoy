import { aggregateSide } from '@/lib/engine/aggregate';
import { getCache, setCache } from '@/lib/engine/cache';
import { fetchBinanceP2P } from '@/lib/engine/sources/binance';

export type PlatformKey = 'eldorado' | 'takenos' | 'airtm' | 'bybit' | 'meru' | 'binance';

export type PlatformRate = {
  buy: number;
  sell: number;
  updatedAt: string;
  source: 'Dólar Blue Bolivia' | 'Binance P2P';
};

export type PlatformRates = Partial<Record<PlatformKey, PlatformRate>>;

const CACHE_KEY = 'platform-rates';
const CACHE_TTL_MS = 5 * 60 * 1000;
const API_BASE = 'https://api.dolarbluebolivia.click';

type ApiEnvelope = {
  data?: Record<string, unknown>;
  fetched_at?: string;
  updated_at?: string;
};

function validPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 3 && value <= 30;
}

function toRate(
  payload: ApiEnvelope,
  buyField: string,
  sellField: string
): PlatformRate | null {
  const buy = payload.data?.[buyField];
  const sell = payload.data?.[sellField];
  if (!validPrice(buy) || !validPrice(sell)) return null;

  const updatedAt = String(
    payload.data?.fetched_at ?? payload.fetched_at ?? payload.updated_at ?? new Date().toISOString()
  );

  return {
    buy,
    sell,
    updatedAt,
    source: 'Dólar Blue Bolivia'
  };
}

async function fetchPublicRate(
  path: string,
  buyField = 'buy',
  sellField = 'sell'
): Promise<PlatformRate | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;
    return toRate((await response.json()) as ApiEnvelope, buyField, sellField);
  } catch (error) {
    console.warn(`[platform-rates] ${path} unavailable`, String(error));
    return null;
  }
}

async function fetchBinanceRate(): Promise<PlatformRate | null> {
  try {
    const samples = await fetchBinanceP2P();
    const buy = aggregateSide(samples.filter((sample) => sample.side === 'buy'));
    const sell = aggregateSide(samples.filter((sample) => sample.side === 'sell'));
    if (!buy || !sell || !validPrice(buy.median) || !validPrice(sell.median)) return null;

    return {
      buy: buy.median,
      sell: sell.median,
      updatedAt: new Date().toISOString(),
      source: 'Binance P2P'
    };
  } catch (error) {
    console.warn('[platform-rates] Binance unavailable', String(error));
    return null;
  }
}

export async function fetchPlatformRates(): Promise<PlatformRates> {
  const cached = getCache<PlatformRates>(CACHE_KEY);
  if (cached) return cached;

  const [eldorado, takenos, airtm, bybit, binance] = await Promise.all([
    fetchPublicRate('/v1/eldorado'),
    fetchPublicRate('/v1/takenos'),
    fetchPublicRate('/v1/airtm', 'addValue', 'withdrawValue'),
    fetchPublicRate('/v1/p2p/bybit'),
    fetchBinanceRate()
  ]);

  const rates: PlatformRates = {};
  if (eldorado) rates.eldorado = eldorado;
  if (takenos) rates.takenos = takenos;
  if (airtm) rates.airtm = airtm;
  if (bybit) rates.bybit = bybit;
  if (binance) rates.binance = binance;

  setCache(CACHE_KEY, rates, CACHE_TTL_MS);
  return rates;
}
