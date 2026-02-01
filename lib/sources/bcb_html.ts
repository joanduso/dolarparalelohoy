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
  anchorFound: boolean;
  compraFound: boolean;
  ventaFound: boolean;
  anchorSnippet: string | null;
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

function extractSection(html: string, start: RegExp, endMarkers: RegExp[]) {
  const startMatch = html.match(start);
  if (!startMatch || startMatch.index === undefined) return null;
  const startIndex = startMatch.index;
  let endIndex = html.length;

  for (const marker of endMarkers) {
    const endMatch = marker.exec(html.slice(startIndex + 1));
    if (endMatch && endMatch.index !== undefined) {
      const absolute = startIndex + 1 + endMatch.index;
      if (absolute < endIndex) endIndex = absolute;
    }
  }

  return html.slice(startIndex, endIndex);
}

function extractDate(section: string) {
  const dateRegex =
    /(lunes|martes|mi(?:e|é)rcoles|jueves|viernes|s(?:a|á)bado|domingo)\s+\d{1,2}\s+de\s+[a-záéíóúñ]+\s*(?:,?\s*de)?\s*\d{4}/i;
  const match = section.match(dateRegex);
  return match ? match[0].trim() : null;
}

function extractValueAfterLabel(sectionHtml: string, label: 'compra' | 'venta') {
  const labelRegex = new RegExp(`${label}\\s*:?.{0,200}`, 'i');
  const match = labelRegex.exec(sectionHtml);
  if (!match || match.index === undefined) {
    return { text: null, found: false };
  }
  const windowText = sectionHtml.slice(match.index, match.index + 240);
  const numberMatch = windowText.match(/([0-9]{1,2}(?:[\.,][0-9]{1,4})?)/);
  return { text: numberMatch ? numberMatch[1] : null, found: Boolean(numberMatch) };
}

function extractValueAfterLabelFromText(sectionText: string, label: 'compra' | 'venta') {
  const labelRegex = new RegExp(`${label}\\s*:?.{0,200}`, 'i');
  const match = labelRegex.exec(sectionText);
  if (!match || match.index === undefined) {
    return { text: null, found: false };
  }
  const windowText = sectionText.slice(match.index, match.index + 240);
  const numberMatch = windowText.match(/([0-9]{1,2}(?:[\.,][0-9]{1,4})?)/);
  return { text: numberMatch ? numberMatch[1] : null, found: Boolean(numberMatch) };
}

function fallbackRegex(html: string) {
  const text = normalizeText(html);
  const compraMatch = text.match(/Compra\s*:?:?\s*([0-9]+(?:[\.,][0-9]+)?)/i);
  const ventaMatch = text.match(/Venta\s*:?:?\s*([0-9]+(?:[\.,][0-9]+)?)/i);
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

function keepIfInRange(valueText: string | null) {
  if (!valueText) return null;
  const numeric = normalizeNumber(valueText);
  if (numeric === null) return null;
  return inRange(numeric) ? valueText : null;
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

function findAnchorSnippet(text: string, anchor: RegExp) {
  const match = text.match(anchor);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 250);
  const end = Math.min(text.length, match.index + 250);
  return text.slice(start, end);
}

function parseSectionValues(html: string, anchor: RegExp, endMarkers: RegExp[]) {
  const decodedHtml = decodeHtmlEntities(html);
  const normalizedText = normalizeText(decodedHtml);
  const section = extractSection(decodedHtml, anchor, endMarkers);
  const sectionText = section ? normalizeText(section) : null;
  const anchorFound = Boolean(normalizedText.match(anchor));

  let dateText: string | null = null;
  let compraText: string | null = null;
  let ventaText: string | null = null;
  let compraFound = false;
  let ventaFound = false;

  if (section) {
    dateText = extractDate(sectionText ?? '');
    const compraResult = extractValueAfterLabel(section, 'compra');
    const ventaResult = extractValueAfterLabel(section, 'venta');
    compraText = compraResult.text;
    ventaText = ventaResult.text;
    compraFound = compraResult.found;
    ventaFound = ventaResult.found;

    if (!compraText || !ventaText) {
      const compraFallback = extractValueAfterLabelFromText(sectionText ?? '', 'compra');
      const ventaFallback = extractValueAfterLabelFromText(sectionText ?? '', 'venta');
      compraText = compraText ?? compraFallback.text;
      ventaText = ventaText ?? ventaFallback.text;
      compraFound = compraFound || compraFallback.found;
      ventaFound = ventaFound || ventaFallback.found;
    }
  }

  return {
    dateText,
    compraText,
    ventaText,
    anchorFound,
    compraFound,
    ventaFound,
    anchorSnippet: findAnchorSnippet(normalizedText, anchor)
  };
}

function parseLinkedValue(html: string, label: 'compra' | 'venta') {
  const decodedHtml = decodeHtmlEntities(html);
  const text = normalizeText(decodedHtml);
  const primary = extractValueAfterLabelFromText(text, label);
  if (primary.text) return primary.text;
  const anyNumber = text.match(/([0-9]{1,2}(?:[\.,][0-9]{1,4})?)/);
  return anyNumber ? anyNumber[1] : null;
}

function extractLink(sectionHtml: string, needle: RegExp) {
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(sectionHtml)) !== null) {
    const href = match[1];
    if (needle.test(href)) return href;
  }
  return null;
}

