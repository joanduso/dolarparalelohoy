export type ApiTier = 'anon' | 'free' | 'pro';

type EndpointLimits = Record<ApiTier, number>;

export const RATE_LIMITS: Record<'latest' | 'history' | 'stats', EndpointLimits> = {
  latest: { anon: 60, free: 120, pro: 600 },
  history: { anon: 30, free: 90, pro: 400 },
  stats: { anon: 30, free: 90, pro: 400 }
};

// Anonymous keeps the site's original 1000-day ceiling (the homepage and
// public chart itself call this endpoint without a key); Free/Pro extend it.
export const HISTORY_MAX_DAYS: Record<ApiTier, number> = {
  anon: 1000,
  free: 2000,
  pro: 4000
};

export function limitFor(endpoint: keyof typeof RATE_LIMITS, tier: ApiTier) {
  return RATE_LIMITS[endpoint][tier];
}
