import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatDateTime(date: Date) {
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}
