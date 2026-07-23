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

export function formatDate(date: Date | string | number) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
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
