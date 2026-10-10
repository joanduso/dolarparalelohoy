import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import {
  pageDescriptions,
  pageTitles,
  publicRepositoryUrl,
  siteConfig
} from '@/lib/seo';

export const metadata: Metadata = {
  title: pageTitles.acercaDe,
  description: pageDescriptions.acercaDe,
  alternates: { canonical: '/acerca-de' },
  openGraph: {
    title: pageTitles.acercaDe,
    description: pageDescriptions.acercaDe,
    url: '/acerca-de',
    locale: siteConfig.locale
  }
};

export default function AcercaDePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: pageTitles.acercaDe,
    description: pageDescriptions.acercaDe,
    url: `${siteConfig.url}/acerca-de`,
    inLanguage: siteConfig.language,
    dateModified: '2026-10-03',
    mainEntity: { '@id': `${siteConfig.url}/#organization` },
    isPartOf: { '@id': `${siteConfig.url}/#website` }
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Quiénes somos', href: '/acerca-de' }]} />
      <article className="grid max-w-4xl gap-8">
        <header className="grid gap-3">
          <p className="kicker">Responsabilidad editorial</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Quiénes somos y cómo publicamos
          </h1>
          <p className="max-w-3xl text-ink/70">
            Dólar Paralelo Hoy Bolivia es un proyecto independiente de datos. No representa al
            Banco Central de Bolivia, ASFI, un banco, una billetera ni un exchange.
          </p>
        </header>

        <section id="politica-editorial" className="card grid gap-4 p-6">
          <h2 className="font-serif text-2xl">Política editorial</h2>
          <ul className="grid gap-3 text-ink/70">
            <li><strong>Dato:</strong> mostramos la fuente, la hora y el estado de disponibilidad junto a cada cotización.</li>
            <li><strong>Metodología:</strong> documentamos los filtros y la agregación sin presentar una estimación como tasa oficial.</li>
            <li><strong>Interpretación:</strong> se identifica como contexto informativo y nunca como recomendación financiera.</li>
            <li><strong>Correcciones:</strong> corregimos hacia adelante, conservamos la procedencia del histórico y fechamos los cambios materiales de metodología.</li>
          </ul>
        </section>

        <section id="independencia" className="card grid gap-3 p-6">
          <h2 className="font-serif text-2xl">Independencia y publicidad</h2>
          <p className="text-ink/70">
            La publicidad se identifica visualmente y no determina las fuentes, filtros,
            cotizaciones ni conclusiones editoriales. La aparición de una plataforma en una tabla
            no constituye una recomendación ni una garantía sobre sus servicios.
          </p>
        </section>

        <section className="card grid gap-3 p-6">
          <h2 className="font-serif text-2xl">Transparencia y verificación</h2>
          <p className="text-ink/70">
            La <Link href="/fuentes" className="underline underline-offset-4">metodología y las fuentes</Link>,
            la <Link href="/devs" className="underline underline-offset-4">API pública</Link> y parte
            de la implementación pueden auditarse de forma independiente.
          </p>
          <a
            className="underline underline-offset-4"
            href={publicRepositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            Revisar el repositorio público
          </a>
          <p className="text-sm text-ink/60">
            Política editorial revisada el 3 de octubre de 2026.
          </p>
        </section>
      </article>
    </main>
  );
}
