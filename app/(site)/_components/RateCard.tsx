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
  featured?: boolean;
};

const actionButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2';

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
  sharePlacement,
  featured = false
}: RateCardProps) {
  const sources = sourcesCount ?? 0;
  const status = sources > 0 ? (sources === 1 ? 'Fuente activa' : `Confirmado por ${sources} fuentes`) : 'Actualización pendiente';
  const note = sourceNote ?? status;
  const hasBuy = typeof buy === 'number';
  const hasSell = typeof sell === 'number';

  return (
    <article
      className={`relative flex h-full min-w-0 flex-col gap-5 overflow-hidden rounded-[1.25rem] border p-5 xl:p-6 ${
        featured
          ? 'border-night bg-night text-white shadow-lift lg:col-span-2'
          : 'border-black/10 bg-[#faf9f6] text-ink'
      }`}
    >
      {featured ? (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signal via-sun to-moss" />
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={logoAlt ?? title}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-black/10 bg-white"
            />
          ) : null}
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${featured ? 'text-white/45' : 'text-ink/45'}`}>
              {featured ? 'Mercado P2P' : 'Referencia pública'}
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-tight tracking-tight">{title}</h2>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${featured ? 'border-white/15 text-white/60' : 'border-black/10 text-ink/60'}`}>
          {sources} {sources === 1 ? 'fuente' : 'fuentes'}
        </span>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className={`min-w-0 border-r ${featured ? 'border-white/15' : 'border-black/10'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${featured ? 'text-white/50' : 'text-ink/50'}`}>Compra</p>
          <p className={`${featured ? 'text-4xl 2xl:text-5xl' : 'text-lg xl:text-xl 2xl:text-2xl'} mt-2 whitespace-nowrap font-semibold tracking-[-0.05em] tabular-nums`}>
            {hasBuy ? formatCurrency(buy) : <Skeleton className="h-7 w-24" />}
          </p>
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${featured ? 'text-white/50' : 'text-ink/50'}`}>Venta</p>
          <p className={`${featured ? 'text-4xl text-sun 2xl:text-5xl' : 'text-lg xl:text-xl 2xl:text-2xl'} mt-2 whitespace-nowrap font-semibold tracking-[-0.05em] tabular-nums`}>
            {hasSell ? formatCurrency(sell) : <Skeleton className="h-7 w-24" />}
          </p>
        </div>
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm ${featured ? 'border-white/10 text-white/60' : 'border-black/10 text-ink/60'}`}>
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
      <p className={`text-xs leading-relaxed ${featured ? 'text-white/55' : 'text-ink/60'}`}>{note}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Link href={href} className={`${actionButtonClass} ${featured ? 'bg-white text-night hover:bg-sun' : 'bg-ink text-white hover:bg-moss'}`}>
          {actionLabel}
        </Link>
        {shareHref ? (
          <ShareCtaLink
            href={shareHref}
            placement={sharePlacement ?? 'home_p2p_card'}
            className={`${actionButtonClass} ${featured ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15' : 'border border-ink/20 bg-white text-ink hover:bg-sand'}`}
          >
            Compartir cotización
          </ShareCtaLink>
        ) : null}
      </div>
    </article>
  );
}
