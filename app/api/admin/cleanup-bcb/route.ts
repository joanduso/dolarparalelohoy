import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { PrismaWithRatesHistory } from '@/lib/engine/store';

export const runtime = 'nodejs';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

export async function POST(request: Request) {
  const adminKey = request.headers.get('x-admin-key') ?? '';
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const client = prisma as PrismaWithRatesHistory;
    const result = await client.ratesHistory.updateMany({
      where: {
        officialBcb: {
          not: null
        },
        OR: [
          { officialBcb: { lt: 5 } },
          { officialBcb: { gt: 15 } }
        ]
      },
      data: {
        officialBcb: null
      }
    });

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error) {
    console.error('[admin/cleanup-bcb] failed', errorDetails(error));
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
