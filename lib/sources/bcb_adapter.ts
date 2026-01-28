import type { RawRatePoint, SourceAdapter } from './base';

const SOURCE_URL = 'https://api.dolarbluebolivia.click/v1/bcb';

function toNumber(value: unknown) {
  if (value == null) return null;
  if (typeof value == 'number') return Number.isFinite(value) ? value : null;
  if (typeof value == 'string') {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickValue(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in payload) return payload[key];
  }
  return null;
}

function parseTimestamp(payload: Record<string, unknown>) {
  const raw = pickValue(payload, ['timestamp', 'updatedAt', 'fecha', 'date', 'fetchedAt']);
  if (typeof raw == 'number') {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  if (typeof raw == 'string') {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
}

async function fetchBCB(): Promise<RawRatePoint | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es'
      },
      signal: controller.signal
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    const buy = toNumber(
      pickValue(payload, ['buy', 'compra', 'compra_oficial', 'official_buy', 'bcb_buy'])
    );
    const sell = toNumber(
      pickValue(payload, ['sell', 'venta', 'venta_oficial', 'official_sell', 'bcb_sell'])
    );

    const resolvedBuy = buy ?? sell;
    const resolvedSell = sell ?? buy;
    if (resolvedBuy == null || resolvedSell == null) return null;

    return {
      kind: 'OFICIAL',
      timestamp: parseTimestamp(payload).toISOString(),
      buy: resolvedBuy,
      sell: resolvedSell,
      source: 'bcb-api',
      currencyPair: 'USD/BOB',
      country: 'BO',
      raw: {
        sourceUrl: SOURCE_URL,
        buy,
        sell
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const bcbAdapter: SourceAdapter = {
  id: 'bcb',
  kind: 'OFICIAL',
  fetchLatest: fetchBCB,
  compliance: {
    async checkAllowed() {
      return { allowed: true, reason: 'public_source' };
    }
  }
};
