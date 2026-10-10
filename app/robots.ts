import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/v1/'],
        disallow: ['/api/']
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/v1/'],
        disallow: ['/api/']
      }
    ],
    host: siteConfig.url,
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
