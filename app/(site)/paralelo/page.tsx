import Link from 'next/link';
import { Suspense } from 'react';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { DeclareForm } from '@/app/(site)/_components/DeclareForm';
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
    title: pageTitles.paralelo,
    description: pageDescriptions.paralelo,
    alternates: { canonical: '/paralelo' },
    openGraph: {
      title: pageTitles.paralelo,
      description: pageDescriptions.paralelo,
      locale: siteConfig.locale
    }
  };
}

export default async function ParaleloPage() {
  const [latest, history, mini] = await Promise.all([
    getLatestRate('PARALELO'),
    getDailyHistory('PARALELO', 365),
    getMiniTable('PARALELO', 14)
  ]);

  const chartData = {
    paralelo: history.map((row: DailyHistoryRow) => ({
      date: row.date.toISOString(),
      value: row.sell_avg
    })),
    oficial: [],
    brecha: []
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.paralelo,
    description: pageDescriptions.paralelo,
    url: `${siteConfig.url}/paralelo`,
    inLanguage: siteConfig.language
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">Dólar paralelo hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio dólar paralelo Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El dólar paralelo refleja operaciones fuera del canal oficial. Publicamos promedios
            diarios para ofrecer una referencia transparente.
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
          <p className="text-sm text-ink/60">
            Fuente base: agregación de mercado P2P y fuentes informativas.
          </p>
        </div>

        <Suspense
          fallback={<div className="card p-5 text-sm text-ink/60">Cargando declarado...</div>}
        >
          <DeclaredBlock />
        </Suspense>

        <DeclareForm />

        <AdSlot label="Paralelo debajo del hero" />

        <ChartCard data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="Últimos 14 días" rows={mini} href="/historico/paralelo" />
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-serif text-xl">Qué es el dólar paralelo</h3>
            <p className="text-ink/70">
              Es el tipo de cambio que surge de operaciones fuera del mercado oficial. Se calcula
              con promedios de fuentes públicas y no representa una oferta vinculante.
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
