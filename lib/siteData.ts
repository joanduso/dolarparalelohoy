import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { computeLatest } from '@/lib/engine/priceEngine';
import { getHistory, getLatestRun, type RateHistoryRow } from '@/lib/engine/store';
import {
  getPublicOficialHistory,
  getPublicParallelHistory,
  type HistoryDataRow
} from '@/lib/sources/publicHistory';

export const CURRENT_DATA_REVALIDATE_SECONDS = 10 * 60;
export const HISTORY_DATA_REVALIDATE_SECONDS = 6 * 60 * 60;

export type CurrentRatesData = {
  updatedAt: string | null;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  sources: {
    bcb: 'OK' | 'ERROR';
    binance_p2p: 'OK' | 'ERROR';
  };
  paralelo: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
    sampleSize: number;
  } | null;
  oficial: {
    buy: number | null;
    sell: number | null;
    sources_count: number;
  } | null;
  brecha: {
    gap_abs: number | null;
    gap_pct: number | null;
  } | null;
  notes: string | null;
  errors: unknown[];
};

type HistoryKind = 'PARALELO' | 'OFICIAL';

export type PublicHistoryData = {
  data: HistoryDataRow[];
};

export type PublicBrechaHistoryRow = {
  date: string;
  official_sell: number;
  paralelo_sell: number;
  gap_abs: number;
  gap_pct: number;
};

export type SiteDataResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

