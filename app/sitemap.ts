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
    '/historico/paralelo',
    '/historico/oficial',
    '/faq',
    '/fuentes',
    '/terminos',
    '/privacidad',
    '/devs'
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' || ['/paralelo', '/oficial', '/brecha'].includes(path)
      ? 'hourly'
      : path.startsWith('/historico')
        ? 'daily'
        : 'monthly',
    priority: path === '' ? 1 : ['/paralelo', '/oficial', '/brecha'].includes(path) ? 0.9 : 0.6
  }));
}
