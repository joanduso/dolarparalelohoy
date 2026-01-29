type BcbParsed = {
  buy: number;
  sell: number;
  dateText: string | null;
  compraText: string | null;
  ventaText: string | null;
};

const ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  aacute: '\u00e1',
  eacute: '\u00e9',
  iacute: '\u00ed',
  oacute: '\u00f3',
  uacute: '\u00fa',
  ntilde: '\u00f1',
  Aacute: '\u00c1',
  Eacute: '\u00c9',
  Iacute: '\u00cd',
  Oacute: '\u00d3',
  Uacute: '\u00da',
  Ntilde: '\u00d1'
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
    /(lunes|martes|mi(?:e|\u00e9)rcoles|jueves|viernes|s(?:a|\u00e1)bado|domingo)\s+\d{1,2}\s+de\s+[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]+\s*(?:,?\s*de)?\s*\d{4}/i;
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

function inRange(value: number) {
  return value >= 5 && value <= 15;
}

export function parseBcbOfficial(html: string): BcbParsed | null {
  const text = normalizeText(html);
  const section = extractSection(
    text,
    /TIPO\s+DE\s+CAMBIO/i,
    [
      /VALOR\s+REFERENCIAL\s+DEL\s+D[\u00d3O]LAR/i,
      /COTIZACI[\u00d3O]N\s+INTERNACIONAL/i,
      /TASA\s+DE\s+REFERENCIA/i
    ]
  );

  if (!section || !/Tipo\s+de\s+cambio\s+Bs\s+por\s+1\s+D[\u00f3o]lar/i.test(section)) {
    return null;
  }

  const dateText = extractDate(section);
  const compraText = extractValue(section, 'compra');
  const ventaText = extractValue(section, 'venta');
  if (!compraText || !ventaText) return null;

  const buy = normalizeNumber(compraText);
  const sell = normalizeNumber(ventaText);
  if (buy === null || sell === null) return null;

  if (!inRange(buy) || !inRange(sell)) return null;

  return {
    buy,
    sell,
    dateText,
    compraText,
    ventaText
  };
}

export function parseBcbReferencial(html: string): BcbParsed | null {
  const text = normalizeText(html);
  const section = extractSection(
    text,
    /VALOR\s+REFERENCIAL\s+DEL\s+D[\u00d3O]LAR\s+ESTADOUNIDENSE/i,
    [
      /UNIDAD\s+DE\s+FOMENTO/i,
      /INDICADORES\s+DE\s+INFLACI[\u00d3O]N/i,
      /CARTERAS\s+ADMINISTRADAS/i
    ]
  );

  if (!section) return null;

  const dateText = extractDate(section);
  const compraText = extractValue(section, 'compra');
  const ventaText = extractValue(section, 'venta');
  if (!compraText || !ventaText) return null;

  const buy = normalizeNumber(compraText);
  const sell = normalizeNumber(ventaText);
  if (buy === null || sell === null) return null;

  return {
    buy,
    sell,
    dateText,
    compraText,
    ventaText
  };
}
