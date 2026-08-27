import type { MetadataRoute } from 'next';
import { siteConfig, siteRoutes } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();
  const routes = siteRoutes;

  const frequentlyUpdated = ['', '/paralelo', '/oficial', '/brecha', '/usdt-bob', '/dolar-blue-bolivia', '/calculadora-dolar-bolivia', '/binance-p2p-bolivia', '/exchanges'];
  const dailyUpdated = ['/historico/paralelo', '/historico/oficial'];
  const staticPageModifiedAt = new Date('2026-08-27T00:00:00.000Z');

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified:
      frequentlyUpdated.includes(path) || dailyUpdated.includes(path)
        ? now
        : staticPageModifiedAt,
    changeFrequency: frequentlyUpdated.includes(path)
      ? 'hourly'
      : dailyUpdated.includes(path)
        ? 'daily'
        : 'monthly',
    priority: path === '' ? 1 : frequentlyUpdated.includes(path) ? 0.9 : 0.6
  }));
}
