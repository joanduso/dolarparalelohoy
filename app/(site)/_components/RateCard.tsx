import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { Skeleton } from '@/app/(site)/_components/Skeleton';
import { ShareCtaLink } from '@/app/(site)/_components/ShareCtaLink';

type RateCardProps = {
  title: string;
  buy?: number | null;
  sell?: number | null;
  delta?: number | null;
  updatedAt?: Date | null;
  sourcesCount?: number | null;
  href: string;
  sourceNote?: string;
  logoSrc?: string;
  logoAlt?: string;
  actionLabel?: string;
  shareHref?: string;
  sharePlacement?: string;
};

const actionButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2';

export function RateCard({
  title,
  buy,
  sell,
  delta,
  updatedAt,
  sourcesCount,
  href,
  sourceNote,
  logoSrc,
  logoAlt,
  actionLabel = 'Ver detalle',
  shareHref,
  sharePlacement
}: RateCardProps) {
  const sources = sourcesCount ?? 0;
  const status = sources >= 2 ? `Confirmado por ${sources} fuentes` : 'Estimación pendiente';
  const note = sourceNote ?? status;
  const hasBuy = typeof buy === 'number';
  const hasSell = typeof sell === 'number';

  return (
    <div className="card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={logoAlt ?? title}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-black/10 bg-white"
            />
          ) : null}
          <h2 className="font-serif text-xl">{title}</h2>
        </div>
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
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Link href={href} className={`${actionButtonClass} bg-ink text-white hover:bg-ink/90`}>
          {actionLabel}
        </Link>
        {shareHref ? (
          <ShareCtaLink
            href={shareHref}
            placement={sharePlacement ?? 'home_p2p_card'}
            className={`${actionButtonClass} border border-ink/20 bg-white text-ink hover:bg-sand`}
          >
            Compartir cotización
          </ShareCtaLink>
        ) : null}
      </div>
    </div>
  );
}
