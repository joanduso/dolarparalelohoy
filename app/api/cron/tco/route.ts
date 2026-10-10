import { NextResponse } from 'next/server';
import { dispatchTcoAlerts } from '@/lib/dispatchTcoAlerts';

export const runtime = 'nodejs';

async function run(request: Request) {
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
    const alerts = await dispatchTcoAlerts();
    console.info('[cron/tco] completed', alerts);
    return NextResponse.json({ ok: true, alerts });
  } catch (error) {
    console.error('[cron/tco] failed', String(error));
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
