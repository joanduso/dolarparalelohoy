import { fetchP2PIndex } from '@/lib/p2pIndex';
import { siteConfig } from '@/lib/seo';

type CurrentRatesResponse = {
  updatedAt: string | null;
  paralelo: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
    sampleSize: number;
  } | null;
};

export type ShareRate = {
  buy: number;
  sell: number;
  updatedAt: string;
  sourceCount: number;
  sourceLabel: string;
};

function isValidRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export async function getShareRate(): Promise<ShareRate | null> {
  const index = await fetchP2PIndex();

  if (index && isValidRate(index.buy) && isValidRate(index.sell)) {
    return {
      buy: index.buy,
      sell: index.sell,
      updatedAt: index.timestamp,
      sourceCount: index.sourceCount,
      sourceLabel: 'Índice P2P multi-exchange'
    };
  }

  try {
    const response = await fetch(`${siteConfig.url}/api/rates/current?v=share-card`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;

    const data = (await response.json()) as CurrentRatesResponse;
    const paralelo = data.paralelo;
    if (!paralelo || !isValidRate(paralelo.buy) || !isValidRate(paralelo.sell)) {
      return null;
    }

    return {
      buy: paralelo.buy,
      sell: paralelo.sell,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      sourceCount: paralelo.sources_count || (paralelo.sampleSize > 0 ? 1 : 0),
      sourceLabel: 'Respaldo Binance P2P'
    };
  } catch (error) {
    console.warn('[share-rate] unavailable', String(error));
    return null;
  }
}
