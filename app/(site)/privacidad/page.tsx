import type { Metadata } from 'next';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const metadata: Metadata = {
  title: pageTitles.privacidad,
  description: pageDescriptions.privacidad,
  alternates: { canonical: '/privacidad' },
  openGraph: {
    title: pageTitles.privacidad,
    description: pageDescriptions.privacidad,
    url: '/privacidad',
    locale: siteConfig.locale
  }
};

export default function PrivacidadPage() {
  return (
    <main className="section-shell pb-16">
      <article className="card p-6 grid gap-5 max-w-4xl">
        <h1 className="font-serif text-3xl sm:text-4xl">Política de privacidad</h1>
        <p className="text-ink/70">Última actualización: 22 de julio de 2026.</p>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Datos de reportes voluntarios</h2>
          <p className="text-ink/70">
            Un reporte puede incluir precio, tipo de operación, fuente y departamento opcional.
            No solicitamos nombre, correo, teléfono ni datos bancarios para reportar un precio.
          </p>
        </section>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Prevención de abuso</h2>
          <p className="text-ink/70">
            Procesamos identificadores técnicos transformados mediante hash para limitar envíos
            repetidos y detectar abuso. Los reportes públicos se muestran de forma agregada.
          </p>
        </section>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Servicios técnicos</h2>
          <p className="text-ink/70">
            Utilizamos proveedores de alojamiento y base de datos para operar el sitio. Estos
            servicios pueden procesar registros técnicos necesarios para seguridad y disponibilidad.
          </p>
        </section>
      </article>
    </main>
  );
}
