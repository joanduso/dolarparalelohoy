import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runIngest } from '@/lib/ingest/run';

export const runtime = 'nodejs';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

async function refresh(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const legacySecret = request.headers.get('x-cron-secret') ?? '';
  const expectedSecret = process.env.CRON_SECRET;
  const authorized = Boolean(expectedSecret) && (
    authorization === `Bearer ${expectedSecret}` || legacySecret === expectedSecret
  );

  if (!authorized) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runIngest(prisma);
    console.info('[cron/refresh] completed', {
      runId: result.runId,
      inserted: result.inserted,
      status: result.status,
      sourcesUsed: result.sourcesUsed,
      errors: result.errors
    });
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      inserted: result.inserted
    });
  } catch (error) {
    const details = errorDetails(error);
    console.error('[cron/refresh] failed', details);
    return NextResponse.json({
      ok: false,
      error: 'internal_error',
      details
    });
  }
}

// Vercel Cron invokes configured paths with GET and sends CRON_SECRET as a
// Bearer token. POST remains available for backwards-compatible manual calls.
export const GET = refresh;
export const POST = refresh;
