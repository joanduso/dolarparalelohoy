import { Suspense } from 'react';
import Link from 'next/link';
import { RateCard } from '@/app/(site)/_components/RateCard';
import { BrechaCard } from '@/app/(site)/_components/BrechaCard';
import { BCBCard } from '@/app/(site)/_components/BCBCard';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { DeclareFormLazy } from '@/app/(site)/_components/DeclareFormLazy';
import { DeclaredBlock } from '@/app/(site)/_components/DeclaredBlock';
import { PlatformCards } from '@/app/(site)/_components/PlatformCards';
import { TrendSummary } from '@/app/(site)/_components/TrendSummary';
import { ChartCardLazy } from '@/app/(site)/_components/ChartCardLazy';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatDateTime } from '@/lib/format';
import { computeTrend } from '@/lib/trend';
import type { Metadata } from 'next';
import { fetchP2PIndex } from '@/lib/p2pIndex';

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
  const [latestResult, brechaLatestResult, bcbResult, p2pIndex, paraleloDeltaResult, oficialDeltaResult] =
    await Promise.all([
      fetchJson<CurrentRatesResponse>('/api/rates/current?v=live-20260722', {}, 600),
      fetchJson<BrechaLatestResponse>('/api/brecha/latest', {}, 600),
      fetchJson<BcbResponse>('/api/bcb/valor-referencial?v=live-20260722', {}, 600),
      fetchP2PIndex(),
      // Small window: only the last couple of days are needed to compute
      // "variación hoy" — no reason to wait on the full historical series.
      fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=3', {}, 600),
      fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=3', {}, 600)
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

  const sourceBadges = [
    { name: 'BCB', active: latest?.sources?.bcb === 'OK' || Boolean(bcbData) },
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
  const hasAnyData = Boolean(paralelo || oficial || brecha || bcbData);
  const status = latest?.status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = status === 'OK' ? 'OK' : status === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    status === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : status === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  void parallelActive;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Fuentes y metodología</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70">
          <span>Última actualización: {lastUpdated ? formatDateTime(lastUpdated) : '—'}</span>
          <span className={`px-2 py-1 rounded-full border text-xs ${statusClass}`}>
            Estado: {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70">
        <span>Fuentes activas: {activeSources}</span>
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
      <p className="text-xs text-ink/60">
        La información es referencial y se basa en múltiples fuentes públicas. No constituye
        una recomendación financiera.
      </p>
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
      />
      <DeclaredBlock />
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
  bcbError
}: RatesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
      <RateCard
        title="Índice P2P Bolivia"
        buy={indexBuy}
        sell={indexSell}
        delta={paraleloDelta}
        updatedAt={indexUpdatedAt}
        sourcesCount={indexSources}
        href="/paralelo"
        sourceNote={parallelSourceNote}
      />
      <RateCard
        title="Dólar oficial"
        buy={oficialBuy}
        sell={oficialSell}
        delta={oficialDelta}
        updatedAt={lastUpdated}
        sourcesCount={oficialSourcesCount}
        href="/oficial"
        logoSrc="/logos/bcb.svg"
        logoAlt="BCB"
      />
      <BrechaCard gapAbs={gapAbs} gapPct={gapPct} />
      <BCBCard
        dateText={bcbDateText}
        compraText={bcbCompraText}
        ventaText={bcbVentaText}
        error={bcbError}
      />
    </div>
  );
}

function RatesSectionFallback() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Fuentes y metodología</h2>
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
      />
    </>
  );
}

