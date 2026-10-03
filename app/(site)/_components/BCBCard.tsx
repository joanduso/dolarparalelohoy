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
  const parsedDate = dateText && dateText.includes('T') ? new Date(dateText) : null;
  const displayDate = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat('es-BO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/La_Paz'
      }).format(parsedDate)
    : dateText;

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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Dato oficial</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Referencial BCB</h2>
          </div>
        </div>
        <Link href="https://www.bcb.gob.bo" className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-xs text-ink/60">
          Fuente
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="border-r border-black/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Compra</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] tabular-nums">
            {compraText ? compraText : <Skeleton className="h-7 w-20" />}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Venta</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] tabular-nums">
            {ventaText ? ventaText : <Skeleton className="h-7 w-20" />}
          </p>
        </div>
      </div>
      <div className="mt-auto border-t border-black/10 pt-4 text-xs text-ink/60">
        {displayDate ? (
          <span>Fecha: {displayDate}</span>
        ) : hasData ? null : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600">No pudimos actualizar las fuentes ({error}).</p>
      ) : (
        <p className="text-xs text-ink/60">Referencia oficial publicada por el BCB.</p>
      )}
    </article>
  );
}
