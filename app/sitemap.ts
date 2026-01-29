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
    '/devs'
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: path === '' ? 1 : 0.7
  }));
}
