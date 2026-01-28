export type StatsSeriesPoint = {
  t: Date;
  parallel_mid: number | null;
};

export type StatisticsResult = {
  min: number | null;
  max: number | null;
  avg: number | null;
  change_percent: number | null;
  count: number;
};

export function computeStatistics(points: StatsSeriesPoint[]): StatisticsResult {
  const values = points
    .map((point) => point.parallel_mid)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (values.length === 0) {
    return { min: null, max: null, avg: null, change_percent: null, count: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  const first = values[0];
  const last = values[values.length - 1];
  const change_percent = first ? ((last - first) / first) * 100 : null;

  return {
    min,
    max,
    avg,
    change_percent,
    count: values.length
  };
}
