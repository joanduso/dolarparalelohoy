import { headers } from 'next/headers';
import type { ApiTier } from '@/lib/apiTiers';

export type ApiKeyAuth = {
  ok: boolean;
  key?: string;
  tier: ApiTier;
};

function parseBearer(authHeader: string | null) {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function parseEnvKeys(name: string) {
  return (process.env[name] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getApiKeyAuth(): ApiKeyAuth {
  const headerList = headers();
  const token = parseBearer(headerList.get('authorization'));
  if (!token) return { ok: false, tier: 'anon' };

  const proKeys = parseEnvKeys('API_KEYS_PRO');
  const freeKeys = parseEnvKeys('API_KEYS_FREE');
  // Legacy API_KEYS predates the tier split; treat those keys as "pro" so
  // anyone already issued one keeps their existing (higher) limit.
  const legacyKeys = parseEnvKeys('API_KEYS');

  if (proKeys.includes(token) || legacyKeys.includes(token)) {
    return { ok: true, key: token, tier: 'pro' };
  }
  if (freeKeys.includes(token)) {
    return { ok: true, key: token, tier: 'free' };
  }
  return { ok: false, tier: 'anon' };
}
