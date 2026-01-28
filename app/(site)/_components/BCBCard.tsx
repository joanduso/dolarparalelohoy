import Link from 'next/link';
import { Skeleton } from '@/app/(site)/_components/Skeleton';

type BcbCardProps = {
  dateText?: string | null;
  compraText?: string | null;
  ventaText?: string | null;
  error?: string | null;
};

export function BCBCard({ dateText, compraText, ventaText, error }: BcbCardProps) {
  const hasData = Boolean(compraText && ventaText);

  return (
    <div className="card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Dólar referencial BCB</h2>
        <Link href="https://www.bcb.gob.bo" className="text-xs text-ink/60 underline">
          bcb.gob.bo
        </Link>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-ink/50">Compra</p>
          <p className="text-2xl font-semibold">
            {compraText ? compraText : <Skeleton className="h-7 w-20" />}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink/50">Venta</p>
          <p className="text-2xl font-semibold">
            {ventaText ? ventaText : <Skeleton className="h-7 w-20" />}
          </p>
        </div>
      </div>
      <div className="text-sm text-ink/60">
        {dateText ? (
          <span>Fecha: {dateText}</span>
        ) : hasData ? null : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600">No pudimos actualizar las fuentes ({error}).</p>
      ) : (
        <p className="text-xs text-ink/60">Referencia oficial publicada por el BCB.</p>
      )}
    </div>
  );
}
