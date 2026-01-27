import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { RateCard } from '@/app/(site)/_components/RateCard';
import { BrechaCard } from '@/app/(site)/_components/BrechaCard';
import { MiniTable } from '@/app/(site)/_components/MiniTable';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getBrechaHistory, getDailyHistory, getLatestSnapshot, getMiniTable } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import type { Metadata } from 'next';

export const revalidate = 60;

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
  const [{ paralelo, oficial, brecha }, paraleloHistory, oficialHistory, brechaHistory, paraleloMini, oficialMini] =
    await Promise.all([
      getLatestSnapshot(),
      getDailyHistory('PARALELO', 365),
      getDailyHistory('OFICIAL', 365),
      getBrechaHistory(365),
      getMiniTable('PARALELO', 14),
      getMiniTable('OFICIAL', 14)
    ]);

  const paraleloDelta = getDelta([...paraleloHistory].reverse());
  const oficialDelta = getDelta([...oficialHistory].reverse());

  const chartData = {
    paralelo: paraleloHistory.map((row) => ({
      date: row.date.toISOString(),
      value: row.sell_avg
    })),
    oficial: oficialHistory.map((row) => ({
      date: row.date.toISOString(),
      value: row.sell_avg
    })),
    brecha: brechaHistory.map((row) => ({
      date: row.date.toISOString(),
      value: row.gap_pct
    }))
  };

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
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <section className="grid gap-8">
        <div className="grid gap-4">
          <p className="kicker">Actualizado hoy</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Dólar paralelo y oficial en Bolivia hoy
          </h1>
          <p className="text-lg text-ink/70 max-w-2xl">
            Consulta el dólar blue (paralelo) y el dólar oficial con brecha cambiaria, series
            históricas y validación cruzada de fuentes.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RateCard
            title="Dólar paralelo"
            buy={paralelo?.buy}
            sell={paralelo?.sell}
            delta={paraleloDelta}
            updatedAt={paralelo?.timestamp}
            sourcesCount={paralelo?.sourcesCount}
            href="/paralelo"
          />
          <RateCard
            title="Dólar oficial"
            buy={oficial?.buy}
            sell={oficial?.sell}
            delta={oficialDelta}
            updatedAt={oficial?.timestamp}
            sourcesCount={oficial?.sourcesCount}
            href="/oficial"
          />
          <BrechaCard gapAbs={brecha?.gap_abs} gapPct={brecha?.gap_pct} />
        </div>

        <p className="text-sm text-ink/60">
          Última actualización: {paralelo?.timestamp ? formatDateTime(paralelo.timestamp) : '—'} ·
          Fuentes activas: {paralelo?.sourcesCount ?? 0}
        </p>

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
          <MiniTable title="Histórico reciente paralelo" rows={paraleloMini} href="/historico/paralelo" />
          <MiniTable title="Histórico reciente oficial" rows={oficialMini} href="/historico/oficial" />
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
