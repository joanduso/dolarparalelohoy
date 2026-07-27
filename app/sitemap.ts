import type { MetadataRoute } from 'next';
import { siteConfig, siteRoutes } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();
  const routes = siteRoutes;

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
