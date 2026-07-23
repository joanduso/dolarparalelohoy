import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const routes = [
    '',
    '/paralelo',
    '/oficial',
    '/brecha',
    '/usdt-bob',
    '/dolar-blue-bolivia',
    '/exchanges',
    '/historico/paralelo',
    '/historico/oficial',
    '/faq',
    '/fuentes',
    '/terminos',
    '/privacidad',
    '/devs'
  ];

  const frequentlyUpdated = ['', '/paralelo', '/oficial', '/brecha', '/usdt-bob', '/dolar-blue-bolivia', '/exchanges'];
  const staticPageModifiedAt = new Date('2026-07-22T00:00:00.000Z');

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: frequentlyUpdated.includes(path) ? now : staticPageModifiedAt,
    changeFrequency: frequentlyUpdated.includes(path)
      ? 'hourly'
      : path.startsWith('/historico')
        ? 'daily'
        : 'monthly',
    priority: path === '' ? 1 : frequentlyUpdated.includes(path) ? 0.9 : 0.6
  }));
}
