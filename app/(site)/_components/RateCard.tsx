import Link from 'next/link';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';

type RateCardProps = {
  title: string;
  buy?: number;
  sell?: number;
  delta?: number | null;
  updatedAt?: Date | null;
  sourcesCount?: number;
  href: string;
};

export function RateCard({
  title,
  buy,
  sell,
  delta,
  updatedAt,
  sourcesCount,
  href
}: RateCardProps) {
  const sources = sourcesCount ?? 0;
  const status = sources >= 2 ? `Confirmado por ${sources} fuentes` : 'Estimación pendiente';

  return (
    <Link href={href} className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">{title}</h2>
        <span className="text-xs text-ink/60">{sources} fuentes</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-ink/50">Compra</p>
          <p className="text-2xl font-semibold">{formatCurrency(buy)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink/50">Venta</p>
          <p className="text-2xl font-semibold">{formatCurrency(sell)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-ink/60">
        <span>
          Variación hoy: {delta !== undefined && delta !== null ? formatNumber(delta, 2) : '—'}%
        </span>
        <span>{updatedAt ? formatDateTime(updatedAt) : 'Sin datos'}</span>
      </div>
      <p className="text-xs text-ink/60">{status}</p>
    </Link>
  );
}
