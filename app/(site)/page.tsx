import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { RateCard } from '@/app/(site)/_components/RateCard';
import { BrechaCard } from '@/app/(site)/_components/BrechaCard';
import { BCBCard } from '@/app/(site)/_components/BCBCard';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
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

type LatestRateResponse = {
  updatedAt: string;
  paralelo: {
    buy: number;
    sell: number;
    timestamp: string;
    sourcesCount: number;
  } | null;
  oficial: {
    buy: number;
    sell: number;
    timestamp: string;
    sourcesCount: number;
  } | null;
  errors?: { source: string; error: string }[];
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
    fetchJson<LatestRateResponse>('/api/rates/latest', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=PARALELO&days=365', {}, 600),
    fetchJson<HistoryResponse<DailyHistoryRow>>('/api/rates/history?kind=OFICIAL&days=365', {}, 600),
    fetchJson<HistoryResponse<BrechaHistoryRow>>('/api/brecha/history?days=365', {}, 600),
    fetchJson<BrechaLatestResponse>('/api/brecha/latest', {}, 600),
    fetchJson<BcbResponse>('/api/bcb/valor-referencial', {}, 600)
  ]);

  const latest = latestResult.data;
  const paralelo = latest?.paralelo ?? null;
  const oficial = latest?.oficial ?? null;
  const brecha = brechaLatestResult.data?.brecha ?? null;
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

  const lastUpdated = paralelo?.timestamp
    ? new Date(paralelo.timestamp)
    : oficial?.timestamp
      ? new Date(oficial.timestamp)
      : null;
  const bcbData = bcbResult.ok ? bcbResult.data : null;

  const sourceBadges = [
    { name: 'BCB', active: Boolean(bcbData) },
    { name: 'Binance P2P', active: (paralelo?.sourcesCount ?? 0) > 0 },
    { name: 'Fuentes oficiales', active: (oficial?.sourcesCount ?? 0) > 0 }
  ];

  const activeSources = sourceBadges.filter((source) => source.active).length;
  const hasAnyData = Boolean(paralelo || oficial || brecha || bcbData);

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
              D?lar paralelo y oficial en Bolivia hoy
            </h1>
            <p className="text-lg text-ink max-w-2xl">
              Datos reales, fuentes visibles y series hist?ricas para entender la brecha cambiaria
              en Bolivia con confianza.
            </p>
          </div>

          <div className="card p-5 grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">Fuentes y metodolog?a</h2>
              <span className="text-sm text-ink/70">
                ?ltima actualizaci?n:{' '}
                {lastUpdated ? formatDateTime(lastUpdated) : <Skeleton className="h-4 w-24" />}
              </span>
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
              La informaci?n es referencial y se basa en m?ltiples fuentes p?blicas. No constituye
              una recomendaci?n financiera.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4 items-stretch">
            <RateCard
              title="D?lar paralelo"
              buy={paralelo?.buy}
              sell={paralelo?.sell}
              delta={paraleloDelta}
              updatedAt={paralelo?.timestamp ? new Date(paralelo.timestamp) : null}
              sourcesCount={paralelo?.sourcesCount}
              href="/paralelo"
            />
            <RateCard
              title="D?lar oficial"
              buy={oficial?.buy}
              sell={oficial?.sell}
              delta={oficialDelta}
              updatedAt={oficial?.timestamp ? new Date(oficial.timestamp) : null}
              sourcesCount={oficial?.sourcesCount}
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
          <h2 className="font-serif text-2xl">Explora m?s datos</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/paralelo" className="underline underline-offset-4">
              D?lar paralelo hoy
            </Link>
            <Link href="/oficial" className="underline underline-offset-4">
              D?lar oficial hoy
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              Brecha cambiaria
            </Link>
            <Link href="/historico/paralelo" className="underline underline-offset-4">
              Hist?rico paralelo
            </Link>
            <Link href="/historico/oficial" className="underline underline-offset-4">
              Hist?rico oficial
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MiniTable title="Hist?rico reciente paralelo" rows={paraleloMiniRows} href="/historico/paralelo" />
          <MiniTable title="Hist?rico reciente oficial" rows={oficialMiniRows} href="/historico/oficial" />
        </div>

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Metodolog?a r?pida</h2>
          <p className="text-ink/70">
            Publicamos promedios diarios basados en m?ltiples fuentes disponibles p?blicamente. Los
            valores se actualizan durante el d?a y pasan por filtros de validaci?n para detectar
            outliers.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/faq" className="underline underline-offset-4">
              Ver metodolog?a completa
            </Link>
            <Link href="/brecha" className="underline underline-offset-4">
              ?Qu? es la brecha cambiaria?
            </Link>
          </div>
        </div>

        <AdSlot label="Mitad de contenido" />
      </section>
    </main>
  );
}
