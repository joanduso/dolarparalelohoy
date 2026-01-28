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

type CurrentRatesResponse = {
  updatedAt: string | null;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  notes?: string | null;
  oficial: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
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
    fetchJson<CurrentRatesResponse>('/api/rates/current', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=365', {}, 600)
  ]);

  const latest = latestResult.data?.oficial ?? null;
  const status = latestResult.data?.status ?? null;
  const notes = latestResult.data?.notes ?? null;
  const updatedAt = latestResult.data?.updatedAt ? new Date(latestResult.data.updatedAt) : null;
  const history = historyResult.data?.data ?? [];
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const hasAnyData = Boolean(latest || history.length);

  const sourceNote = latest ? 'Fuente base: Banco Central de Bolivia (BCB).' : 'Oficial sin fuentes activas. Intentaremos actualizar pronto.';

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

  const statusLabelValue = status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = statusLabelValue === 'OK' ? 'OK' : statusLabelValue === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    statusLabelValue === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : statusLabelValue === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿De dónde sale el dólar oficial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Se obtiene de fuentes institucionales y referencias oficiales publicadas en Bolivia.'
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
          <p className="kicker">Dólar oficial hoy Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Precio dólar oficial Bolivia</h1>
          <p className="text-ink/70 max-w-2xl">
            El dólar oficial proviene de fuentes institucionales y sirve como referencia para
            operaciones reguladas.
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
                {updatedAt ? formatDateTime(updatedAt) : <Skeleton className="h-4 w-28" />}
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
                {typeof latest?.sources_count === 'number' ? latest.sources_count : <Skeleton className="h-8 w-10" />}
              </p>
            </div>
            <p className="text-sm text-ink/60">
              {latest?.sources_count && latest.sources_count >= 2
                ? `Confirmado por ${latest.sources_count} fuentes`
                : 'Estimación pendiente'}
            </p>
          </div>
        </div>

        <p className="text-sm text-ink/60">{sourceNote}</p>
        {statusLabelValue !== 'OK' && notes ? (
          <p className="text-xs text-ink/60">Nota técnica: {notes}</p>
        ) : null}

        <AdSlot label="Oficial debajo del hero" />

        <ChartCard data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="Últimos 14 días" rows={miniRows} href="/historico/oficial" />
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
