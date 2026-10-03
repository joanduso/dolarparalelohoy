import Link from 'next/link';
import { formatCalendarDate, formatCurrency } from '@/lib/format';

type MiniRow = {
  date: Date;
  buy_avg: number;
  sell_avg: number;
};

export function MiniTable({
  title,
  rows,
  href
}: {
  title: string;
  rows: MiniRow[];
  href: string;
}) {
  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-black/10 pb-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <Link className="text-link shrink-0 text-sm" href={href}>
          Ver histórico
        </Link>
      </div>
      <div className="grid gap-2 text-sm">
        {rows.length === 0 && <p className="text-ink/60">Sin datos recientes.</p>}
        {rows.map((row) => (
          <div
            key={row.date.toISOString()}
            className="flex items-center justify-between border-b border-black/5 py-1.5 last:border-0"
          >
            <span>{formatCalendarDate(row.date)}</span>
            <span className="font-semibold tabular-nums">{formatCurrency(row.sell_avg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
