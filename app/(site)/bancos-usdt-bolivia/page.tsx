import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/app/(site)/_components/Breadcrumbs';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { SeoFaq, type SeoFaqItem } from '@/app/(site)/_components/SeoFaq';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.bancosUsdt,
    description: pageDescriptions.bancosUsdt,
    alternates: { canonical: '/bancos-usdt-bolivia' },
    openGraph: {
      title: pageTitles.bancosUsdt,
      description: pageDescriptions.bancosUsdt,
      locale: siteConfig.locale
    }
  };
}

type BankRow = {
  bank: string;
  service: string;
  asset: string;
  limits: string;
  fee: string;
  requirement: string;
  href: string;
};

const banks: BankRow[] = [
  {
    bank: 'Banco de Crédito (BCP)',
    service: 'Transferencias internacionales vía Banca Móvil',
    asset: 'USDT',
    limits: 'Hasta el equivalente en USD de Bs 69.600 por transacción',
    fee: 'Sin comisión adicional (tipo de cambio del día del banco)',
    requirement: 'Cuenta en bolivianos y Banca Móvil BCP activa',
    href: 'https://www.bcp.com.bo/USDtCuenta'
  },
  {
    bank: 'Banco BISA',
    service: 'Criptobisa: custodia, compra y venta',
    asset: 'USDT',
    limits: '200 a 10.000 USDT por día',
    fee: 'Compra sin costo. Venta: Bs 35 hasta 5.000 USDT, Bs 100 por encima',
    requirement: 'Cuenta de custodia Criptobisa vía e-BISA o e-BISA Mobile+',
    href: 'https://www.bisa.com/criptobisa-usdt'
  },
  {
    bank: 'Banco Ganadero',
    service: 'GanaCripto: compra, venta y custodia',
    asset: 'USDC (no ofrece USDT)',
    limits: '100 a 10.000 USDC/día en compra-venta; 200 a 10.000 USDC en transferencias',
    fee: 'No publicado; costos fijos solo en transferencias internacionales',
    requirement: 'Cliente con cuenta GanaDoble/GanaMás y GanaMóvil, menos de 6 cuentas activas',
    href: 'https://www.bg.com.bo/ganacripto/'
  },
  {
    bank: 'Banco Unión / Yasta',
    service: 'Compra de USDT vía Yasta (con EFY Finance)',
    asset: 'USDT',
    limits: 'Operaciones individuales hasta Bs 8.250 (2,5 salarios mínimos)',
    fee: 'No publicado en fuentes oficiales',
    requirement: 'Cuenta Yasta activa',
    href: 'https://www.yasta.com.bo'
  },
  {
    bank: 'Banco FIE',
    service: 'Cuenta Cripto: compra y venta de USDT',
    asset: 'USDT',
    limits: 'Operaciones individuales hasta Bs 8.250 (2,5 salarios mínimos)',
    fee: 'No publicado en fuentes oficiales',
    requirement: 'Cuenta de ahorro Banco FIE y verificación de identidad',
    href: 'https://www.bancofie.com.bo'
  }
];

