import { Suspense } from 'react';
import Link from 'next/link';
import { RateCard } from '@/app/(site)/_components/RateCard';
import { BrechaCard } from '@/app/(site)/_components/BrechaCard';
import { TcoCard } from '@/app/(site)/_components/TcoCard';
import { BCBCard } from '@/app/(site)/_components/BCBCard';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { DeclareFormLazy } from '@/app/(site)/_components/DeclareFormLazy';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { PlatformCards } from '@/app/(site)/_components/PlatformCards';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { ChartCardLazy } from '@/app/(site)/_components/ChartCardLazy';
import {
  BcbTcoBankFallback,
  BcbTcoBankSection
} from '@/app/(site)/_components/BcbTcoBankSection';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getSiteData } from '@/lib/siteData';
import { formatDateTime } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
import type { Metadata } from 'next';
import { fetchP2PIndex } from '@/lib/p2pIndex';
import { fetchRecentBcbTcoBreakdowns } from '@/lib/bcbTco';

type DailyHistoryRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
};

type BrechaHistoryRow = {
  date: string;
  gap_pct: number;
};

type CurrentRatesResponse = {
  updatedAt: string | null;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  sources: {
    bcb: 'OK' | 'ERROR';
    binance_p2p: 'OK' | 'ERROR';
  };
  paralelo: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
    sampleSize: number;
  } | null;
  oficial: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
  } | null;
  brecha: {
    gap_abs: number | null;
    gap_pct: number | null;
  } | null;
  notes?: string | null;
};

type HistoryResponse<T> = {
  data: T[];
};

type BrechaLatestResponse = {
  brecha: {
    gap_abs: number;
    gap_pct: number;
    date: string;
  } | null;
};

type BcbResponse = {
  source: string;
  dateText: string;
  compraText: string;
  ventaText: string;
  compra: number;
  venta: number;
  fetchedAt: string;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: pageTitles.home },
    description: pageDescriptions.home,
    alternates: { canonical: '/' },
    openGraph: {
      title: pageTitles.home,
      description: pageDescriptions.home,
      locale: siteConfig.locale
    },
    twitter: {
      title: pageTitles.home,
      description: pageDescriptions.home
    }
  };
}

export const revalidate = 600;

function getDelta(history: { sell_avg: number }[]) {
  if (history.length < 2) return null;
  const [today, yesterday] = history.slice(0, 2);
  return ((today.sell_avg - yesterday.sell_avg) / yesterday.sell_avg) * 100;
}

// Full multi-hundred-day history is only needed for the below-the-fold trend
// chart and mini tables, not for the headline quote. Both history sections
// below request the exact same URL/options, so Next.js dedupes it into a
// single request per render instead of fetching twice.
const PARALELO_HISTORY_PATH = '/api/rates/history?kind=PARALELO&days=900&v=merged-history-20260722';
const OFICIAL_HISTORY_PATH = '/api/rates/history?kind=OFICIAL&days=365&v=daily-20260722';
const BRECHA_HISTORY_PATH = '/api/brecha/history?days=365';

