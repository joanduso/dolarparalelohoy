import { headers } from 'next/headers';

export type ApiKeyAuth = {
  ok: boolean;
  key?: string;
};

function parseBearer(authHeader: string | null) {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function getApiKeyAuth(): ApiKeyAuth {
  const headerList = headers();
  const token = parseBearer(headerList.get('authorization'));
  if (!token) return { ok: false };

  const rawKeys = process.env.API_KEYS ?? '';
  const allowed = rawKeys
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!allowed.length) {
    return { ok: false };
  }

  const ok = allowed.includes(token);
  return ok ? { ok: true, key: token } : { ok: false };
}
