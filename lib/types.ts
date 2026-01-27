export type RateKind = 'PARALELO' | 'OFICIAL';
export type DeclaredSide = 'BUY' | 'SELL';
export type DeclaredSourceType = 'P2P' | 'CasaCambio' | 'Calle' | 'Otro';
export type RatePoint = {
  timestamp: Date;
  buy: number;
  sell: number;
  source: string;
};
export type DailyAggregate = {
  date: Date;
  sell_avg: number;
};
export type DeclaredRate = {
  value: number;
  created_at: Date;
};
