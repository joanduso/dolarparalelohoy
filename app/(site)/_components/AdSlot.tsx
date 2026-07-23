export function AdSlot({ label }: { label: string }) {
  return (
    <a
      href="https://marketops360.com"
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Publicidad de MarketOps360 · ${label}`}
      className="group relative flex h-40 items-center justify-between gap-6 overflow-hidden rounded-2xl border border-black/5 px-6 sm:px-10"
      style={{ backgroundColor: '#04090f' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(600px circle at 15% 20%, rgba(0, 212, 255, 0.25), transparent 55%)'
        }}
      />
      <div className="relative flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#00D4FF' }}>
          MarketOps360 · Publicidad
        </span>
        <p className="max-w-md text-sm sm:text-base font-medium text-white">
          ¿Sabes qué tiendas de tu cartera no visitó tu equipo esta semana?
        </p>
      </div>
      <span
        className="relative shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-black transition-transform group-hover:scale-105"
        style={{ backgroundColor: '#00D4FF' }}
      >
        Ver demo
      </span>
    </a>
  );
}
