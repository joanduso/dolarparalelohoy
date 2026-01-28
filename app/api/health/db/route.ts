import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return {
    message: maybe.message ?? String(error),
    code: maybe.code
  };
}

export async function GET() {
  try {
    await prisma.declaredRate.findFirst({ select: { id: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[health/db] failed', errorDetails(error));
    return NextResponse.json({ ok: false, error: 'db_unavailable' }, { status: 500 });
  }
}
