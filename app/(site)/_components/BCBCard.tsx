import Link from 'next/link';
import Image from 'next/image';
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
        <div className="flex items-center gap-2">
          <Image
            src="/logos/usd.svg"
            alt="USD"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full border border-black/10 bg-white"
          />
          <h2 className="font-serif text-xl">Dólar referencial BCB</h2>
        </div>
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
