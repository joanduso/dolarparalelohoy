import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getLatestRate } from '@/lib/queries';
import { rateLimit } from '@/lib/apiRateLimit';

export const revalidate = 30;

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

  const [paralelo, oficial] = await Promise.all([
    getLatestRate('PARALELO'),
    getLatestRate('OFICIAL')
  ]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    paralelo,
    oficial
  });
}
