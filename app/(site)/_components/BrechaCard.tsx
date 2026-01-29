import Image from 'next/image';
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
        <div className="flex items-center gap-2">
          <Image
            src="/logos/usd.svg"
            alt="USD"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full border border-black/10 bg-white"
          />
          <h2 className="font-serif text-xl">Brecha cambiaria</h2>
        </div>
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
