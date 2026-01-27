export type SourceKind = 'PARALELO' | 'OFICIAL';

export type RawRatePoint = {
  kind: SourceKind;
  timestamp: string;
  buy: number;
  sell: number;
  source: string;
  currencyPair: string;
  country: string;
  raw?: unknown;
};

export type ComplianceCheck = {
  allowed: boolean;
  reason?: string;
  robotsUrl?: string;
  termsUrl?: string;
};

export type SourceCompliance = {
  checkAllowed: () => Promise<ComplianceCheck>;
};

export type SourceAdapter = {
  id: string;
  kind: SourceKind;
  fetchLatest: () => Promise<RawRatePoint | null>;
  fetchHistory?: (days: number) => Promise<RawRatePoint[]>;
  compliance: SourceCompliance;
};
