import { NextResponse } from 'next/server';
import {
  CURRENT_DATA_REVALIDATE_SECONDS,
  getCurrentRatesData
} from '@/lib/siteData';

export const revalidate = CURRENT_DATA_REVALIDATE_SECONDS;

export async function GET() {
  const current = await getCurrentRatesData();
  const brecha = current.brecha && current.brecha.gap_abs !== null && current.brecha.gap_pct !== null
    ? {
        ...current.brecha,
        date: current.updatedAt
      }
    : null;
  const errors = [];
  if (!brecha) errors.push({ source: 'BRECHA', error: 'unavailable' });
  const updatedAtMs = current.updatedAt ? Date.parse(current.updatedAt) : Number.NaN;
  const freshUntil = Number.isFinite(updatedAtMs)
    ? new Date(updatedAtMs + CURRENT_DATA_REVALIDATE_SECONDS * 1000).toISOString()
    : null;
  return NextResponse.json({
    updatedAt: current.updatedAt,
    brecha,
    freshness: {
      maxAgeSeconds: CURRENT_DATA_REVALIDATE_SECONDS,
      freshUntil
    },
    errors
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60'
    }
  });
}
