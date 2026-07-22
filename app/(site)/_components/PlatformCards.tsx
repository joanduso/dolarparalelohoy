const platforms = [
  {
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
    name: 'Binance',
    domain: 'binance.com',
    href: 'https://p2p.binance.com/',
    mark: 'B',
    color: 'bg-yellow-400 text-black',
    type: 'Exchange · P2P BOB',
    detail: 'Fuente principal de nuestra cotización por liquidez.',
    featured: false
  }
];

export function PlatformCards() {
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
        {platforms.map((platform) => (
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
              <p className="text-xs uppercase tracking-wide text-ink/50">Modalidad</p>
              <p className="mt-1 font-semibold">{platform.type}</p>
              <p className="mt-2 text-sm text-ink/65">{platform.detail}</p>
            </div>
            <a
              href={platform.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ink/15 px-4 py-2 text-center text-sm font-medium hover:bg-ink hover:text-white"
            >
              Consultar cotización
            </a>
          </article>
        ))}
      </div>
      <p className="text-xs text-ink/50">
        No es una clasificación financiera ni una garantía. Verifica tasa, comisión, límites,
        identidad del receptor y condiciones de cada plataforma antes de operar.
      </p>
    </section>
  );
}
