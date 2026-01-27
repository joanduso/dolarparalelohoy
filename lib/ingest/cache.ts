import fs from 'node:fs';
import path from 'node:path';

const memory = new Map<string, { value: unknown; expiresAt: number }>();

function loadFromDisk(filePath: string) {
  if (!fs.existsSync(filePath)) return new Map();
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as Record<string, { value: unknown; expiresAt: number }>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function saveToDisk(filePath: string, map: Map<string, { value: unknown; expiresAt: number }>) {
  const obj: Record<string, { value: unknown; expiresAt: number }> = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj), 'utf-8');
}

export function getCache(key: string) {
  const now = Date.now();
  const entry = memory.get(key);
  if (entry && entry.expiresAt > now) return entry.value;

  const filePath = process.env.INGEST_CACHE_PATH;
  if (filePath) {
    const diskMap = loadFromDisk(filePath);
    const diskEntry = diskMap.get(key);
    if (diskEntry && diskEntry.expiresAt > now) return diskEntry.value;
  }

  return null;
}

export function setCache(key: string, value: unknown, ttlMs = 60_000) {
  const expiresAt = Date.now() + ttlMs;
  const entry = { value, expiresAt };
  memory.set(key, entry);

  const filePath = process.env.INGEST_CACHE_PATH;
  if (filePath) {
    const diskMap = loadFromDisk(filePath);
    diskMap.set(key, entry);
    saveToDisk(filePath, diskMap);
  }
}
