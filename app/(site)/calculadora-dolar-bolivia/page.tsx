import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { DollarCalculator } from '@/app/(site)/_components/DollarCalculator';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { getParallelQuote } from '@/lib/p2pIndex';
import { getSiteData } from '@/lib/siteData';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

type CurrentRates = {
  oficial: { buy: number | null; sell: number | null } | null;
};

export const revalidate = 600;

export const metadata: Metadata = {
  title: pageTitles.calculadora,
  description: pageDescriptions.calculadora,
  alternates: { canonical: '/calculadora-dolar-bolivia' },
  openGraph: { title: pageTitles.calculadora, description: pageDescriptions.calculadora, locale: siteConfig.locale }
};

export default async function CalculadoraDolarBoliviaPage() {
  const [parallel, currentResult] = await Promise.all([
    getParallelQuote(),
    getSiteData<CurrentRates>('/api/rates/current?v=calculator-20260827')
  ]);
  const official = currentResult.data?.oficial ?? null;
  const faqItems: SeoFaqItem[] = [
    { question: '¿Cuántos bolivianos son 100 dólares hoy?', answer: 'Ingresa 100, elige dólar paralelo u oficial y selecciona si quieres comprar o vender. La calculadora aplica automáticamente la cotización disponible.' },
    { question: '¿Qué tasa debo usar para comprar dólares?', answer: 'Para estimar cuánto pagarías al comprar, usa la tasa de venta. Si vendes dólares y recibes bolivianos, usa la tasa de compra.' },
    { question: '¿El resultado incluye comisiones?', answer: 'No. Es una referencia. Bancos, plataformas y contrapartes pueden aplicar comisiones, límites o un precio distinto según el medio de pago.' }
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: pageTitles.calculadora, description: pageDescriptions.calculadora, url: `${siteConfig.url}/calculadora-dolar-bolivia`, inLanguage: siteConfig.locale },
      { '@type': 'WebApplication', name: 'Calculadora dólar a bolivianos', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', url: `${siteConfig.url}/calculadora-dolar-bolivia`, offers: { '@type': 'Offer', price: 0, priceCurrency: 'BOB' } }
    ]
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Calculadora dólar Bolivia', href: '/calculadora-dolar-bolivia' }]} />
      <section className="grid gap-8">
        <header className="grid max-w-3xl gap-3">
          <p className="kicker">Dólar a bolivianos hoy</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Calculadora de dólares a bolivianos y de BOB a USD</h1>
          <p className="text-ink/70">Convierte en ambos sentidos y compara el resultado con la cotización paralela P2P o la oficial del BCB. Usa compra o venta según la operación que quieras estimar.</p>
        </header>
        <DollarCalculator parallelBuy={parallel?.buy ?? null} parallelSell={parallel?.sell ?? null} officialBuy={official?.buy ?? null} officialSell={official?.sell ?? null} />
        <article className="card grid gap-4 p-6 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo elegir la cotización correcta</h2>
          <p>La tasa paralela refleja referencias observadas en mercados P2P; la oficial corresponde a la publicación institucional. La diferencia entre ambas se conoce como brecha cambiaria.</p>
          <p>Antes de tomar una decisión, revisa la <Link href="/" className="underline underline-offset-4">cotización del dólar paralelo hoy</Link>, el <Link href="/oficial" className="underline underline-offset-4">dólar oficial del BCB</Link>, la <Link href="/brecha" className="underline underline-offset-4">brecha cambiaria</Link> y el <Link href="/historico/paralelo" className="underline underline-offset-4">histórico por fecha</Link>.</p>
        </article>
        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
