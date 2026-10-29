import type { MetadataRoute } from 'next';
import { siteConfig, siteRoutes } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const routes = siteRoutes;

  const frequentlyUpdated = ['', '/paralelo', '/oficial', '/brecha', '/usdt-bob', '/dolar-blue-bolivia', '/tco-bancos-bolivia', '/calculadora-dolar-bolivia', '/binance-p2p-bolivia', '/exchanges'];
  const dailyUpdated = ['/historico/paralelo', '/historico/oficial'];

  return routes.map((path) => ({
    url: `${base}${path}`,
    // Omit lastModified until an actual content modification time is available.
    // Generating this file does not mean every listed page changed.
    changeFrequency: frequentlyUpdated.includes(path)
      ? 'hourly'
      : dailyUpdated.includes(path)
        ? 'daily'
        : 'monthly',
    priority: path === '' ? 1 : frequentlyUpdated.includes(path) ? 0.9 : 0.6
  }));
}
