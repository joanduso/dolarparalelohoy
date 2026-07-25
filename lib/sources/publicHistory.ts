export type HistoryDataRow = {
  date: string;
  buy_avg: number;
  sell_avg: number;
  sources_count: number;
};

type PublicParallelHistory = {
  points?: Array<{ t: string; v: number }>;
};

export async function getPublicParallelHistory(from: Date, to: Date): Promise<HistoryDataRow[]> {
  try {
    const response = await fetch('https://paralelo.bo/api/v1/historical.json', {
      next: { revalidate: 60 * 60 }
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as PublicParallelHistory;
    return (payload.points ?? [])
      .filter((point) => {
        const timestamp = new Date(point.t).getTime();
        return Number.isFinite(point.v) && point.v > 0 && timestamp >= from.getTime() && timestamp <= to.getTime();
      })
      .map((point) => ({
        date: point.t,
        buy_avg: point.v,
        sell_avg: point.v,
        sources_count: 1
      }));
  } catch (error) {
    console.warn('[public-history] parallel history unavailable', String(error));
    return [];
  }
}

const MONTHS_ES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

function parseSpanishDate(text: string): Date | null {
  const match = text.trim().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(\d{4})/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS_ES[monthName.toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(year), month, Number(day)));
}

function parseBcbNumber(text: string): number | null {
  const normalized = text.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * BCB's public "Bolsín - información por períodos" endpoint. Before ~29 Jun
 * 2026 it published separate compra/venta bolsín rates; after that date it
 * publishes a single official rate. Both formats are parsed and reduced to
 * one representative value per day.
 */
export async function getPublicOficialHistory(from: Date, to: Date): Promise<HistoryDataRow[]> {
  const start = { d: from.getUTCDate(), m: from.getUTCMonth() + 1, y: from.getUTCFullYear() };
  const end = { d: to.getUTCDate(), m: to.getUTCMonth() + 1, y: to.getUTCFullYear() };
  const url =
    `https://www.bcb.gob.bo/librerias/indicadores/dolar/periodos.php?` +
    `sdd=${start.d}&smm=${start.m}&saa=${start.y}&edd=${end.d}&emm=${end.m}&eaa=${end.y}&qlist=1`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!response.ok) return [];
    const html = await response.text();

    const rows: HistoryDataRow[] = [];
    const rowMatches = html.matchAll(/<tr class="listas-fila\d">([\s\S]*?)<\/tr>/g);
    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[1];
      const dateMatch = rowHtml.match(/(\d{1,2}\s+de\s+[a-záéíóú]+\s+\d{4})/i);
      if (!dateMatch) continue;
      const date = parseSpanishDate(dateMatch[1]);
      if (!date) continue;

      const values = [...rowHtml.matchAll(/<strong>Bs<\/strong>\s*([\d.,]+)/g)]
        .map((m) => parseBcbNumber(m[1]))
        .filter((v): v is number => v !== null && v > 0);

      if (values.length === 0) continue;
      const value = values.length >= 2 ? (values[0] + values[1]) / 2 : values[0];

      rows.push({
        date: date.toISOString(),
        buy_avg: value,
        sell_avg: value,
        sources_count: 1
      });
    }

    return rows.filter((row) => {
      const timestamp = new Date(row.date).getTime();
      return timestamp >= from.getTime() && timestamp <= to.getTime();
    });
  } catch (error) {
    console.warn('[public-history] oficial history unavailable', String(error));
    return [];
  }
}
