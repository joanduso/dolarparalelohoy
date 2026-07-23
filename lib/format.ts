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

export function formatDate(date: Date) {
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date) {
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
  const timePart = new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
  return `${datePart}, ${timePart}`;
}
