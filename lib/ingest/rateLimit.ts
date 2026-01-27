const lastRun = new Map<string, number>();

export function throttle(key: string, minDelayMs = 2000) {
  const now = Date.now();
  const last = lastRun.get(key) ?? 0;
  const wait = Math.max(minDelayMs - (now - last), 0);
  lastRun.set(key, now + wait);
  return new Promise((resolve) => setTimeout(resolve, wait));
}
