import Link from 'next/link';
import { ChartCard } from '@/app/(site)/_components/ChartCard';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { AdSlot } from '@/app/(site)/_components/AdSlot';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import { getBrechaHistory, getLatestBrecha } from '@/lib/queries';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Metadata } from 'next';

type BrechaRow = {
  date: Date;
  gap_pct: number;
};

export const revalidate = 300;

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
  const [latest, history] = await Promise.all([
    getLatestBrecha(),
    getBrechaHistory(365)
  ]);

  const chartData = {
    paralelo: [],
    oficial: [],
    brecha: history.map((row: BrechaRow) => ({
      date: row.date.toISOString(),
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

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
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

        <div className="card p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className="font-serif text-2xl">Brecha actual</h2>
            <span className="text-sm text-ink/60">Promedio diario</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-ink/50">Diferencia</p>
              <p className="text-3xl font-semibold">{formatCurrency(latest?.gap_abs)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink/50">Brecha %</p>
              <p className="text-3xl font-semibold">{formatNumber(latest?.gap_pct, 2)}%</p>
            </div>
          </div>
        </div>

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
