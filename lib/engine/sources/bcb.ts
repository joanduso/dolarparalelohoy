import type { PriceSource } from '../types';

const SOURCE_URL = 'https://www.bcb.gob.bo/';
const TIMEOUT_MS = 8000;

export type BcbResult = {
  official_rate: number;
  timestamp: Date;
  source: PriceSource;
  meta: {
    dateText: string | null;
    compraText: string | null;
    ventaText: string | null;
  };
};

const normalizeNumber = (valueText: string) => {
  const normalized = valueText.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const extractBlock = (html: string) => {
  const marker = /VALOR\s+REFERENCIAL\s+DEL\s+D[\u00d3O]LAR\s+ESTADOUNIDENSE/i;
  const match = html.match(marker);
  if (!match || match.index === undefined) return null;
  const start = Math.max(match.index - 500, 0);
  const end = Math.min(match.index + 2500, html.length);
  return html.slice(start, end);
};

const extractDate = (block: string) => {
  const dateRegex =
    /(lunes|martes|mi(?:e|\u00e9)rcoles|jueves|viernes|s(?:a|\u00e1)bado|domingo)\s+\d{1,2}\s+de\s+[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]+\s*(?:,?\s*de)?\s*\d{4}/i;
  const match = block.match(dateRegex);
  return match ? match[0].trim() : null;
};

const extractValue = (block: string, label: 'compra' | 'venta') => {
  const regex = label === 'compra'
    ? /compra[^0-9]*([0-9]+,[0-9]+)/i
    : /venta[^0-9]*([0-9]+,[0-9]+)/i;
  const match = block.match(regex);
  return match ? match[1] : null;
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

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      throw new Error(`BCB parse_failed: invalid_content_type ${contentType}`);
    }

    const html = await response.text();
    const block = extractBlock(html);
    if (!block) {
      throw new Error('BCB parse_failed: section_missing');
    }

    const dateText = extractDate(block);
    const compraText = extractValue(block, 'compra');
    const ventaText = extractValue(block, 'venta');
    if (!ventaText) {
      throw new Error('BCB parse_failed: venta_missing');
    }

    const venta = normalizeNumber(ventaText);
    if (!venta) {
      throw new Error('BCB parse_failed: venta_invalid');
    }

    return {
      official_rate: venta,
      timestamp: new Date(),
      source: 'BCB',
      meta: { dateText, compraText, ventaText }
    };
  } finally {
    clearTimeout(timeout);
  }
}