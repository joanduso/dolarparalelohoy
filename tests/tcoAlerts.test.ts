import { describe, expect, it } from 'vitest';
import type { BcbBankBreakdown, BcbTcoBreakdown } from '../lib/bcbTco';
import { buildTcoAlertSignal } from '../lib/tcoAlerts';

function bank(overrides: Partial<BcbBankBreakdown> = {}): BcbBankBreakdown {
  return {
    name: 'BANCO PRUEBA',
    shortName: 'Prueba',
    usd: 4_000_000,
    sharePct: 20,
    operations: 20,
    medianRate: 12,
    averageRate: 12,
    belowUsd: 0,
    atUsd: 4_000_000,
    aboveUsd: 0,
    tcoWithoutBank: 12,
    effectCents: 0,
    ...overrides
  };
}

function breakdown(
  cutoffDate: string,
  tco: number,
  banks: BcbBankBreakdown[]
): BcbTcoBreakdown {
  return {
    cutoffDate,
    validity: cutoffDate,
    tco,
    weightedAverage: tco,
    totalUsd: 20_000_000,
    totalOperations: 100,
    sensitivity: {
      lowerDisplayBoundary: tco - 0.005,
      upperDisplayBoundary: tco + 0.005,
      belowDisplayUsd: 0,
      atDisplayUsd: 20_000_000,
      aboveDisplayUsd: 0,
      displayDownAdditionalUsd: 20_000_000,
      displayUpAdditionalUsdExclusive: 20_000_000,
      rawMedianDownAdditionalUsd: 20_000_000,
      rawMedianUpAdditionalUsdExclusive: 20_000_000
    },
    banks,
    medianBanks: banks.filter((item) => item.medianRate === tco).map((item) => item.shortName),
    sourceUrl: 'https://www.bcb.gob.bo/'
  };
}

describe('buildTcoAlertSignal', () => {
  const previous = breakdown('2026-10-01', 11.9, [bank()]);

  it('alerts when the published TCO moves at least five centavos', () => {
    const current = breakdown('2026-10-02', 12, [bank()]);
    const signal = buildTcoAlertSignal(current, previous);

    expect(signal?.changeBob).toBe(0.1);
    expect(signal?.reasons).toContain('TCO_CHANGE');
  });

  it('alerts when one bank changes the counterfactual median', () => {
    const current = breakdown('2026-10-02', 11.9, [
      bank({ tcoWithoutBank: 11.84, effectCents: 6 })
    ]);

    expect(buildTcoAlertSignal(current, previous)?.reasons).toContain('BANK_EFFECT');
  });

  it('alerts on dominant volume even without a price move', () => {
    const current = breakdown('2026-10-02', 11.9, [bank({ sharePct: 36 })]);

    expect(buildTcoAlertSignal(current, previous)?.reasons).toContain('BANK_CONCENTRATION');
  });

  it('stays quiet when no threshold is reached', () => {
    const current = breakdown('2026-10-02', 11.92, [bank({ sharePct: 25 })]);

    expect(buildTcoAlertSignal(current, previous)).toBeNull();
  });
});
