import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getDailyHistory, getLatestRate, getMiniTable } from '@/lib/queries';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Metadata } from 'next';

type DailyHistoryRow = {
  date: Date;
  sell_avg: number;
};

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.oficial,
    description: pageDescriptions.oficial,
    alternates: { canonical: '/oficial' },
    openGraph: {
      title: pageTitles.oficial,
      description: pageDescriptions.oficial,
      locale: siteConfig.locale
    }
  };
}

export default async function OficialPage() {
  const [latest, history, mini] = await Promise.all([
    getLatestRate('OFICIAL'),
    getDailyHistory('OFICIAL', 365),
    getMiniTable('OFICIAL', 14)
  ]);

  const chartData = {
    paralelo: [],
    oficial: history.map((row: DailyHistoryRow) => ({
      date: row.date.toISOString(),
      value: row.sell_avg
    })),
    brecha: []
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.oficial,
    description: pageDescriptions.oficial,
    url: `${siteConfig.url}/oficial`,
    inLanguage: siteConfig.language
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">Dólar oficial hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio dólar oficial Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El dólar oficial proviene de fuentes institucionales y sirve como referencia para
            operaciones reguladas.
          </p>
        </div>

        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className="font-serif text-2xl">Cotización actual</h2>
            <span className="text-sm text-ink/60">
              {latest?.timestamp ? formatDateTime(latest.timestamp) : 'Sin datos recientes'}
            </span>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-ink/50">Compra</p>
              <p className="text-3xl font-semibold">{formatCurrency(latest?.buy)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Venta</p>
              <p className="text-3xl font-semibold">{formatCurrency(latest?.sell)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Fuentes</p>
              <p className="text-3xl font-semibold">{latest?.sourcesCount ?? 0}</p>
            </div>
            <p className="text-sm text-ink/60">
              {latest?.sourcesCount && latest.sourcesCount >= 2
                ? `Confirmado por ${latest.sourcesCount} fuentes`
                : 'Estimacion pendiente'}
            </p>
          </div>
        </div>

        <AdSlot label="Oficial debajo del hero" />

        <ChartCard data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="Últimos 14 días" rows={mini} href="/historico/oficial" />
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-serif text-xl">Qué es el dólar oficial</h3>
            <p className="text-ink/70">
              Es el tipo de cambio reconocido por entidades oficiales. Lo usamos para comparar la
              brecha y calcular el diferencial frente al paralelo.
            </p>
            <Link href="/faq" className="underline underline-offset-4 text-sm">
              Metodología completa
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
