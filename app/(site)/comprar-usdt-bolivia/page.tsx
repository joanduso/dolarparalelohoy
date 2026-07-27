import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.comprarUsdt,
    description: pageDescriptions.comprarUsdt,
    alternates: { canonical: '/comprar-usdt-bolivia' },
    openGraph: {
      title: pageTitles.comprarUsdt,
      description: pageDescriptions.comprarUsdt,
      locale: siteConfig.locale
    }
  };
}

export default function ComprarUsdtBoliviaPage() {
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Necesito verificar mi identidad para comprar USDT?',
      answer: 'La mayoría de las plataformas P2P piden verificación de identidad (KYC) antes de permitir operar o para subir tus límites. Algunas permiten montos pequeños sin verificación completa, pero es la excepción, no la norma.'
    },
    {
      question: '¿Cuánto tiempo tarda una compra de USDT por P2P?',
      answer: 'Si el pago es por QR o transferencia instantánea y el vendedor confirma rápido, puede tomar minutos. Si el pago requiere procesamiento bancario o el vendedor no está activo, puede tardar horas.'
    },
    {
      question: '¿Qué pasa si el vendedor no libera el USDT tras mi pago?',
      answer: 'Abre una disputa dentro de la plataforma (no fuera de ella) y adjunta tu comprobante de pago. Las plataformas P2P retienen el USDT en garantía justamente para resolver estos casos; por eso nunca debes pagar fuera del chat oficial.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitles.comprarUsdt,
    description: pageDescriptions.comprarUsdt,
    url: `${siteConfig.url}/comprar-usdt-bolivia`,
    inLanguage: siteConfig.language,
    author: { '@id': `${siteConfig.url}/#organization` },
    publisher: { '@id': `${siteConfig.url}/#organization` }
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Cómo comprar USDT en Bolivia', href: '/comprar-usdt-bolivia' }]} />
      <section className="grid gap-8 max-w-3xl">
        <div className="grid gap-3">
          <p className="kicker">Guía completa</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Cómo comprar USDT en Bolivia (guía 2026)</h1>
          <p className="text-ink/70">
            La forma más común de comprar USDT en Bolivia hoy es a través de mercados P2P (persona a persona) dentro de exchanges como Binance, Bybit o El Dorado, pagando en bolivianos por transferencia bancaria o QR. Esta guía explica el proceso completo, cómo elegir un anuncio seguro y qué errores evitar.
          </p>
        </div>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Paso a paso</h2>
          <ol className="grid gap-4 list-decimal pl-5">
            <li>
              <strong className="text-ink">Elige una plataforma.</strong> Compara en nuestro{' '}
              <Link href="/exchanges" className="underline underline-offset-4">comparador de exchanges P2P</Link>{' '}
              qué opciones tienen mejor precio y aceptan tu banco o billetera (QR, Banco Unión, BNB, BCP, Tigo Money, etc.).
            </li>
            <li>
              <strong className="text-ink">Crea la cuenta y verifica tu identidad (KYC).</strong> Sube tu documento de identidad y espera la validación. Sin esto, la mayoría de plataformas limitan mucho el monto que puedes operar.
            </li>
            <li>
              <strong className="text-ink">Deposita bolivianos o ve directo al mercado P2P.</strong> Algunas plataformas requieren fondear una billetera intermedia; otras te llevan directo a elegir un anuncio.
            </li>
            <li>
              <strong className="text-ink">Elige un anuncio de compra.</strong> Ordena por precio, pero antes de confirmar revisa el número de operaciones completadas del vendedor, su porcentaje de finalización y el medio de pago exacto que acepta.
            </li>
            <li>
              <strong className="text-ink">Confirma la orden y paga solo por el medio indicado.</strong> La plataforma retiene el USDT del vendedor en garantía. No pagues por fuera del chat ni aceptes &ldquo;adelantar&rdquo; el pago sin que la orden esté abierta.
            </li>
            <li>
              <strong className="text-ink">Marca &ldquo;he pagado&rdquo; y espera la liberación.</strong> El vendedor confirma al recibir tu pago y el USDT se libera a tu cuenta. Si no libera en un tiempo razonable, abre una disputa dentro de la plataforma.
            </li>
          </ol>
        </article>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Cómo elegir un buen anuncio</h2>
          <p>
            El precio más bajo no siempre es la mejor opción. Un vendedor con pocas operaciones o un porcentaje de finalización bajo puede cancelar o demorar la entrega. Prioriza anunciantes con historial amplio, y si vas a mover un monto grande, considera dividirlo en dos operaciones con vendedores distintos en vez de concentrar todo en un solo anuncio nuevo.
          </p>
          <p>
            Revisa también el límite mínimo y máximo del anuncio: algunos exigen un monto mínimo alto, lo que puede no convenir si solo quieres comprar una cantidad pequeña para probar la plataforma.
          </p>
        </article>

        <article className="card p-6 grid gap-4 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Errores comunes que debes evitar</h2>
          <ul className="grid gap-3 list-disc pl-5">
            <li>Pagar por fuera de la plataforma (transferencia directa sin abrir una orden) porque el vendedor &ldquo;lo prefiere así&rdquo;: pierdes la protección de la garantía.</li>
            <li>Marcar &ldquo;he pagado&rdquo; antes de haber hecho la transferencia real, presionado por el vendedor.</li>
            <li>Ignorar el nombre del titular de la cuenta bancaria de destino: si no coincide con el que la plataforma muestra, puede ser una señal de alerta.</li>
            <li>No leer las condiciones del anuncio (comisiones extra, tiempo límite de pago) antes de confirmar.</li>
          </ul>
        </article>

        <div className="card p-6 grid gap-3 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Después de comprar</h2>
          <p>
            Una vez que tengas USDT, puedes usar nuestro{' '}
            <Link href="/usdt-bob" className="underline underline-offset-4">conversor USDT a BOB</Link>{' '}
            para estimar a cuántos bolivianos equivale, seguir el{' '}
            <Link href="/paralelo" className="underline underline-offset-4">precio del dólar paralelo</Link>{' '}
            para saber si conviene vender ahora o esperar, y entender de dónde sale esta referencia en{' '}
            <Link href="/que-es-dolar-blue-bolivia" className="underline underline-offset-4">qué es el dólar blue en Bolivia</Link>.
            {' '}Si prefieres comprar dentro de un banco regulado en vez del mercado P2P, revisa{' '}
            <Link href="/bancos-usdt-bolivia" className="underline underline-offset-4">qué bancos venden USDT en Bolivia</Link>.
          </p>
        </div>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
