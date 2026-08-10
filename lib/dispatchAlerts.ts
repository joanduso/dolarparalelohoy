import { dailyAlertEmail, sendAlertEmailBatch } from '@/lib/alertEmail';
import { shouldSendAlert, type AlertFrequencyValue } from '@/lib/alerts';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { siteConfig } from '@/lib/seo';
import { getShareSnapshot } from '@/lib/shareRate';

export type AlertDispatchResult = {
  eligible: number;
  sent: number;
  skipped: number;
  reason?: string;
};

export async function dispatchRateAlerts(now = new Date()): Promise<AlertDispatchResult> {
  const snapshot = await getShareSnapshot();
  if (!snapshot) return { eligible: 0, sent: 0, skipped: 0, reason: 'rate_unavailable' };

  const subscriptions = await prisma.alertSubscription.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ last_sent_at: 'asc' }, { created_at: 'asc' }],
    take: 100
  });

  const eligible = subscriptions.filter((subscription) => shouldSendAlert({
    frequency: subscription.frequency as AlertFrequencyValue,
    thresholdPct: subscription.threshold_pct,
    changePct: snapshot.changePct,
    lastSentAt: subscription.last_sent_at,
    now
  }));

  const shareUrl = new URL('/compartir', siteConfig.url);
  shareUrl.searchParams.set('utm_source', 'email');
  shareUrl.searchParams.set('utm_medium', 'retention');
  shareUrl.searchParams.set('utm_campaign', 'alerta_cotizacion');

  const variation = snapshot.changePct === null
    ? 'no disponible'
    : `${snapshot.changePct >= 0 ? '+' : ''}${formatNumber(snapshot.changePct, 1)}% vs. ayer`;
  const gap = snapshot.gapPct === null
    ? 'no disponible'
    : `${formatNumber(snapshot.gapPct, 1)}% sobre el oficial`;
  const messages = eligible.map((subscription) => {
    const unsubscribeUrl = new URL('/api/alerts/unsubscribe', siteConfig.url);
    unsubscribeUrl.searchParams.set('token', subscription.unsubscribe_token);
    return dailyAlertEmail({
      email: subscription.email,
      buy: formatCurrency(snapshot.buy),
      sell: formatCurrency(snapshot.sell),
      variation,
      gap,
      updatedAt: formatDateTime(snapshot.updatedAt),
      shareUrl: shareUrl.toString(),
      unsubscribeUrl: unsubscribeUrl.toString()
    });
  });

  const delivery = await sendAlertEmailBatch(messages);
  if (!delivery.sent) {
    return {
      eligible: eligible.length,
      sent: 0,
      skipped: subscriptions.length - eligible.length,
      reason: delivery.reason
    };
  }

  if (eligible.length > 0) {
    await prisma.alertSubscription.updateMany({
      where: { id: { in: eligible.map(({ id }) => id) } },
      data: { last_sent_at: now }
    });
  }

  return {
    eligible: eligible.length,
    sent: eligible.length,
    skipped: subscriptions.length - eligible.length
  };
}
