import crypto from 'node:crypto';

export type AlertFrequencyValue = 'DAILY' | 'THRESHOLD';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_THRESHOLDS = new Set([1, 2, 3, 5, 10]);

export function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

export function parseAlertPreferences(input: {
  frequency?: unknown;
  thresholdPct?: unknown;
}) {
  const frequency: AlertFrequencyValue = input.frequency === 'THRESHOLD' ? 'THRESHOLD' : 'DAILY';
  if (frequency === 'DAILY') return { frequency, thresholdPct: null };

  const thresholdPct = Number(input.thresholdPct ?? 3);
  if (!ALLOWED_THRESHOLDS.has(thresholdPct)) return null;
  return { frequency, thresholdPct };
}

export function createAlertToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashAlertValue(value: string) {
  const salt = process.env.ALERT_TOKEN_SALT ?? process.env.DECLARED_SALT ?? '';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function boliviaCalendarDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function shouldSendAlert(input: {
  frequency: AlertFrequencyValue;
  thresholdPct: number | null;
  changePct: number | null;
  lastSentAt: Date | null;
  now: Date;
}) {
  if (input.lastSentAt && boliviaCalendarDate(input.lastSentAt) === boliviaCalendarDate(input.now)) {
    return false;
  }
  if (input.frequency === 'DAILY') return true;
  if (input.changePct === null) return false;
  return Math.abs(input.changePct) >= (input.thresholdPct ?? 3);
}
