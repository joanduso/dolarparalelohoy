export type HistoryPeriod = {
  slug: string;
  days: number;
  label: string;
  shortLabel: string;
};

// days for "todo" matches the anonymous API ceiling (see lib/apiTiers.ts) —
// enough to cover the full paralelo.bo-backed history since Aug 2024.
//
// No "24h" period: our history data is daily averages (one row/day), so a
// 24h window returns ~1-2 rows — genuinely thin and redundant with the
// live rate already on the homepage. Don't add it back without hourly
// granularity to actually show.
export const HISTORY_PERIODS: HistoryPeriod[] = [
  { slug: '7d', days: 7, label: 'los últimos 7 días', shortLabel: '7 días' },
  { slug: '30d', days: 30, label: 'los últimos 30 días', shortLabel: '30 días' },
  { slug: '90d', days: 90, label: 'los últimos 90 días', shortLabel: '90 días' },
  { slug: '1a', days: 365, label: 'el último año', shortLabel: '1 año' },
  { slug: 'todo', days: 1000, label: 'todo el histórico', shortLabel: 'Todo' }
];

export function getHistoryPeriod(slug: string): HistoryPeriod | undefined {
  return HISTORY_PERIODS.find((period) => period.slug === slug);
}
