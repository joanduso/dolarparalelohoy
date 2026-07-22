import type { Metadata } from 'next';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const metadata: Metadata = {
  title: pageTitles.terminos,
  description: pageDescriptions.terminos,
  alternates: { canonical: '/terminos' },
  openGraph: {
    title: pageTitles.terminos,
    description: pageDescriptions.terminos,
    url: '/terminos',
    locale: siteConfig.locale
  }
};

export default function TerminosPage() {
  return (
    <main className="section-shell pb-16">
      <article className="card p-6 grid gap-5 max-w-4xl">
        <h1 className="font-serif text-3xl sm:text-4xl">Términos de uso</h1>
        <p className="text-ink/70">Última actualización: 22 de julio de 2026.</p>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Información referencial</h2>
          <p className="text-ink/70">
            Las cotizaciones y estadísticas se ofrecen con fines informativos. No constituyen una
            oferta, asesoría financiera ni garantía de disponibilidad para una operación concreta.
          </p>
        </section>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Exactitud y disponibilidad</h2>
          <p className="text-ink/70">
            Procuramos validar y actualizar los datos, pero las fuentes externas pueden presentar
            retrasos, interrupciones o cambios. Verifica siempre el precio final antes de operar.
          </p>
        </section>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Uso de los reportes</h2>
          <p className="text-ink/70">
            Al enviar un reporte declaras que corresponde a una referencia real y autorizas su uso
            agregado y anónimo para construir indicadores públicos.
          </p>
        </section>
      </article>
    </main>
  );
}
