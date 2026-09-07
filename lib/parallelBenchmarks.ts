export const HISTORIC_OFFICIAL_RATE = 6.96;

export type RatePoint = {
  date: string;
  value: number;
};

type Benchmark = {
  baseline: number;
  delta: number;
  percent: number;
};

function latestValidPoint(points: RatePoint[], onOrBefore?: string): RatePoint | null {
  return [...points]
    .filter((point) => (
      Number.isFinite(point.value) &&
      point.value > 0 &&
      Number.isFinite(new Date(point.date).getTime()) &&
      (!onOrBefore || point.date.slice(0, 10) <= onOrBefore)
    ))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .at(-1) ?? null;
}

function compare(value: number, baseline: number): Benchmark {
  const delta = value - baseline;
  return {
    baseline,
    delta,
    percent: (delta / baseline) * 100
  };
}

export function computeParallelBenchmarks(
  parallelPoints: RatePoint[],
  officialPoints: RatePoint[],
  onOrBefore?: string
) {
  const parallel = latestValidPoint(parallelPoints, onOrBefore);
  if (!parallel) return null;

  const comparisonDay = parallel.date.slice(0, 10);
  const official = latestValidPoint(officialPoints, comparisonDay);
  return {
    parallel,
    historic: compare(parallel.value, HISTORIC_OFFICIAL_RATE),
    official: official
      ? {
          ...compare(parallel.value, official.value),
          date: official.date
        }
      : null
  };
}
