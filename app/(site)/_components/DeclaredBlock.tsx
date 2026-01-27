import Link from 'next/link';
import { getDeclaredLatest } from '@/lib/queries';
import { formatCurrency, formatDateTime } from '@/lib/format';

export async function DeclaredBlock() {
  const declared = await getDeclaredLatest('SELL');
  const show = declared.count >= 5 && declared.median !== null;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl">Precio declarado (24h)</h3>
        <span className="text-xs text-ink/60">Indicador secundario</span>
      </div>
      <p className="text-sm text-ink/70">
        Reportes voluntarios de usuarios sobre operaciones reales. Se valida contra el precio base
        y se publica solo con suficiente evidencia.
      </p>
      {show ? (
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs uppercase text-ink/50">Mediana venta</p>
            <p className="text-2xl font-semibold">{formatCurrency(declared.median ?? undefined)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink/50">Reportes</p>
            <p className="text-2xl font-semibold">{declared.count}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink/50">Actualizado</p>
            <p className="text-sm text-ink/70">
              {declared.updatedAt ? formatDateTime(declared.updatedAt) : '—'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink/60">
          Aún no hay suficientes reportes válidos (mínimo 5 en 24h) para mostrar el precio
          declarado.
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/faq" className="underline underline-offset-4">
          ¿Qué es el precio declarado?
        </Link>
        <span className="text-ink/60">Uso informativo, no vinculante.</span>
      </div>
    </div>
  );
}
