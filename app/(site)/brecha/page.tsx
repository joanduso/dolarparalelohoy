import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { fetchJson } from '@/lib/serverFetch';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Metadata } from 'next';

type BrechaHistoryRow = {
  date: string;
  gap_pct: number;
};

type BrechaLatestResponse = {
  brecha: {
    gap_abs: number;
    gap_pct: number;
    date: string;
  } | null;
};

type CurrentRatesResponse = {
  status: 'OK' | 'DEGRADED' | 'ERROR';
  notes?: string | null;
};

type BrechaHistoryResponse = {
  data: BrechaHistoryRow[];
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.brecha,
    description: pageDescriptions.brecha,
    alternates: { canonical: '/brecha' },
    openGraph: {
      title: pageTitles.brecha,
      description: pageDescriptions.brecha,
      locale: siteConfig.locale
    }
  };
}

export default async function BrechaPage() {
  const [latestResult, historyResult, latestRateResult] = await Promise.all([
    fetchJson<BrechaLatestResponse>('/api/brecha/latest', {}, 600),
    fetchJson<BrechaHistoryResponse>('/api/brecha/history?days=365', {}, 600),
    fetchJson<CurrentRatesResponse>('/api/rates/current', {}, 600)
  ]);

  const latest = latestResult.data?.brecha ?? null;
  const status = latestRateResult.data?.status ?? null;
  const notes = latestRateResult.data?.notes ?? null;
  const history = historyResult.data?.data ?? [];

  const hasAnyData = Boolean(latest || history.length);

  const sourceNote = latest
    ? 'Fuente base: cálculos diarios con BCB + Binance P2P.'
    : 'Brecha sin fuentes activas. Intentaremos actualizar pronto.';

  const chartData = {
    paralelo: [],
    oficial: [],
    brecha: history.map((row) => ({
      date: row.date,
      value: row.gap_pct
    }))
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.brecha,
    description: pageDescriptions.brecha,
    url: `${siteConfig.url}/brecha`,
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
        name: '¿Qué es la brecha cambiaria?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es la diferencia porcentual entre el dólar oficial y el paralelo.'
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
          <p className="kicker">Brecha dólar oficial vs paralelo</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Brecha dólar oficial vs paralelo en Bolivia
          </h1>
          <p className="text-ink/70 max-w-2xl">
            La brecha cambiaria muestra la diferencia porcentual entre el dólar oficial y el
            paralelo. Es un indicador clave para entender la presión cambiaria.
          </p>
        </div>


        {!hasAnyData ? (
          <div className="card p-4 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}
        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Brecha actual</h2>
            <div className="flex items-center gap-3 text-sm text-ink/60">
              <span>Promedio diario</span>
              <span className={`px-2 py-1 rounded-full border text-xs ${statusClass}`}>
                Estado: {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-ink/50">Diferencia</p>
              <p className="text-3xl font-semibold">
                {typeof latest?.gap_abs === 'number' ? formatCurrency(latest.gap_abs) : <Skeleton className="h-8 w-24" />}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Brecha %</p>
              <p className="text-3xl font-semibold">
                {typeof latest?.gap_pct === 'number' ? `${formatNumber(latest.gap_pct, 2)}%` : <Skeleton className="h-8 w-16" />}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-ink/60">{sourceNote}</p>
        {statusLabelValue !== 'OK' && notes ? (
          <p className="text-xs text-ink/60">Nota técnica: {notes}</p>
        ) : null}

        <AdSlot label="Brecha debajo del hero" />

        <ChartCard data={chartData} />

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Qué es la brecha cambiaria</h2>
          <p className="text-ink/70">
            Es la diferencia porcentual entre el dólar oficial y el paralelo. Una brecha alta suele
            reflejar restricciones de acceso o expectativas devaluatorias.
          </p>
          <Link href="/faq" className="underline underline-offset-4 text-sm">
            Leer metodología y advertencias
          </Link>
        </div>
      </section>
    </main>
  );
}
