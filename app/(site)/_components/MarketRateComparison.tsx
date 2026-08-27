import { formatCurrency, formatNumber } from '@/lib/format';

export function MarketRateComparison({
  marketLabel,
  marketSell,
  officialSell
}: {
  marketLabel: string;
  marketSell: number | null;
  officialSell: number | null;
}) {
  if (marketSell === null || officialSell === null || officialSell <= 0) return null;
  const gapAbs = marketSell - officialSell;
  const gapPct = (gapAbs / officialSell) * 100;

  return (
    <section className="card grid gap-4 p-6" aria-labelledby="comparacion-mercados">
      <div>
        <p className="kicker">Comparación propia</p>
        <h2 id="comparacion-mercados" className="font-serif text-2xl">{marketLabel} frente al dólar oficial</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-sand/40 p-4"><p className="text-xs uppercase tracking-wide text-ink/50">{marketLabel}</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(marketSell)}</p></div>
        <div className="rounded-xl bg-sand/40 p-4"><p className="text-xs uppercase tracking-wide text-ink/50">Oficial venta</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(officialSell)}</p></div>
        <div className="rounded-xl bg-sun/35 p-4"><p className="text-xs uppercase tracking-wide text-ink/50">Diferencia</p><p className="mt-1 text-2xl font-semibold">{gapAbs >= 0 ? '+' : ''}{formatCurrency(gapAbs)} · {gapPct >= 0 ? '+' : ''}{formatNumber(gapPct, 1)}%</p></div>
      </div>
      <p className="text-sm text-ink/65">La comparación usa las tasas de venta disponibles en el mismo momento. Es una referencia de mercado, no una oferta para operar.</p>
    </section>
  );
}
