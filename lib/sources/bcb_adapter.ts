import type { RawRatePoint, SourceAdapter } from './base';

const SOURCE_URL = 'https://www.bcb.gob.bo/';

const normalizeNumber = (valueText: string) => {
  const normalized = valueText.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const extractBlock = (html: string) => {
  const marker = /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR\s+ESTADOUNIDENSE/i;
  const match = html.match(marker);
  if (!match || match.index === undefined) return null;
  const start = Math.max(match.index - 500, 0);
  const end = Math.min(match.index + 2500, html.length);
  return html.slice(start, end);
};

const extractDate = (block: string) => {
  const dateRegex =
    /(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)\s+\d{1,2}\s+de\s+[a-záéíóúñ]+\s*(?:,?\s*de)?\s*\d{4}/i;
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

async function fetchBCB(): Promise<RawRatePoint | null> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'es'
    }
  });

  if (!response.ok) return null;

  const html = await response.text();
  const block = extractBlock(html);
  if (!block) return null;

  const dateText = extractDate(block);
  const compraText = extractValue(block, 'compra');
  const ventaText = extractValue(block, 'venta');

  if (!compraText || !ventaText) return null;

  const compra = normalizeNumber(compraText);
  const venta = normalizeNumber(ventaText);

  if (compra === null || venta === null) return null;

  return {
    kind: 'OFICIAL',
    timestamp: new Date().toISOString(),
    buy: compra,
    sell: venta,
    source: 'bcb',
    currencyPair: 'USD/BOB',
    country: 'BO',
    raw: {
      dateText,
      compraText,
      ventaText,
      sourceUrl: SOURCE_URL
    }
  };
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
