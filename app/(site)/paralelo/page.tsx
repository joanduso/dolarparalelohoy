import Link from 'next/link';
import { Suspense } from 'react';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { DeclareForm } from '@/app/(site)/_components/DeclareForm';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getSiteData } from '@/lib/siteData';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
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
  paralelo: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
    sampleSize: number;
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

export const revalidate = 600;

export default async function ParaleloPage() {
  const [latestResult, historyResult] = await Promise.all([
    getSiteData<CurrentRatesResponse>('/api/rates/current?v=live-20260722'),
    getSiteData<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=365')
  ]);

  const latest = latestResult.data?.paralelo ?? null;
  const status = latestResult.data?.status ?? null;
  const notes = latestResult.data?.notes ?? null;
  const updatedAt = latestResult.data?.updatedAt ? new Date(latestResult.data.updatedAt) : null;
  const history = historyResult.data?.data ?? [];
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend7d = computeTrend(trendPoints, 7);
  const trend30d = computeTrend(trendPoints, 30);
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const hasAnyData = Boolean(latest || history.length);

  const sourceNote = (latest?.sampleSize ?? 0) > 0 ? 'Fuente base: Binance P2P (mediana de avisos).' : 'Paralelo sin fuentes activas. Intentaremos actualizar pronto.';

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
    inLanguage: siteConfig.language,
    dateModified: updatedAt?.toISOString()
  };

  const statusLabelValue = status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = statusLabelValue === 'OK' ? 'OK' : statusLabelValue === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    statusLabelValue === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : statusLabelValue === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Cuánto está el dólar paralelo en Bolivia hoy?',
      answer:
        typeof latest?.buy === 'number' && typeof latest?.sell === 'number'
          ? `La referencia actual es ${formatCurrency(latest.buy)} para compra y ${formatCurrency(latest.sell)} para venta. La hora de actualización aparece junto a la cotización.`
          : 'La cotización aparece en esta página cuando las fuentes activas completan la validación.'
    },
    {
      question: '¿Cómo se calcula el dólar paralelo?',
      answer: 'Se calcula con promedios de fuentes públicas y mercados P2P, filtrando valores atípicos antes de publicar la referencia.'
    },
    {
      question: '¿Cada cuánto se actualiza?',
      answer: 'Los datos se actualizan automáticamente cada 10 minutos cuando las fuentes están disponibles.'
    }
  ];

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Dólar paralelo', href: '/paralelo' }]} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">Cotización actualizada cada 10 minutos</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Dólar paralelo Bolivia hoy: compra y venta
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Consulta el precio del dólar paralelo en Bolivia hoy, cuánto pagan por comprar y cuánto
            cuesta vender, la variación reciente y la hora de actualización. La referencia usa
            fuentes públicas y mercados P2P filtrados.
          </p>
          {typeof latest?.buy === 'number' && typeof latest?.sell === 'number' ? (
            <p className="text-lg text-ink max-w-2xl">
              Hoy la referencia es <strong>{formatCurrency(latest.buy)}</strong> para compra y{' '}
              <strong>{formatCurrency(latest.sell)}</strong> para venta.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              Analizar tendencia, máximos y mínimos
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Comparar con el dólar oficial
            </Link>
          </div>
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
                {typeof latest?.sampleSize === 'number' ? latest.sampleSize : <Skeleton className="h-8 w-10" />}
              </p>
            </div>
            <p className="text-sm text-ink/60">
              {latest?.sampleSize && latest.sampleSize >= 2
                ? `Confirmado por ${latest.sampleSize} muestras`
                : 'Estimación pendiente'}
            </p>
          </div>
          <p className="text-sm text-ink/60">{sourceNote}</p>
          {statusLabelValue !== 'OK' && notes ? (
            <p className="text-xs text-ink/60">Nota técnica: {notes}</p>
          ) : null}
        </div>

        {(trend7d || trend30d) ? (
          <section className="card p-5 grid gap-3" aria-labelledby="movimiento-dolar-paralelo">
            <h2 id="movimiento-dolar-paralelo" className="font-serif text-2xl">
              Movimiento reciente del dólar paralelo
            </h2>
            <TrendSummary label="La venta del dólar paralelo" trend={trend7d} />
            <TrendSummary label="La venta del dólar paralelo" trend={trend30d} />
            <Link href="/historico/paralelo" className="underline underline-offset-4 text-sm">
              Analizar máximos, mínimos e histórico por fecha
            </Link>
          </section>
        ) : null}

        <Suspense
          fallback={<div className="card p-5 text-sm text-ink/60">Cargando declarado...</div>}
        >
          <DeclaredBlock />
        </Suspense>

        <DeclareForm />

        <AdSlot label="Paralelo debajo del hero" />

        <ChartCard data={chartData} />

        <div className="card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Más contexto</p>
            <h2 className="font-serif text-2xl">¿Cómo cambió el dólar paralelo?</h2>
            <p className="mt-1 text-sm text-ink/70">
              Compara 7, 30, 90 y 365 días, revisa máximos y mínimos y descarga la serie diaria.
            </p>
          </div>
          <Link
            href="/historico/paralelo"
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-white"
          >
            Explorar histórico
          </Link>
        </div>

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
        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
