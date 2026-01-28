import type { PrismaClient } from '@prisma/client';
import { runIngest } from './run';

const BASE_SOURCE = 'base-median';
const MIN_ATTEMPT_INTERVAL_MS = 60_000;
let lastAttemptAt = 0;

export async function ensureFreshRates(
  prisma: PrismaClient,
  maxAgeMs = 10 * 60_000
) {
  const latest = await prisma.ratePoint.findFirst({
    where: { source: BASE_SOURCE },
    orderBy: { timestamp: 'desc' }
  });

  const now = Date.now();
  const ageMs = latest ? now - latest.timestamp.getTime() : Infinity;

  if (ageMs <= maxAgeMs) {
    return { fresh: true, attempted: false, ageMs };
  }

  if (now - lastAttemptAt < MIN_ATTEMPT_INTERVAL_MS) {
    return { fresh: false, attempted: false, ageMs, reason: 'throttled' };
  }

  lastAttemptAt = now;

  try {
    const result = await runIngest(prisma);
    return { fresh: true, attempted: true, ageMs, result };
  } catch (error) {
    return { fresh: false, attempted: true, ageMs, error: String(error) };
  }
}
