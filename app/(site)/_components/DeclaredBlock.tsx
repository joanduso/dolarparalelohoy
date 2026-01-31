import Link from 'next/link';
import { getDeclaredAggregate } from '@/lib/queries';
import { formatCurrency, formatDateTime } from '@/lib/format';

export async function DeclaredBlock() {
  const declared = await getDeclaredAggregate('PARALELO');
  const show = declared.sampleSize >= 5 && declared.sell !== null;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl">Dólar declarado (24h)</h3>
        <span className="text-xs text-ink/60">Indicador secundario</span>
      </div>
      <p className="text-sm text-ink/70">
        Reportes voluntarios de usuarios sobre operaciones reales. Se valida contra el precio base
        y se publica solo con suficiente evidencia.
      </p>
      {show ? (
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs uppercase text-ink/50">Venta declarada</p>
            <p className="text-2xl font-semibold">{formatCurrency(declared.sell ?? undefined)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink/50">Compra declarada</p>
            <p className="text-2xl font-semibold">{formatCurrency(declared.buy ?? undefined)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink/50">Reportes</p>
            <p className="text-2xl font-semibold">{declared.sampleSize}</p>
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
