export type TrendPoint = { date: string; value: number };

export type TrendSummaryData = {
  changeAbs: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
  firstValue: number;
  lastValue: number;
  firstDate: string;
  lastDate: string;
  days: number;
};

/**
 * Compares the first and last valid points within the trailing `days` window.
 * Returns null when there isn't enough data to describe a trend.
 */
export function computeTrend(points: TrendPoint[], days: number): TrendSummaryData | null {
  const valid = points
    .filter((p) => Number.isFinite(p.value) && p.value > 0 && !Number.isNaN(new Date(p.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (valid.length < 2) return null;

  const to = new Date(valid[valid.length - 1].date);
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const windowed = valid.filter((p) => new Date(p.date) >= from);

  if (windowed.length < 2) return null;

  const first = windowed[0];
  const last = windowed[windowed.length - 1];
  const changeAbs = last.value - first.value;
  const changePct = (changeAbs / first.value) * 100;

  return {
    changeAbs,
    changePct,
    direction: changeAbs > 0.001 ? 'up' : changeAbs < -0.001 ? 'down' : 'flat',
    firstValue: first.value,
    lastValue: last.value,
    firstDate: first.date,
    lastDate: last.date,
    days
  };
}