async function ChartAndTrendSection() {
  const [paraleloHistoryResult, oficialHistoryResult, brechaHistoryResult] = await Promise.all([
    fetchJson<HistoryResponse<DailyHistoryRow>>(PARALELO_HISTORY_PATH, {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>(OFICIAL_HISTORY_PATH, {}, 600),
    fetchJson<HistoryResponse<BrechaHistoryRow>>(BRECHA_HISTORY_PATH, {}, 600)
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
      <ChartCardLazy data={chartData} />
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
    fetchJson<HistoryResponse<DailyHistoryRow>>(PARALELO_HISTORY_PATH, {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>(OFICIAL_HISTORY_PATH, {}, 600)
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
  return (
    <main className="pb-16">
      <section className="w-full bg-gradient-to-b from-sand/70 via-sand/30 to-transparent">
        <div className="section-shell py-12 grid gap-6">
          <div className="grid gap-4">
            <p className="kicker">Actualizado cada 10 minutos</p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight">
              Dólar paralelo y oficial en Bolivia hoy
            </h1>
            <p className="text-lg text-ink max-w-2xl">
              Datos reales, fuentes visibles y series históricas para entender la brecha cambiaria
              en Bolivia con confianza.
            </p>
          </div>

          <div className="card p-5 grid gap-4">
            <Suspense fallback={<RatesSectionFallback />}>
              <RatesSection />
            </Suspense>
            <DeclareFormLazy />
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-8">
        <AdSlot label="Debajo del hero" />

        <Suspense fallback={<PlatformCardsFallback />}>
          <PlatformCards />
        </Suspense>

        <article className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">
            Cómo interpretar el precio del dólar paralelo en Bolivia
          </h2>
          <p className="text-ink/70">
            El dólar paralelo es una referencia del precio al que se intercambian dólares o activos
            digitales fuera del canal oficial. En Bolivia, una parte importante de esa referencia
            se observa en mercados P2P de USDT/BOB. Por eso comparamos precios de compra y venta,
            descartamos valores extremos y mostramos cuándo fue actualizado cada dato.
          </p>
          <p className="text-ink/70">
            La compra indica cuánto ofrecen por cada dólar o unidad equivalente; la venta indica
            cuánto cuesta adquirirla. El precio final puede cambiar según el monto, medio de pago,
            comisión y plataforma. Antes de operar, compara el{' '}
            <Link href="/paralelo" className="underline underline-offset-4">
              dólar paralelo de hoy
            </Link>{' '}
            con el{' '}
            <Link href="/oficial" className="underline underline-offset-4">
              dólar oficial
            </Link>{' '}
            y revisa la{' '}
            <Link href="/brecha" className="underline underline-offset-4">
              brecha cambiaria
            </Link>
            .
          </p>
          <p className="text-ink/70">
            Para entender la tendencia y no depender de una sola lectura, consulta el{' '}
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              histórico del dólar paralelo
            </Link>{' '}
            y nuestra página de{' '}
            <Link href="/fuentes" className="underline underline-offset-4">
              fuentes y metodología
            </Link>
            . Toda la información es referencial y no constituye asesoramiento financiero.
          </p>
        </article>

        <Suspense fallback={<ChartAndTrendFallback />}>
          <ChartAndTrendSection />
        </Suspense>

        <div className="card p-5 flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Explora más datos</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/paralelo" className="underline underline-offset-4">
              Dólar paralelo hoy
            </Link>
            <Link href="/oficial" className="underline underline-offset-4">
              Dólar oficial hoy
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Brecha cambiaria
            </Link>
            <Link href="/usdt-bob" className="underline underline-offset-4">
              Conversor USDT a BOB
            </Link>
            <Link href="/dolar-blue-bolivia" className="underline underline-offset-4">
              Dólar blue Bolivia
            </Link>
            <Link href="/exchanges" className="underline underline-offset-4">
              Comparar exchanges
            </Link>
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              Histórico paralelo
            </Link>
            <Link href="/historico/oficial" className="underline underline-offset-4">
              Histórico oficial
            </Link>
            <Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">
              Cómo comprar USDT
            </Link>
            <Link href="/bancos-usdt-bolivia" className="underline underline-offset-4">
              Bancos con USDT
            </Link>
            <Link href="/que-es-dolar-blue-bolivia" className="underline underline-offset-4">
              Qué es el dólar blue
            </Link>
            <Link href="/eur-bob" className="underline underline-offset-4">
              Euro a bolivianos
            </Link>
            <Link href="/btc-bob" className="underline underline-offset-4">
              Bitcoin a bolivianos
            </Link>
          </div>
        </div>

        <Suspense fallback={<MiniTablesFallback />}>
          <MiniTablesSection />
        </Suspense>

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Metodología rápida</h2>
          <p className="text-ink/70">
            Publicamos promedios diarios basados en múltiples fuentes disponibles públicamente. Los
            valores se actualizan durante el día y pasan por filtros de validación para detectar
            outliers.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/faq" className="underline underline-offset-4">
              Ver metodología completa
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              ¿Qué es la brecha cambiaria?
            </Link>
          </div>
        </div>

        <AdSlot label="Mitad de contenido" />
      </section>
    </main>
  );
}
