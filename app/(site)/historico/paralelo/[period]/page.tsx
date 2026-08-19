import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { siteConfig } from '@/lib/seo';
import { getSiteData } from '@/lib/siteData';
import { formatCalendarDate, formatCurrency } from '@/lib/format';
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

export const revalidate = 21600;

export async function generateMetadata({
  params
}: {
  params: { period: string };
}): Promise<Metadata> {
  const period = getHistoryPeriod(params.period);
  if (!period) return {};

  const title = `Histórico dólar paralelo Bolivia: ${period.shortLabel}`;
  const description = `Serie histórica del dólar paralelo en Bolivia durante ${period.label}: promedios diarios, tendencia y fuentes públicas verificables.`;

  return {
    title,
    description,
    alternates: { canonical: `/historico/paralelo/${period.slug}` },
    openGraph: { title, description, locale: siteConfig.locale }
  };
}

export default async function HistoricoParaleloPeriodPage({
  params
}: {
  params: { period: string };
}) {
  const period = getHistoryPeriod(params.period);
  if (!period) notFound();

  const historyResult = await getSiteData<HistoryResponse>(
    `/api/rates/history?kind=PARALELO&days=${period.days}`
  );

  const history = historyResult.data?.data ?? [];
  const hasAnyData = history.length > 0;
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend = computeTrend(trendPoints, period.days);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Histórico dólar paralelo Bolivia — ${period.shortLabel}`,
    description: `Serie histórica del dólar paralelo en Bolivia durante ${period.label}.`,
    url: `${siteConfig.url}/historico/paralelo/${period.slug}`,
    inLanguage: siteConfig.language,
    creator: { '@id': `${siteConfig.url}/#organization` },
    license: `${siteConfig.url}/terminos`
  };

  const faqItems: SeoFaqItem[] = [
    {
      question: `¿Qué muestra este período de ${period.shortLabel.toLowerCase()}?`,
      answer: `Promedios diarios del dólar paralelo en Bolivia durante ${period.label}, calculados con la misma metodología multi-fuente que el resto del sitio.`
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
          { name: 'Histórico dólar paralelo', href: '/historico/paralelo' },
          { name: period.shortLabel, href: `/historico/paralelo/${period.slug}` }
        ]}
      />
      <section className="grid gap-6">
        <div className="grid gap-3">
          <p className="kicker">Serie histórica por período</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Histórico del dólar paralelo en Bolivia: {period.shortLabel.toLowerCase()}
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Serie histórica con promedios diarios del dólar paralelo durante {period.label}. Datos
            agregados de múltiples fuentes y filtrados por validación.
          </p>
          <p className="text-sm text-ink/70">
            Para la referencia vigente, consulta el{' '}
            <Link href="/paralelo" className="underline underline-offset-4">
              dólar paralelo Bolivia hoy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {HISTORY_PERIODS.map((option) => (
            <a
              key={option.slug}
              href={`/historico/paralelo/${option.slug}`}
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${
                option.slug === period.slug ? 'bg-ink text-white' : 'bg-black/5'
              }`}
            >
              {option.shortLabel}
            </a>
          ))}
        </div>

        <TrendSummary label="El dólar paralelo" trend={trend} />

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
