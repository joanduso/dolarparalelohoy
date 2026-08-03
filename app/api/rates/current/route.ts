import { NextResponse } from 'next/server';
import {
  CURRENT_DATA_REVALIDATE_SECONDS,
  getCurrentRatesData
} from '@/lib/siteData';

export const runtime = 'nodejs';
export const revalidate = CURRENT_DATA_REVALIDATE_SECONDS;

const cacheHeaders = {
  'Cache-Control': 'public, max-age=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400'
};

export async function GET() {
  try {
    return NextResponse.json(await getCurrentRatesData(), { headers: cacheHeaders });
  } catch (error) {
    console.error('[rates/current] failed', { message: String(error) });
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
