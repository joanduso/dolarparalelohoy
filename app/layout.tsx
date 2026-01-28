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

const metadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
  alternates: {
    canonical: absoluteUrl('/')
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: siteConfig.locale
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description
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
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="font-sans">
        <div className="gradient-panel min-h-screen">
          <header className="section-shell py-6">
            <div className="flex flex-col gap-3">
              <Logo />
              <p className="text-sm text-ink/70 max-w-2xl">
                Seguimiento diario del dólar paralelo y oficial en Bolivia con metodología
                transparente y datos agregados de múltiples fuentes.
              </p>
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
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
