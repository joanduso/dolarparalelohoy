import 'server-only';
import { headers } from 'next/headers';
import { siteConfig } from './seo';

const getBaseUrl = () => {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  if (host) return `${proto}://${host}`;
  return siteConfig.url;
};

type FetchJsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  revalidate = 600
): Promise<FetchJsonResult<T>> {
  // Pull-on-request + ISR: all server fetches use a shared 10-minute revalidate window.
  const baseUrl = getBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const response = await fetch(url, { ...options, next: { revalidate } });
  const text = await response.text();
  let data: T | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: 'invalid_json'
      };
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data,
      error: typeof (data as { error?: string } | null)?.error === 'string'
        ? (data as { error: string }).error
        : 'request_failed'
    };
  }

  return {
    ok: true,
    status: response.status,
    data
  };
}
