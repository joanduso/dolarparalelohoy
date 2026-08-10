import Link from 'next/link';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatCalendarDate, formatCurrency, toCalendarDateString } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
import { HISTORY_PERIODS } from '@/lib/historyPeriods';
import type { Metadata } from 'next';

type DailyHistoryRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
  sources_count: number;
};

type HistoryResponse = {
  data: DailyHistoryRow[];
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.historicoParalelo,
    description: pageDescriptions.historicoParalelo,
    alternates: { canonical: '/historico/paralelo' },
    openGraph: {
      title: pageTitles.historicoParalelo,
      description: pageDescriptions.historicoParalelo,
      locale: siteConfig.locale
    }
  };
}

export default async function HistoricoParaleloPage() {
  const historyResult = await fetchJson<HistoryResponse>(
    '/api/rates/history?kind=PARALELO&days=365',
    {},
    600
  );

  const history = historyResult.data?.data ?? [];
  const hasAnyData = history.length > 0;
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend7d = computeTrend(trendPoints, 7);
  const trend30d = computeTrend(trendPoints, 30);
  const trend365d = computeTrend(trendPoints, 365);
  const validHistory = history.filter((row) => Number.isFinite(row.sell_avg) && row.sell_avg > 0);
  const minimumRow = validHistory.reduce<DailyHistoryRow | null>(
    (minimum, row) => (!minimum || row.sell_avg < minimum.sell_avg ? row : minimum),
    null
  );
  const maximumRow = validHistory.reduce<DailyHistoryRow | null>(
    (maximum, row) => (!maximum || row.sell_avg > maximum.sell_avg ? row : maximum),
    null
  );
  const averageSell = validHistory.length
    ? validHistory.reduce((sum, row) => sum + row.sell_avg, 0) / validHistory.length
    : null;
  const oldestRow = history.at(0) ?? null;
  const latestRow = history.at(-1) ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: pageTitles.historicoParalelo,
    description: pageDescriptions.historicoParalelo,
    url: `${siteConfig.url}/historico/paralelo`,
    inLanguage: siteConfig.language,
    creator: { '@id': `${siteConfig.url}/#organization` },
    license: `${siteConfig.url}/terminos`,
    isBasedOn: `${siteConfig.url}/fuentes`,
    ...(oldestRow && latestRow
      ? {
          temporalCoverage: `${toCalendarDateString(oldestRow.date)}/${toCalendarDateString(latestRow.date)}`,
          dateModified: toCalendarDateString(latestRow.date)
        }
      : {})
  };

  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Qué periodo cubre el histórico?',
      answer:
        oldestRow && latestRow
          ? `La tabla disponible va de ${formatCalendarDate(new Date(oldestRow.date))} a ${formatCalendarDate(new Date(latestRow.date))}.`
          : 'Mostramos hasta 12 meses de promedios diarios para comparar la tendencia del dólar paralelo.'
    },
    {
      question: '¿Cuánto estaba el dólar paralelo ayer en Bolivia?',
      answer:
        history.length >= 2
          ? `El registro anterior más reciente muestra compra a ${formatCurrency(history.at(-2)!.buy_avg)} y venta a ${formatCurrency(history.at(-2)!.sell_avg)}. Consulta la fecha exacta en la tabla.`
          : 'Consulta la tabla por fecha cuando exista más de un registro diario validado.'
    },
    {
      question: '¿Cada cuánto se actualiza?',
      answer: 'La cotización actual se refresca cada 10 minutos y el histórico consolida promedios diarios.'
    }
  ];

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Histórico dólar paralelo', href: '/historico/paralelo' }]} />
      <section className="grid gap-6">
        <div className="grid gap-3">
          <p className="kicker">Histórico dólar paralelo Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Histórico del dólar paralelo en Bolivia por fecha
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Consulta cuánto estaba el dólar paralelo en Bolivia ayer o en una fecha anterior.
            La tabla muestra promedios diarios de compra y venta, fuentes utilizadas, variaciones
            de 7, 30 y 365 días y los valores máximo, mínimo y promedio del último año.
          </p>
          {oldestRow && latestRow ? (
            <p className="text-sm text-ink/70">
              Cobertura disponible: del <strong>{formatCalendarDate(new Date(oldestRow.date))}</strong> al{' '}
              <strong>{formatCalendarDate(new Date(latestRow.date))}</strong>.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/paralelo" className="underline underline-offset-4">
              Ver precio de hoy
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Ver brecha cambiaria
            </Link>
          </div>
        </div>

        {latestRow && minimumRow && maximumRow && averageSell !== null ? (
          <section className="card p-5 grid gap-4" aria-labelledby="resumen-historico-paralelo">
            <div className="grid gap-2">
              <h2 id="resumen-historico-paralelo" className="font-serif text-2xl">
                ¿Cómo cambió el dólar paralelo en Bolivia?
              </h2>
              <p className="text-ink/70">
                El último promedio de venta disponible es <strong>{formatCurrency(latestRow.sell_avg)}</strong>,
                correspondiente al <strong>{formatCalendarDate(new Date(latestRow.date))}</strong>.
                Compara debajo la variación de la última semana, el último mes y el último año.
              </p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-black/5 p-4">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Máximo del período</dt>
                <dd className="mt-1 font-semibold">{formatCurrency(maximumRow.sell_avg)}</dd>
                <dd className="text-xs text-ink/60">{formatCalendarDate(new Date(maximumRow.date))}</dd>
              </div>
              <div className="rounded-xl bg-black/5 p-4">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Mínimo del período</dt>
                <dd className="mt-1 font-semibold">{formatCurrency(minimumRow.sell_avg)}</dd>
                <dd className="text-xs text-ink/60">{formatCalendarDate(new Date(minimumRow.date))}</dd>
              </div>
              <div className="rounded-xl bg-black/5 p-4">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Promedio del período</dt>
                <dd className="mt-1 font-semibold">{formatCurrency(averageSell)}</dd>
                <dd className="text-xs text-ink/60">{validHistory.length} registros diarios</dd>
              </div>
            </dl>
            <div className="grid gap-2">
              <TrendSummary label="El dólar paralelo" trend={trend7d} />
              <TrendSummary label="El dólar paralelo" trend={trend30d} />
              <TrendSummary label="El dólar paralelo" trend={trend365d} />
            </div>
          </section>
        ) : null}

        <div className="card p-5 grid gap-3">
          <p className="text-sm font-medium text-ink">Ver por período</p>
          <div className="flex flex-wrap gap-2">
            {HISTORY_PERIODS.map((period) => (
              <a
                key={period.slug}
                href={`/historico/paralelo/${period.slug}`}
                className="px-3 py-1 rounded-full text-xs uppercase tracking-wide bg-black/5 hover:bg-black/10"
              >
                {period.shortLabel}
              </a>
            ))}
          </div>
        </div>

        {!hasAnyData ? (
          <div className="card p-4 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}
        <div className="card p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ink/60">
              <tr>
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Compra</th>
                <th className="pb-2">Venta</th>
                <th className="pb-2">Fuentes</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td className="py-3" colSpan={4}>
                    No pudimos actualizar las fuentes.
                  </td>
                </tr>
              )}
              {[...history].reverse().map((row) => (
                <tr key={row.date} className="border-t border-black/5">
                  <td className="py-2">{formatCalendarDate(new Date(row.date))}</td>
                  <td className="py-2">{formatCurrency(row.buy_avg)}</td>
                  <td className="py-2">{formatCurrency(row.sell_avg)}</td>
                  <td className="py-2">{row.sources_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
