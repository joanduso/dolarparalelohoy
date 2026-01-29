import type { PriceSource } from '../types';
import { parseBcbOfficial } from '@/lib/sources/bcb_html';

const SOURCE_URL = 'https://www.bcb.gob.bo/';
const TIMEOUT_MS = 8000;

export type BcbResult = {
  official_rate: number | null;
  buy: number | null;
  sell: number | null;
  timestamp: Date;
  source: PriceSource;
  meta: {
    dateText: string | null;
    compraText: string | null;
    ventaText: string | null;
  };
};

export async function fetchBCB(): Promise<BcbResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`BCB fetch_failed: HTTP ${response.status}`);
    }

    const raw = await response.text();
    const parsed = parseBcbOfficial(raw);
    if (!parsed) {
      console.error('[bcb] parse failed', {
        status: response.status,
        preview: raw.slice(0, 300)
      });
      throw new Error('BCB parse_failed: official_missing');
    }

    const { buy, sell, dateText, compraText, ventaText } = parsed;
    return {
      official_rate: sell ?? buy ?? null,
      buy,
      sell,
      timestamp: new Date(),
      source: 'BCB',
      meta: { dateText, compraText, ventaText }
    };
  } finally {
    clearTimeout(timeout);
  }
}
