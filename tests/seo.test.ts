import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { pageTitles, siteConfig, siteRoutes } from '@/lib/seo';

describe('SEO configuration', () => {
  it('assigns distinct search intents to home and the P2P detail page', () => {
    expect(pageTitles.home).toContain('Dólar Paralelo Bolivia Hoy');
    expect(pageTitles.paralelo).toContain('Precio del Dólar Paralelo');
    expect(pageTitles.paralelo).toContain('Índice P2P');
    expect(pageTitles.paralelo).not.toBe(pageTitles.home);
  });

  it('lists each canonical, indexable route once in the sitemap', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(entries).toHaveLength(siteRoutes.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(siteConfig.url);
    expect(urls.some((url) => /\/historico\/(?:paralelo|oficial)\/(?:7d|30d|90d|1a|todo)$/.test(url))).toBe(false);
    expect(urls).toContain(`${siteConfig.url}/calculadora-dolar-bolivia`);
    expect(urls).toContain(`${siteConfig.url}/binance-p2p-bolivia`);
    expect(urls).toContain(`${siteConfig.url}/widget`);
    expect(urls).not.toContain(`${siteConfig.url}/widget/embed`);

    for (const url of urls) {
      const parsed = new URL(url);
      expect(parsed.origin).toBe(siteConfig.url);
      expect(parsed.pathname).not.toContain('//');
    }
  });

  it('allows public pages, blocks APIs and advertises the canonical sitemap', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    expect(config.host).toBe(siteConfig.url);
    expect(config.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(rules.every((rule) => rule.allow === '/')).toBe(true);
    expect(rules.every((rule) => rule.disallow?.includes('/api/'))).toBe(true);
  });
});
