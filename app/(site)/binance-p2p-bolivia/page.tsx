import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { P2PCalculator } from '@/app/(site)/_components/P2PCalculator';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { fetchPlatformRates } from '@/lib/platformRates';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = {
  title: pageTitles.binanceP2p,
  description: pageDescriptions.binanceP2p,
  alternates: { canonical: '/binance-p2p-bolivia' },
  openGraph: { title: pageTitles.binanceP2p, description: pageDescriptions.binanceP2p, locale: siteConfig.locale }
};

export default async function BinanceP2PBoliviaPage() {
  const binance = (await fetchPlatformRates()).binance ?? null;
  const spreadPct = binance && binance.buy > 0 ? Math.abs((binance.sell - binance.buy) / binance.buy) * 100 : null;
  const faqItems: SeoFaqItem[] = [
    { question: '¿Cómo se calcula el precio de Binance P2P en Bolivia?', answer: 'Se toman muestras públicas de anuncios USDT/BOB disponibles y se publica una mediana después de validar los precios. No representa todos los anuncios ni garantiza una operación.' },
    { question: '¿Binance cobra comisión por P2P?', answer: 'La plataforma puede mostrar condiciones distintas según usuario, anuncio y momento. El costo efectivo también depende del spread, método de pago y precio elegido; comprueba siempre el resumen antes de confirmar.' },
    { question: '¿Qué debo revisar en un anuncio P2P?', answer: 'Precio, monto mínimo y máximo, banco o QR admitido, operaciones completadas, porcentaje de finalización y que todo el proceso ocurra dentro de la plataforma.' }
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: pageTitles.binanceP2p, description: pageDescriptions.binanceP2p, url: `${siteConfig.url}/binance-p2p-bolivia`, inLanguage: siteConfig.locale, dateModified: binance?.updatedAt },
      { '@type': 'Dataset', name: 'Referencia Binance P2P USDT/BOB', description: 'Mediana informativa de anuncios públicos de compra y venta USDT/BOB.', url: `${siteConfig.url}/binance-p2p-bolivia`, dateModified: binance?.updatedAt, creator: { '@id': `${siteConfig.url}/#organization` }, license: `${siteConfig.url}/terminos`, isBasedOn: `${siteConfig.url}/fuentes` }
    ]
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Binance P2P Bolivia', href: '/binance-p2p-bolivia' }]} />
      <section className="grid gap-8">
        <header className="grid max-w-3xl gap-3">
          <p className="kicker">USDT/BOB por plataforma</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Binance P2P Bolivia hoy: precio de USDT en bolivianos</h1>
          <p className="text-ink/70">Consulta una mediana de anuncios públicos USDT/BOB, calcula un monto y aprende qué revisar antes de elegir una contraparte.</p>
        </header>
        <div className="card grid gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs uppercase tracking-wide text-ink/50">Compra</p><p className="mt-1 text-3xl font-semibold">{binance ? formatCurrency(binance.buy) : '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-ink/50">Venta</p><p className="mt-1 text-3xl font-semibold">{binance ? formatCurrency(binance.sell) : '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-ink/50">Spread observado</p><p className="mt-1 text-3xl font-semibold">{spreadPct === null ? '—' : `${formatNumber(spreadPct, 2)}%`}</p></div>
          </div>
          <p className="text-sm text-ink/60">{binance ? `Actualizado ${formatDateTime(new Date(binance.updatedAt))}. Fuente: ${binance.source}.` : 'La fuente está temporalmente fuera de línea.'}</p>
        </div>
        <P2PCalculator buy={binance?.buy ?? null} sell={binance?.sell ?? null} assetLabel="USDT" rateNote="Estimación con la mediana observada en Binance P2P. El anuncio final puede variar por monto y método de pago." />
        <article className="card grid gap-4 p-6 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo comparar anuncios de Binance P2P</h2>
          <p>Filtra por BOB, elige comprar o vender USDT y selecciona el método de pago que realmente usarás. Después compara el precio efectivo, los límites y la experiencia de la contraparte.</p>
          <p>No envíes fondos fuera de las instrucciones de la operación ni confirmes la recepción antes de verla en tu cuenta. Esta página informa sobre precios; no intermedia operaciones.</p>
          <div className="flex flex-wrap gap-4 text-sm"><Link href="/exchanges" className="underline underline-offset-4">Comparar otras plataformas</Link><Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">Guía para comprar USDT</Link><Link href="/usdt-bob" className="underline underline-offset-4">Conversor USDT/BOB</Link></div>
          <a href="https://www.binance.com/register?ref=CJ7ZK0QV" target="_blank" rel="sponsored noreferrer" className="w-fit rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white">Abrir Binance P2P</a>
        </article>
        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
