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
  const [latestResult, historyResult] = await Promise.all([
    fetchJson<BrechaLatestResponse>('/api/brecha/latest', {}, 600),
    fetchJson<BrechaHistoryResponse>('/api/brecha/history?days=365', {}, 600)
  ]);

  const latest = latestResult.data?.brecha ?? null;
  const history = historyResult.data?.data ?? [];

  const hasAnyData = Boolean(latest || history.length);

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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '?Qu? es la brecha cambiaria?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es la diferencia porcentual entre el d?lar oficial y el paralelo.'
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
          <p className="kicker">Brecha d?lar oficial vs paralelo</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Brecha d?lar oficial vs paralelo en Bolivia
          </h1>
          <p className="text-ink/70 max-w-2xl">
            La brecha cambiaria muestra la diferencia porcentual entre el d?lar oficial y el
            paralelo. Es un indicador clave para entender la presi?n cambiaria.
          </p>
        </div>


        {!hasAnyData ? (
          <div className="card p-4 text-sm text-ink/70">
            No pudimos actualizar las fuentes. Intentaremos nuevamente en unos minutos.
          </div>
        ) : null}
        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className="font-serif text-2xl">Brecha actual</h2>
            <span className="text-sm text-ink/60">Promedio diario</span>
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

        <AdSlot label="Brecha debajo del hero" />

        <ChartCard data={chartData} />

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Qu? es la brecha cambiaria</h2>
          <p className="text-ink/70">
            Es la diferencia porcentual entre el d?lar oficial y el paralelo. Una brecha alta suele
            reflejar restricciones de acceso o expectativas devaluatorias.
          </p>
          <Link href="/faq" className="underline underline-offset-4 text-sm">
            Leer metodolog?a y advertencias
          </Link>
        </div>
      </section>
    </main>
  );
}
