import Link from 'next/link';
import { Suspense } from 'react';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { DeclareForm } from '@/app/(site)/_components/DeclareForm';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Metadata } from 'next';

type DailyHistoryRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
};

type LatestRateResponse = {
  paralelo: {
    buy: number;
    sell: number;
    timestamp: string;
    sourcesCount: number;
  } | null;
};

type HistoryResponse<T> = {
  data: T[];
};

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
  const [latestResult, historyResult] = await Promise.all([
    fetchJson<LatestRateResponse>('/api/rates/latest', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=365', {}, 600)
  ]);

  const latest = latestResult.data?.paralelo ?? null;
  const history = historyResult.data?.data ?? [];
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const chartData = {
    paralelo: history.map((row) => ({
      date: row.date,
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '?C?mo se calcula el d?lar paralelo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Se calcula con promedios diarios de fuentes p?blicas y P2P, filtrando valores at?picos.'
        }
      },
      {
        '@type': 'Question',
        name: '?Cada cu?nto se actualiza?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Los datos se actualizan autom?ticamente cada 10 minutos cuando el cach? expira.'
        }
      }
    ]
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">D?lar paralelo hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio d?lar paralelo Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El d?lar paralelo refleja operaciones fuera del canal oficial. Publicamos promedios
            diarios para ofrecer una referencia transparente.
          </p>
        </div>

        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className="font-serif text-2xl">Cotizaci?n actual</h2>
            <span className="text-sm text-ink/60">
              {latest?.timestamp ? formatDateTime(new Date(latest.timestamp)) : <Skeleton className="h-4 w-28" />}
            </span>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-ink/50">Compra</p>
              <p className="text-3xl font-semibold">
                {typeof latest?.buy === 'number' ? formatCurrency(latest.buy) : <Skeleton className="h-8 w-24" />}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Venta</p>
              <p className="text-3xl font-semibold">
                {typeof latest?.sell === 'number' ? formatCurrency(latest.sell) : <Skeleton className="h-8 w-24" />}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Fuentes</p>
              <p className="text-3xl font-semibold">
                {typeof latest?.sourcesCount === 'number' ? latest.sourcesCount : <Skeleton className="h-8 w-10" />}
              </p>
            </div>
            <p className="text-sm text-ink/60">
              {latest?.sourcesCount && latest.sourcesCount >= 2
                ? `Confirmado por ${latest.sourcesCount} fuentes`
                : 'Estimaci?n pendiente'}
            </p>
          </div>
          <p className="text-sm text-ink/60">
            Fuente base: agregaci?n de mercado P2P y fuentes informativas.
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
          <MiniTable title="?ltimos 14 d?as" rows={miniRows} href="/historico/paralelo" />
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-serif text-xl">Qu? es el d?lar paralelo</h3>
            <p className="text-ink/70">
              Es el tipo de cambio que surge de operaciones fuera del mercado oficial. Se calcula
              con promedios de fuentes p?blicas y no representa una oferta vinculante.
            </p>
            <Link href="/faq" className="underline underline-offset-4 text-sm">
              Metodolog?a completa
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
