import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es'
      },
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'fetch_failed', reason: `HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const block = extractBlock(html);

    if (!block) {
      return NextResponse.json(
        { error: 'parse_failed', reason: 'section_not_found' },
        { status: 502 }
      );
    }

    const dateText = extractDate(block);
    const compraText = extractValue(block, 'compra');
    const ventaText = extractValue(block, 'venta');

    if (!dateText || !compraText || !ventaText) {
      return NextResponse.json(
        {
          error: 'parse_failed',
          reason: 'missing_fields',
          details: { dateText, compraText, ventaText }
        },
        { status: 502 }
      );
    }

    const compra = normalizeNumber(compraText);
    const venta = normalizeNumber(ventaText);

    if (compra === null || venta === null) {
      return NextResponse.json(
        { error: 'parse_failed', reason: 'invalid_number' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      source: 'bcb.gob.bo',
      dateText,
      compraText,
      ventaText,
      compra,
      venta,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'fetch_failed', reason: String(error) },
      { status: 502 }
    );
  }
}
