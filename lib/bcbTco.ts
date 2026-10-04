const BCB_TCO_DETAIL_URL = 'https://www.bcb.gob.bo/bcb_tco_publico_detalle_historico.php';

export type BcbBankBreakdown = {
  name: string;
  shortName: string;
  usd: number;
  sharePct: number;
  operations: number;
  medianRate: number | null;
  averageRate: number | null;
  belowUsd: number;
  atUsd: number;
  aboveUsd: number;
  tcoWithoutBank: number | null;
  effectCents: number | null;
};

export type BcbTcoBreakdown = {
  cutoffDate: string;
  validity: string;
  tco: number;
  weightedAverage: number;
  totalUsd: number;
  totalOperations: number;
  banks: BcbBankBreakdown[];
  medianBanks: string[];
  sourceUrl: string;
};

type BankCell = {
  bank: string;
  rate: number;
  operations: number;
  usd: number;
};

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ';' && !quoted) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }

  fields.push(field.trim());
  return fields;
}

function cleanNumeric(value: string) {
  return value.replace(/^=/, '').replace(/"/g, '').trim();
}

function parseInteger(value: string) {
  const cleaned = cleanNumeric(value);
  if (!cleaned || cleaned === '-') return 0;
  const parsed = Number(cleaned.replace(/\./g, '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRate(value: string) {
  const cleaned = cleanNumeric(value);
  if (!cleaned || cleaned === '-') return null;
  const parsed = Number(cleaned.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function weightedMedian(cells: BankCell[]) {
  const usable = cells.filter((cell) => cell.usd > 0).sort((a, b) => a.rate - b.rate);
  const total = usable.reduce((sum, cell) => sum + cell.usd, 0);
  if (total <= 0) return null;

  let accumulated = 0;
  for (const cell of usable) {
    accumulated += cell.usd;
    if (accumulated >= total / 2) return cell.rate;
  }

  return usable.at(-1)?.rate ?? null;
}

function roundPublishedRate(value: number | null) {
  return value === null ? null : Math.round((value + Number.EPSILON) * 100) / 100;
}

function shortBankName(name: string) {
  const normalized = name.replace(/^BANCO\s+/i, '').trim();
  const aliases: Record<string, string> = {
    BISA: 'BISA',
    FIE: 'FIE',
    'DE CREDITO': 'Crédito',
    'DE LA NACIÓN ARGENTINA': 'Nación Argentina',
    ECONOMICO: 'Económico',
    FORTALEZA: 'Fortaleza',
    GANADERO: 'Ganadero',
    'MERCANTIL SANTA CRUZ': 'Mercantil Santa Cruz',
    'NACIONAL DE BOLIVIA': 'BNB',
    PRODEM: 'Prodem',
    'PYME DE LA COMUNIDAD': 'Comunidad',
    'PYME ECOFUTURO': 'Ecofuturo',
    SOLIDARIO: 'Solidario',
    UNION: 'Unión'
  };

  return aliases[normalized] ?? normalized.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function buildBreakdown(header: string[], rows: string[][]): BcbTcoBreakdown | null {
  const totalIndex = header.findIndex((value) => value === 'TOTAL BANCOS');
  if (totalIndex < 5) return null;

  const banks: { name: string; column: number }[] = [];
  for (let column = 3; column < totalIndex; column += 2) {
    const name = header[column];
    if (name) banks.push({ name, column });
  }

  const cells: BankCell[] = [];
  let cutoffDate = '';
  let validity = '';

  for (const row of rows) {
    const rate = parseRate(row[2] ?? '');
    if (rate === null) continue;
    cutoffDate ||= row[0] ?? '';
    validity ||= row[1] ?? '';

    for (const bank of banks) {
      const operations = parseInteger(row[bank.column] ?? '');
      const usd = parseInteger(row[bank.column + 1] ?? '');
      if (operations > 0 || usd > 0) {
        cells.push({ bank: bank.name, rate, operations, usd });
      }
    }
  }

  const totalUsd = cells.reduce((sum, cell) => sum + cell.usd, 0);
  const totalOperations = cells.reduce((sum, cell) => sum + cell.operations, 0);
  const tco = weightedMedian(cells);
  if (!cutoffDate || !validity || !tco || totalUsd <= 0) return null;

  const weightedAverage = cells.reduce((sum, cell) => sum + cell.rate * cell.usd, 0) / totalUsd;
  const breakdown = banks
    .map((bank): BcbBankBreakdown => {
      const bankCells = cells.filter((cell) => cell.bank === bank.name);
      const usd = bankCells.reduce((sum, cell) => sum + cell.usd, 0);
      const operations = bankCells.reduce((sum, cell) => sum + cell.operations, 0);
      const medianRate = weightedMedian(bankCells);
      const averageRate = usd > 0
        ? bankCells.reduce((sum, cell) => sum + cell.rate * cell.usd, 0) / usd
        : null;
      const tcoWithoutBank = roundPublishedRate(
        weightedMedian(cells.filter((cell) => cell.bank !== bank.name))
      );

      return {
        name: bank.name,
        shortName: shortBankName(bank.name),
        usd,
        sharePct: (usd / totalUsd) * 100,
        operations,
        medianRate,
        averageRate,
        belowUsd: bankCells.filter((cell) => cell.rate < tco).reduce((sum, cell) => sum + cell.usd, 0),
        atUsd: bankCells.filter((cell) => cell.rate === tco).reduce((sum, cell) => sum + cell.usd, 0),
        aboveUsd: bankCells.filter((cell) => cell.rate > tco).reduce((sum, cell) => sum + cell.usd, 0),
        tcoWithoutBank,
        effectCents: tcoWithoutBank === null
          ? null
          : (roundPublishedRate(tco) as number - tcoWithoutBank) * 100
      };
    })
    .filter((bank) => bank.usd > 0)
    .sort((a, b) => b.usd - a.usd);

  return {
    cutoffDate,
    validity,
    tco,
    weightedAverage,
    totalUsd,
    totalOperations,
    banks: breakdown,
    medianBanks: breakdown
      .filter((bank) => bank.medianRate === tco)
      .map((bank) => bank.shortName),
    sourceUrl: `${BCB_TCO_DETAIL_URL}?fecha=${cutoffDate}`
  };
}

export function parseBcbTcoCsvSeries(csv: string): BcbTcoBreakdown[] {
  const rows = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
  const headerIndex = rows.findIndex((row) => row[0] === 'Fecha de corte');
  if (headerIndex < 0) return [];

  const header = rows[headerIndex];
  const groupedRows = new Map<string, string[][]>();
  for (const row of rows.slice(headerIndex + 2)) {
    const cutoffDate = row[0] ?? '';
    if (!cutoffDate || parseRate(row[2] ?? '') === null) continue;
    const dateRows = groupedRows.get(cutoffDate) ?? [];
    dateRows.push(row);
    groupedRows.set(cutoffDate, dateRows);
  }

  return [...groupedRows.entries()]
    .map(([, dateRows]) => buildBreakdown(header, dateRows))
    .filter((value): value is BcbTcoBreakdown => Boolean(value))
    .sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate));
}

export function parseBcbTcoCsv(csv: string): BcbTcoBreakdown | null {
  return parseBcbTcoCsvSeries(csv).at(-1) ?? null;
}

function decodeDatesAttribute(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
}

async function fetchBcbTcoCutoffDates() {
  const detailResponse = await fetch(BCB_TCO_DETAIL_URL, {
    next: { revalidate: 600 },
    headers: { Accept: 'text/html' }
  });
  if (!detailResponse.ok) return [];

  const html = await detailResponse.text();
  const datesMatch = html.match(/data-fechas='([^']+)'/);
  if (!datesMatch) return [];

  const dates = JSON.parse(decodeDatesAttribute(datesMatch[1])) as string[];
  return [...new Set(dates)].sort();
}

async function fetchBcbTcoBreakdownsForRange(from: string, to: string) {
  const csvUrl = new URL('bcb_tco_publico_descargar_csv.php', BCB_TCO_DETAIL_URL);
  csvUrl.searchParams.set('desde', from);
  csvUrl.searchParams.set('hasta', to);
  const csvResponse = await fetch(csvUrl, {
    next: { revalidate: 600 },
    headers: { Accept: 'text/csv' }
  });
  if (!csvResponse.ok) return [];

  return parseBcbTcoCsvSeries(await csvResponse.text());
}

export async function fetchRecentBcbTcoBreakdowns(limit = 2): Promise<BcbTcoBreakdown[]> {
  try {
    const dates = await fetchBcbTcoCutoffDates();
    const selectedDates = dates.slice(-Math.max(1, Math.min(limit, 10)));
    if (!selectedDates.length) return [];

    const breakdowns = await fetchBcbTcoBreakdownsForRange(
      selectedDates[0],
      selectedDates[selectedDates.length - 1]
    );
    const selectedDateSet = new Set(selectedDates);
    return breakdowns
      .filter((value) => selectedDateSet.has(value.cutoffDate))
      .sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate));
  } catch (error) {
    console.warn('[bcb][tco-breakdown] fetch_failed', error);
    return [];
  }
}

export async function fetchLatestBcbTcoBreakdown(): Promise<BcbTcoBreakdown | null> {
  const breakdowns = await fetchRecentBcbTcoBreakdowns(1);
  return breakdowns.at(-1) ?? null;
}
