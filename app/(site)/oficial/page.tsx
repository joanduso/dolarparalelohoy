import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
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
  oficial: {
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
  const [latestResult, historyResult] = await Promise.all([
    fetchJson<LatestRateResponse>('/api/rates/latest', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=365', {}, 600)
  ]);

  const latest = latestResult.data?.oficial ?? null;
  const history = historyResult.data?.data ?? [];
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const hasAnyData = Boolean(latest || history.length);

  const chartData = {
    paralelo: [],
    oficial: history.map((row) => ({
      date: row.date,
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '?De d?nde sale el d?lar oficial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Se obtiene de fuentes institucionales y referencias oficiales publicadas en Bolivia.'
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
          <p className="kicker">D?lar oficial hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio d?lar oficial Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El d?lar oficial proviene de fuentes institucionales y sirve como referencia para
            operaciones reguladas.
          </p>
        </div>


        {!hasAnyData ? (
          <div className="card p-4 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}
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
        </div>

        <AdSlot label="Oficial debajo del hero" />

        <ChartCard data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="?ltimos 14 d?as" rows={miniRows} href="/historico/oficial" />
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-serif text-xl">Qu? es el d?lar oficial</h3>
            <p className="text-ink/70">
              Es el tipo de cambio reconocido por entidades oficiales. Lo usamos para comparar la
              brecha y calcular el diferencial frente al paralelo.
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
