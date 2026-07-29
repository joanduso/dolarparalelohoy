export type P2PIndex = {
  timestamp: string;
  buy: number;
  sell: number;
  median: number;
  sourceCount: number;
};

export type ParallelQuote = {
  buy: number;
  sell: number;
  updatedAt: string;
  sourceCount: number;
};

export const P2P_INDEX_MAX_AGE_MS = 30 * 60 * 1000;
const P2P_INDEX_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export function isP2PIndexFresh(
  index: Pick<P2PIndex, 'timestamp'>,
  nowMs = Date.now(),
  maxAgeMs = P2P_INDEX_MAX_AGE_MS
) {
  const timestampMs = Date.parse(index.timestamp);
  if (!Number.isFinite(timestampMs)) return false;

  const ageMs = nowMs - timestampMs;
  return ageMs >= -P2P_INDEX_MAX_FUTURE_SKEW_MS && ageMs <= maxAgeMs;
}

export async function fetchP2PIndex(): Promise<P2PIndex | null> {
  try {
    const response = await fetch('https://paralelo.bo/api/v1/rate', {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Partial<P2PIndex>;
    if (
      typeof data.buy !== 'number' ||
      typeof data.sell !== 'number' ||
      typeof data.median !== 'number' ||
      typeof data.sourceCount !== 'number' ||
      !data.timestamp
    ) {
      return null;
    }

    const index = data as P2PIndex;
    if (!isP2PIndexFresh(index)) {
      console.warn('[p2p-index] stale quote ignored', index.timestamp);
      return null;
    }

    return index;
  } catch (error) {
    console.warn('[p2p-index] unavailable', String(error));
    return null;
  }
}

export async function getParallelQuote(): Promise<ParallelQuote | null> {
  const index = await fetchP2PIndex();
  if (!index) return null;

  return {
    buy: index.buy,
    sell: index.sell,
    updatedAt: index.timestamp,
    sourceCount: index.sourceCount
  };
}
