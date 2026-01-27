import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runIngest } from '@/lib/ingest/run';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = request.headers.get('x-cron-secret') ?? url.searchParams.get('secret');
  const vercelCron = request.headers.get('x-vercel-cron');

  if (process.env.CRON_SECRET) {
    if (secret !== process.env.CRON_SECRET && vercelCron !== '1') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else if (vercelCron !== '1') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runIngest(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
