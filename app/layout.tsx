import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Alegreya, Commissioner } from 'next/font/google';
import './globals.css';
import { publicRepositoryUrl, siteConfig } from '@/lib/seo';
import { Logo } from '@/components/Logo';
import { MobileTabBar } from '@/components/MobileTabBar';

const GA_MEASUREMENT_ID = 'G-H4XPR5K4NT';
const ADSENSE_CLIENT_ID = 'ca-pub-9113726729959425';

const serif = Alegreya({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap'
});

const sans = Commissioner({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const metadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
const metadataBase = new URL(
  metadataBaseUrl.startsWith('http') ? metadataBaseUrl : `https://${metadataBaseUrl}`
);

const absoluteUrl = (path: string) => new URL(path, metadataBase);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  keywords: [
    'dólar paralelo Bolivia',
    'dólar Bolivia hoy',
    'tipo de cambio Bolivia',
    'dólar oficial Bolivia',
    'USDT BOB',
    'precio dólar Bolivia',
    'brecha cambiaria Bolivia'
  ],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'finanzas',
  alternates: {
    canonical: absoluteUrl('/')
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [{ url: absoluteUrl('/opengraph-image'), alt: siteConfig.name }]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl('/opengraph-image')]
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.png'
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.shortName,
        alternateName: [siteConfig.name, siteConfig.alternateName],
        description: siteConfig.description,
        inLanguage: siteConfig.locale,
        publisher: { '@id': `${siteConfig.url}/#organization` }
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.png` },
        sameAs: [publicRepositoryUrl],
        knowsAbout: [
          'Tipo de cambio en Bolivia',
          'Dólar paralelo en Bolivia',
          'Mercados P2P USDT/BOB',
          'Series históricas cambiarias'
        ],
        publishingPrinciples: `${siteConfig.url}/acerca-de#politica-editorial`
      }
    ]
  };

  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link
          rel="alternate"
          type="application/json"
          href={`${siteConfig.url}/api/v1/rates/current`}
          title="Cotización actual del dólar en Bolivia"
        />
        <link
          rel="alternate"
          type="text/plain"
          href={`${siteConfig.url}/llms.txt`}
          title="Guía para asistentes y agentes"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c')
          }}
        />
        <div className="gradient-panel min-h-screen">
          <div className="data-rule" aria-hidden="true" />
          <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-white/75 backdrop-blur-2xl">
            <div className="section-shell flex min-h-16 items-center justify-between gap-6 py-2 sm:min-h-[72px] sm:py-3">
              <Logo className="shrink-0" />
              <nav
                aria-label="Navegación principal"
                className="hidden items-center gap-1 lg:flex"
              >
                <Link href="/paralelo" className="nav-link">
                  Paralelo
                </Link>
                <Link href="/oficial" className="nav-link">
                  Oficial
                </Link>
                <Link href="/brecha" className="nav-link">
                  Brecha
                </Link>
                <Link href="/historico/paralelo" className="nav-link">
                  Histórico
                </Link>
                <Link href="/usdt-bob" className="nav-link">
                  Conversor
                </Link>
                <Link href="/exchanges" className="nav-link">
                  Exchanges
                </Link>
                <Link href="/faq" className="nav-link">
                  Metodología
                </Link>
              </nav>
              <Link
                href="/compartir"
                rel="nofollow"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-night px-4 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Compartir tasa
              </Link>
            </div>
          </header>
          {children}
          <MobileTabBar />
          <footer className="mt-14 bg-night pb-24 text-sm text-white/65 lg:pb-0">
            <div className="data-rule" aria-hidden="true" />
            <div className="section-shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_2fr]">
              <div className="grid content-start gap-4">
                <Logo className="[&_span]:text-white [&_span_span:last-child]:text-white/50" />
                <p className="max-w-sm leading-relaxed">
                  Tipo de cambio paralelo y oficial de Bolivia, con datos trazables,
                  históricos abiertos y metodología visible.
                </p>
                <p>© {new Date().getFullYear()} {siteConfig.name}.</p>
              </div>
              <div className="flex flex-wrap content-start gap-x-6 gap-y-4 lg:justify-end">
                <Link href="/faq" className="underline underline-offset-4">
                  Metodología y FAQ
                </Link>
                <Link href="/historico/paralelo" className="underline underline-offset-4">
                  Histórico dólar paralelo
                </Link>
                <Link href="/historico/oficial" className="underline underline-offset-4">
                  Histórico dólar oficial
                </Link>
                <Link href="/usdt-bob" className="underline underline-offset-4">
                  Conversor USDT/BOB
                </Link>
                <Link href="/dolar-blue-bolivia" className="underline underline-offset-4">
                  Dólar blue hoy en Bolivia
                </Link>
                <Link href="/tco-bancos-bolivia" className="underline underline-offset-4">
                  TCO por banco
                </Link>
                <Link href="/exchanges" className="underline underline-offset-4">
                  Comparar exchanges
                </Link>
                <Link
                  href="/compartir"
                  rel="nofollow"
                  className="underline underline-offset-4"
                >
                  Compartir cotización
                </Link>
                <Link href="/comprar-usdt-bolivia" className="underline underline-offset-4">
                  Cómo comprar USDT
                </Link>
                <Link href="/bancos-usdt-bolivia" className="underline underline-offset-4">
                  Bancos con USDT
                </Link>
                <Link href="/que-es-dolar-blue-bolivia" className="underline underline-offset-4">
                  Qué es el dólar blue
                </Link>
                <Link href="/eur-bob" className="underline underline-offset-4">
                  Euro a bolivianos
                </Link>
                <Link href="/btc-bob" className="underline underline-offset-4">
                  Bitcoin a bolivianos
                </Link>
                <Link href="/fuentes" className="underline underline-offset-4">
                  Fuentes
                </Link>
                <Link href="/acerca-de" className="underline underline-offset-4">
                  Quiénes somos
                </Link>
                <Link href="/calculadora-dolar-bolivia" className="underline underline-offset-4">
                  Calculadora dólar a bolivianos
                </Link>
                <Link href="/widget" className="underline underline-offset-4">
                  Widget para sitios web
                </Link>
                <Link href="/terminos" className="underline underline-offset-4">
                  Términos
                </Link>
                <Link href="/privacidad" className="underline underline-offset-4">
                  Privacidad
                </Link>
                <Link href="/devs" className="underline underline-offset-4">
                  API
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
