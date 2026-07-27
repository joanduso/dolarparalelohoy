import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { P2PCalculator } from '@/app/(site)/_components/P2PCalculator';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { fetchBtcUsd } from '@/lib/sources/cryptoRates';
import { getParallelQuote } from '@/lib/p2pIndex';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.btcBob,
    description: pageDescriptions.btcBob,
    alternates: { canonical: '/btc-bob' },
    openGraph: {
      title: pageTitles.btcBob,
      description: pageDescriptions.btcBob,
      locale: siteConfig.locale
    }
  };
}

export default async function BtcBobPage() {
  const [btcUsd, quote] = await Promise.all([fetchBtcUsd(), getParallelQuote()]);
  const usdBobMid = quote ? (quote.buy + quote.sell) / 2 : null;
  const rate = btcUsd && usdBobMid ? btcUsd * usdBobMid : null;

  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Este precio viene de un exchange boliviano?',
      answer: 'No. Es un cálculo: precio de BTC en dólares (mercado global) multiplicado por nuestro propio índice del dólar paralelo en Bolivia. No existe un mercado P2P de BTC/BOB documentado como el de USDT.'
    },
    {
      question: '¿Por qué no muestran precio de compra y venta por separado?',
      answer: 'Porque no operamos con un libro de órdenes real de BTC en bolivianos: mostrar un spread inventado sería menos honesto que mostrar una sola referencia calculada.'
    },
    {
      question: '¿Puedo comprar Bitcoin directamente en bolivianos?',
      answer: 'La forma más común es comprar USDT en bolivianos por P2P y luego cambiar USDT por BTC dentro del mismo exchange. Revisa nuestra guía de cómo comprar USDT en Bolivia.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.btcBob,
    description: pageDescriptions.btcBob,
    url: `${siteConfig.url}/btc-bob`,
    inLanguage: siteConfig.locale
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Bitcoin a bolivianos', href: '/btc-bob' }]} />
      <section className="grid gap-8 max-w-3xl">
        <div className="grid gap-3">
          <p className="kicker">Precio de referencia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Bitcoin a bolivianos hoy</h1>
          <p className="text-ink/70">
            Precio de referencia de BTC en bolivianos, calculado con el precio global de Bitcoin en
            dólares y nuestro propio índice del dólar paralelo en Bolivia. No es una cotización de
            ningún exchange local.
          </p>
        </div>

        <div className="card p-6 grid gap-3">
          <p className="text-xs uppercase tracking-wide text-ink/50">1 BTC equivale a</p>
          <p className="text-3xl font-semibold">{rate ? formatCurrency(rate) : '—'}</p>
          <p className="text-sm text-ink/60">
            {btcUsd && quote
              ? `BTC/USD ${new Intl.NumberFormat('en-US').format(btcUsd)} × dólar paralelo Bs ${formatCurrency((quote.buy + quote.sell) / 2)}. Actualizado ${formatDateTime(new Date(quote.updatedAt))}.`
              : 'Cotización temporalmente no disponible.'}
          </p>
        </div>

        {rate ? (
          <P2PCalculator
            buy={rate}
            sell={rate}
            assetLabel="BTC"
            singleRate
            rateNote="Referencia calculada (BTC/USD × dólar paralelo), no una cotización P2P real. Verifica el precio exacto en tu exchange antes de operar."
          />
        ) : null}

        <div className="card p-6 grid gap-3 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo se calcula</h2>
          <p>
            Tomamos el precio de Bitcoin en dólares de mercados globales y lo multiplicamos por
            nuestro propio índice del{' '}
            <Link href="/paralelo" className="underline underline-offset-4">dólar paralelo en Bolivia</Link>.
            Es una referencia útil para estimar valor, no el precio exacto al que podrías comprar o
            vender en un exchange. Para operar, revisa la{' '}
            <Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">guía de cómo comprar USDT en Bolivia</Link>{' '}
            y luego cambia USDT por BTC dentro del exchange que elijas.
          </p>
        </div>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
