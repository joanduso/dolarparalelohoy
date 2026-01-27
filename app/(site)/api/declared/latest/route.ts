import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/apiRateLimit';
import { getDeclaredLatest } from '@/lib/queries';

export async function GET(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const limiter = rateLimit(`declared-latest:${ip}`, 60, 60_000);

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  const url = new URL(request.url);
  const side = (url.searchParams.get('side') ?? 'SELL').toUpperCase() === 'BUY' ? 'BUY' : 'SELL';

  const data = await getDeclaredLatest(side);

  return NextResponse.json({
    side,
    ...data
  });
}
