import { formatCurrency, formatNumber } from '@/lib/format';

type BrechaCardProps = {
  gapAbs?: number | null;
  gapPct?: number | null;
  date?: Date | null;
};

export function BrechaCard({ gapAbs, gapPct }: BrechaCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Brecha cambiaria</h2>
        <span className="text-xs text-ink/60">Paralelo vs Oficial</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-ink/50">Diferencia</p>
          <p className="text-2xl font-semibold">{formatCurrency(gapAbs ?? undefined)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink/50">Brecha %</p>
          <p className="text-2xl font-semibold">{formatNumber(gapPct ?? undefined, 2)}%</p>
        </div>
      </div>
      <p className="text-sm text-ink/60">
        La brecha se calcula usando la venta promedio diaria. Valores altos indican mayor
        diferencia entre mercados.
      </p>
    </div>
  );
}
