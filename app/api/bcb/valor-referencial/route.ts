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
      return NextResponse.json(
        { error: 'fetch_failed', reason: `HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const parsed = parseBcbReferencial(html);

    if (!parsed) {
      return NextResponse.json(
        { error: 'parse_failed', reason: 'section_not_found' },
        { status: 502 }
      );
    }

    const { dateText, compraText, ventaText, buy, sell } = parsed;

    return NextResponse.json({
      source: 'bcb.gob.bo',
      dateText,
      compraText,
      ventaText,
      compra: buy,
      venta: sell,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'fetch_failed', reason: String(error) },
      { status: 502 }
    );
  }
}
