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
  const adminKey = request.headers.get('x-admin-key') ?? '';
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runIngest(prisma);
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      inserted: result.inserted,
      errors: result.errors
    });
  } catch (error) {
    console.error('[rates/refresh] failed', errorDetails(error));
    return NextResponse.json(
      { error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
