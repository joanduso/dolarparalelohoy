import { formatCalendarDate, formatCurrency, formatNumber } from '@/lib/format';
import type { HistoryStats } from '@/lib/historyStats';
import type { TrendSummaryData } from '@/lib/trend';

type TrendWindow = {
  label: string;
  trend: TrendSummaryData | null;
};

function formatChange(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatNumber(value, 1)}%`;
}

function trendSentence(label: string, trend: TrendSummaryData | null) {
  if (!trend) return null;

  if (trend.direction === 'flat') {
    return `${label} se mantuvo estable durante los últimos ${trend.days} días.`;
  }

  const verb = trend.direction === 'up' ? 'subió' : 'bajó';
  return `${label} ${verb} ${formatNumber(Math.abs(trend.changePct), 1)}% durante los últimos ${trend.days} días, una variación de ${formatCurrency(Math.abs(trend.changeAbs))}.`;
}

export function HistoryHighlights({
  label,
  stats,
  trends
}: {
  label: string;
  stats: HistoryStats | null;
  trends: TrendWindow[];
}) {
  if (!stats) return null;

  const primaryTrend = trends.find(({ trend }) => trend?.days === 30)?.trend ?? trends.find(({ trend }) => trend)?.trend ?? null;
  const interpretation = trendSentence(label, primaryTrend);

  return (
    <section className="grid gap-4" aria-labelledby="resumen-tendencia">
      <div>
        <p className="kicker">Datos del período</p>
        <h2 id="resumen-tendencia" className="font-serif text-2xl">
          Resumen de la tendencia
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Último promedio</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.lastValue)}</p>
          <p className="mt-1 text-xs text-ink/60">{formatCalendarDate(stats.lastDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Cambio del período</p>
          <p className="mt-1 text-2xl font-semibold">{formatChange(stats.changePct)}</p>
          <p className="mt-1 text-xs text-ink/60">{formatCurrency(stats.changeAbs)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Máximo</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.maxValue)}</p>
          <p className="mt-1 text-xs text-ink/60">{formatCalendarDate(stats.maxDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Mínimo</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.minValue)}</p>
          <p className="mt-1 text-xs text-ink/60">{formatCalendarDate(stats.minDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Promedio</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.averageValue)}</p>
          <p className="mt-1 text-xs text-ink/60">{stats.count} registros diarios</p>
        </div>
      </div>

      <div className="card p-5 grid gap-3">
        <h3 className="font-serif text-xl">Lectura rápida</h3>
        {interpretation ? <p className="text-ink/70">{interpretation}</p> : null}
        <p className="text-ink/70">
          En el período visible, el valor más bajo fue {formatCurrency(stats.minValue)} y el más alto{' '}
          {formatCurrency(stats.maxValue)}. Estas cifras son promedios diarios de venta y no una oferta
          garantizada para operar.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {trends.map(({ label: trendLabel, trend }) =>
            trend ? (
              <span key={trendLabel} className="rounded-full bg-black/5 px-3 py-1">
                {trendLabel}: {formatChange(trend.changePct)}
              </span>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}
