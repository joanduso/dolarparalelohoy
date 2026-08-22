import Link from 'next/link';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { ChartCardLazy } from '@/app/(site)/_components/ChartCardLazy';
import { HistoryHighlights } from '@/app/(site)/_components/HistoryHighlights';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getSiteData } from '@/lib/siteData';
import { formatCalendarDate, formatCurrency, toCalendarDateString } from '@/lib/format';
import { computeHistoryStats } from '@/lib/historyStats';
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

type BrechaHistoryRow = {
  date: string;
  gap_pct: number;
};

type BrechaHistoryResponse = {
  data: BrechaHistoryRow[];
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

export const revalidate = 21600;

export default async function HistoricoParaleloPage() {
  const [historyResult, officialHistoryResult, brechaHistoryResult] = await Promise.all([
    getSiteData<HistoryResponse>('/api/rates/history?kind=PARALELO&days=365'),
    getSiteData<HistoryResponse>('/api/rates/history?kind=OFICIAL&days=365'),
    getSiteData<BrechaHistoryResponse>('/api/brecha/history?days=365')
  ]);

  const history = historyResult.data?.data ?? [];
  const officialHistory = officialHistoryResult.data?.data ?? [];
  const brechaHistory = brechaHistoryResult.data?.data ?? [];
  const hasAnyData = history.length > 0;
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend7d = computeTrend(trendPoints, 7);
  const trend30d = computeTrend(trendPoints, 30);
  const trend90d = computeTrend(trendPoints, 90);
  const trend365d = computeTrend(trendPoints, 365);
  const stats = computeHistoryStats(trendPoints);
  const oldestRow = history.at(0) ?? null;
  const latestRow = history.at(-1) ?? null;
  const chartData = {
    paralelo: trendPoints,
    oficial: officialHistory.map((row) => ({ date: row.date, value: row.sell_avg })),
    brecha: brechaHistory.map((row) => ({ date: row.date, value: row.gap_pct }))
  };

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
              Ver dólar paralelo Bolivia hoy
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Ver brecha cambiaria
            </Link>
          </div>
        </div>

        <HistoryHighlights
          label="El dólar paralelo"
          stats={stats}
          trends={[
            { label: '7 días', trend: trend7d },
            { label: '30 días', trend: trend30d },
            { label: '90 días', trend: trend90d },
            { label: '1 año', trend: trend365d }
          ]}
        />

        <ChartCardLazy
          data={chartData}
          title="Evolución del dólar en Bolivia"
          initialSeries="paralelo"
          initialRange={365}
        />

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
