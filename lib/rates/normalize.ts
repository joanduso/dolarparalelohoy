export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function computeBrecha(parallelValue: unknown, officialValue: unknown) {
  const parallel = toNumberOrNull(parallelValue);
  const official = toNumberOrNull(officialValue);

  if (parallel === null || official === null || official <= 0) {
    return { gapAbs: null, gapPct: null };
  }

  const gapAbs = parallel - official;
  const gapPct = (parallel / official - 1) * 100;

  return { gapAbs, gapPct };
}
