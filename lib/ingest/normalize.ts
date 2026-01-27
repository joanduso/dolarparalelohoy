import type { RawRatePoint } from '../sources/base';

export type NormalizedRatePoint = {
  kind: 'PARALELO' | 'OFICIAL';
  timestamp: Date;
  buy: number;
  sell: number;
  source: string;
  currency_pair: string;
  country: string;
  raw?: unknown;
};

export function normalizeRaw(input: RawRatePoint): NormalizedRatePoint {
  return {
    kind: input.kind,
    timestamp: new Date(input.timestamp),
    buy: Number(input.buy),
    sell: Number(input.sell),
    source: input.source,
    currency_pair: input.currencyPair,
    country: input.country,
    raw: input.raw
  };
}
