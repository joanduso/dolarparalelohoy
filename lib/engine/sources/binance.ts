import type { Sample, PriceSource } from '../types';

const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const BINANCE_ENABLED = process.env.ENABLE_BINANCE_P2P === 'true';
const TOP_N = Number(process.env.BINANCE_P2P_TOP_N ?? 20);
const MIN_USD = Number(process.env.BINANCE_P2P_MIN_USD ?? 100);
const MAX_USD = Number(process.env.BINANCE_P2P_MAX_USD ?? 1000);

const TIMEOUT_MS = 8000;

type BinanceListing = {
  adv?: {
    price?: string;
  };
};

type BinanceResponse = {
  data?: BinanceListing[];
};

async function fetchSide(tradeType: 'BUY' | 'SELL'): Promise<Sample[]> {
  if (!BINANCE_ENABLED) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
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
    const prices = (payload.data ?? [])
      .map((item) => Number(item.adv?.price))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, TOP_N);

    return prices.map((price) => ({
      price,
      side: tradeType === 'BUY' ? 'buy' : 'sell',
      source: 'BINANCE' as PriceSource,
      timestamp: new Date()
    }));
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBinanceP2P(): Promise<Sample[]> {
  const [buySamples, sellSamples] = await Promise.all([
    fetchSide('BUY'),
    fetchSide('SELL')
  ]);
  return [...buySamples, ...sellSamples];
}
