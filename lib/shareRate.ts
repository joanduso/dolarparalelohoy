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

export type ShareSnapshot = ShareRate & {
  changeAbs: number | null;
  changePct: number | null;
  gapAbs: number | null;
  gapPct: number | null;
};

type HistoryResponse = {
  data?: Array<{ date: string; sell_avg: number }>;
};

type BrechaResponse = {
  brecha?: { gap_abs: number | null; gap_pct: number | null } | null;
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

export async function getShareSnapshot(): Promise<ShareSnapshot | null> {
  const rate = await getShareRate();
  if (!rate) return null;

  let changeAbs: number | null = null;
  let changePct: number | null = null;
  let gapAbs: number | null = null;
  let gapPct: number | null = null;

  try {
    const [historyResponse, brechaResponse] = await Promise.all([
      fetch(`${siteConfig.url}/api/rates/history?kind=PARALELO&days=3&v=share-snapshot`, {
        next: { revalidate: 60 }
      }),
      fetch(`${siteConfig.url}/api/brecha/latest?v=share-snapshot`, {
        next: { revalidate: 60 }
      })
    ]);

    if (historyResponse.ok) {
      const history = (await historyResponse.json()) as HistoryResponse;
      const byDay = new Map<string, number>();
      for (const row of history.data ?? []) {
        if (Number.isFinite(row.sell_avg) && row.sell_avg > 0) {
          byDay.set(row.date.slice(0, 10), row.sell_avg);
        }
      }
      const dailyValues = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
      const previous = dailyValues.at(-2)?.[1] ?? null;
      if (previous && previous > 0) {
        changeAbs = rate.sell - previous;
        changePct = (changeAbs / previous) * 100;
      }
    }

    if (brechaResponse.ok) {
      const brecha = (await brechaResponse.json()) as BrechaResponse;
      gapAbs = brecha.brecha?.gap_abs ?? null;
      gapPct = brecha.brecha?.gap_pct ?? null;
    }
  } catch (error) {
    console.warn('[share-rate] context unavailable', String(error));
  }

  return { ...rate, changeAbs, changePct, gapAbs, gapPct };
}
