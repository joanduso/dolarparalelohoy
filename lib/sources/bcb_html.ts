export type BcbParsed = {
  buy: number;
  sell: number;
  dateText: string | null;
  compraText: string | null;
  ventaText: string | null;
  fallbackRegex: boolean;
};

export type BcbParseDebug = {
  fallbackRegex: boolean;
  dateText: string | null;
  compraText: string | null;
  ventaText: string | null;
};

const ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Ntilde: 'Ñ'
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, token) => {
    if (token[0] === '#') {
      const isHex = token[1].toLowerCase() === 'x';
      const num = parseInt(isHex ? token.slice(2) : token.slice(1), isHex ? 16 : 10);
      return Number.isFinite(num) ? String.fromCharCode(num) : '';
    }
    return ENTITY_MAP[token] ?? '';
  });
}

function normalizeText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const stripped = withoutScripts.replace(/<[^>]+>/g, ' ');
  const decoded = decodeHtmlEntities(stripped);
  return decoded.replace(/\s+/g, ' ').trim();
}

function normalizeNumber(valueText: string) {
  const normalized = valueText.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function extractSection(text: string, start: RegExp, endMarkers: RegExp[]) {
  const startMatch = text.match(start);
  if (!startMatch || startMatch.index === undefined) return null;
  const startIndex = startMatch.index;
  let endIndex = text.length;

  for (const marker of endMarkers) {
    const endMatch = marker.exec(text.slice(startIndex + 1));
    if (endMatch && endMatch.index !== undefined) {
      const absolute = startIndex + 1 + endMatch.index;
      if (absolute < endIndex) endIndex = absolute;
    }
  }

  return text.slice(startIndex, endIndex);
}

function extractDate(section: string) {
  const dateRegex =
    /(lunes|martes|mi(?:e|é)rcoles|jueves|viernes|s(?:a|á)bado|domingo)\s+\d{1,2}\s+de\s+[a-záéíóúñ]+\s*(?:,?\s*de)?\s*\d{4}/i;
  const match = section.match(dateRegex);
  return match ? match[0].trim() : null;
}

function extractValue(section: string, label: 'compra' | 'venta') {
  const regex = label === 'compra'
    ? /compra\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i
    : /venta\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i;
  const match = section.match(regex);
  return match ? match[1] : null;
}

function fallbackRegex(html: string) {
  const text = normalizeText(html);
  const compraMatch = text.match(/Compra\s*:?\s*([0-9]+(?:[\.,][0-9]+)?)/i);
  const ventaMatch = text.match(/Venta\s*:?\s*([0-9]+(?:[\.,][0-9]+)?)/i);
  const fechaMatch = text.match(
    /(lunes|martes|mi[e?]rcoles|jueves|viernes|s[a?]bado|domingo)\s+\d{1,2}\s+de\s+[a-z?????]+\s*,\s*\d{4}/i
  );
  return {
    dateText: fechaMatch ? fechaMatch[0].trim() : null,
    compraText: compraMatch ? compraMatch[1] : null,
    ventaText: ventaMatch ? ventaMatch[1] : null
  };
}

function inRange(value: number) {
  return value >= 5 && value <= 15;
}

function buildParsed(values: {
  dateText: string | null;
  compraText: string | null;
  ventaText: string | null;
  fallbackRegex: boolean;
}) {
  const buy = values.compraText ? normalizeNumber(values.compraText) : null;
  const sell = values.ventaText ? normalizeNumber(values.ventaText) : null;

  if (buy === null || sell === null) return null;
  if (!inRange(buy) || !inRange(sell)) return null;

  return {
    buy,
    sell,
    dateText: values.dateText,
    compraText: values.compraText,
    ventaText: values.ventaText,
    fallbackRegex: values.fallbackRegex
  } as BcbParsed;
}

export function parseBcbOfficial(html: string): { parsed: BcbParsed | null; debug: BcbParseDebug } {
  const text = normalizeText(html);
  const section = extractSection(
    text,
    /TIPO\s+DE\s+CAMBIO/i,
    [
      /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR/i,
      /COTIZACI[ÓO]N\s+INTERNACIONAL/i,
      /TASA\s+DE\s+REFERENCIA/i
    ]
  );

  let dateText: string | null = null;
  let compraText: string | null = null;
  let ventaText: string | null = null;
  let fallbackUsed = false;

  if (section && /Tipo\s+de\s+cambio\s+Bs\s+por\s+1\s+D[óo]lar/i.test(section)) {
    dateText = extractDate(section);
    compraText = extractValue(section, 'compra');
    ventaText = extractValue(section, 'venta');
  }

  if (!dateText || !compraText || !ventaText) {
    const fallback = fallbackRegex(html);
    fallbackUsed = true;
    dateText = dateText ?? fallback.dateText;
    compraText = compraText ?? fallback.compraText;
    ventaText = ventaText ?? fallback.ventaText;
  }

  const parsed = buildParsed({ dateText, compraText, ventaText, fallbackRegex: fallbackUsed });

  return {
    parsed,
    debug: { fallbackRegex: fallbackUsed, dateText, compraText, ventaText }
  };
}

export function parseBcbReferencial(html: string): { parsed: BcbParsed | null; debug: BcbParseDebug } {
  const text = normalizeText(html);
  const section = extractSection(
    text,
    /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR\s+ESTADOUNIDENSE/i,
    [
      /UNIDAD\s+DE\s+FOMENTO/i,
      /INDICADORES\s+DE\s+INFLACI[ÓO]N/i,
      /CARTERAS\s+ADMINISTRADAS/i
    ]
  );

  let dateText: string | null = null;
  let compraText: string | null = null;
  let ventaText: string | null = null;
  let fallbackUsed = false;

  if (section) {
    dateText = extractDate(section);
    compraText = extractValue(section, 'compra');
    ventaText = extractValue(section, 'venta');
  }

  if (!dateText || !compraText || !ventaText) {
    const fallback = fallbackRegex(html);
    fallbackUsed = true;
    dateText = dateText ?? fallback.dateText;
    compraText = compraText ?? fallback.compraText;
    ventaText = ventaText ?? fallback.ventaText;
  }

  const parsed = buildParsed({ dateText, compraText, ventaText, fallbackRegex: fallbackUsed });

  return {
    parsed,
    debug: { fallbackRegex: fallbackUsed, dateText, compraText, ventaText }
  };
}
