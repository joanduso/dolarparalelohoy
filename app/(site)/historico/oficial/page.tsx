import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatCurrency, formatDate } from '@/lib/format';
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
    title: pageTitles.historicoOficial,
    description: pageDescriptions.historicoOficial,
    alternates: { canonical: '/historico/oficial' },
    openGraph: {
      title: pageTitles.historicoOficial,
      description: pageDescriptions.historicoOficial,
      locale: siteConfig.locale
    }
  };
}

export default async function HistoricoOficialPage() {
  const historyResult = await fetchJson<HistoryResponse>(
    '/api/rates/history?kind=OFICIAL&days=365',
    {},
    600
  );

  const history = historyResult.data?.data ?? [];
  const hasAnyData = history.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: pageTitles.historicoOficial,
    description: pageDescriptions.historicoOficial,
    url: `${siteConfig.url}/historico/oficial`,
    inLanguage: siteConfig.language
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '?Qu? periodo cubre el hist?rico?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mostramos hasta 12 meses de promedios diarios para comparar tendencias.'
        }
      },
      {
        '@type': 'Question',
        name: '?Cada cu?nto se actualiza?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Los datos se refrescan autom?ticamente cada 10 minutos al expirar el cach?.'
        }
      }
    ]
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <section className="grid gap-6">
        <div className="grid gap-3">
          <p className="kicker">Hist?rico d?lar oficial Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Hist?rico d?lar oficial Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            Serie hist?rica con promedios diarios del d?lar oficial. Datos agregados de m?ltiples
            fuentes y filtrados por validaci?n.
          </p>
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
                  <td className="py-2">{formatDate(new Date(row.date))}</td>
                  <td className="py-2">{formatCurrency(row.buy_avg)}</td>
                  <td className="py-2">{formatCurrency(row.sell_avg)}</td>
                  <td className="py-2">{row.sources_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
