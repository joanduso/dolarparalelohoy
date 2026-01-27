import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/apiRateLimit';

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const limiter = rateLimit(`history:${ip}`, 30, 60_000);

  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  const url = new URL(request.url);
  const kindParam = url.searchParams.get('kind')?.toUpperCase() ?? 'PARALELO';
  if (!['PARALELO', 'OFICIAL'].includes(kindParam)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }

  let to = parseDate(url.searchParams.get('to'), new Date());
  let from = parseDate(
    url.searchParams.get('from'),
    new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  );

  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }

  const data = await prisma.dailyAggregate.findMany({
    where: {
      kind: kindParam as 'PARALELO' | 'OFICIAL',
      date: { gte: from, lte: to }
    },
    orderBy: { date: 'asc' }
  });

  return NextResponse.json({
    kind: kindParam,
    from: from.toISOString(),
    to: to.toISOString(),
    count: data.length,
    data
  });
}
