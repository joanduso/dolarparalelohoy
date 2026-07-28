import { formatCalendarDate, formatCurrency } from '@/lib/format';
import type { TrendSummaryData } from '@/lib/trend';

const LABELS: Record<'up' | 'down' | 'flat', string> = {
  up: 'subió',
  down: 'bajó',
  flat: 'se mantuvo estable'
};

export function TrendSummary({
  label,
  trend
}: {
  label: string;
  trend: TrendSummaryData | null;
}) {
  if (!trend) return null;

  const verb = LABELS[trend.direction];
  const pctText = trend.direction === 'flat' ? null : `${Math.abs(trend.changePct).toFixed(1)}%`;

  return (
    <p className="text-sm text-ink/70">
      <strong className="text-ink">Tendencia ({trend.days} días):</strong> {label} {verb}
      {pctText ? ` ${pctText}` : ''} en los últimos {trend.days} días, de{' '}
      {formatCurrency(trend.firstValue)} ({formatCalendarDate(trend.firstDate)}) a{' '}
      {formatCurrency(trend.lastValue)} ({formatCalendarDate(trend.lastDate)}).
    </p>
  );
}
