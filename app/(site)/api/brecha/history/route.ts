import { NextResponse } from 'next/server';
import {
  getBrechaHistoryData,
  HISTORY_DATA_REVALIDATE_SECONDS
} from '@/lib/siteData';

export const revalidate = HISTORY_DATA_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('days') ?? '365');
  const days = Number.isFinite(daysParam) && daysParam > 0
    ? Math.min(Math.trunc(daysParam), 900)
    : 365;
  const { data } = await getBrechaHistoryData(days);

  return NextResponse.json({
    days,
    count: data.length,
    data
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400'
    }
  });
}
