import { NextResponse } from 'next/server';
import { getBrechaHistory } from '@/lib/queries';

export const revalidate = 600;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('days') ?? '365');
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 365;

  const data = await getBrechaHistory(days);

  return NextResponse.json({
    days,
    count: data.length,
    data
  });
}
