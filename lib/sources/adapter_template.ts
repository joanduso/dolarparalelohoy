import type { RawRatePoint, SourceAdapter } from './base';
import { getCache, setCache } from '../ingest/cache';
import { throttle } from '../ingest/rateLimit';

const BASE_URL = process.env.SOURCE_BASE_URL ?? '';
const ROBOTS_URL = process.env.SOURCE_ROBOTS_URL ?? '';
const TERMS_URL = process.env.SOURCE_TERMS_URL ?? '';

async function checkRobotsAndTerms() {
  if (!BASE_URL || !ROBOTS_URL || !TERMS_URL) {
    return { allowed: false, reason: 'missing_compliance_urls', robotsUrl: ROBOTS_URL, termsUrl: TERMS_URL };
  }

  // Hook for robots.txt and ToS verification. Replace with real checks.
  return { allowed: true, reason: 'compliance_placeholder', robotsUrl: ROBOTS_URL, termsUrl: TERMS_URL };
}

async function fetchFromSource(): Promise<RawRatePoint | null> {
  if (!BASE_URL) return null;

  const cacheKey = `adapter:${BASE_URL}`;
  const cached = getCache(cacheKey);
  if (cached) return cached as RawRatePoint;

  await throttle(`adapter:${BASE_URL}`, 2000);

  // TODO: Implement a compliant fetcher for your data provider.
  // Do not scrape without permission. Respect robots.txt and ToS.
  const now = new Date();

  const result: RawRatePoint = {
    kind: 'PARALELO',
    timestamp: now.toISOString(),
    buy: 0,
    sell: 0,
    source: 'adapter-template',
    currencyPair: 'USD/BOB',
    country: 'BO',
    raw: { note: 'replace_with_real_fetcher' }
  };

  setCache(cacheKey, result, 60_000);
  return result;
}

export const adapterTemplate: SourceAdapter = {
  id: 'adapter-template',
  kind: 'PARALELO',
  fetchLatest: fetchFromSource,
  compliance: {
    checkAllowed: checkRobotsAndTerms
  }
};