function dailyRows(rows: HistoryDataRow[]) {
  const byDay = new Map<string, HistoryDataRow>();
  for (const row of rows) {
    if (row.buy_avg <= 0 || row.sell_avg <= 0) continue;
    byDay.set(row.date.slice(0, 10), row);
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function validRate(value: unknown, max: number): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 3 && number <= max ? number : null;
}

async function computeCurrentRatesData(): Promise<CurrentRatesData> {
  const { result: latest } = await computeLatest();
  let sourcesUsed: string[] = Array.isArray(latest.quality.sources_used)
    ? [...latest.quality.sources_used]
    : [];
  let updatedAt = latest.timestampUtc;
  let officialValue = validRate(latest.officialBcb, 15);
  let parallelSell = validRate(latest.parallel.sell, 30);
  let parallelBuy = validRate(latest.parallel.buy, 30);
  let sampleSizeBuy = latest.quality.sample_size.buy ?? 0;
  let sampleSizeSell = latest.quality.sample_size.sell ?? 0;
  let status = latest.quality.status;
  let notes = latest.quality.notes ?? null;

  // A last-known-good database snapshot protects the rendered HTML when a
  // public source is temporarily unavailable. Its original timestamp remains
  // visible, so stale fallback data is never presented as newly fetched.
  if (officialValue === null || parallelBuy === null || parallelSell === null) {
    try {
      const stored = await getLatestRun(prisma);
      if (stored) {
        officialValue ??= validRate(stored.officialBcb, 15);
        parallelBuy ??= validRate(stored.parallelBuy, 30);
        parallelSell ??= validRate(stored.parallelSell, 30);
        sampleSizeBuy ||= stored.sampleSizeBuy ?? 0;
        sampleSizeSell ||= stored.sampleSizeSell ?? 0;
        if (sourcesUsed.length === 0 && Array.isArray(stored.sourcesUsed)) {
          sourcesUsed = stored.sourcesUsed;
        }
        if (latest.quality.status === 'ERROR') {
          updatedAt = stored.timestampUtc;
          status = 'DEGRADED';
          notes = stored.notes ?? 'Usando la última cotización persistida.';
        }
      }
    } catch (error) {
      console.warn('[site-data] latest persisted quote unavailable', String(error));
    }
  }

  const bcbOk = sourcesUsed.includes('BCB') && officialValue !== null;
  const binanceOk = (
    sourcesUsed.includes('BINANCE') || sourcesUsed.includes('BINANCE_P2P')
  ) && parallelBuy !== null && parallelSell !== null;
  const gapAbs = officialValue !== null && parallelSell !== null
    ? parallelSell - officialValue
    : null;
  const gapPct = officialValue !== null && gapAbs !== null && officialValue > 0
    ? (gapAbs / officialValue) * 100
    : null;

  return {
    updatedAt: updatedAt.toISOString(),
    status,
    sources: {
      bcb: bcbOk ? 'OK' : 'ERROR',
      binance_p2p: binanceOk ? 'OK' : 'ERROR'
    },
    paralelo: {
      buy: parallelBuy,
      sell: parallelSell,
      sources_count: binanceOk ? 1 : 0,
      sampleSize: Math.max(
        sampleSizeBuy,
        sampleSizeSell
      )
    },
    oficial: {
      buy: officialValue,
      sell: officialValue,
      sources_count: bcbOk ? 1 : 0
    },
    brecha: {
      gap_abs: gapAbs,
      gap_pct: gapPct
    },
    notes,
    errors: latest.errors ?? []
  };
}

const getCachedCurrentRatesData = unstable_cache(
  computeCurrentRatesData,
  ['site-current-rates-v1'],
  { revalidate: CURRENT_DATA_REVALIDATE_SECONDS }
);

async function cachedOrDirect<T>(cached: () => Promise<T>, direct: () => Promise<T>) {
  try {
    return await cached();
  } catch (error) {
    // Unit tests call route handlers without a Next.js request cache. Production
    // always has it, but falling back keeps the data builders independently testable.
    if (String(error).includes('incrementalCache missing')) return direct();
    throw error;
  }
}

export async function getCurrentRatesData() {
  return cachedOrDirect(getCachedCurrentRatesData, computeCurrentRatesData);
}

async function computeHistoryData(
  kind: HistoryKind,
  days: number
): Promise<PublicHistoryData> {
  const safeDays = Math.max(1, Math.min(Math.trunc(days), 900));
  const to = new Date();
  const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);

  let rows: RateHistoryRow[] = [];
  try {
    rows = await getHistory(prisma, from, to, '1d');
  } catch (error) {
    console.warn('[site-data] persistent history unavailable', String(error));
  }

  const storedData: HistoryDataRow[] = rows.map((row) => ({
    date: row.timestampUtc.toISOString(),
    buy_avg: kind === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelBuy ?? 0,
    sell_avg: kind === 'OFICIAL' ? row.officialBcb ?? 0 : row.parallelSell ?? 0,
    sources_count: kind === 'OFICIAL' ? (row.officialBcb === null ? 0 : 1) : row.sampleSizeSell ?? 0
  }));

  const publicHistory = kind === 'PARALELO'
    ? await getPublicParallelHistory(from, to)
    : await getPublicOficialHistory(from, to);

  let liveRows: HistoryDataRow[] = [];
  try {
    const current = await getCurrentRatesData();
    const liveBuy = kind === 'OFICIAL' ? current.oficial?.buy : current.paralelo?.buy;
    const liveSell = kind === 'OFICIAL' ? current.oficial?.sell : current.paralelo?.sell;
    if (current.updatedAt && liveBuy !== null && liveBuy !== undefined && liveSell !== null && liveSell !== undefined) {
      liveRows = [{
        date: current.updatedAt,
        buy_avg: liveBuy,
        sell_avg: liveSell,
        sources_count: kind === 'OFICIAL'
          ? current.oficial?.sources_count ?? 0
          : current.paralelo?.sampleSize ?? 0
      }];
    }
  } catch (error) {
    console.warn('[site-data] live history row unavailable', String(error));
  }

  return { data: dailyRows([...publicHistory, ...storedData, ...liveRows]) };
}

const getCachedHistoryData = unstable_cache(
  computeHistoryData,
  ['site-rate-history-v1'],
  { revalidate: HISTORY_DATA_REVALIDATE_SECONDS }
);

export async function getRateHistoryData(kind: HistoryKind, days: number) {
  return cachedOrDirect(
    () => getCachedHistoryData(kind, days),
    () => computeHistoryData(kind, days)
  );
}

