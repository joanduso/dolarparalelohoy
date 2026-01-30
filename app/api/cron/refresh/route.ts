import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runIngest } from '@/lib/ingest/run';

export const runtime = 'nodejs';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

export async function POST(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret') ?? '';
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runIngest(prisma);
    console.info('[cron/refresh] completed', {
      runId: result.runId,
      inserted: result.inserted,
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
