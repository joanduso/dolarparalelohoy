import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getLatestRate } from '@/lib/queries';
import { rateLimit } from '@/lib/apiRateLimit';
import { prisma } from '@/lib/db';
import { ensureFreshRates } from '@/lib/ingest/ensureFresh';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const limiter = rateLimit(`latest:${ip}`, 60, 60_000);

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  await ensureFreshRates(prisma, 10 * 60_000);

  const [paralelo, oficial] = await Promise.all([
    getLatestRate('PARALELO'),
    getLatestRate('OFICIAL')
  ]);

  const errors = [];
  if (!paralelo) errors.push({ source: 'PARALELO', error: 'unavailable' });
  if (!oficial) errors.push({ source: 'OFICIAL', error: 'unavailable' });

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    paralelo,
    oficial,
    errors
  });
}
