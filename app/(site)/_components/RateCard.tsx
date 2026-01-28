import Link from 'next/link';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { Skeleton } from '@/app/(site)/_components/Skeleton';

type RateCardProps = {
  title: string;
  buy?: number | null;
  sell?: number | null;
  delta?: number | null;
  updatedAt?: Date | null;
  sourcesCount?: number | null;
  href: string;
  sourceNote?: string;
};

export function RateCard({
  title,
  buy,
  sell,
  delta,
  updatedAt,
  sourcesCount,
  href,
  sourceNote
}: RateCardProps) {
  const sources = sourcesCount ?? 0;
  const status = sources >= 2 ? `Confirmado por ${sources} fuentes` : 'Estimación pendiente';
  const note = sourceNote ?? status;
  const hasBuy = typeof buy === 'number';
  const hasSell = typeof sell === 'number';

  return (
    <Link href={href} className="card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">{title}</h2>
        <span className="text-xs text-ink/60">{sources} fuentes</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-ink/50">Compra</p>
          <p className="text-2xl font-semibold">
            {hasBuy ? formatCurrency(buy) : <Skeleton className="h-7 w-24" />}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink/50">Venta</p>
          <p className="text-2xl font-semibold">
            {hasSell ? formatCurrency(sell) : <Skeleton className="h-7 w-24" />}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-ink/60">
        <span>
          Variación hoy:{' '}
          {delta !== undefined && delta !== null ? (
            `${formatNumber(delta, 2)}%`
          ) : (
            <Skeleton className="h-4 w-16" />
          )}
        </span>
        <span>
          {updatedAt ? formatDateTime(updatedAt) : <Skeleton className="h-4 w-24" />}
        </span>
      </div>
      <p className="text-xs text-ink/60">{note}</p>
    </Link>
  );
}
