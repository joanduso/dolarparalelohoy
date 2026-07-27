import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.queEsDolarBlue,
    description: pageDescriptions.queEsDolarBlue,
    alternates: { canonical: '/que-es-dolar-blue-bolivia' },
    openGraph: {
      title: pageTitles.queEsDolarBlue,
      description: pageDescriptions.queEsDolarBlue,
      locale: siteConfig.locale
    }
  };
}

export default function QueEsDolarBlueBoliviaPage() {
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿El dólar blue es legal en Bolivia?',
      answer: 'No existe una prohibición sobre comprar o vender dólares entre personas ni sobre operar en plataformas P2P. No es, sin embargo, una tasa reconocida ni fijada por ninguna autoridad monetaria: es una referencia informal de mercado.'
    },
    {
      question: '¿Por qué el dólar blue puede ser más caro que el oficial?',
      answer: 'Refleja la oferta y demanda real de dólares fuera del sistema bancario. Cuando hay más gente buscando dólares que vendedores dispuestos a ofrecerlos al tipo oficial, el precio informal sube.'
    },
    {
      question: '¿Dólar blue, paralelo y USDT/BOB son lo mismo?',
      answer: 'Son formas de nombrar el mismo fenómeno de mercado. En Bolivia, al no existir una cotización paralela centralizada, la referencia más visible en la práctica es el precio de USDT en mercados P2P.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitles.queEsDolarBlue,
    description: pageDescriptions.queEsDolarBlue,
    url: `${siteConfig.url}/que-es-dolar-blue-bolivia`,
    inLanguage: siteConfig.language,
    author: { '@id': `${siteConfig.url}/#organization` },
    publisher: { '@id': `${siteConfig.url}/#organization` }
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Qué es el dólar blue en Bolivia', href: '/que-es-dolar-blue-bolivia' }]} />
      <section className="grid gap-8 max-w-3xl">
        <div className="grid gap-3">
          <p className="kicker">Explicación completa</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Qué es el dólar blue y cómo funciona en Bolivia</h1>
          <p className="text-ink/70">
            &ldquo;Dólar blue&rdquo; es el nombre coloquial que se le da en Bolivia al mercado paralelo de dólares: el precio al que la gente realmente compra y vende dólares fuera del sistema bancario, distinto del{' '}
            <Link href="/oficial" className="underline underline-offset-4">tipo de cambio oficial</Link>{' '}
            publicado por el Banco Central de Bolivia (BCB).
          </p>
        </div>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">De dónde viene el término</h2>
          <p>
            El término se originó en Argentina, donde el mercado paralelo de dólares tiene décadas de historia y un nombre coloquial muy asentado. Con la escasez de dólares que vivió Bolivia desde 2023, empezó a usarse aquí de forma informal para describir el mismo fenómeno: personas y negocios buscando dólares fuera del sistema bancario porque la demanda superaba la oferta disponible al tipo de cambio oficial.
          </p>
          <p>
            A diferencia de Argentina, Bolivia no tiene una cotización paralela centralizada ni ampliamente publicada por medios tradicionales. La referencia más visible que existe hoy es el precio de USDT y otras stablecoins en mercados P2P, que es justamente lo que este sitio agrega y publica en la página de{' '}
            <Link href="/dolar-blue-bolivia" className="underline underline-offset-4">dólar blue en Bolivia hoy</Link>.
          </p>
        </article>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo se forma el precio</h2>
          <p>
            No lo fija ninguna autoridad. Sale de la negociación entre miles de compradores y vendedores individuales en plataformas P2P: cada uno publica un anuncio con su propio precio, y el &ldquo;precio del dólar blue&rdquo; que ves en cualquier sitio (incluido este) es en realidad una mediana o promedio de esos anuncios activos en un momento dado.
          </p>
          <p>
            Por eso el precio puede variar levemente entre distintas fuentes: cada una agrega datos de plataformas distintas, con métodos de cálculo distintos, y en momentos distintos del día. La brecha entre el paralelo y el oficial —lo que en este sitio llamamos{' '}
            <Link href="/brecha" className="underline underline-offset-4">brecha cambiaria</Link>— es una forma de medir qué tan alejado está el mercado informal del tipo de cambio oficial.
          </p>
        </article>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Para qué se usa en la práctica</h2>
          <p>
            Hoy se usa sobre todo para recibir remesas del exterior, cambiar ahorros en dólares físicos que no encuentran fácil salida bancaria, pagar a proveedores internacionales, o simplemente para no mantener todos los ahorros en bolivianos. No es una inversión ni una tasa garantizada: cambia con la oferta y demanda de cada momento y puede variar de una plataforma a otra.
          </p>
          <p>
            Si vas a comprar o vender por primera vez, revisa nuestra{' '}
            <Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">guía paso a paso para comprar USDT en Bolivia</Link>{' '}
            y el <Link href="/exchanges" className="underline underline-offset-4">comparador de exchanges P2P</Link>{' '}
            antes de operar.
          </p>
        </article>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
