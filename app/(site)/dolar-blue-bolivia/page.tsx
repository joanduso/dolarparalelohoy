import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { P2PCalculator } from '@/app/(site)/_components/P2PCalculator';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { getParallelQuote } from '@/lib/p2pIndex';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.dolarBlue,
    description: pageDescriptions.dolarBlue,
    alternates: { canonical: '/dolar-blue-bolivia' },
    openGraph: {
      title: pageTitles.dolarBlue,
      description: pageDescriptions.dolarBlue,
      locale: siteConfig.locale
    }
  };
}

export default async function DolarBlueBoliviaPage() {
  const quote = await getParallelQuote();
  const updatedAt = quote ? new Date(quote.updatedAt) : null;
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Dólar blue y dólar paralelo son lo mismo en Bolivia?',
      answer: 'Se usan como términos cercanos para describir una referencia distinta al tipo de cambio oficial. En este sitio, la cotización paralela se apoya en datos públicos y mercados P2P de USD digital.'
    },
    {
      question: '¿El dólar blue es una tasa oficial?',
      answer: 'No. Es una referencia informativa de mercado. Para el tipo de cambio publicado por la autoridad, consulta siempre las referencias oficiales del BCB.'
    },
    {
      question: '¿Qué debo comparar antes de cambiar?',
      answer: 'El precio de compra o venta, comisión, monto, método de pago, límites, reputación de la contraparte y condiciones de la plataforma.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.dolarBlue,
    description: pageDescriptions.dolarBlue,
    url: `${siteConfig.url}/dolar-blue-bolivia`,
    inLanguage: siteConfig.locale,
    dateModified: updatedAt?.toISOString()
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Dólar blue Bolivia', href: '/dolar-blue-bolivia' }]} />
      <section className="grid gap-8">
        <div className="grid gap-3 max-w-3xl">
          <p className="kicker">Referencia de mercado</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Dólar blue Bolivia hoy</h1>
          <p className="text-ink/70">
            En Bolivia, “dólar blue” suele referirse al precio paralelo o de mercado. Aquí lo explicamos con una referencia P2P visible, separada de la cotización oficial.
          </p>
        </div>

        <div className="card p-6 grid gap-3">
          <p className="text-xs uppercase tracking-wide text-ink/50">Referencia P2P actual</p>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <div><span className="text-sm text-ink/60">Compra</span><p className="text-3xl font-semibold">{quote ? formatCurrency(quote.buy) : '—'}</p></div>
            <div><span className="text-sm text-ink/60">Venta</span><p className="text-3xl font-semibold">{quote ? formatCurrency(quote.sell) : '—'}</p></div>
          </div>
          <p className="text-sm text-ink/60">
            {updatedAt ? `Actualizado ${formatDateTime(updatedAt)} con ${quote?.sourceCount ?? 0} fuentes P2P.` : 'Cotización temporalmente no disponible.'}
          </p>
        </div>

        <P2PCalculator buy={quote?.buy ?? null} sell={quote?.sell ?? null} />

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Diferencia entre dólar blue, paralelo y oficial</h2>
          <p>
            El dólar blue o paralelo es una forma informal de nombrar la referencia que surge fuera del canal oficial. En mercados digitales, la relación USDT/BOB puede aportar señales de compra y venta, pero no reemplaza una tasa bancaria ni garantiza un precio.
          </p>
          <p>
            El <Link href="/oficial" className="underline underline-offset-4">dólar oficial</Link> corresponde a la referencia publicada por el BCB. La{' '}
            <Link href="/brecha" className="underline underline-offset-4">brecha cambiaria</Link> muestra la diferencia entre ambos mercados y ayuda a entender el contexto, no a recomendar una operación.
          </p>
          <p>
            Para seguir el valor con detalle consulta el <Link href="/paralelo" className="underline underline-offset-4">dólar paralelo de hoy</Link>, el{' '}
            <Link href="/usdt-bob" className="underline underline-offset-4">conversor USDT a BOB</Link> y el{' '}
            <Link href="/historico/paralelo" className="underline underline-offset-4">histórico diario</Link>.
          </p>
        </article>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
