import fs from 'node:fs';
import { prisma } from '../lib/db';
import { normalizeRaw } from '../lib/ingest/normalize';

const filePath = process.argv[2];

if (!filePath || !fs.existsSync(filePath)) {
  console.error('Usage: pnpm backfill path/to/file.csv');
  process.exit(1);
}

const raw = fs.readFileSync(filePath, 'utf-8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const [header, ...rows] = lines;
const cols = header.split(',').map((col) => col.trim());

async function run() {
  for (const row of rows) {
    const values = row.split(',').map((val) => val.trim());
    const record: Record<string, string> = {};
    cols.forEach((col, idx) => {
      record[col] = values[idx];
    });

    const normalized = normalizeRaw({
      kind: record.kind as 'PARALELO' | 'OFICIAL',
      timestamp: record.timestamp,
      buy: Number(record.buy),
      sell: Number(record.sell),
      source: record.source ?? 'csv',
      currencyPair: record.currency_pair ?? 'USD/BOB',
      country: record.country ?? 'BO',
      raw: record
    });

    await prisma.ratePoint.create({
      data: {
        kind: normalized.kind,
        timestamp: normalized.timestamp,
        buy: normalized.buy,
        sell: normalized.sell,
        source: normalized.source,
        currency_pair: normalized.currency_pair,
        country: normalized.country,
        raw: normalized.raw ?? undefined
      }
    });
  }

  await prisma.$disconnect();
}

run();
