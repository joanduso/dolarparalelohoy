import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/format';

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
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg">{title}</h3>
        <Link className="text-sm underline underline-offset-4" href={href}>
          Ver histórico
        </Link>
      </div>
      <div className="grid gap-2 text-sm">
        {rows.length === 0 && <p className="text-ink/60">Sin datos recientes.</p>}
        {rows.map((row) => (
          <div
            key={row.date.toISOString()}
            className="flex items-center justify-between border-b border-black/5 pb-2"
          >
            <span>{formatDate(row.date)}</span>
            <span className="font-medium">{formatCurrency(row.sell_avg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
