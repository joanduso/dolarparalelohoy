import type { BcbBankBreakdown, BcbTcoBreakdown } from '@/lib/bcbTco';

export const TCO_ALERT_THRESHOLDS = {
  changeBob: 0.05,
  bankEffectCents: 5,
  dominantSharePct: 35
} as const;

export type TcoAlertReason = 'TCO_CHANGE' | 'BANK_EFFECT' | 'BANK_CONCENTRATION';

export type TcoAlertSignal = {
  current: BcbTcoBreakdown;
  previous: BcbTcoBreakdown;
  changeBob: number;
  reasons: TcoAlertReason[];
  influentialBank: BcbBankBreakdown | null;
  leadingBank: BcbBankBreakdown;
};

export function buildTcoAlertSignal(
  current: BcbTcoBreakdown,
  previous: BcbTcoBreakdown
): TcoAlertSignal | null {
  if (current.cutoffDate <= previous.cutoffDate || current.banks.length === 0) return null;

  const changeBob = Number((current.tco - previous.tco).toFixed(4));
  const influentialBank = [...current.banks]
    .filter((bank) => bank.effectCents !== null)
    .sort((a, b) => Math.abs(b.effectCents ?? 0) - Math.abs(a.effectCents ?? 0))[0] ?? null;
  const leadingBank = current.banks[0];
  const reasons: TcoAlertReason[] = [];

  if (Math.abs(changeBob) + Number.EPSILON >= TCO_ALERT_THRESHOLDS.changeBob) {
    reasons.push('TCO_CHANGE');
  }
  if (
    influentialBank
    && Math.abs(influentialBank.effectCents ?? 0) + Number.EPSILON
      >= TCO_ALERT_THRESHOLDS.bankEffectCents
  ) {
    reasons.push('BANK_EFFECT');
  }
  if (leadingBank.sharePct + Number.EPSILON >= TCO_ALERT_THRESHOLDS.dominantSharePct) {
    reasons.push('BANK_CONCENTRATION');
  }

  if (reasons.length === 0) return null;
  return { current, previous, changeBob, reasons, influentialBank, leadingBank };
}
