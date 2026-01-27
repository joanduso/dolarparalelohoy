export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function deviationPct(value: number, base: number) {
  return Math.abs(((value - base) / base) * 100);
}

export function confidenceLevel(count: number) {
  if (count >= 20) return 'alta';
  if (count >= 10) return 'media';
  if (count >= 5) return 'baja';
  return 'insuficiente';
}
