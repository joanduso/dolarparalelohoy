import { notFound } from 'next/navigation';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatCurrency, formatDate } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
import { HISTORY_PERIODS, getHistoryPeriod } from '@/lib/historyPeriods';
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

export function generateStaticParams() {
  return HISTORY_PERIODS.map((period) => ({ period: period.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { period: string };
}): Promise<Metadata> {
  const period = getHistoryPeriod(params.period);
  if (!period) return {};

  const title = `Histórico dólar oficial Bolivia: ${period.shortLabel}`;
  const description = `Serie histórica del dólar oficial en Bolivia durante ${period.label}, publicada por el BCB: promedios diarios, tendencia y metodología transparente.`;

  return {
    title,
    description,
    alternates: { canonical: `/historico/oficial/${period.slug}` },
    openGraph: { title, description, locale: siteConfig.locale }
  };
}

export default async function HistoricoOficialPeriodPage({
  params
}: {
  params: { period: string };
}) {
  const period = getHistoryPeriod(params.period);
  if (!period) notFound();

  const historyResult = await fetchJson<HistoryResponse>(
    `/api/rates/history?kind=OFICIAL&days=${period.days}`,
    {},
    600
  );

  const history = historyResult.data?.data ?? [];
  const hasAnyData = history.length > 0;
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend = computeTrend(trendPoints, period.days);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Histórico dólar oficial Bolivia — ${period.shortLabel}`,
    description: `Serie histórica del dólar oficial en Bolivia durante ${period.label}.`,
    url: `${siteConfig.url}/historico/oficial/${period.slug}`,
    inLanguage: siteConfig.language,
    creator: { '@id': `${siteConfig.url}/#organization` },
    license: `${siteConfig.url}/terminos`
  };

  const faqItems: SeoFaqItem[] = [
    {
      question: `¿Qué muestra este período de ${period.shortLabel.toLowerCase()}?`,
      answer: `Promedios diarios del dólar oficial en Bolivia durante ${period.label}, publicados por el Banco Central de Bolivia (BCB).`
    },
    {
      question: '¿Cada cuánto se actualiza?',
      answer: 'La cotización actual se refresca cada 10 minutos y el histórico consolida promedios diarios.'
    }
  ];

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { name: 'Histórico dólar oficial', href: '/historico/oficial' },
          { name: period.shortLabel, href: `/historico/oficial/${period.slug}` }
        ]}
      />
      <section className="grid gap-6">
        <div className="grid gap-3">
          <p className="kicker">Histórico dólar oficial Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Dólar oficial Bolivia: {period.shortLabel.toLowerCase()}
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Serie histórica con promedios diarios del dólar oficial durante {period.label}. Datos
            publicados por el BCB y agregados con metodología transparente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {HISTORY_PERIODS.map((option) => (
            <a
              key={option.slug}
              href={`/historico/oficial/${option.slug}`}
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${
                option.slug === period.slug ? 'bg-ink text-white' : 'bg-black/5'
              }`}
            >
              {option.shortLabel}
            </a>
          ))}
        </div>

        <TrendSummary label="El dólar oficial" trend={trend} />

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
                  <td className="py-2">{formatDate(new Date(row.date))}</td>
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
