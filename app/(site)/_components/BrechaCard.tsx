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
    <article className="flex h-full flex-col gap-5 rounded-[1.25rem] border border-black/10 bg-[#faf9f6] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/logos/usd.svg"
            alt="USD"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full border border-black/10 bg-white"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Señal de mercado</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Brecha cambiaria</h2>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-xs text-ink/60">P2P / BCB</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border-r border-black/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Diferencia</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] tabular-nums">{typeof gapAbs === 'number' ? formatCurrency(gapAbs) : <Skeleton className="h-7 w-24" />}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Brecha %</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-signal tabular-nums">{typeof gapPct === 'number' ? `${formatNumber(gapPct, 2)}%` : <Skeleton className="h-7 w-16" />}</p>
        </div>
      </div>
      <p className="mt-auto border-t border-black/10 pt-4 text-xs leading-relaxed text-ink/60">
        La brecha se calcula usando la venta promedio diaria. Valores altos indican mayor
        diferencia entre mercados.
      </p>
    </article>
  );
}
