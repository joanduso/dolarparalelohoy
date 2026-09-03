import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

const [inputArg, outputArg = 'data/history/parallel-daily.json'] = process.argv.slice(2);

if (!inputArg) {
  console.error('Uso: node scripts/build-parallel-history.mjs <archivo.csv> [salida.json]');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const raw = await readFile(inputPath, 'utf8');
const lines = raw.trim().split(/\r?\n/);
const headers = lines.shift()?.split(',') ?? [];
const column = Object.fromEntries(headers.map((name, index) => [name.trim(), index]));

for (const required of ['datetime', 'blue_buy', 'blue_sell']) {
  if (column[required] === undefined) {
    throw new Error(`Falta la columna requerida: ${required}`);
  }
}

const observationsByDay = new Map();
let rejectedRows = 0;

for (const line of lines) {
  const cells = line.split(',');
  const day = cells[column.datetime]?.slice(0, 10);
  const buy = Number(cells[column.blue_buy]);
  const sell = Number(cells[column.blue_sell]);
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(day ?? '');
  const validRates = Number.isFinite(buy) && Number.isFinite(sell) &&
    buy >= 3 && buy <= 30 && sell >= 3 && sell <= 30;

  if (!validDay || !validRates) {
    rejectedRows += 1;
    continue;
  }

  const observations = observationsByDay.get(day) ?? [];
  observations.push({ buy, sell });
  observationsByDay.set(day, observations);
}

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const round = (value) => Math.round(value * 10_000) / 10_000;

const data = Array.from(observationsByDay.entries())
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([day, observations]) => ({
    date: `${day}T00:00:00.000Z`,
    buy_avg: round(average(observations.map(({ buy }) => buy))),
    sell_avg: round(average(observations.map(({ sell }) => sell))),
    sources_count: 1
  }));

if (data.length === 0) throw new Error('El archivo no produjo días válidos.');
if (data.some((row) => row.buy_avg <= 0 || row.sell_avg <= 0)) {
  throw new Error('La salida contiene una cotización cero o negativa.');
}

for (let index = 1; index < data.length; index += 1) {
  const previous = new Date(data[index - 1].date).getTime();
  const current = new Date(data[index].date).getTime();
  if ((current - previous) / 86_400_000 !== 1) {
    throw new Error(`Hueco entre ${data[index - 1].date} y ${data[index].date}.`);
  }
}

const document = {
  metadata: {
    source: 'https://api.dolarbluebolivia.click/v1/chart/all.csv',
    source_page: 'https://www.dolarbluebolivia.click/datos/',
    raw_file: basename(inputPath),
    raw_sha256: createHash('sha256').update(raw).digest('hex'),
    generated_at: new Date().toISOString(),
    aggregation: 'media aritmética diaria de blue_buy y blue_sell válidos',
    validation: 'valores finitos entre Bs 3 y Bs 30; ceros y filas inválidas rechazados',
    license: 'Términos de la fuente no especifican una licencia abierta; se conserva atribución y enlace.',
    raw_observations: lines.length,
    rejected_observations: rejectedRows,
    days: data.length,
    first_date: data[0].date.slice(0, 10),
    last_date: data.at(-1).date.slice(0, 10)
  },
  data
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(document.metadata, null, 2));
