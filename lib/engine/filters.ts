import type { Sample } from './types';

export function sanityFilter(samples: Sample[]) {
  return samples.filter((sample) => {
    if (!Number.isFinite(sample.price)) return false;
    if (sample.price <= 0) return false;
    if (sample.price < 0.1 || sample.price > 100) return false;
    return true;
  });
}

function quantile(values: number[], q: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function outlierFilter(samples: Sample[]) {
  if (samples.length < 4) return samples;
  const prices = samples.map((sample) => sample.price);
  const q1 = quantile(prices, 0.25);
  const q3 = quantile(prices, 0.75);
  if (q1 === null || q3 === null) return samples;
  const iqr = q3 - q1;
  if (iqr === 0) return samples;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return samples.filter((sample) => sample.price >= lower && sample.price <= upper);
}

export function minSampleThreshold(samples: Sample[], min = 8) {
  return samples.length >= min;
}
