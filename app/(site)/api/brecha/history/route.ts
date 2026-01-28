import { NextResponse } from 'next/server';
import { getBrechaHistory } from '@/lib/queries';
import { prisma } from '@/lib/db';
import { ensureFreshRates } from '@/lib/ingest/ensureFresh';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureFreshRates(prisma, 10 * 60_000);
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
