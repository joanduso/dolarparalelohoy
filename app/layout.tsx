import type { Metadata } from 'next';
import Link from 'next/link';
import { Alegreya, Commissioner } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/seo';
import { StickyAd } from '@/app/(site)/_components/StickyAd';
import { Logo } from '@/components/Logo';

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
    template: `%s | ${siteConfig.name}`
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
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png'
  }
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
        logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.png` }
      }
    ]
  };

  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c')
          }}
        />
        <div className="gradient-panel min-h-screen">
          <header className="section-shell py-6">
            <div className="flex flex-col gap-3">
              <Logo />
              <p className="text-sm text-ink/70 max-w-2xl">
                Seguimiento diario del dólar paralelo y oficial en Bolivia con metodología
                transparente y datos agregados de múltiples fuentes.
              </p>
              <nav className="flex flex-wrap gap-4 text-sm">
                <Link href="/paralelo" className="underline underline-offset-4">
                  Dólar paralelo
                </Link>
                <Link href="/oficial" className="underline underline-offset-4">
                  Dólar oficial
                </Link>
                <Link href="/brecha" className="underline underline-offset-4">
                  Brecha
                </Link>
                <Link href="/faq" className="underline underline-offset-4">
                  Metodología
                </Link>
                <Link href="/devs" className="underline underline-offset-4">
                  API
                </Link>
              </nav>
            </div>
          </header>
          {children}
          <StickyAd />
          <footer className="section-shell py-10 text-sm text-ink/70">
            <div className="flex flex-col gap-2">
              <p>
                © {new Date().getFullYear()} {siteConfig.name}. Información con fines
                informativos.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/faq" className="underline underline-offset-4">
                  Metodología y FAQ
                </Link>
                <Link href="/historico/paralelo" className="underline underline-offset-4">
                  Histórico dólar paralelo
                </Link>
                <Link href="/historico/oficial" className="underline underline-offset-4">
                  Histórico dólar oficial
                </Link>
                <Link href="/fuentes" className="underline underline-offset-4">
                  Fuentes
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
