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
  provider: 'paralelo.bo' | 'binance';
};

export const P2P_INDEX_MAX_AGE_MS = 30 * 60 * 1000;
export const P2P_INDEX_REVALIDATE_SECONDS = 60;
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

function isValidRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export async function fetchP2PIndex(): Promise<P2PIndex | null> {
  try {
    const response = await fetch('https://paralelo.bo/api/v1/rate', {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: P2P_INDEX_REVALIDATE_SECONDS }
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Partial<P2PIndex>;
    if (
      !isValidRate(data.buy) ||
      !isValidRate(data.sell) ||
      !isValidRate(data.median) ||
      !Number.isInteger(data.sourceCount) ||
      (data.sourceCount ?? 0) <= 0 ||
      typeof data.timestamp !== 'string'
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

async function getOwnParallelQuote(): Promise<ParallelQuote | null> {
  try {
    const { computeLatest } = await import('./engine/priceEngine');
    const { result } = await computeLatest();
    const updatedAt = result.timestampUtc.toISOString();

    const hasBinance = result.quality.sources_used.includes('BINANCE');
    if (
      !hasBinance ||
      !isValidRate(result.parallel.buy) ||
      !isValidRate(result.parallel.sell) ||
      !isP2PIndexFresh({ timestamp: updatedAt })
    ) {
      return null;
    }

    return {
      buy: result.parallel.buy,
      sell: result.parallel.sell,
      updatedAt,
      sourceCount: 1,
      provider: 'binance'
    };
  } catch (error) {
    console.warn('[p2p-index] own quote unavailable', String(error));
    return null;
  }
}

export async function getParallelQuote(): Promise<ParallelQuote | null> {
  const index = await fetchP2PIndex();
  if (!index) return getOwnParallelQuote();

  return {
    buy: index.buy,
    sell: index.sell,
    updatedAt: index.timestamp,
    sourceCount: index.sourceCount,
    provider: 'paralelo.bo'
  };
}

/** Keep the source attribution tied to the quote, never to its sample count. */
export function describeParallelQuote(quote: ParallelQuote | null): string {
  if (!quote) return 'Cotización reciente no disponible. Intentaremos actualizar pronto.';
  if (quote.provider === 'binance') return 'Respaldo temporal: Binance P2P (mediana de anuncios recientes).';
  return `Referencia publicada por paralelo.bo con ${quote.sourceCount} ${quote.sourceCount === 1 ? 'fuente activa' : 'fuentes activas'}.`;
}