async function computeBrechaHistoryData(days: number) {
  const [official, parallel] = await Promise.all([
    getRateHistoryData('OFICIAL', days),
    getRateHistoryData('PARALELO', days)
  ]);
  const officialByDay = new Map(
    official.data.map((row) => [row.date.slice(0, 10), row.sell_avg])
  );
  const parallelByDay = new Map(
    parallel.data.map((row) => [row.date.slice(0, 10), row.sell_avg])
  );
  const data: PublicBrechaHistoryRow[] = [];

  for (const [day, officialSell] of officialByDay) {
    const parallelSell = parallelByDay.get(day);
    if (!parallelSell || officialSell <= 0) continue;
    const gapAbs = parallelSell - officialSell;
    data.push({
      date: new Date(`${day}T00:00:00.000Z`).toISOString(),
      official_sell: officialSell,
      paralelo_sell: parallelSell,
      gap_abs: gapAbs,
      gap_pct: (gapAbs / officialSell) * 100
    });
  }

  return { data: data.sort((a, b) => a.date.localeCompare(b.date)) };
}

const getCachedBrechaHistoryData = unstable_cache(
  computeBrechaHistoryData,
  ['site-brecha-history-v1'],
  { revalidate: HISTORY_DATA_REVALIDATE_SECONDS }
);

export async function getBrechaHistoryData(days: number) {
  return cachedOrDirect(
    () => getCachedBrechaHistoryData(days),
    () => computeBrechaHistoryData(days)
  );
}

function success<T>(data: T): SiteDataResult<T> {
  return { ok: true, status: 200, data };
}

function formatBcbValue(value: number) {
  return `Bs ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Serves the same data shapes used by the public pages without making an HTTP
 * request back into this Vercel deployment. This keeps the page HTML intact
 * while allowing Next.js to reuse processed data across requests and routes.
 */
export async function getSiteData<T>(path: string): Promise<SiteDataResult<T>> {
  try {
    const url = new URL(path, 'https://internal.invalid');

    if (url.pathname === '/api/rates/current') {
      return success(await getCurrentRatesData() as T);
    }

    if (url.pathname === '/api/rates/history') {
      const kind = url.searchParams.get('kind')?.toUpperCase() === 'OFICIAL'
        ? 'OFICIAL'
        : 'PARALELO';
      const requestedDays = Number(url.searchParams.get('days') ?? '365');
      const days = Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : 365;
      return success(await getRateHistoryData(kind, days) as T);
    }

    if (url.pathname === '/api/brecha/history') {
      const requestedDays = Number(url.searchParams.get('days') ?? '365');
      const days = Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : 365;
      return success(await getBrechaHistoryData(days) as T);
    }

    if (url.pathname === '/api/brecha/latest') {
      const current = await getCurrentRatesData();
      const brecha = current.brecha && current.brecha.gap_abs !== null && current.brecha.gap_pct !== null
        ? {
            ...current.brecha,
            date: current.updatedAt ?? new Date().toISOString()
          }
        : null;
      return success({ brecha } as T);
    }

    if (url.pathname === '/api/bcb/valor-referencial') {
      const current = await getCurrentRatesData();
      const buy = current.oficial?.buy;
      const sell = current.oficial?.sell;
      if (buy === null || buy === undefined || sell === null || sell === undefined) {
        return { ok: false, status: 503, data: null, error: 'source_unavailable' };
      }
      return success({
        source: 'BCB',
        dateText: current.updatedAt,
        compraText: formatBcbValue(buy),
        ventaText: formatBcbValue(sell),
        compra: buy,
        venta: sell,
        fetchedAt: current.updatedAt
      } as T);
    }

    return { ok: false, status: 404, data: null, error: 'unsupported_site_data_path' };
  } catch (error) {
    console.error('[site-data] failed', { path, error: String(error) });
    return { ok: false, status: 503, data: null, error: 'site_data_unavailable' };
  }
}
