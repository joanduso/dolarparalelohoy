import type { Metadata } from 'next';
import Link from 'next/link';
import { ShareRateActions } from '@/app/(site)/_components/ShareRateActions';
import { formatDateTime, formatNumber } from '@/lib/format';
import { getShareRate } from '@/lib/shareRate';
import { siteConfig } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Compartir cotización del dólar en Bolivia',
  description:
    'Tarjeta diaria para compartir la compra y venta del dólar paralelo en Bolivia.',
  alternates: { canonical: '/compartir' },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      'max-image-preview': 'large'
    }
  },
  openGraph: {
    title: 'Dólar paralelo en Bolivia hoy',
    description: 'Compra y venta actualizadas para compartir.',
    url: '/compartir',
    type: 'website',
    images: [
      {
        url: '/compartir/card',
        width: 1200,
        height: 630,
        alt: 'Cotización del dólar paralelo en Bolivia hoy'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dólar paralelo en Bolivia hoy',
    description: 'Compra y venta actualizadas para compartir.',
    images: ['/compartir/card']
  }
};

export default async function SharePage() {
  const rate = await getShareRate();
  const updatedAt = rate ? formatDateTime(rate.updatedAt) : null;

  return (
    <main className="pb-16">
      <section className="section-shell py-8 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-6">
          <div className="grid gap-3">
            <p className="kicker">Tarjeta diaria</p>
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              Comparte el dólar paralelo de hoy
            </h1>
            <p className="max-w-2xl text-ink/70">
              Envía la cotización actualizada por WhatsApp, Facebook o cualquier aplicación.
              Cada enlace nos permite medir qué canal ayuda a más personas.
            </p>
          </div>

          <article className="overflow-hidden rounded-[2rem] border border-black/5 bg-ink text-white shadow-soft">
            <div className="grid gap-8 bg-[radial-gradient(circle_at_top_right,rgba(246,196,83,0.35),transparent_42%)] p-6 sm:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">
                    Dólar paralelo Bolivia
                  </p>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Cotización de hoy</h2>
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
                  Actualización automática
                </span>
              </div>

              {rate ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-wider text-white/65">Compra</p>
                      <p className="mt-2 text-4xl font-bold sm:text-5xl">
                        Bs {formatNumber(rate.buy)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sun/30 bg-sun p-5 text-ink">
                      <p className="text-sm uppercase tracking-wider text-ink/65">Venta</p>
                      <p className="mt-2 text-4xl font-bold sm:text-5xl">
                        Bs {formatNumber(rate.sell)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 text-sm text-white/70">
                    <span>
                      {rate.sourceLabel}
                      {rate.sourceCount > 0
                        ? ` · ${rate.sourceCount} ${rate.sourceCount === 1 ? 'fuente' : 'fuentes'}`
                        : ''}
                    </span>
                    <span>{updatedAt}</span>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6">
                  <p className="text-xl font-semibold">Cotización temporalmente no disponible</p>
                  <p className="mt-2 text-white/70">
                    Estamos reintentando la actualización. Puedes volver a consultar en unos
                    minutos.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-sm">
                <span className="font-semibold">{siteConfig.shortName}</span>
                <span className="text-white/65">dolarparalelohoy.com</span>
              </div>
            </div>
          </article>

          <div className="card grid gap-4 p-5 sm:p-6">
            <h2 className="font-serif text-2xl">¿Dónde quieres compartirla?</h2>
            <ShareRateActions
              baseUrl={siteConfig.url}
              buy={rate?.buy ?? null}
              sell={rate?.sell ?? null}
            />
            <p className="text-xs text-ink/60">
              La cotización es informativa. Verifica el precio final y las condiciones antes de
              realizar una operación.
            </p>
          </div>

          <Link href="/" className="justify-self-start underline underline-offset-4">
            Volver a todas las cotizaciones
          </Link>
        </div>
      </section>
    </main>
  );
}
