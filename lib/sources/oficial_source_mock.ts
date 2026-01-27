import type { RawRatePoint, SourceAdapter } from './base';

function mockValue(base: number, variance: number) {
  const delta = (Math.random() - 0.5) * variance;
  return Number((base + delta).toFixed(2));
}

async function fetchMock(): Promise<RawRatePoint> {
  const now = new Date();
  return {
    kind: 'OFICIAL',
    timestamp: now.toISOString(),
    buy: mockValue(6.86, 0.05),
    sell: mockValue(6.96, 0.05),
    source: 'mock-oficial',
    currencyPair: 'USD/BOB',
    country: 'BO',
    raw: { note: 'mock data' }
  };
}

export const oficialSourceMock: SourceAdapter = {
  id: 'mock-oficial',
  kind: 'OFICIAL',
  fetchLatest: fetchMock,
  compliance: {
    async checkAllowed() {
      return { allowed: true, reason: 'mock_source' };
    }
  }
};
