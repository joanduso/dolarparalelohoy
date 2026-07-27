import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { P2PCalculator } from '@/app/(site)/_components/P2PCalculator';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { formatCurrency } from '@/lib/format';
import { fetchBcbEurRate } from '@/lib/sources/bcb_eur';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.eurBob,
    description: pageDescriptions.eurBob,
    alternates: { canonical: '/eur-bob' },
    openGraph: {
      title: pageTitles.eurBob,
      description: pageDescriptions.eurBob,
      locale: siteConfig.locale
    }
  };
}

export default async function EurBobPage() {
  const eur = await fetchBcbEurRate();
  const rate = eur?.bobPerEur ?? null;

  const faqItems: SeoFaqItem[] = [
    {
      question: '¿De dónde sale este tipo de cambio?',
      answer: 'Del Banco Central de Bolivia (BCB), que publica una cotización del euro frente al boliviano. El propio BCB la describe como indicativa (no fija como el dólar oficial).'
    },
    {
      question: '¿Hay un mercado paralelo de euros en Bolivia?',
      answer: 'No de forma visible o documentada como el del dólar. La referencia más práctica sigue siendo esta cotización oficial del BCB.'
    },
    {
      question: '¿Cada cuánto se actualiza?',
      answer: 'El BCB publica esta cotización una vez al día. La consultamos cada pocas horas para mantenerla al día.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.eurBob,
    description: pageDescriptions.eurBob,
    url: `${siteConfig.url}/eur-bob`,
    inLanguage: siteConfig.locale
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Euro a bolivianos', href: '/eur-bob' }]} />
      <section className="grid gap-8 max-w-3xl">
        <div className="grid gap-3">
          <p className="kicker">Tipo de cambio oficial</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Euro a bolivianos hoy</h1>
          <p className="text-ink/70">
            Tipo de cambio del euro publicado por el Banco Central de Bolivia (BCB), la única
            fuente oficial disponible para esta referencia.
          </p>
        </div>

        <div className="card p-6 grid gap-3">
          <p className="text-xs uppercase tracking-wide text-ink/50">1 EUR equivale a</p>
          <p className="text-3xl font-semibold">{rate ? formatCurrency(rate) : '—'}</p>
          <p className="text-sm text-ink/60">
            {eur ? `Publicado por el BCB el ${eur.dateText}.` : 'Cotización temporalmente no disponible.'}
          </p>
        </div>

        {rate ? (
          <P2PCalculator
            buy={rate}
            sell={rate}
            assetLabel="EUR"
            singleRate
            rateNote="Tipo de cambio oficial del BCB. No es un mercado P2P: no hay spread de compra/venta publicado."
          />
        ) : null}

        <div className="card p-6 grid gap-3 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Sobre esta referencia</h2>
          <p>
            A diferencia del dólar, Bolivia no tiene un mercado paralelo de euros documentado
            públicamente. Para euros, la cotización del BCB es la referencia más práctica
            disponible. Si necesitas dólares o USDT, revisa el{' '}
            <Link href="/paralelo" className="underline underline-offset-4">dólar paralelo hoy</Link>{' '}
            y el <Link href="/usdt-bob" className="underline underline-offset-4">conversor USDT a BOB</Link>.
          </p>
        </div>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
