import type { RawRatePoint, SourceAdapter } from './base';
import { parseBcbOfficial } from './bcb_html';

const SOURCE_URL = 'https://www.bcb.gob.bo/';

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

    const html = await response.text();
    const { parsed, debug } = parseBcbOfficial(html);
    console.info('[refresh][bcb] parsed', {
      fallbackRegex: debug.fallbackRegex,
      compraText: debug.compraText,
      ventaText: debug.ventaText
    });
    if (!parsed) return null;
    const resolvedBuy = parsed.buy;
    const resolvedSell = parsed.sell;

    return {
      kind: 'OFICIAL',
      timestamp: new Date().toISOString(),
      buy: resolvedBuy,
      sell: resolvedSell,
      source: 'bcb-api',
      currencyPair: 'USD/BOB',
      country: 'BO',
      raw: {
        sourceUrl: SOURCE_URL,
        buy: parsed.buy,
        sell: parsed.sell,
        dateText: parsed.dateText,
        compraText: parsed.compraText,
        ventaText: parsed.ventaText,
        fallbackRegex: parsed.fallbackRegex
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
