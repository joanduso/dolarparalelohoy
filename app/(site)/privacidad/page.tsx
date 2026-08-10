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
        <p className="text-ink/70">Última actualización: 10 de agosto de 2026.</p>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Datos de reportes voluntarios</h2>
          <p className="text-ink/70">
            Un reporte puede incluir precio, tipo de operación, fuente y departamento opcional.
            No solicitamos nombre, correo, teléfono ni datos bancarios para reportar un precio.
          </p>
        </section>
        <section className="grid gap-2">
          <h2 className="font-serif text-2xl">Suscripciones y alertas</h2>
          <p className="text-ink/70">
            Si solicitas alertas, guardamos tu correo, la frecuencia elegida, el umbral de cambio,
            el momento del consentimiento y el estado de confirmación. Usamos estos datos solo para
            enviar la cotización solicitada, administrar la suscripción y prevenir abuso.
          </p>
          <p className="text-ink/70">
            La suscripción requiere confirmación por correo y cada mensaje incluye un enlace de baja.
            El proveedor de correo procesa la dirección y el contenido necesarios para entregar el
            mensaje. Conservamos el registro hasta que solicites la baja o eliminación.
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
