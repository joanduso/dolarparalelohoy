import Link from 'next/link';
import { fetchPlatformRates, type PlatformKey } from '@/lib/platformRates';

const platforms = [
  {
    key: 'eldorado' as PlatformKey,
    name: 'El Dorado',
    domain: 'eldorado.io',
    href: 'https://eldorado.io/',
    mark: 'ED',
    color: 'bg-yellow-300 text-black',
    type: 'P2P · USDT/BOB',
    detail: 'Transferencia bancaria y pagos QR en Bolivia.',
    featured: true
  },
  {
    key: 'takenos' as PlatformKey,
    name: 'Takenos',
    domain: 'takenos.com',
    href: 'https://takenos.com/',
    mark: 'T',
    color: 'bg-violet-600 text-white',
    type: 'Billetera · USD digital',
    detail: 'Recibe BOB y paga QR con conversión automática.',
    featured: true
  },
  {
    key: 'airtm' as PlatformKey,
    name: 'Airtm',
    domain: 'airtm.com',
    href: 'https://www.airtm.com/',
    mark: 'A',
    color: 'bg-cyan-500 text-white',
    type: 'P2P · USDC/BOB',
    detail: 'P2P, retiro bancario y pagos QR en Bolivia.',
    featured: true
  },
  {
    key: 'bybit' as PlatformKey,
    name: 'Bybit',
    domain: 'bybit.com',
    href: 'https://www.bybit.com/fiat/trade/otc/',
    mark: 'BY',
    color: 'bg-amber-400 text-black',
    type: 'Exchange · P2P BOB',
    detail: 'Mercado de anuncios para comprar y vender USDT.',
    featured: false
  },
  {
    key: 'meru' as PlatformKey,
    name: 'Meru',
    domain: 'meru.com',
    href: 'https://meru.com/',
    mark: 'M',
    color: 'bg-blue-600 text-white',
    type: 'Billetera · QR Bolivia',
    detail: 'Cuenta digital con depósitos mediante QR boliviano.',
    featured: false
  },
  {
    key: 'binance' as PlatformKey,
    name: 'Binance',
    domain: 'binance.com',
    href: 'https://web3.binance.com/referral?ref=WB11QEW6',
    mark: 'B',
    color: 'bg-yellow-400 text-black',
    type: 'Exchange · P2P BOB',
    detail: 'Fuente principal de nuestra cotización por liquidez.',
    featured: false,
    affiliate: true
  }
];

const priceFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const timeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/La_Paz'
});

export async function PlatformCards() {
  const rates = await fetchPlatformRates();

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Opciones para Bolivia</p>
          <h2 className="font-serif text-2xl">Plataformas recomendadas</h2>
        </div>
        <p className="max-w-xl text-sm text-ink/60">
          Compara el precio final dentro de cada aplicación: algunas son mercados P2P y otras
          billeteras con una tasa propia que puede incluir margen o comisión.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => {
          const rate = rates[platform.key];
          return (
            <article
              key={platform.name}
              className={`card relative overflow-hidden p-5 grid gap-4 ${
                platform.featured ? 'ring-1 ring-sun/70' : ''
              }`}
            >
            {platform.featured ? (
              <span className="absolute right-4 top-4 rounded-full bg-sun px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                Relevante
              </span>
            ) : null}
            <div className="flex items-center gap-3 pr-20">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl font-bold ${platform.color}`}>
                {platform.mark}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{platform.name}</h3>
                <p className="text-sm text-ink/50">{platform.domain}</p>
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-sand/30 p-4">
              {rate ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink/50">Compra</p>
                      <p className="mt-1 text-xl font-semibold">Bs {priceFormatter.format(rate.buy)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink/50">Venta</p>
                      <p className="mt-1 text-xl font-semibold">Bs {priceFormatter.format(rate.sell)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-ink/50">
                    Actualizado {timeFormatter.format(new Date(rate.updatedAt))} · {platform.type}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-ink/50">Cotización</p>
                  <p className="mt-1 font-semibold">Disponible en la aplicación</p>
                  <p className="mt-2 text-sm text-ink/65">{platform.detail}</p>
                </>
              )}
            </div>
            <a
              href={platform.href}
              target="_blank"
              rel={platform.affiliate ? 'sponsored noreferrer' : 'noreferrer'}
              className="rounded-full border border-ink/15 px-4 py-2 text-center text-sm font-medium hover:bg-ink hover:text-white"
            >
              Consultar cotización
            </a>
            </article>
          );
        })}
      </div>
      <Link href="/exchanges" className="w-fit text-sm underline underline-offset-4">
        Ver comparador completo de exchanges P2P
      </Link>
      <p className="text-xs text-ink/50">
        No es una clasificación financiera ni una garantía. Verifica tasa, comisión, límites,
        identidad del receptor y condiciones de cada plataforma antes de operar. Datos públicos de{' '}
        <a
          href="https://www.dolarbluebolivia.click/devs/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Dólar Blue Bolivia
        </a>{' '}
        y Binance P2P; Meru muestra su tasa dinámica únicamente dentro de su aplicación.
      </p>
    </section>
  );
}
