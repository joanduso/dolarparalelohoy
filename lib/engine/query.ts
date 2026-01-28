export type HistoryQuery = {
  from: Date;
  to: Date;
  interval: string;
};

export function parseHistoryParams(url: URL) {
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const interval = url.searchParams.get('interval') ?? '10m';

  if (!/^\d+(m|h)$/i.test(interval)) {
    return { ok: false as const, error: 'invalid_interval' };
  }

  const to = toParam ? new Date(toParam) : new Date();
  if (Number.isNaN(to.getTime())) {
    return { ok: false as const, error: 'invalid_to' };
  }

  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime())) {
    return { ok: false as const, error: 'invalid_from' };
  }

  return { ok: true as const, value: { from, to, interval } };
}

const periodMap: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365
};

export function parsePeriodParam(url: URL) {
  const period = url.searchParams.get('period') ?? '30d';
  const days = periodMap[period];
  if (!days) {
    return { ok: false as const, error: 'invalid_period' };
  }
  return { ok: true as const, value: { period, days } };
}
