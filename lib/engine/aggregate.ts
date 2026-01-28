import type { Sample, AggregateResult } from './types';

export function aggregateSide(samples: Sample[]): AggregateResult | null {
  if (samples.length === 0) return null;
  const values = samples.map((sample) => sample.price).sort((a, b) => a - b);
  const n = values.length;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  const avg = values.reduce((sum, value) => sum + value, 0) / n;
  return {
    median,
    avg,
    min: values[0],
    max: values[n - 1],
    n
  };
}
