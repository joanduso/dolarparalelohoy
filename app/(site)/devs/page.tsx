import Link from 'next/link';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { pageDescriptions, pageTitles, siteConfig } from '@/lib/seo';
import type { Metadata } from 'next';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitles.devs,
    description: pageDescriptions.devs,
    alternates: { canonical: '/devs' },
    openGraph: {
      title: pageTitles.devs,
      description: pageDescriptions.devs,
      locale: siteConfig.locale
    }
  };
}

export default function DevsPage() {
  const baseUrl = `${siteConfig.url}/api/v1`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitles.devs,
    description: pageDescriptions.devs,
    url: `${siteConfig.url}/devs`,
    inLanguage: siteConfig.language
  };

  return (
    <main className="pb-16">
      <JsonLd data={jsonLd} />

      <section className="section-shell py-12 grid gap-8">
        <div className="grid gap-4">
          <p className="kicker">Para desarrolladores</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight">
            API pública de Dólar Paralelo Hoy
          </h1>
          <p className="text-lg text-ink/70 max-w-3xl">
            Endpoints de solo lectura para integrar cotizaciones actuales, histórico y
            estadísticas del dólar paralelo y oficial en Bolivia. Respuestas en JSON, sin
            autenticación obligatoria.
          </p>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Inicio rápido</h2>
          <div className="grid gap-2 text-sm text-ink/70">
            <p>
              <strong>Base URL:</strong> <span className="text-ink">{baseUrl}</span>
            </p>
            <p>
              <strong>Autenticación opcional:</strong> header{' '}
              <span className="text-ink">Authorization: Bearer &lt;API_KEY&gt;</span>.
            </p>
            <p>
              <strong>Rate limit:</strong> 30 req/min por IP en endpoints de histórico y
              estadísticas. Con API key sube a 120 req/min. Se devuelven headers
              X-RateLimit-Limit, X-RateLimit-Remaining y X-RateLimit-Reset.
            </p>
          </div>
          <pre className="rounded-xl bg-ink text-sand text-xs sm:text-sm p-4 overflow-x-auto">
{`curl "${baseUrl}/rates/current"`}
          </pre>
        </div>

        <div className="grid gap-6">
          <h2 className="font-serif text-2xl">Endpoints</h2>

          <div className="card p-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-1 rounded-full border text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                GET
              </span>
              <span className="text-sm text-ink/70">/rates/current</span>
            </div>
            <p className="text-ink/70">
              Cotización actual consolidada. Incluye estado del servicio, fuentes y brecha
              cambiaria.
            </p>
            <pre className="rounded-xl bg-ink text-sand text-xs sm:text-sm p-4 overflow-x-auto">
{`{
  "updatedAt": "2026-01-29T13:40:00.000Z",
  "status": "OK",
  "sources": { "bcb": "OK", "binance_p2p": "OK" },
  "paralelo": { "buy": 12.4, "sell": 12.6, "sources_count": 1, "sampleSize": 72 },
  "oficial": { "buy": 6.96, "sell": 6.96, "sources_count": 1 },
  "brecha": { "gap_abs": 5.64, "gap_pct": 81.03 },
  "notes": null
}`}
            </pre>
          </div>

          <div className="card p-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-1 rounded-full border text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                GET
              </span>
              <span className="text-sm text-ink/70">/rates/history</span>
            </div>
            <p className="text-ink/70">
              Serie histórica con intervalos configurables. Parámetros:
              <span className="text-ink"> kind=PARALELO|OFICIAL</span>,
              <span className="text-ink"> from</span>,
              <span className="text-ink"> to</span>,
              <span className="text-ink"> interval</span> (ej. 10m, 1h).
            </p>
            <pre className="rounded-xl bg-ink text-sand text-xs sm:text-sm p-4 overflow-x-auto">
{`{
  "from": "2026-01-22T00:00:00.000Z",
  "to": "2026-01-29T00:00:00.000Z",
  "interval": "1h",
  "series": [
    {
      "t": "2026-01-29T10:00:00.000Z",
      "official_bcb": 6.96,
      "parallel_mid": 12.5,
      "parallel_buy": 12.4,
      "parallel_sell": 12.6
    }
  ],
  "kind": "PARALELO",
  "count": 1,
  "data": [
    {
      "date": "2026-01-29T10:00:00.000Z",
      "buy_avg": 12.4,
      "sell_avg": 12.6,
      "sources_count": 72
    }
  ]
}`}
            </pre>
          </div>

          <div className="card p-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-1 rounded-full border text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                GET
              </span>
              <span className="text-sm text-ink/70">/rates/statistics</span>
            </div>
            <p className="text-ink/70">
              Estadísticas para el dólar paralelo (min, max, promedio y variación). Parámetro:
              <span className="text-ink"> period=7d|30d|90d|1y</span>.
            </p>
            <pre className="rounded-xl bg-ink text-sand text-xs sm:text-sm p-4 overflow-x-auto">
{`{
  "min": 12.1,
  "max": 12.9,
  "avg": 12.5,
  "period": "30d",
  "change_percent": 3.2,
  "count": 720,
  "timestamp_utc": "2026-01-29T13:40:00.000Z"
}`}
            </pre>
          </div>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Fuentes de datos</h2>
          <p className="text-ink/70">
            El dólar oficial se obtiene desde referencias institucionales (BCB) y el paralelo se
            calcula con datos agregados de mercados públicos P2P (Binance). Aplicamos validaciones
            para filtrar outliers y mantener series consistentes.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/fuentes" className="underline underline-offset-4">
              Ver fuentes completas
            </Link>
          </div>
        </div>

        <div className="card p-6 grid gap-4">
          <h2 className="font-serif text-2xl">Uso y legal</h2>
          <p className="text-ink/70">
            Esta API es pública y de solo lectura. No documentamos endpoints administrativos ni
            internos en esta página.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/terminos" className="underline underline-offset-4">
              Términos de uso
            </Link>
            <Link href="/privacidad" className="underline underline-offset-4">
              Política de privacidad
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
