import Link from 'next/link';
import { formatCalendarDate, formatNumber } from '@/lib/format';
import { Skeleton } from '@/app/(site)/_components/Skeleton';

type TcoCardProps = {
  tco?: number | null;
  weightedAverage?: number | null;
  cutoffDate?: string | null;
};

export function TcoCard({ tco, weightedAverage, cutoffDate }: TcoCardProps) {
  const hasTco = typeof tco === 'number';

  return (
    <article className="flex h-full min-w-0 flex-col gap-4 rounded-[1.25rem] border border-black/10 bg-[#faf9f6] p-5 xl:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Cálculo oficial BCB
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">TCO bancario</h2>
        </div>
        <span className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-xs text-ink/60">
          Oficial
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
        <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">
          Nivel oficial del corte
        </p>
        <p className="mt-2 whitespace-nowrap text-3xl font-semibold tracking-[-0.05em] tabular-nums">
          {hasTco ? `Bs ${formatNumber(tco, 2)}` : <Skeleton className="h-9 w-28" />}
        </p>
        {cutoffDate ? (
          <p className="mt-1 text-xs text-ink/50">Corte {formatCalendarDate(cutoffDate)}</p>
        ) : null}
        </div>

        <div className="rounded-2xl bg-ink/[0.045] p-3 text-xs leading-relaxed text-ink/60">
          <span className="block font-semibold text-ink">Promedio por monto</span>
          <span className="mt-1 block text-base font-semibold tabular-nums text-ink">
            {typeof weightedAverage === 'number'
              ? `Bs ${formatNumber(weightedAverage, 2)}`
              : 'Sin dato comparable'}
          </span>
          Resume las mismas compras de otra manera; no es otra cotización.
        </div>
      </div>

      <Link href="#radiografia-tco" className="text-link mt-auto w-fit text-sm">
        Ver cómo se calcula
      </Link>
    </article>
  );
}
