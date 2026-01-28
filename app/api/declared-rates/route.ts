import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getLatestRun } from '@/lib/engine/store';

export const runtime = 'nodejs';

const MIN_VALUE = 3;
const MAX_VALUE = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type DeclaredBody = {
  kind: 'PARALELO' | 'OFICIAL';
  side: 'BUY' | 'SELL';
  value: number;
  city?: string | null;
  source_type: 'P2P' | 'CasaCambio' | 'Calle' | 'Otro';
};

function hashWithSalt(value: string) {
  const salt = process.env.DECLARED_SALT ?? process.env.HASH_SALT ?? '';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

function getClientIp(headerList: Headers) {
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  return forwarded.split(',')[0].trim();
}

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return {
    message: maybe.message ?? String(error),
    code: maybe.code
  };
}

function parseBody(body: DeclaredBody) {
  const kind = body.kind?.toUpperCase?.() ?? '';
  const side = body.side?.toUpperCase?.() ?? '';
  const sourceType = body.source_type ?? 'Otro';

  if (kind !== 'PARALELO' && kind !== 'OFICIAL') {
    return { error: 'invalid_kind' as const };
  }

  if (side !== 'BUY' && side !== 'SELL') {
    return { error: 'invalid_side' as const };
  }

  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: 'invalid_value' as const };
  }

  if (value < MIN_VALUE || value > MAX_VALUE) {
    return { error: 'value_out_of_range' as const };
  }

  const allowedSources: DeclaredBody['source_type'][] = ['P2P', 'CasaCambio', 'Calle', 'Otro'];
  const source_type = allowedSources.includes(sourceType) ? sourceType : 'Otro';

  return {
    kind: kind as DeclaredBody['kind'],
    side: side as DeclaredBody['side'],
    value,
    city: body.city ? String(body.city) : null,
    source_type
  };
}

async function getLatestBase(kind: DeclaredBody['kind'], side: DeclaredBody['side']) {
  const latest = await getLatestRun(prisma);

  if (!latest) return { base: null, baseAvailable: false };

  if (kind === 'OFICIAL') {
    return {
      base: latest.officialBcb ?? null,
      baseAvailable: latest.officialBcb !== null
    };
  }

  const sideValue = side === 'BUY' ? latest.parallelBuy : latest.parallelSell;
  if (sideValue !== null && sideValue !== undefined) {
    return { base: sideValue, baseAvailable: true };
  }

  if (latest.parallelMid !== null && latest.parallelMid !== undefined) {
    return { base: latest.parallelMid, baseAvailable: true };
  }

  return { base: null, baseAvailable: false };
}

export async function POST(request: Request) {
  try {
    const headerList = headers();
    const ip = getClientIp(headerList);
    const userAgent = headerList.get('user-agent') ?? 'unknown';

    let body: DeclaredBody;
    try {
      const raw = await request.text();
      if (!raw) {
        return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
      }
      body = JSON.parse(raw);
    } catch (error) {
      console.error('[declared-rates] invalid json', errorDetails(error));
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const parsed = parseBody(body);
    if ('error' in parsed) {
      console.error('[declared-rates] invalid payload', {
        error: parsed.error,
        kindType: typeof body.kind,
        sideType: typeof body.side,
        valueType: typeof body.value
      });
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const ipHash = hashWithSalt(ip);
    const uaHash = hashWithSalt(userAgent);
    const recent = await prisma.declaredRate.findFirst({
      where: {
        ip_hash: ipHash,
        created_at: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) }
      }
    });

    if (recent) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    let baseResult;
    try {
      baseResult = await getLatestBase(parsed.kind, parsed.side);
    } catch (error) {
      console.error('[declared-rates] latest base failed', errorDetails(error));
      return NextResponse.json(
        { error: 'internal_error', message: 'latest_base_failed' },
        { status: 500 }
      );
    }

    const { base, baseAvailable } = baseResult;
    const baseValue = baseAvailable && base !== null ? base : parsed.value;
    const deviation_pct = baseAvailable
      ? ((parsed.value - baseValue) / baseValue) * 100
      : 0;

    const deviationAbs = Math.abs(deviation_pct);
    let status: 'ACCEPTED' | 'FLAGGED' | 'REJECTED';
    let trust_score = 0.4;

    if (!baseAvailable) {
      status = 'FLAGGED';
      trust_score = 0.4;
    } else if (deviationAbs <= 10) {
      status = 'ACCEPTED';
      trust_score = 0.7;
    } else if (deviationAbs <= 25) {
      status = 'FLAGGED';
      trust_score = 0.4;
    } else {
      status = 'REJECTED';
      trust_score = 0.1;
    }

    try {
      await prisma.declaredRate.create({
        data: {
          kind: parsed.kind,
          side: parsed.side,
          value: parsed.value,
          city: parsed.city,
          source_type: parsed.source_type,
          base_value_at_submit: baseValue,
          deviation_pct,
          status,
          trust_score,
          ip_hash: ipHash,
          user_agent_hash: uaHash
        }
      });
    } catch (error) {
      console.error('[declared-rates] create failed', errorDetails(error));
      return NextResponse.json(
        { error: 'internal_error', message: 'insert_failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, status, deviation_pct },
      { status: 201 }
    );
  } catch (error) {
    console.error('[declared-rates] handler failed', errorDetails(error));
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit') ?? '20');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

    const rows = await prisma.declaredRate.findMany({
      where: { status: { in: ['ACCEPTED', 'FLAGGED'] } },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        kind: true,
        side: true,
        value: true,
        city: true,
        source_type: true,
        deviation_pct: true,
        status: true,
        created_at: true
      }
    });

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        side: row.side,
        value: row.value,
        city: row.city,
        source_type: row.source_type,
        deviation_pct: row.deviation_pct,
        status: row.status,
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error('[declared-rates] get failed', errorDetails(error));
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
