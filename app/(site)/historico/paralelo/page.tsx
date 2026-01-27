import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getDailyHistory } from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Metadata } from 'next';

export const revalidate = 600;

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
  const history = await getDailyHistory('PARALELO', 365);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: pageTitles.historicoParalelo,
    description: pageDescriptions.historicoParalelo,
    url: `${siteConfig.url}/historico/paralelo`,
    inLanguage: siteConfig.language
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <section className="grid gap-6">
        <div className="grid gap-3">
          <p className="kicker">Histórico dólar paralelo Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Histórico dólar paralelo Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            Serie histórica con promedios diarios del dólar paralelo. Datos agregados de múltiples
            fuentes y filtrados por validación.
          </p>
        </div>

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
                    Sin datos disponibles.
                  </td>
                </tr>
              )}
              {[...history].reverse().map((row) => (
                <tr key={row.date.toISOString()} className="border-t border-black/5">
                  <td className="py-2">{formatDate(row.date)}</td>
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