export function parseTipoDeCambio(html: string): { parsed: BcbParsed | null; debug: BcbParseDebug } {
  const values = parseSectionValues(
    html,
    /TIPO\s+DE\s+CAMBIO/i,
    [
      /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR/i,
      /COTIZACI[ÓO]N\s+INTERNACIONAL/i,
      /TASA\s+DE\s+REFERENCIA/i
    ]
  );

  const parsed = buildParsed({
    dateText: values.dateText,
    compraText: values.compraText,
    ventaText: values.ventaText,
    fallbackRegex: false
  });

  return {
    parsed,
    debug: {
      fallbackRegex: false,
      dateText: values.dateText,
      compraText: values.compraText,
      ventaText: values.ventaText,
      anchorFound: values.anchorFound,
      compraFound: values.compraFound,
      ventaFound: values.ventaFound,
      anchorSnippet: values.anchorSnippet
    }
  };
}

export async function parseValorReferencial(
  html: string,
  options?: { fetcher?: (url: string) => Promise<string | null>; baseUrl?: string }
): Promise<{ parsed: BcbParsed | null; debug: BcbParseDebug }> {
  const values = parseSectionValues(
    html,
    /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR\s+ESTADOUNIDENSE/i,
    [
      /UNIDAD\s+DE\s+FOMENTO/i,
      /INDICADORES\s+DE\s+INFLACI[ÓO]N/i,
      /CARTERAS\s+ADMINISTRADAS/i
    ]
  );

  let compraText = keepIfInRange(values.compraText);
  let ventaText = keepIfInRange(values.ventaText);
  let dateText = values.dateText;

  if ((!compraText || !ventaText) && options?.fetcher) {
    const decodedHtml = decodeHtmlEntities(html);
    const sectionHtml = extractSection(
      decodedHtml,
      /VALOR\s+REFERENCIAL\s+DEL\s+D[ÓO]LAR\s+ESTADOUNIDENSE/i,
      [
        /UNIDAD\s+DE\s+FOMENTO/i,
        /INDICADORES\s+DE\s+INFLACI[ÓO]N/i,
        /CARTERAS\s+ADMINISTRADAS/i
      ]
    );

    if (sectionHtml) {
      const compraLink = extractLink(sectionHtml, /valor-referencial-de-compra/i);
      const ventaLink = extractLink(sectionHtml, /valor-referencial-de-venta/i);
      const base = options.baseUrl ?? '';

      if (!compraText && compraLink) {
        const url = new URL(compraLink, base).toString();
        const compraHtml = await options.fetcher(url);
        if (compraHtml) {
          compraText = keepIfInRange(parseLinkedValue(compraHtml, 'compra'));
          dateText = dateText ?? extractDate(normalizeText(decodeHtmlEntities(compraHtml)));
        }
      }

      if (!ventaText && ventaLink) {
        const url = new URL(ventaLink, base).toString();
        const ventaHtml = await options.fetcher(url);
        if (ventaHtml) {
          ventaText = keepIfInRange(parseLinkedValue(ventaHtml, 'venta'));
          dateText = dateText ?? extractDate(normalizeText(decodeHtmlEntities(ventaHtml)));
        }
      }
    }
  }

  const parsed = buildParsed({ dateText, compraText, ventaText, fallbackRegex: false });

  return {
    parsed,
    debug: {
      fallbackRegex: false,
      dateText,
      compraText,
      ventaText,
      anchorFound: values.anchorFound,
      compraFound: Boolean(compraText),
      ventaFound: Boolean(ventaText),
      anchorSnippet: values.anchorSnippet
    }
  };
}

export function parseBcbOfficial(html: string): { parsed: BcbParsed | null; debug: BcbParseDebug } {
  return parseTipoDeCambio(html);
}
