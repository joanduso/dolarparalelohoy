import { NextResponse } from 'next/server';
import { parseBcbOfficial, parseValorReferencial } from '@/lib/sources/bcb_html';

export const runtime = 'nodejs';

const SOURCE_URL = 'https://www.bcb.gob.bo/';

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
      return NextResponse.json({
        ok: false,
        status: 'ERROR',
        reason: 'no_data_or_parse_failed',
        details: { httpStatus: response.status }
      });
    }

    const html = await response.text();
    const fetcher = async (url: string) => {
      const linked = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept-Language': 'es'
        },
        next: { revalidate: 600 }
      });
      if (!linked.ok) return null;
      return linked.text();
    };

    let { parsed, debug } = await parseValorReferencial(html, {
      fetcher,
      baseUrl: SOURCE_URL
    });

    // The BCB currently exposes a unified official value on its homepage. If
    // the former referential buy/sell pages are unavailable, use that official
    // value for both sides instead of leaving the card empty.
    if (!parsed) {
      ({ parsed, debug } = parseBcbOfficial(html));
    }

    if (!parsed) {
      console.warn('[bcb][valor-referencial] parse_failed', {
        anchorFound: debug.anchorFound,
        compraFound: debug.compraFound,
        ventaFound: debug.ventaFound,
        snippet: debug.anchorSnippet
      });
      return NextResponse.json({
        ok: false,
        error: 'parse_failed',
        reason: 'missing_fields',
        details: {
          anchorFound: debug.anchorFound,
          compraFound: debug.compraFound,
          ventaFound: debug.ventaFound
        }
      });
    }

    return NextResponse.json({
      ok: true,
      buy: parsed.buy,
      sell: parsed.sell,
      compra: parsed.buy,
      venta: parsed.sell,
      compraText: `Bs ${parsed.buy.toFixed(2).replace('.', ',')}`,
      ventaText: `Bs ${parsed.sell.toFixed(2).replace('.', ',')}`,
      dateText: parsed.dateText,
      source: 'BCB',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      status: 'ERROR',
      reason: 'no_data_or_parse_failed',
      details: { error: String(error) }
    });
  }
}