export default function BancosUsdtBoliviaPage() {
  const faqItems: SeoFaqItem[] = [
    {
      question: '¿Qué banco boliviano vende USDT más barato?',
      answer:
        'No lo publicamos como un ranking porque ningún banco muestra su tipo de cambio en una página pública: la tasa solo aparece dentro de la app, después de iniciar sesión, y cambia cada día. Compara la tasa vigente directamente en la app de cada banco antes de operar, o usa el mercado P2P si buscas el precio de referencia más líquido.'
    },
    {
      question: '¿Es más seguro comprar USDT en un banco que en un exchange P2P?',
      answer:
        'Un banco regulado por ASFI elimina el riesgo de contraparte de un anuncio P2P individual (el vendedor no libera, disputa, etc.), pero suele tener límites diarios más bajos y, en algunos casos, comisiones de venta. El mercado P2P típicamente ofrece más liquidez y mejor precio, a cambio de más pasos de verificación por tu cuenta.'
    },
    {
      question: '¿Todos los bancos venden el mismo activo (USDT)?',
      answer:
        'No. Banco Ganadero ofrece USDC, no USDT, a través de GanaCripto. El resto de los bancos de esta lista (BCP, BISA, Unión/Yasta, FIE) trabajan específicamente con USDT.'
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitles.bancosUsdt,
    description: pageDescriptions.bancosUsdt,
    url: `${siteConfig.url}/bancos-usdt-bolivia`,
    inLanguage: siteConfig.language,
    author: { '@id': `${siteConfig.url}/#organization` },
    publisher: { '@id': `${siteConfig.url}/#organization` }
  };

  return (
    <main className="section-shell pb-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: 'Bancos que venden USDT en Bolivia', href: '/bancos-usdt-bolivia' }]} />
      <section className="grid gap-8 max-w-4xl">
        <div className="grid gap-3">
          <p className="kicker">Servicios bancarios</p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Qué bancos venden USDT en Bolivia (2026)
          </h1>
          <p className="text-ink/70">
            Desde que el Banco Central de Bolivia levantó la restricción sobre activos virtuales en
            junio de 2024, varios bancos regulados por ASFI lanzaron servicios propios de compra,
            venta y custodia de stablecoins. Esta es la lista de bancos con servicio activo, qué
            activo manejan, límites y requisitos — sin inventar comisiones ni tasas que no publican.
          </p>
        </div>

        <div className="card p-6 grid gap-4 overflow-x-auto">
          <h2 className="font-serif text-2xl">Comparativa de servicios bancarios con USDT/USDC</h2>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="text-ink/50 uppercase text-xs tracking-wide">
                <th className="py-2 pr-4">Banco</th>
                <th className="py-2 pr-4">Servicio</th>
                <th className="py-2 pr-4">Activo</th>
                <th className="py-2 pr-4">Límites</th>
                <th className="py-2 pr-4">Comisión</th>
                <th className="py-2 pr-4">Requisito</th>
              </tr>
            </thead>
            <tbody className="text-ink/80">
              {banks.map((row) => (
                <tr key={row.bank} className="border-t border-black/5 align-top">
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">
                    <a href={row.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      {row.bank}
                    </a>
                  </td>
                  <td className="py-3 pr-4">{row.service}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{row.asset}</td>
                  <td className="py-3 pr-4">{row.limits}</td>
                  <td className="py-3 pr-4">{row.fee}</td>
                  <td className="py-3 pr-4">{row.requirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-ink/50">
            Banco Económico no figura en esta lista: no encontramos ningún servicio público de
            compra/venta de USDT o USDC ofrecido por esa entidad al momento de publicar esta guía.
          </p>
        </div>

        <div className="card p-6 grid gap-3 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">¿Por qué no mostramos el tipo de cambio de cada banco?</h2>
          <p>
            Ninguno de estos bancos publica su tasa de compra/venta de USDT en una página pública en
            tiempo real: la tasa solo aparece dentro de la app, después de iniciar sesión, y se
            actualiza varias veces al día. Mostrar aquí un número fijo lo volvería incorrecto en
            horas, algo que va en contra de la metodología transparente de este sitio (ver{' '}
            <Link href="/fuentes" className="underline underline-offset-4">nuestras fuentes</Link>).
          </p>
          <p>
            Para una referencia de precio en vivo y comparable entre plataformas, usa nuestro{' '}
            <Link href="/usdt-bob" className="underline underline-offset-4">conversor USDT a BOB</Link>{' '}
            (mercado P2P) o revisa la tasa vigente directamente en la app del banco antes de operar.
          </p>
        </div>

        <div className="card p-6 grid gap-3 text-ink/70">
          <h2 className="font-serif text-2xl text-ink">Banco vs. P2P: qué conviene según el caso</h2>
          <p>
            Un servicio bancario regulado tiene la ventaja de eliminar el riesgo de contraparte de un
            anuncio P2P (el vendedor que no libera, una disputa que se demora), pero suele tener
            límites diarios más bajos y, en algunos casos, comisión de venta. El mercado P2P —
            cubierto en nuestro{' '}
            <Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">
              guía para comprar USDT
            </Link>{' '}
            y en el{' '}
            <Link href="/exchanges" className="underline underline-offset-4">
              comparador de exchanges
            </Link>
            — típicamente ofrece más liquidez y mejor precio a cambio de más pasos de verificación
            por tu cuenta.
          </p>
        </div>

        <SeoFaq items={faqItems} />
      </section>
    </main>
  );
}
