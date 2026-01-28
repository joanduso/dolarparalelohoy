import { formatCurrency, formatNumber } from '@/lib/format';
import { Skeleton } from '@/app/(site)/_components/Skeleton';

type BrechaCardProps = {
  gapAbs?: number | null;
  gapPct?: number | null;
  date?: Date | null;
};

export function BrechaCard({ gapAbs, gapPct }: BrechaCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Brecha cambiaria</h2>
        <span className="text-xs text-ink/60">Paralelo vs Oficial</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-ink/50">Diferencia</p>
          <p className="text-2xl font-semibold">{typeof gapAbs === 'number' ? formatCurrency(gapAbs) : <Skeleton className="h-7 w-24" />}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink/50">Brecha %</p>
          <p className="text-2xl font-semibold">{typeof gapPct === 'number' ? `${formatNumber(gapPct, 2)}%` : <Skeleton className="h-7 w-16" />}</p>
        </div>
      </div>
      <p className="text-sm text-ink/60">
        La brecha se calcula usando la venta promedio diaria. Valores altos indican mayor
        diferencia entre mercados.
      </p>
    </div>
  );
}
