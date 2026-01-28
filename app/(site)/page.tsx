import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { RateCard } from '@/app/(site)/_components/RateCard';
import { BrechaCard } from '@/app/(site)/_components/BrechaCard';
import { BCBCard } from '@/app/(site)/_components/BCBCard';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
import { DeclareForm } from '@/app/(site)/_components/DeclareForm';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatDateTime } from '@/lib/format';
import type { Metadata } from 'next';

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
    title: pageTitles.home,
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

export default async function HomePage() {
  const [
    latestResult,
    paraleloHistoryResult,
    oficialHistoryResult,
    brechaHistoryResult,
    brechaLatestResult,
    bcbResult
  ] = await Promise.all([
    fetchJson<CurrentRatesResponse>('/api/rates/current', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=365', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=365', {}, 600),
    fetchJson<HistoryResponse<BrechaHistoryRow>>('/api/brecha/history?days=365', {}, 600),
    fetchJson<BrechaLatestResponse>('/api/brecha/latest', {}, 600),
    fetchJson<BcbResponse>('/api/bcb/valor-referencial', {}, 600)
  ]);

  const latest = latestResult.data;
  const paralelo = latest?.paralelo ?? null;
  const oficial = latest?.oficial ?? null;
  const brecha = latest?.brecha ?? brechaLatestResult.data?.brecha ?? null;
  const paraleloHistory = paraleloHistoryResult.data?.data ?? [];
  const oficialHistory = oficialHistoryResult.data?.data ?? [];
  const brechaHistory = brechaHistoryResult.data?.data ?? [];

  const paraleloMiniRows = paraleloHistory.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));
  const oficialMiniRows = oficialHistory.slice(-14).reverse().map((row) => ({
    ...row,
    date: new Date(row.date)
  }));

  const paraleloDelta = getDelta([...paraleloHistory].reverse());
  const oficialDelta = getDelta([...oficialHistory].reverse());

  const chartData = {
    paralelo: paraleloHistory.map((row: DailyHistoryRow) => ({
      date: row.date,
      value: row.sell_avg
    })),
    oficial: oficialHistory.map((row: DailyHistoryRow) => ({
      date: row.date,
      value: row.sell_avg
    })),
    brecha: brechaHistory.map((row: BrechaHistoryRow) => ({
      date: row.date,
      value: row.gap_pct
    }))
  };

  const lastUpdated = latest?.updatedAt ? new Date(latest.updatedAt) : null;
  const bcbData = bcbResult.ok ? bcbResult.data : null;

  const sourceBadges = [
    { name: 'BCB', active: latest?.sources?.bcb === 'OK' || Boolean(bcbData) },
    { name: 'Binance P2P', active: latest?.sources?.binance_p2p === 'OK' }
  ];

  const parallelSourceNote = (paralelo?.sampleSize ?? 0) > 0
    ? 'Fuente base: Binance P2P (mediana de avisos).'
    : 'Paralelo sin fuentes activas. Intentaremos actualizar pronto.';

  const parallelActive = (paralelo?.sampleSize ?? 0) > 0;
  const officialActive = (oficial?.sources_count ?? 0) > 0;
  const activeSources = [parallelActive, officialActive].filter(Boolean).length;
  const hasAnyData = Boolean(paralelo || oficial || brecha || bcbData);
  const status = latest?.status ?? (hasAnyData ? 'DEGRADED' : 'ERROR');
  const statusLabel = status === 'OK' ? 'OK' : status === 'DEGRADED' ? 'Degradado' : 'Error';
  const statusClass =
    status === 'OK'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : status === 'DEGRADED'
        ? 'border-amber-200 text-amber-800 bg-amber-50'
        : 'border-rose-200 text-rose-700 bg-rose-50';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <main className="pb-16">
      <JsonLd data={jsonLd} />
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">Fuentes y metodología</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70">
                <span>
                  Última actualización:{' '}
                  {lastUpdated ? formatDateTime(lastUpdated) : <Skeleton className="h-4 w-24" />}
                </span>
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
              <p className="text-xs text-ink/60">
                Nota técnica: {latest?.notes}
              </p>
            ) : null}
            <DeclareForm />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            <RateCard
              title="Dólar paralelo"
              buy={paralelo?.buy}
              sell={paralelo?.sell}
              delta={paraleloDelta}
              updatedAt={lastUpdated}
              sourcesCount={paralelo?.sampleSize}
              href="/paralelo"
              sourceNote={parallelSourceNote}
            />
            <RateCard
              title="Dólar oficial"
              buy={oficial?.buy}
              sell={oficial?.sell}
              delta={oficialDelta}
              updatedAt={lastUpdated}
              sourcesCount={oficial?.sources_count}
              href="/oficial"
            />
            <BrechaCard gapAbs={brecha?.gap_abs} gapPct={brecha?.gap_pct} />
            <BCBCard
              dateText={bcbData?.dateText}
              compraText={bcbData?.compraText}
              ventaText={bcbData?.ventaText}
              error={bcbResult.ok ? null : bcbResult.error ?? 'fuente_no_disponible'}
            />
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-8">
        {!hasAnyData ? (
          <div className="card p-6 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}

        <AdSlot label="Debajo del hero" />

        <ChartCard data={chartData} />

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
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              Histórico paralelo
            </Link>
            <Link href="/historico/oficial" className="underline underline-offset-4">
              Histórico oficial
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="Histórico reciente paralelo" rows={paraleloMiniRows} href="/historico/paralelo" />
          <MiniTable title="Histórico reciente oficial" rows={oficialMiniRows} href="/historico/oficial" />
        </div>

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
