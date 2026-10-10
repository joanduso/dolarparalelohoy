import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { confirmationEmail, sendAlertEmail } from '@/lib/alertEmail';
import {
  createAlertToken,
  hashAlertValue,
  normalizeEmail,
  parseAlertPreferences
} from '@/lib/alerts';
import { rateLimit } from '@/lib/rateLimit';
import { prisma } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for') ?? 'anonymous';
  const ip = forwarded.split(',')[0].trim();
  const limiter = rateLimit(`alert-subscribe:${ip}`, 5, 60 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true, delivery: 'queued' }, { status: 202 });
  const email = normalizeEmail(body.email);
  const preferences = parseAlertPreferences({
    frequency: body.frequency,
    thresholdPct: body.thresholdPct
  });
  const tcoAlerts = body.tcoAlerts === true;
  const tcoProInterest = body.tcoProInterest === true;
  if (!email || !preferences || body.consent !== true) {
    return NextResponse.json({ ok: false, error: 'invalid_subscription' }, { status: 400 });
  }

  const confirmationToken = createAlertToken();
  const unsubscribeToken = createAlertToken();
  const emailHash = hashAlertValue(email);
  const source = typeof body.source === 'string' ? body.source.slice(0, 80) : 'unknown';
  const existing = await prisma.alertSubscription.findUnique({ where: { email } });

  const needsTcoConfirmation = Boolean(
    existing?.status === 'ACTIVE' && tcoAlerts && !existing.tco_alerts
  );
  if (existing?.status === 'ACTIVE' && !needsTcoConfirmation) {
    await prisma.alertSubscription.update({
      where: { id: existing.id },
      data: {
        frequency: preferences.frequency,
        threshold_pct: preferences.thresholdPct,
        tco_alerts: tcoAlerts,
        tco_pro_interest: tcoProInterest,
        consent_at: new Date(),
        source
      }
    });
    return NextResponse.json({ ok: true, delivery: 'active' });
  }

  await prisma.alertSubscription.upsert({
    where: { email },
    create: {
      email,
      email_hash: emailHash,
      status: 'PENDING',
      frequency: preferences.frequency,
      threshold_pct: preferences.thresholdPct,
      tco_alerts: tcoAlerts,
      tco_pro_interest: tcoProInterest,
      consent_at: new Date(),
      confirmation_token_hash: hashAlertValue(confirmationToken),
      unsubscribe_token: unsubscribeToken,
      source
    },
    update: {
      email_hash: emailHash,
      status: 'PENDING',
      frequency: preferences.frequency,
      threshold_pct: preferences.thresholdPct,
      tco_alerts: tcoAlerts,
      tco_pro_interest: tcoProInterest,
      consent_at: new Date(),
      confirmed_at: null,
      confirmation_token_hash: hashAlertValue(confirmationToken),
      unsubscribe_token: unsubscribeToken,
      source
    }
  });

  const confirmUrl = new URL('/api/alerts/confirm', siteConfig.url);
  confirmUrl.searchParams.set('token', confirmationToken);
  const frequencyLabel = preferences.frequency === 'DAILY'
    ? 'resumen diario'
    : `cambios diarios de ${preferences.thresholdPct}% o más`;
  const delivery = await sendAlertEmail(confirmationEmail({
    email,
    confirmUrl: confirmUrl.toString(),
    frequencyLabel: tcoAlerts
      ? `${frequencyLabel} y movimientos relevantes del TCO bancario`
      : frequencyLabel
  }));

  return NextResponse.json(
    { ok: true, delivery: delivery.sent ? 'sent' : 'queued' },
    { status: delivery.sent ? 200 : 202 }
  );
}
