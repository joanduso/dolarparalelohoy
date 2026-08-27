import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { WidgetEmbedCode } from '@/app/(site)/_components/WidgetEmbedCode';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const metadata: Metadata = {
  title: pageTitles.widget,
  description: pageDescriptions.widget,
  alternates: { canonical: '/widget' },
  openGraph: { title: pageTitles.widget, description: pageDescriptions.widget, locale: siteConfig.locale }
};

export default function WidgetPage() {
  const embedUrl = `${siteConfig.url}/widget/embed`;
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebApplication', name: pageTitles.widget, description: pageDescriptions.widget, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', url: `${siteConfig.url}/widget`, offers: { '@type': 'Offer', price: 0, priceCurrency: 'BOB' } };
  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Widget dólar paralelo', href: '/widget' }]} />
      <section className="grid gap-8">
        <header className="grid max-w-3xl gap-3"><p className="kicker">Recurso gratuito</p><h1 className="font-serif text-3xl sm:text-4xl">Widget del dólar paralelo Bolivia para tu web</h1><p className="text-ink/70">Muestra compra, venta y hora de actualización en tu blog, medio o página empresarial. El widget se actualiza automáticamente y enlaza a la fuente.</p></header>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card grid gap-3 p-6"><h2 className="font-serif text-2xl">Vista previa</h2><iframe src="/widget/embed" title="Vista previa del dólar paralelo Bolivia" width="100%" height="250" className="rounded-xl border-0" loading="lazy" /></div>
          <div className="card grid gap-4 p-6"><h2 className="font-serif text-2xl">Insértalo en segundos</h2><p className="text-sm text-ink/70">Copia el código y pégalo donde tu gestor permita HTML. Mantén el enlace de atribución para reutilizar los datos bajo CC BY 4.0.</p><WidgetEmbedCode embedUrl={embedUrl} /></div>
        </div>
        <article className="card grid gap-3 p-6 text-ink/70"><h2 className="font-serif text-2xl text-ink">Condiciones y funcionamiento</h2><p>El iframe es ligero, no requiere claves y muestra la referencia P2P disponible. La cotización es informativa y puede diferir del precio final de una operación.</p><p>La atribución permite verificar la <Link href="/fuentes" className="underline underline-offset-4">metodología y la licencia</Link>. Para una integración personalizada, utiliza la <Link href="/devs" className="underline underline-offset-4">API pública documentada</Link>.</p></article>
      </section>
    </main>
  );
}
