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
  return NextResponse.json({
    updatedAt: current.updatedAt,
    brecha,
    errors
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400'
    }
  });
}
