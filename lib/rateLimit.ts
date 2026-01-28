const buckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, limit };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt, limit };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt, limit };
}
