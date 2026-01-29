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
  if (!match || match.index === undefined) return html;
  const start = Math.max(match.index - 800, 0);
  const end = Math.min(match.index + 3500, html.length);
  return html.slice(start, end);
};

const extractDate = (block: string) => {
  const dateRegex =
    /(lunes|martes|mi(?:e|\u00e9)rcoles|jueves|viernes|s(?:a|\u00e1)bado|domingo)\s+\d{1,2}\s+de\s+[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]+\s*(?:,?\s*de)?\s*\d{4}/i;
  const match = block.match(dateRegex);
  return match ? match[0].trim() : null;
};

const extractValue = (block: string, label: 'compra' | 'venta') => {
  const primary = label === 'compra'
    ? /compra[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i
    : /venta[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i;
  const match = block.match(primary);
  if (match) return match[1];

  const secondary = label === 'compra'
    ? /valor\s+referencial[^0-9]{0,120}compra[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i
    : /valor\s+referencial[^0-9]{0,120}venta[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i;
  const matchSecondary = block.match(secondary);
  return matchSecondary ? matchSecondary[1] : null;
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
    const raw = await response.text();

    if (contentType.includes('application/json')) {
      const payload = JSON.parse(raw) as Record<string, unknown>;
      const buy = normalizeNumber(String((payload as { compra?: string }).compra ?? ''));
      const sell = normalizeNumber(String((payload as { venta?: string }).venta ?? ''));
      if (!buy && !sell) {
        console.error('[bcb] parse failed json', {
          status: response.status,
          contentType,
          preview: raw.slice(0, 300)
        });
        throw new Error('BCB parse_failed: json_missing_values');
      }
      return {
        official_rate: sell ?? buy ?? 0,
        timestamp: new Date(),
        source: 'BCB',
        meta: { dateText: null, compraText: buy ? String(buy) : null, ventaText: sell ? String(sell) : null }
      };
    }

    if (!contentType.includes('text/html')) {
      console.error('[bcb] invalid content-type', {
        status: response.status,
        contentType,
        preview: raw.slice(0, 300)
      });
      throw new Error(`BCB parse_failed: invalid_content_type ${contentType}`);
    }

    const html = raw;
    const block = extractBlock(html);
    if (!block) {
      console.error('[bcb] parse failed block', {
        status: response.status,
        contentType,
        preview: html.slice(0, 300)
      });
      throw new Error('BCB parse_failed: section_missing');
    }

    const dateText = extractDate(block);
    const compraText = extractValue(block, 'compra') ?? extractValue(html, 'compra');
    const ventaText = extractValue(block, 'venta') ?? extractValue(html, 'venta');
    if (!ventaText) {
      console.error('[bcb] parse failed venta', {
        status: response.status,
        contentType,
        preview: block.slice(0, 300)
      });
      throw new Error('BCB parse_failed: venta_missing');
    }

    const compra = compraText ? normalizeNumber(compraText) : null;
    const venta = normalizeNumber(ventaText);
    if (!venta) {
      console.error('[bcb] parse failed venta invalid', {
        status: response.status,
        contentType,
        preview: block.slice(0, 300)
      });
      throw new Error('BCB parse_failed: venta_invalid');
    }

    return {
      official_rate: venta ?? compra ?? 0,
      timestamp: new Date(),
      source: 'BCB',
      meta: { dateText, compraText, ventaText }
    };
  } finally {
    clearTimeout(timeout);
  }
}
