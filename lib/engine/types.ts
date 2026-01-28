export type PriceSource = 'BCB' | 'BINANCE';

export type SampleSide = 'buy' | 'sell';

export type Sample = {
  price: number;
  side: SampleSide;
  source: PriceSource;
  timestamp: Date;
};

export type AggregateResult = {
  median: number;
  avg: number;
  min: number;
  max: number;
  n: number;
};

export type QualityStatus = 'OK' | 'DEGRADED' | 'ERROR';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type LatestRateResult = {
  timestampUtc: Date;
  officialBcb: number | null;
  parallel: {
    buy: number | null;
    sell: number | null;
    mid: number | null;
    range: {
      buy: { min: number | null; max: number | null };
      sell: { min: number | null; max: number | null };
    };
  };
  delta: {
    vs_5m: number | null;
    vs_24h: number | null;
  };
  quality: {
    confidence: ConfidenceLevel;
    sample_size: { buy: number; sell: number };
    sources_used: PriceSource[];
    status: QualityStatus;
    notes: string | null;
  };
  errors: Array<{ source: PriceSource; reason: string }>;
};

