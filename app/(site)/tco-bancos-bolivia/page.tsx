import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { BcbTcoBankSection } from '@/app/(site)/_components/BcbTcoBankSection';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: pageTitles.tcoBancos },
  description: pageDescriptions.tcoBancos,
  alternates: { canonical: '/tco-bancos-bolivia' },
  openGraph: {
    title: pageTitles.tcoBancos,
    description: pageDescriptions.tcoBancos,
    locale: siteConfig.locale
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/tco-bancos-bolivia#webpage`,
      url: `${siteConfig.url}/tco-bancos-bolivia`,
      name: pageTitles.tcoBancos,
      description: pageDescriptions.tcoBancos,
      inLanguage: siteConfig.locale,
      isPartOf: { '@id': `${siteConfig.url}/#website` },
      about: { '@id': `${siteConfig.url}/tco-bancos-bolivia#dataset` }
    },
    {
      '@type': 'Dataset',
      '@id': `${siteConfig.url}/tco-bancos-bolivia#dataset`,
      name: 'Participación bancaria en las compras de dólares y formación del TCO en Bolivia',
      description: pageDescriptions.tcoBancos,
      url: `${siteConfig.url}/tco-bancos-bolivia`,
      inLanguage: siteConfig.locale,
      creator: { '@id': `${siteConfig.url}/#organization` },
      isBasedOn: 'https://www.bcb.gob.bo/bcb_tco_publico_detalle_historico.php',
      variableMeasured: [
        'Dólares comprados por banco',
        'Número de operaciones',
        'Participación del volumen',
        'Mediana ponderada por banco',
        'Tipo de Cambio Oficial'
      ]
    }
  ]
};

export default function TcoBancosBoliviaPage() {
  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'TCO por banco', href: '/tco-bancos-bolivia' }]} />
      <BcbTcoBankSection standalone />
      <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Cómo interpretar los datos del TCO">
        <article className="card grid gap-4 p-6 sm:p-8">
          <p className="kicker">Guía de lectura</p>
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">Cómo leer la tabla por banco</h2>
          <p className="leading-relaxed text-ink/65">
            La cuota del volumen es el porcentaje de dólares que compró cada entidad dentro del
            corte. La mediana del banco resume el nivel de tipo de cambio de sus propias
            operaciones, ponderado por monto; no es un precio ofrecido al público.
          </p>
          <p className="leading-relaxed text-ink/65">
            La posición compara esa mediana con el TCO publicado. Estar por debajo o por encima no
            califica al banco ni demuestra que haya causado el resultado general.
          </p>
        </article>

        <article className="card grid gap-4 p-6 sm:p-8">
          <p className="kicker">Prueba de sensibilidad</p>
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">Qué significa excluir un banco</h2>
          <p className="leading-relaxed text-ink/65">
            Recalculamos la mediana ponderada retirando una entidad a la vez. La variación muestra
            cuánto habría cambiado el TCO en ese escenario contrafactual, manteniendo iguales las
            operaciones de los demás bancos.
          </p>
          <p className="leading-relaxed text-ink/65">
            Es una medida de sensibilidad, no una afirmación causal. Todos los cálculos parten del
            detalle público del Banco Central de Bolivia y se enlazan al corte original.
          </p>
        </article>
      </section>
    </main>
  );
}
