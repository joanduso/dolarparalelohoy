const BOLIVIA_TIME_ZONE = 'America/La_Paz';

export function formatCurrency(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value?: number, fractionDigits = 2) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

// Calendar dates (e.g. a daily history row's "2026-07-28") represent a day,
// not an instant — they have no real time-of-day and are conventionally
// stored as UTC midnight. Formatting them through a non-UTC timeZone shifts
// the displayed day (America/La_Paz is UTC-4, so midnight UTC becomes
// 20:00 the previous day). Read the UTC calendar components directly so the
// stored date always displays as itself, regardless of the viewer's or
// server's timezone.
export function formatCalendarDate(date: Date | string | number) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
}

// Returns a stable YYYY-MM-DD for a calendar date, for use in structured
// data (Dataset temporalCoverage) — same UTC-components rule as above.
export function toCalendarDateString(date: Date | string | number) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function formatDateTime(date: Date | string | number) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
  const timePart = new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(parsed);
  return `${datePart}, ${timePart}`;
}
