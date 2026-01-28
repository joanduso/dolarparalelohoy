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
  quality?: {
    status: 'OK' | 'DEGRADED' | 'ERROR';
    notes?: string | null;
  };
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
  const quality = latestResult.data?.quality ?? null;
  const history = historyResult.data?.data ?? [];
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const hasAnyData = Boolean(latest || history.length);

  const sourceNote = latest?.sourcesCount ? 'Fuente base: Binance P2P (mediana de avisos).' : 'Paralelo sin fuentes activas. Intentaremos actualizar pronto.';

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

  const status = quality?.status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = status === 'OK' ? 'OK' : status === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    status === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : status === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo se calcula el dólar paralelo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Se calcula con promedios diarios de fuentes públicas y P2P, filtrando valores atípicos.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Cada cuánto se actualiza?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Los datos se actualizan automáticamente cada 10 minutos cuando el cache expira.'
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
          <p className="kicker">Dólar paralelo hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio dólar paralelo Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El dólar paralelo refleja operaciones fuera del canal oficial. Publicamos promedios
            diarios para ofrecer una referencia transparente.
          </p>
        </div>


        {!hasAnyData ? (
          <div className="card p-4 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}
        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Cotización actual</h2>
            <div className="flex items-center gap-3 text-sm text-ink/60">
              <span>
                {latest?.timestamp ? formatDateTime(new Date(latest.timestamp)) : <Skeleton className="h-4 w-28" />}
              </span>
              <span className={`px-2 py-1 rounded-full border text-xs ${statusClass}`}>
                Estado: {statusLabel}
              </span>
            </div>
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
                : 'Estimación pendiente'}
            </p>
          </div>
          <p className="text-sm text-ink/60">{sourceNote}</p>
          {status !== 'OK' && quality?.notes ? (
            <p className="text-xs text-ink/60">Nota técnica: {quality.notes}</p>
          ) : null}
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
          <MiniTable title="Últimos 14 días" rows={miniRows} href="/historico/paralelo" />
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
