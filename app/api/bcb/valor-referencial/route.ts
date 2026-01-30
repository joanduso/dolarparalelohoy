import { NextResponse } from 'next/server';
import { parseBcbReferencial } from '@/lib/sources/bcb_html';

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
    const { parsed, debug } = parseBcbReferencial(html);

    console.info('[bcb][valor-referencial]', {
      fallbackRegex: debug.fallbackRegex,
      compraText: debug.compraText,
      ventaText: debug.ventaText
    });

    if (!parsed) {
      return NextResponse.json({
        ok: false,
        status: 'ERROR',
        reason: 'no_data_or_parse_failed',
        details: debug
      });
    }

    return NextResponse.json({
      ok: true,
      buy: parsed.buy,
      sell: parsed.sell,
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
