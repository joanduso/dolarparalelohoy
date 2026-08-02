export type HistoryStatPoint = {
  date: string;
  value: number;
};

export type HistoryStats = {
  count: number;
  firstDate: string;
  firstValue: number;
  lastDate: string;
  lastValue: number;
  minDate: string;
  minValue: number;
  maxDate: string;
  maxValue: number;
  averageValue: number;
  changeAbs: number;
  changePct: number;
};

/**
 * Summarizes a daily historical series after removing invalid and duplicate
 * calendar dates. The last value received for a date wins.
 */
export function computeHistoryStats(points: HistoryStatPoint[]): HistoryStats | null {
  const byDay = new Map<string, HistoryStatPoint>();

  for (const point of points) {
    const parsed = new Date(point.date);
    if (!Number.isFinite(point.value) || point.value <= 0 || Number.isNaN(parsed.getTime())) {
      continue;
    }

    byDay.set(parsed.toISOString().slice(0, 10), point);
  }

  const valid = Array.from(byDay.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (valid.length < 2) return null;

  const first = valid[0];
  const last = valid[valid.length - 1];
  let min = first;
  let max = first;
  let total = 0;

  for (const point of valid) {
    total += point.value;
    if (point.value < min.value) min = point;
    if (point.value > max.value) max = point;
  }

  const changeAbs = last.value - first.value;

  return {
    count: valid.length,
    firstDate: first.date,
    firstValue: first.value,
    lastDate: last.date,
    lastValue: last.value,
    minDate: min.date,
    minValue: min.value,
    maxDate: max.date,
    maxValue: max.value,
    averageValue: total / valid.length,
    changeAbs,
    changePct: (changeAbs / first.value) * 100
  };
}
