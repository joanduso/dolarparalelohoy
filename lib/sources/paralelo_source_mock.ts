import type { RawRatePoint, SourceAdapter } from './base';

function mockValue(base: number, variance: number) {
  const delta = (Math.random() - 0.5) * variance;
  return Number((base + delta).toFixed(2));
}

async function fetchMock(): Promise<RawRatePoint> {
  const now = new Date();
  return {
    kind: 'PARALELO',
    timestamp: now.toISOString(),
    buy: mockValue(11.8, 0.3),
    sell: mockValue(12.1, 0.3),
    source: 'mock-paralelo',
    currencyPair: 'USD/BOB',
    country: 'BO',
    raw: { note: 'mock data' }
  };
}

export const paraleloSourceMock: SourceAdapter = {
  id: 'mock-paralelo',
  kind: 'PARALELO',
  fetchLatest: fetchMock,
  compliance: {
    async checkAllowed() {
      return { allowed: true, reason: 'mock_source' };
    }
  }
};
