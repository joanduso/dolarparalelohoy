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
    title: pageTitles.usdtBob,
    description: pageDescriptions.usdtBob,
    alternates: { canonical: '/usdt-bob' },
    openGraph: {
      title: pageTitles.usdtBob,
      description: pageDescriptions.usdtBob,
      locale: siteConfig.locale
    }
  };
}

export default async function UsdtBobPage() {
  const quote = await getParallelQuote();
  const updatedAt = quote ? new Date(quote.updatedAt) : null;
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Qué significa USDT/BOB?',
      answer: 'Es la relación entre una unidad de USDT y bolivianos. En mercados P2P se usa como una referencia frecuente del dólar digital en Bolivia.'
    },
    {
      question: '¿La calculadora muestra el precio final?',
      answer: 'No. Es una estimación con la cotización P2P agregada. El precio final depende del anuncio, monto, medio de pago, comisión y verificación de cada plataforma.'
    },
    {
      question: '¿Por qué compra y venta son diferentes?',
      answer: 'Comprar y vender son operaciones opuestas: quien compra USDT normalmente paga la tasa de venta, mientras quien vende recibe la tasa de compra.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: pageTitles.usdtBob,
        description: pageDescriptions.usdtBob,
        url: `${siteConfig.url}/usdt-bob`,
        inLanguage: siteConfig.locale,
        dateModified: updatedAt?.toISOString()
      },
      {
        '@type': 'Dataset',
        name: 'Cotización P2P USDT/BOB en Bolivia',
        description: 'Referencia agregada de compra y venta de USDT frente a bolivianos.',
        url: `${siteConfig.url}/usdt-bob`,
        dateModified: updatedAt?.toISOString(),
        creator: { '@id': `${siteConfig.url}/#organization` },
        variableMeasured: quote
          ? [
              { '@type': 'PropertyValue', name: 'Compra USDT/BOB', value: quote.buy, unitText: 'BOB por USDT' },
              { '@type': 'PropertyValue', name: 'Venta USDT/BOB', value: quote.sell, unitText: 'BOB por USDT' }
            ]
          : []
      }
    ]
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'USDT a BOB', href: '/usdt-bob' }]} />
      <section className="grid gap-8">
        <div className="grid gap-3 max-w-3xl">
          <p className="kicker">Cotización P2P Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">USDT a BOB hoy: conversor y precio P2P</h1>
          <p className="text-ink/70">
            Calcula una referencia de USDT a bolivianos usando compra y venta agregadas de mercados P2P.
            Compara siempre el precio final, la comisión y el medio de pago antes de operar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-ink/50">Compra USDT</p>
            <p className="mt-2 text-3xl font-semibold">{quote ? formatCurrency(quote.sell) : '—'}</p>
            <p className="mt-2 text-sm text-ink/60">Precio de referencia para adquirir USDT.</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-ink/50">Venta USDT</p>
            <p className="mt-2 text-3xl font-semibold">{quote ? formatCurrency(quote.buy) : '—'}</p>
            <p className="mt-2 text-sm text-ink/60">Precio de referencia para vender USDT.</p>
          </div>
        </div>

        <P2PCalculator buy={quote?.buy ?? null} sell={quote?.sell ?? null} assetLabel="USDT" />

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo usar esta referencia</h2>
          <p>
            USDT suele utilizarse como aproximación operativa al dólar digital en mercados P2P. No es una cotización bancaria ni una oferta vinculante: cada anuncio puede cambiar según monto, reputación del comerciante, banco, QR y disponibilidad.
          </p>
          <p>
            {updatedAt ? `Última actualización de esta referencia: ${formatDateTime(updatedAt)}.` : 'La fuente P2P está temporalmente disponible sin una hora de actualización.'}{' '}
            Revisa además el <Link href="/paralelo" className="underline underline-offset-4">dólar paralelo</Link>, la{' '}
            <Link href="/brecha" className="underline underline-offset-4">brecha cambiaria</Link> y las{' '}
            <Link href="/fuentes" className="underline underline-offset-4">fuentes y metodología</Link>.
          </p>
        </article>

        <div className="card p-6 grid gap-3">
          <h2 className="font-serif text-2xl">Compara antes de operar</h2>
          <p className="text-ink/70">Las tasas pueden variar entre plataformas y billeteras. Consulta la cotización y condiciones de cada una.</p>
          <Link href="/exchanges" className="underline underline-offset-4 text-sm">Ver comparador de exchanges P2P en Bolivia</Link>
        </div>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
