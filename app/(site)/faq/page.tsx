import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import type { Metadata } from 'next';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.faq,
    description: pageDescriptions.faq,
    alternates: { canonical: '/faq' },
    openGraph: {
      title: pageTitles.faq,
      description: pageDescriptions.faq,
      locale: siteConfig.locale
    }
  };
}

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: siteConfig.language,
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es el dólar paralelo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es un tipo de cambio que surge fuera de los canales oficiales. Publicamos promedios diarios de fuentes públicas para dar contexto.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Qué es la brecha cambiaria?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es la diferencia porcentual entre el dólar oficial y el paralelo. Sirve para medir la distancia entre mercados.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Cómo validan los datos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aplicamos filtros de sanidad, detección de outliers y confirmación por múltiples fuentes antes de publicar el promedio diario.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Qué es el precio declarado?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es un indicador secundario basado en reportes voluntarios de usuarios. Solo se publica si hay suficientes reportes válidos en 24 horas.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Cómo se valida el precio declarado?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cada reporte se compara con el precio base. Solo se acepta si la desviación es menor o igual al 15% y pasa controles anti-abuso.'
        }
      },
      {
        '@type': 'Question',
        name: '¿Por qué puede diferir del precio base?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Depende de la zona, el canal y el volumen de la operación. El declarado refleja experiencias puntuales, mientras que el base es una agregación.'
        }
      }
    ]
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.faq,
    description: pageDescriptions.faq,
    url: `${siteConfig.url}/faq`,
    inLanguage: siteConfig.language
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <section className="grid gap-8">
        <div className="grid gap-3">
          <p className="kicker">Metodología y transparencia</p>
          <h1 className="font-serif text-3xl sm:text-4xl">FAQ, metodología y aviso legal</h1>
          <p className="text-ink/70 max-w-2xl">
            Explicamos cómo recolectamos, validamos y publicamos datos del dólar paralelo y oficial
            en Bolivia.
          </p>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Metodología</h2>
          <ul className="grid gap-3 text-ink/70">
            <li>
              Promediamos varias fuentes públicas por tipo de cambio. Cada fuente tiene adaptador y
              se valida por separado.
            </li>
            <li>
              Detectamos valores atípicos: si la variación supera un umbral en 15 minutos exigimos
              confirmación de al menos dos fuentes.
            </li>
            <li>
              Publicamos promedios diarios (compra/venta) y almacenamos la respuesta cruda en
              registros internos para auditoría.
            </li>
            <li>
              El precio declarado es un indicador secundario y se publica solo con al menos 5
              reportes válidos en las últimas 24 horas.
            </li>
          </ul>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Aviso legal</h2>
          <p className="text-ink/70">
            Esta información es solo referencial y no constituye asesoría financiera. Las
            cotizaciones pueden variar según el canal, el volumen y las condiciones de cada
            operación.
          </p>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Preguntas frecuentes</h2>
          <div className="grid gap-3 text-ink/70">
            <p>
              <strong>¿Qué es el dólar paralelo?</strong> Es un tipo de cambio fuera del canal
              oficial. Lo usamos para medir expectativas y disponibilidad.
            </p>
            <p>
              <strong>¿Qué es la brecha cambiaria?</strong> Diferencia porcentual entre el dólar
              oficial y el paralelo.
            </p>
            <p>
              <strong>¿Cada cuánto actualizan?</strong> Varias veces al día, con promedios diarios
              visibles y marcas de última actualización.
            </p>
            <p>
              <strong>¿Qué es el precio declarado?</strong> Es un indicador secundario con reportes
              de usuarios. Se publica cuando hay suficientes reportes válidos en 24h.
            </p>
            <p>
              <strong>¿Cómo se valida?</strong> Cada reporte se compara contra el precio base y se
              rechaza si se aleja más de 15% o si incumple controles anti-abuso.
            </p>
            <p>
              <strong>¿Por qué puede diferir del base?</strong> Porque refleja operaciones puntuales
              en distintos canales, zonas y montos, mientras el base es una agregación.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
