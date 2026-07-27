import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const metadata: Metadata = {
  title: pageTitles.fuentes,
  description: pageDescriptions.fuentes,
  alternates: { canonical: '/fuentes' },
  openGraph: {
    title: pageTitles.fuentes,
    description: pageDescriptions.fuentes,
    url: '/fuentes',
    locale: siteConfig.locale
  }
};

export default function FuentesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.fuentes,
    description: pageDescriptions.fuentes,
    url: `${siteConfig.url}/fuentes`,
    inLanguage: siteConfig.locale,
    isPartOf: { '@id': `${siteConfig.url}/#website` }
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Fuentes', href: '/fuentes' }]} />
      <article className="grid gap-8 max-w-4xl">
        <header className="grid gap-3">
          <p className="kicker">Transparencia de datos</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Fuentes del dólar en Bolivia</h1>
          <p className="text-ink/70">
            Explicamos de dónde salen las cotizaciones, cómo las comparamos y qué controles
            aplicamos antes de publicar un valor.
          </p>
        </header>

        <section className="card p-6 grid gap-3">
          <h2 className="font-serif text-2xl">Dólar oficial y referencial</h2>
          <p className="text-ink/70">
            Consultamos publicaciones del Banco Central de Bolivia (BCB) para mostrar referencias
            institucionales. La fecha y el enlace de origen se presentan junto a la cotización.
          </p>
          <a className="underline underline-offset-4" href="https://www.bcb.gob.bo" target="_blank" rel="noreferrer">
            Visitar el Banco Central de Bolivia
          </a>
        </section>

        <section className="card p-6 grid gap-3">
          <h2 className="font-serif text-2xl">Índice P2P Bolivia</h2>
          <p className="text-ink/70">
            El índice paralelo combina cotizaciones públicas disponibles para operaciones con
            activos digitales y bolivianos. Usamos medianas y filtros de valores atípicos para
            reducir el efecto de anuncios extremos o con poca liquidez.
          </p>
          <p className="text-ink/70">
            Cuando una fuente no responde, la página lo indica y evita presentarla como activa.
            Las cotizaciones son referenciales: el precio final depende del medio de pago, límites,
            comisiones y condiciones de cada contraparte.
          </p>
        </section>

        <section id="licencia-de-uso-de-datos" className="card p-6 grid gap-3">
          <h2 className="font-serif text-2xl">Licencia de uso de datos</h2>
          <p className="text-ink/70">
            Los datos que agregamos (cotización actual, histórico diario y brecha cambiaria) pueden
            citarse y reutilizarse libremente con atribución a <strong>Dólar Paralelo Hoy Bolivia</strong>{' '}
            y un enlace a <Link href="/" className="underline underline-offset-4">dolarparalelohoy.com</Link>,
            bajo los mismos términos de{' '}
            <a
              className="underline underline-offset-4"
              href="https://creativecommons.org/licenses/by/4.0/deed.es"
              target="_blank"
              rel="noreferrer"
            >
              Creative Commons BY 4.0
            </a>. Esto aplica a los datos que nosotros calculamos y publicamos; las fuentes
            primarias que citamos (BCB, paralelo.bo, Binance P2P) mantienen sus propios términos.
          </p>
          <p className="text-ink/70">
            Para integrar estos datos en un producto, agente o asistente, usa la{' '}
            <Link className="underline underline-offset-4" href="/devs">API pública documentada</Link>{' '}
            en vez de scrapear el sitio: es más estable y no cambia sin aviso.
          </p>
        </section>

        <section className="card p-6 grid gap-3">
          <h2 className="font-serif text-2xl">Reportes de usuarios</h2>
          <p className="text-ink/70">
            Los precios declarados son voluntarios y se publican como indicador secundario solo
            cuando existe una cantidad mínima de reportes válidos. Se comparan con la cotización
            vigente y se rechazan valores demasiado alejados.
          </p>
          <Link className="underline underline-offset-4" href="/faq">
            Leer la metodología completa
          </Link>
        </section>
      </article>
    </main>
  );
}
