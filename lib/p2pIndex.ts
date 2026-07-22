export type P2PIndex = {
  timestamp: string;
  buy: number;
  sell: number;
  median: number;
  sourceCount: number;
};

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

    return data as P2PIndex;
  } catch (error) {
    console.warn('[p2p-index] unavailable', String(error));
    return null;
  }
}
