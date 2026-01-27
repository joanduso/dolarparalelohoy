import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getLatestRate } from '@/lib/queries';
import { rateLimit } from '@/lib/apiRateLimit';
import { hashValue } from '@/lib/hash';
import { deviationPct } from '@/lib/declared';
import type { DeclaredSourceType } from '@prisma/client';

const MAX_DEVIATION = 15;

function parseNumber(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num;
}

async function parseBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

export async function POST(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const userAgent = headerList.get('user-agent') ?? 'unknown';

  const limiter = rateLimit(`declare:${ip}`, 10, 10 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'x-ratelimit-reset': String(limiter.resetAt) } }
    );
  }

  const body = await parseBody(request);

  const honeypot = body.website ?? body.company ?? '';
  const side = String(body.side ?? '').toUpperCase();
  const sourceType = String(body.source_type ?? '').toString();
  const city = body.city ? String(body.city) : null;
  const value = parseNumber(body.value ?? null);

  const ipHash = hashValue(ip);
  const uaHash = hashValue(userAgent);

  const recent = await prisma.declaredRate.findFirst({
    where: {
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      created_at: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    }
  });

  if (recent) {
    return NextResponse.json({ error: 'too_soon' }, { status: 429 });
  }

  const latestBase = await getLatestRate('PARALELO');
  if (!latestBase) {
    return NextResponse.json({ error: 'base_unavailable' }, { status: 503 });
  }

  const baseValue = latestBase.sell;

  let status: 'ACCEPTED' | 'REJECTED' | 'FLAGGED' = 'REJECTED';
  let trustScore = 0.4;
  let deviation = 100;

  if (honeypot) {
    status = 'FLAGGED';
    trustScore = 0.1;
  } else if (!['BUY', 'SELL'].includes(side) || value === null || value <= 0) {
    status = 'REJECTED';
    trustScore = 0.2;
  } else {
    deviation = deviationPct(value, baseValue);
    if (deviation <= MAX_DEVIATION) {
      status = 'ACCEPTED';
      trustScore = Math.max(0.6, 1 - deviation / MAX_DEVIATION);
    } else {
      status = 'REJECTED';
      trustScore = Math.max(0.2, 0.8 - deviation / 100);
    }
  }

  const allowedSourceTypes: DeclaredSourceType[] = ['P2P', 'CasaCambio', 'Calle', 'Otro'];
  const source_type: DeclaredSourceType = allowedSourceTypes.includes(
    sourceType as DeclaredSourceType
  )
    ? (sourceType as DeclaredSourceType)
    : 'Otro';

  await prisma.declaredRate.create({
    data: {
      kind: 'PARALELO',
      side: side === 'BUY' ? 'BUY' : 'SELL',
      value: value ?? 0,
      city,
      source_type,
      base_value_at_submit: baseValue,
      deviation_pct: deviation,
      status,
      trust_score: trustScore,
      ip_hash: ipHash,
      user_agent_hash: uaHash
    }
  });

  return NextResponse.json({ ok: status === 'ACCEPTED', status });
}
