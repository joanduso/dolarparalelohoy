import { NextResponse } from 'next/server';
import {
  CURRENT_DATA_REVALIDATE_SECONDS,
  getCurrentRatesData
} from '@/lib/siteData';

export const runtime = 'nodejs';
export const revalidate = CURRENT_DATA_REVALIDATE_SECONDS;

const cacheHeaders = {
  'Cache-Control': 'public, max-age=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60'
};

export async function GET() {
  try {
    const data = await getCurrentRatesData();
    const updatedAtMs = data.updatedAt ? Date.parse(data.updatedAt) : Number.NaN;
    const freshUntil = Number.isFinite(updatedAtMs)
      ? new Date(updatedAtMs + CURRENT_DATA_REVALIDATE_SECONDS * 1000).toISOString()
      : null;

    return NextResponse.json({
      ...data,
      freshness: {
        maxAgeSeconds: CURRENT_DATA_REVALIDATE_SECONDS,
        freshUntil
      }
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error('[rates/current] failed', { message: String(error) });
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