async function RatesSection() {
  const [latestResult, brechaLatestResult, bcbResult, tcoSeries, p2pIndex, paraleloDeltaResult, oficialDeltaResult] =
    await Promise.all([
      getSiteData<CurrentRatesResponse>('/api/rates/current?v=live-20260722'),
      getSiteData<BrechaLatestResponse>('/api/brecha/latest'),
      getSiteData<BcbResponse>('/api/bcb/valor-referencial?v=live-20260722'),
      fetchRecentBcbTcoBreakdowns(10),
      fetchP2PIndex(),
      // Small window: only the last couple of days are needed to compute
      // "variación hoy" — no reason to wait on the full historical series.
      getSiteData<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=3'),
      getSiteData<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=3')
    ]);

  const latest = latestResult.data;
  const paralelo = latest?.paralelo ?? null;
  const oficial = latest?.oficial ?? null;
  const indexBuy = p2pIndex?.buy ?? paralelo?.buy ?? null;
  const indexSell = p2pIndex?.sell ?? paralelo?.sell ?? null;
  const indexSources = p2pIndex?.sourceCount ?? (paralelo?.sampleSize ? 1 : 0);
  const indexUpdatedAt = p2pIndex?.timestamp ? new Date(p2pIndex.timestamp) : null;
  const officialSell = oficial?.sell ?? null;
  const indexBrecha = indexSell !== null && officialSell !== null
    ? {
        gap_abs: indexSell - officialSell,
        gap_pct: ((indexSell - officialSell) / officialSell) * 100
      }
    : null;
  const brecha = indexBrecha ?? latest?.brecha ?? brechaLatestResult.data?.brecha ?? null;

  const paraleloDelta = getDelta([...(paraleloDeltaResult.data?.data ?? [])].reverse());
  const oficialDelta = getDelta([...(oficialDeltaResult.data?.data ?? [])].reverse());

  const lastUpdated = latest?.updatedAt ? new Date(latest.updatedAt) : null;
  const bcbData = bcbResult.ok ? bcbResult.data : null;
  const tcoData = tcoSeries.at(-1) ?? null;

  const sourceBadges = [
    { name: 'BCB', active: latest?.sources?.bcb === 'OK' || Boolean(bcbData) || Boolean(tcoData) },
    { name: 'Índice P2P', active: Boolean(p2pIndex) },
    { name: 'Binance P2P', active: latest?.sources?.binance_p2p === 'OK' }
  ];

  const parallelSourceNote = indexSources > 1
    ? `Mediana multi-exchange con ${indexSources} fuentes activas. Datos agregados por paralelo.bo.`
    : (paralelo?.sampleSize ?? 0) > 0
      ? 'Respaldo temporal: Binance P2P (mediana de anuncios).'
    : 'Paralelo sin fuentes activas. Intentaremos actualizar pronto.';

  const parallelActive = indexSources > 0;
  const officialActive = (oficial?.sources_count ?? 0) > 0;
  const activeSources = indexSources + (officialActive ? 1 : 0);
  const hasAnyData = Boolean(paralelo || oficial || brecha || bcbData || tcoData);
  const status = latest?.status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = status === 'OK' ? 'OK' : status === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    status === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : status === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="kicker">Mercado en vivo</p>
          <h2>Cotización de hoy</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/65">
          <span>Actualizado {lastUpdated ? formatDateTime(lastUpdated) : '—'}</span>
          <span className={`px-2 py-1 rounded-full border text-xs ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-ink/65">
        <span>{activeSources} fuentes activas</span>
        <div className="flex flex-wrap gap-2">
          {sourceBadges.map((source) => (
            <span
              key={source.name}
              className={`px-2 py-1 rounded-full border text-xs ${
                source.active
                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                  : 'border-ink/10 text-ink/50'
              }`}
            >
              {source.name}
            </span>
          ))}
        </div>
      </div>
      {status !== 'OK' && latest?.notes ? (
        <p className="text-xs text-ink/60">Nota técnica: {latest?.notes}</p>
      ) : null}
      <RatesGrid
        indexBuy={indexBuy}
        indexSell={indexSell}
        paraleloDelta={paraleloDelta}
        indexUpdatedAt={indexUpdatedAt ?? lastUpdated}
        indexSources={indexSources}
        parallelSourceNote={parallelSourceNote}
        oficialBuy={oficial?.buy ?? null}
        oficialSell={oficial?.sell ?? null}
        oficialDelta={oficialDelta}
        lastUpdated={lastUpdated}
        oficialSourcesCount={oficial?.sources_count ?? null}
        gapAbs={brecha?.gap_abs ?? null}
        gapPct={brecha?.gap_pct ?? null}
        bcbDateText={bcbData?.dateText}
        bcbCompraText={bcbData?.compraText}
        bcbVentaText={bcbData?.ventaText}
        bcbError={bcbResult.ok ? null : bcbResult.error ?? 'fuente_no_disponible'}
        tco={tcoData?.tco}
        tcoWeightedAverage={tcoData?.weightedAverage}
        tcoCutoffDate={tcoData?.cutoffDate}
      />
      <DeclaredBlock />
      <p className="text-xs leading-relaxed text-ink/50">
        Información referencial basada en fuentes públicas y cálculos propios. No constituye una
        recomendación financiera.
      </p>
      {!hasAnyData ? (
        <div className="card p-6 text-sm text-ink/70">
          No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
        </div>
      ) : null}
    </>
  );
}

type RatesGridProps = {
  indexBuy: number | null;
  indexSell: number | null;
  paraleloDelta: number | null;
  indexUpdatedAt: Date | null;
  indexSources: number;
  parallelSourceNote: string;
  oficialBuy: number | null | undefined;
  oficialSell: number | null | undefined;
  oficialDelta: number | null;
  lastUpdated: Date | null;
  oficialSourcesCount: number | null;
  gapAbs: number | null;
  gapPct: number | null;
  bcbDateText?: string | null;
  bcbCompraText?: string | null;
  bcbVentaText?: string | null;
  bcbError?: string | null;
  tco?: number | null;
  tcoWeightedAverage?: number | null;
  tcoCutoffDate?: string | null;
};

function RatesGrid({
  indexBuy,
  indexSell,
  paraleloDelta,
  indexUpdatedAt,
  indexSources,
  parallelSourceNote,
  oficialBuy,
  oficialSell,
  oficialDelta,
  lastUpdated,
  oficialSourcesCount,
  gapAbs,
  gapPct,
  bcbDateText,
  bcbCompraText,
  bcbVentaText,
  bcbError,
  tco,
  tcoWeightedAverage,
  tcoCutoffDate
}: RatesGridProps) {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RateCard
        title="Índice P2P Bolivia"
        buy={indexBuy}
        sell={indexSell}
        delta={paraleloDelta}
        updatedAt={indexUpdatedAt}
        sourcesCount={indexSources}
        href="/paralelo"
        actionLabel="Cómo calculamos el índice"
        sourceNote={parallelSourceNote}
        shareHref="/compartir?utm_source=home&utm_medium=internal&utm_campaign=tarjeta_diaria&utm_content=kpi_p2p"
        sharePlacement="home_p2p_card"
        featured
      />
      <RateCard
        title="Cotización oficial"
        buy={oficialBuy}
        sell={oficialSell}
        delta={oficialDelta}
        updatedAt={lastUpdated}
        sourcesCount={oficialSourcesCount}
        href="/oficial"
        logoSrc="/logos/bcb.svg"
        logoAlt="BCB"
      />
      <BCBCard
        dateText={bcbDateText}
        compraText={bcbCompraText}
        ventaText={bcbVentaText}
        error={bcbError}
      />
      <div className="xl:col-span-2">
        <BrechaCard gapAbs={gapAbs} gapPct={gapPct} />
      </div>
      <div className="xl:col-span-2">
        <TcoCard
          tco={tco}
          weightedAverage={tcoWeightedAverage}
          cutoffDate={tcoCutoffDate}
        />
      </div>
    </div>
  );
}

function RatesSectionFallback() {
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="kicker">Mercado en vivo</p>
          <h2>Cotización de hoy</h2>
        </div>
      </div>
      <p className="text-xs text-ink/60">
        La información es referencial y se basa en múltiples fuentes públicas. No constituye
        una recomendación financiera.
      </p>
      <RatesGrid
        indexBuy={null}
        indexSell={null}
        paraleloDelta={null}
        indexUpdatedAt={null}
        indexSources={0}
        parallelSourceNote="Cargando fuentes activas…"
        oficialBuy={null}
        oficialSell={null}
        oficialDelta={null}
        lastUpdated={null}
        oficialSourcesCount={null}
        gapAbs={null}
        gapPct={null}
        bcbDateText={null}
        bcbCompraText={null}
        bcbVentaText={null}
        bcbError={null}
        tco={null}
        tcoWeightedAverage={null}
        tcoCutoffDate={null}
      />
    </>
  );
}

async function ChartAndTrendSection() {
  const [paraleloHistoryResult, oficialHistoryResult, brechaHistoryResult] = await Promise.all([
    getSiteData<HistoryResponse<DailyHistoryRow>>(PARALELO_HISTORY_PATH),
    getSiteData<HistoryResponse<DailyHistoryRow>>(OFICIAL_HISTORY_PATH),
    getSiteData<HistoryResponse<BrechaHistoryRow>>(BRECHA_HISTORY_PATH)
  ]);

  const paraleloHistory = paraleloHistoryResult.data?.data ?? [];
  const oficialHistory = oficialHistoryResult.data?.data ?? [];
  const brechaHistory = brechaHistoryResult.data?.data ?? [];

  const chartData = {
    paralelo: paraleloHistory.map((row: DailyHistoryRow) => ({ date: row.date, value: row.sell_avg })),
    oficial: oficialHistory.map((row: DailyHistoryRow) => ({ date: row.date, value: row.sell_avg })),
    brecha: brechaHistory.map((row: BrechaHistoryRow) => ({ date: row.date, value: row.gap_pct }))
  };

  const paraleloTrend30d = computeTrend(chartData.paralelo, 30);

  return (
    <>
      <TrendSummary label="El dólar paralelo" trend={paraleloTrend30d} />
      <ChartCardLazy data={chartData} title="Evolución del mercado" />
    </>
  );
}

function ChartAndTrendFallback() {
  return (
    <div className="card p-5 flex flex-col gap-4 min-h-[360px] animate-pulse">
      <div className="h-4 w-2/3 rounded bg-ink/10" />
      <div className="h-64 w-full rounded bg-ink/5" />
    </div>
  );
}

async function MiniTablesSection() {
  const [paraleloHistoryResult, oficialHistoryResult] = await Promise.all([
    getSiteData<HistoryResponse<DailyHistoryRow>>(PARALELO_HISTORY_PATH),
    getSiteData<HistoryResponse<DailyHistoryRow>>(OFICIAL_HISTORY_PATH)
  ]);

  const paraleloHistory = paraleloHistoryResult.data?.data ?? [];
  const oficialHistory = oficialHistoryResult.data?.data ?? [];

  const paraleloMiniRows = paraleloHistory.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));
  const oficialMiniRows = oficialHistory.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MiniTable title="Histórico reciente paralelo" rows={paraleloMiniRows} href="/historico/paralelo" />
      <MiniTable title="Histórico reciente oficial" rows={oficialMiniRows} href="/historico/oficial" />
    </div>
  );
}

function MiniTablesFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="card p-5 min-h-[220px] animate-pulse">
          <div className="h-5 w-1/2 rounded bg-ink/10 mb-4" />
          <div className="grid gap-2">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-5 w-full rounded bg-ink/5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlatformCardsFallback() {
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Opciones para Bolivia</p>
          <h2 className="font-serif text-2xl">Plataformas recomendadas</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-5 min-h-[180px] animate-pulse" />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteConfig.url}/#webpage`,
    url: siteConfig.url,
    name: pageTitles.home,
    description: pageDescriptions.home,
    inLanguage: siteConfig.language,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    about: {
      '@type': 'Thing',
      name: 'Dólar paralelo en Bolivia'
    }
  };

  return (
    <main className="pb-16">
      <JsonLd data={jsonLd} />
      <section className="home-hero">
        <div className="section-shell grid gap-8 py-12 sm:py-16 lg:gap-10 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="grid max-w-4xl gap-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sun">
                Datos de Bolivia · Actualización cada 10 minutos
              </p>
              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                Dólar paralelo en Bolivia hoy
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
                Consulta compra, venta, variación y hora de actualización. Compara la referencia
                P2P con el dólar oficial y revisa las fuentes utilizadas.
              </p>
            </div>
            <div className="border-l border-white/15 pl-5 text-sm leading-relaxed text-white/55 lg:pb-2">
              <p className="font-semibold text-white">Sin ruido. Sin una cifra aislada.</p>
              <p className="mt-2">
                Comparamos referencias P2P con el tipo de cambio oficial y conservamos el
                histórico para que puedas entender el contexto.
              </p>
            </div>
          </div>

          <div className="market-surface grid gap-5">
            <Suspense fallback={<RatesSectionFallback />}>
              <RatesSection />
            </Suspense>
            <DeclareFormLazy />
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-10 pt-10 sm:pt-14">
        <AdSlot label="Debajo del hero" />

        <Suspense fallback={<BcbTcoBankFallback />}>
          <BcbTcoBankSection />
        </Suspense>

        <section className="grid gap-5" aria-labelledby="tendencia-mercado">
          <div className="section-heading">
            <div>
              <p className="kicker">Contexto</p>
              <h2 id="tendencia-mercado">Más que el precio de hoy</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-ink/60">
              Cambia el rango y compara el paralelo, el oficial y la brecha. El histórico ayuda a
              distinguir un movimiento puntual de una tendencia.
            </p>
          </div>
          <Suspense fallback={<ChartAndTrendFallback />}>
            <ChartAndTrendSection />
          </Suspense>
        </section>

        <Suspense fallback={<PlatformCardsFallback />}>
          <PlatformCards />
        </Suspense>

        <article className="grid gap-8 rounded-[1.75rem] bg-night p-6 text-white shadow-lift sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sun">Guía rápida</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              Cómo leer el dólar paralelo sin perder el contexto
            </h2>
          </div>
          <div className="grid gap-5 leading-relaxed text-white/65">
            <p>
              El dólar paralelo es una referencia del precio al que se intercambian dólares o
              activos digitales fuera del canal oficial. En Bolivia, una parte importante se
              observa en mercados P2P de USDT/BOB; por eso comparamos precios, descartamos extremos
              y mostramos cuándo fue actualizado cada dato.
            </p>
            <p>
              La compra indica cuánto ofrecen por cada dólar o unidad equivalente; la venta indica
              cuánto cuesta adquirirla. El precio final puede variar por monto, medio de pago,
              comisión y plataforma. Contrasta el{' '}
              <Link href="/paralelo" className="font-semibold text-white underline decoration-white/30 underline-offset-4">
                dólar paralelo de hoy
              </Link>{' '}
              con el{' '}
              <Link href="/oficial" className="font-semibold text-white underline decoration-white/30 underline-offset-4">
                dólar oficial
              </Link>{' '}
              y revisa la{' '}
              <Link href="/brecha" className="font-semibold text-white underline decoration-white/30 underline-offset-4">
                brecha cambiaria
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/historico/paralelo" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-night">
                Ver histórico
              </Link>
              <Link href="/fuentes" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">
                Revisar fuentes
              </Link>
            </div>
          </div>
        </article>

        <div className="card flex flex-col gap-5 p-6 sm:p-8">
          <div className="section-heading">
            <div>
              <p className="kicker">Directorio</p>
              <h2>Explora más datos</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/paralelo" className="text-link">Dólar paralelo hoy</Link>
            <Link href="/oficial" className="text-link">Dólar oficial hoy</Link>
            <Link href="/brecha" className="text-link">Brecha cambiaria</Link>
            <Link href="/usdt-bob" className="text-link">Conversor USDT a BOB</Link>
            <Link href="/calculadora-dolar-bolivia" className="text-link">Calculadora dólar a bolivianos</Link>
            <Link href="/dolar-blue-bolivia" className="text-link">Dólar blue hoy en Bolivia</Link>
            <Link href="/tco-bancos-bolivia" className="text-link">TCO por banco</Link>
            <Link href="/exchanges" className="text-link">Comparar exchanges</Link>
            <Link href="/binance-p2p-bolivia" className="text-link">Binance P2P Bolivia</Link>
            <Link href="/historico/paralelo" className="text-link">Histórico paralelo</Link>
            <Link href="/historico/oficial" className="text-link">Histórico oficial</Link>
            <Link href="/comprar-usdt-bolivia" className="text-link">Cómo comprar USDT</Link>
            <Link href="/bancos-usdt-bolivia" className="text-link">Bancos con USDT</Link>
            <Link href="/que-es-dolar-blue-bolivia" className="text-link">Qué es el dólar blue</Link>
            <Link href="/eur-bob" className="text-link">Euro a bolivianos</Link>
            <Link href="/btc-bob" className="text-link">Bitcoin a bolivianos</Link>
            <Link href="/widget" className="text-link">Widget del dólar para tu web</Link>
          </div>
        </div>

        <Suspense fallback={<MiniTablesFallback />}>
          <MiniTablesSection />
        </Suspense>

        <div className="card grid gap-5 p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="kicker">Transparencia</p>
            <h2 className="mt-2 font-serif text-3xl">Metodología rápida</h2>
          </div>
          <div className="grid gap-4">
            <p className="leading-relaxed text-ink/70">
              Publicamos promedios diarios basados en múltiples fuentes disponibles públicamente.
              Los valores se actualizan durante el día y pasan por filtros de validación para
              detectar valores extremos.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/faq" className="text-link">Ver metodología completa</Link>
              <Link href="/brecha" className="text-link">¿Qué es la brecha cambiaria?</Link>
            </div>
          </div>
        </div>

        <AdSlot label="Mitad de contenido" />
      </section>
    </main>
  );
}
