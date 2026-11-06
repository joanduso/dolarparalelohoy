import Link from 'next/link';
import { Suspense } from 'react';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { DeclareForm } from '@/app/(site)/_components/DeclareForm';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getSiteData } from '@/lib/siteData';
import { getParallelQuote, describeParallelQuote } from '@/lib/p2pIndex';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
import type { Metadata } from 'next';

type DailyHistoryRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
};

type HistoryResponse<T> = {
  data: T[];
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: pageTitles.paralelo },
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
  const [historyResult, officialHistoryResult, quote] = await Promise.all([
    getSiteData<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=365'),
    getSiteData<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=365'),
    getParallelQuote()
  ]);

  const buy = quote?.buy ?? null;
  const sell = quote?.sell ?? null;
  const evidenceCount = quote?.sourceCount ?? 0;
  const status = quote ? (quote.provider === 'binance' ? 'DEGRADED' : 'OK') : 'ERROR';
  const updatedAt = quote ? new Date(quote.updatedAt) : null;
  const history = historyResult.data?.data ?? [];
  const officialHistory = officialHistoryResult.data?.data ?? [];
  const trendPoints = history.map((row) => ({ date: row.date, value: row.sell_avg }));
  const trend7d = computeTrend(trendPoints, 7);
  const trend30d = computeTrend(trendPoints, 30);
  const miniRows = history.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const hasAnyData = Boolean((buy !== null && sell !== null) || history.length);

  const sourceNote = describeParallelQuote(quote);

  const chartData = {
    paralelo: history.map((row) => ({
      date: row.date,
      value: row.sell_avg
    })),
    oficial: officialHistory.map((row) => ({
      date: row.date,
      value: row.sell_avg
    })),
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

  const statusLabelValue = status;
  const statusLabel = statusLabelValue === 'OK' ? 'OK' : statusLabelValue === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    statusLabelValue === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : statusLabelValue === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Cómo se calcula el índice P2P del dólar en Bolivia?',
      answer: quote?.provider === 'paralelo.bo'
        ? 'Mostramos la mediana multi-exchange publicada por paralelo.bo junto con su hora y número de fuentes activas. Si ese índice no está disponible, mostramos un respaldo temporal de Binance P2P cuando hay datos recientes.'
        : 'Cuando el índice multi-exchange no está disponible, mostramos un respaldo temporal de anuncios de Binance P2P si hay datos recientes; de lo contrario, indicamos que falta la cotización.'
    },
    {
      question: '¿Qué representan la compra y la venta del índice?',
      answer: 'La compra refleja cuánto ofrecen por cada unidad equivalente a un dólar; la venta, cuánto cuesta adquirirla en los mercados observados.'
    },
    {
      question: '¿Cada cuánto se actualiza?',
      answer: 'Mostramos la fecha y hora de la referencia consultada. Si una fuente no ofrece datos recientes, usamos un respaldo temporal o indicamos que la cotización no está disponible.'
    },
    {
      question: '¿El índice indica el precio de dólares en billetes?',
      answer: 'No. Es una referencia digital de mercados P2P USDT/BOB; los billetes pueden negociarse a otro precio y bajo otras condiciones.'
    }
  ];

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Índice P2P', href: '/paralelo' }]} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">Metodología y detalle de mercado</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Índice P2P de Bolivia: fuentes y metodología
          </h1>
          <p className="text-ink/70 max-w-2xl">
            Conoce cómo se obtiene la referencia digital USDT/BOB, qué proveedor la publica y
            cuándo se utiliza un respaldo. Los anuncios P2P no equivalen a fuentes independientes
            ni al precio de dólares en efectivo.
          </p>
          {typeof buy === 'number' && typeof sell === 'number' ? (
            <p className="text-lg text-ink max-w-2xl">
              La referencia consultada es <strong>{formatCurrency(buy)}</strong> para compra y{' '}
              <strong>{formatCurrency(sell)}</strong> para venta.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="underline underline-offset-4">
              Ver dólar paralelo Bolivia hoy
            </Link>
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              Analizar tendencia, máximos y mínimos
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Comparar con el dólar oficial
            </Link>
            <Link href="/calculadora-dolar-bolivia" className="underline underline-offset-4">
              Calcular USD a BOB
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
                {updatedAt ? formatDateTime(updatedAt) : 'Sin actualización reciente'}
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
                {typeof buy === 'number' ? formatCurrency(buy) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Venta</p>
              <p className="text-3xl font-semibold">
                {typeof sell === 'number' ? formatCurrency(sell) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Fuentes activas</p>
              <p className="text-3xl font-semibold">{evidenceCount}</p>
            </div>
            <p className="text-sm text-ink/60">
              {evidenceCount >= 2
                ? `Publicado con ${evidenceCount} fuentes activas`
                : evidenceCount === 1 ? 'Una fuente activa' : 'Sin cotización reciente'}
            </p>
          </div>
          <p className="text-sm text-ink/60">{sourceNote}</p>
          <p className="text-sm text-ink/60">
            Esta cotización es una referencia digital P2P, no una oferta de cambio ni un precio de
            billetes en efectivo. <Link href="/fuentes" className="underline underline-offset-4">Revisa las fuentes y el método</Link>.
          </p>

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
              Es una referencia de mercados digitales P2P fuera del tipo de cambio oficial. La
              cifra actual usa el índice de paralelo.bo cuando está disponible y un respaldo
              temporal de Binance P2P si falta; no representa una oferta vinculante.
            </p>
            <Link href="/fuentes" className="underline underline-offset-4 text-sm">
              Metodología completa
            </Link>
          </div>
        </div>
        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
