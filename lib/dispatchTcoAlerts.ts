import { tcoAlertEmail, sendAlertEmailBatch } from '@/lib/alertEmail';
import { fetchRecentBcbTcoBreakdowns } from '@/lib/bcbTco';
import { buildTcoAlertSignal } from '@/lib/tcoAlerts';
import { prisma } from '@/lib/db';
import { formatCalendarDate, formatNumber } from '@/lib/format';
import { siteConfig } from '@/lib/seo';

export type TcoAlertDispatchResult = {
  cutoffDate?: string;
  eligible: number;
  sent: number;
  skipped: number;
  reasons?: string[];
  reason?: string;
};

function formatCompactUsd(value: number) {
  return `USD ${new Intl.NumberFormat('es-BO', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)}`;
}

function alertExplanation(signal: NonNullable<ReturnType<typeof buildTcoAlertSignal>>) {
  const bank = signal.influentialBank;
  const bankEffect = bank?.effectCents ?? 0;

  if (signal.reasons.includes('BANK_EFFECT') && bank && bank.tcoWithoutBank !== null) {
    const direction = bankEffect > 0 ? 'por encima' : 'por debajo';
    return `${bank.shortName} tuvo el mayor efecto individual: sin sus operaciones, el TCO habría sido Bs ${formatNumber(bank.tcoWithoutBank, 2)}. Su participación dejó la mediana ${formatNumber(Math.abs(bankEffect), 0)} centavos ${direction}.`;
  }

  if (signal.reasons.includes('BANK_CONCENTRATION')) {
    return `${signal.leadingBank.shortName} concentró ${formatNumber(signal.leadingBank.sharePct, 1)}% del volumen del período. Aun así, la mediana debe leerse junto con la distribución completa de operaciones.`;
  }

  return 'El movimiento fue conjunto: ningún banco cambió por sí solo el TCO al recalcular la mediana sin sus operaciones.';
}

export async function dispatchTcoAlerts(): Promise<TcoAlertDispatchResult> {
  const breakdowns = await fetchRecentBcbTcoBreakdowns(2);
  if (breakdowns.length < 2) {
    return { eligible: 0, sent: 0, skipped: 0, reason: 'history_unavailable' };
  }

  const previous = breakdowns.at(-2)!;
  const current = breakdowns.at(-1)!;
  const signal = buildTcoAlertSignal(current, previous);
  if (!signal) {
    return {
      cutoffDate: current.cutoffDate,
      eligible: 0,
      sent: 0,
      skipped: 0,
      reason: 'no_material_signal'
    };
  }

  const subscriptions = await prisma.alertSubscription.findMany({
    where: {
      status: 'ACTIVE',
      tco_alerts: true,
      OR: [
        { last_tco_alert_cutoff: null },
        { last_tco_alert_cutoff: { not: current.cutoffDate } }
      ]
    },
    orderBy: [{ created_at: 'asc' }],
    take: 100
  });

  const detailUrl = new URL('/', siteConfig.url);
  detailUrl.searchParams.set('utm_source', 'email');
  detailUrl.searchParams.set('utm_medium', 'retention');
  detailUrl.searchParams.set('utm_campaign', 'alerta_tco_bancos');
  detailUrl.hash = 'bancos-tco-title';
  const change = `${signal.changeBob >= 0 ? '+' : '−'}Bs ${formatNumber(Math.abs(signal.changeBob), 2)}`;
  const explanation = alertExplanation(signal);
  const messages = subscriptions.map((subscription) => {
    const unsubscribeUrl = new URL('/api/alerts/unsubscribe', siteConfig.url);
    unsubscribeUrl.searchParams.set('token', subscription.unsubscribe_token);
    return tcoAlertEmail({
      email: subscription.email,
      cutoffDate: formatCalendarDate(current.cutoffDate),
      tco: `Bs ${formatNumber(current.tco, 2)}`,
      change,
      totalUsd: formatCompactUsd(current.totalUsd),
      leadingBank: signal.leadingBank.shortName,
      leadingShare: `${formatNumber(signal.leadingBank.sharePct, 1)}%`,
      explanation,
      detailUrl: detailUrl.toString(),
      sourceUrl: current.sourceUrl,
      unsubscribeUrl: unsubscribeUrl.toString()
    });
  });

  const delivery = await sendAlertEmailBatch(messages);
  if (!delivery.sent) {
    return {
      cutoffDate: current.cutoffDate,
      eligible: subscriptions.length,
      sent: 0,
      skipped: 0,
      reasons: signal.reasons,
      reason: delivery.reason
    };
  }

  if (subscriptions.length > 0) {
    await prisma.alertSubscription.updateMany({
      where: { id: { in: subscriptions.map(({ id }) => id) } },
      data: { last_tco_alert_cutoff: current.cutoffDate }
    });
  }

  return {
    cutoffDate: current.cutoffDate,
    eligible: subscriptions.length,
    sent: subscriptions.length,
    skipped: 0,
    reasons: signal.reasons
  };
}
