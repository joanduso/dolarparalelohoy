import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { PlatformCards } from '@/app/(site)/_components/PlatformCards';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.exchanges,
    description: pageDescriptions.exchanges,
    alternates: { canonical: '/exchanges' },
    openGraph: {
      title: pageTitles.exchanges,
      description: pageDescriptions.exchanges,
      locale: siteConfig.locale
    }
  };
}

export default function ExchangesPage() {
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Qué plataforma tiene el mejor precio?',
      answer: 'No existe una respuesta fija. La cotización final puede cambiar por liquidez, monto, método de pago, comisión y disponibilidad. Por eso conviene comparar antes de confirmar.'
    },
    {
      question: '¿Todas las plataformas muestran una tasa P2P?',
      answer: 'No. Algunas son mercados P2P y otras billeteras con una tasa propia. La tabla indica el tipo de plataforma y solo publica precio cuando existe una fuente pública disponible.'
    },
    {
      question: '¿Esto es una recomendación financiera?',
      answer: 'No. La comparación es informativa. Cada persona debe verificar términos, límites, comisiones y la identidad de su contraparte antes de operar.'
    }
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitles.exchanges,
    description: pageDescriptions.exchanges,
    url: `${siteConfig.url}/exchanges`,
    inLanguage: siteConfig.locale
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Comparador de exchanges', href: '/exchanges' }]} />
      <section className="grid gap-8">
        <div className="grid gap-3 max-w-3xl">
          <p className="kicker">P2P y billeteras para Bolivia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Comparador de exchanges P2P en Bolivia</h1>
          <p className="text-ink/70">
            Consulta precios publicados cuando están disponibles y conoce el tipo de plataforma antes de abrir una operación. El mejor precio depende de tu monto, comisión y medio de pago.
          </p>
        </div>

        <PlatformCards />

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo comparar correctamente</h2>
          <p>
            No compares únicamente la cifra grande. Revisa la dirección de la operación —compra o venta—, comisión, monto mínimo, banco o QR admitido, velocidad de liquidación y reputación de la contraparte.
          </p>
          <p>
            Usa el <Link href="/usdt-bob" className="underline underline-offset-4">conversor USDT/BOB</Link> para una estimación y contrasta el resultado con el{' '}
            <Link href="/paralelo" className="underline underline-offset-4">índice paralelo</Link> y las{' '}
            <Link href="/fuentes" className="underline underline-offset-4">fuentes</Link>.
          </p>
        </article>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
