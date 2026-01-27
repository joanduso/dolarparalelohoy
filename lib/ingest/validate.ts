import type { NormalizedRatePoint } from './normalize';

export type ValidationResult = {
  ok: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
};

const MAX_PCT_CHANGE = 0.05;
const MAX_MINUTES = 15;
const MAX_VALUE = 500;

function pctChange(current: number, previous: number) {
  return Math.abs((current - previous) / previous);
}

export function validatePoint(
  point: NormalizedRatePoint,
  lastPoint?: NormalizedRatePoint | null,
  sourcesConfirming = 1
): ValidationResult {
  if (point.buy <= 0 || point.sell <= 0) {
    return { ok: false, reason: 'invalid_non_positive' };
  }

  if (point.buy > MAX_VALUE || point.sell > MAX_VALUE) {
    return { ok: false, reason: 'invalid_absurd_value' };
  }

  if (!lastPoint) return { ok: true };

  const diffMinutes =
    (point.timestamp.getTime() - lastPoint.timestamp.getTime()) / 60000;

  if (diffMinutes <= MAX_MINUTES) {
    const buyChange = pctChange(point.buy, lastPoint.buy);
    const sellChange = pctChange(point.sell, lastPoint.sell);
    const isOutlier = buyChange > MAX_PCT_CHANGE || sellChange > MAX_PCT_CHANGE;

    if (isOutlier && sourcesConfirming < 2) {
      return {
        ok: false,
        reason: 'outlier_needs_confirmation',
        requiresConfirmation: true
      };
    }
  }

  return { ok: true };
}
