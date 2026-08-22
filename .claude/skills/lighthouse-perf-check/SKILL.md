# Lighthouse Perf Check

Runs a real mobile Lighthouse audit against a local production build, with
the process/cache hygiene this project actually needs. Two bugs cost most
of the time the first time this was done manually — this skill exists to
not repeat them.

## The two gotchas this exists to avoid

1. **Zombie server on the port.** `pkill -f "next start -p 3100"` does
   **not** reliably match the running process — after `next start` boots,
   the OS process is named `next-server (vX.Y.Z)`, not `next start`. A
   `pkill` by that pattern silently fails, an old server keeps listening,
   and every subsequent "after" test quietly measures the **old** code.
   Always kill by port, and verify the port is empty before trusting a
   fresh start:
   ```bash
   lsof -ti :3100 | xargs -r kill -9
   sleep 1
   lsof -i :3100   # must print nothing
   ```
   After starting the new server, confirm the PID is the one you expect:
   ```bash
   nohup npm run start -- -p 3100 > /tmp/dpf-server.log 2>&1 &
   disown
   sleep 5
   lsof -ti :3100   # note this PID
   ```

2. **`.next/cache/fetch-cache` persists across restarts.** Any `fetch()`
   call using `next: { revalidate: N }` is cached to *disk*, not just
   in-memory — restarting or even rebuilding the server does **not**
   clear it within the revalidate window. If you're testing how the app
   behaves with a cold cache (e.g. right after a deploy, or simulating a
   slow upstream dependency), you must delete it explicitly:
   ```bash
   rm -rf .next/cache
   ```
   Without this, a route can have `export const dynamic = 'force-dynamic'`
   and still appear to ignore an artificial delay you just added to it —
   the *route* re-executes, but the *page's* internal fetch to that route
   is served from the stale disk cache.

## Procedure

1. **Build.**
   ```bash
   rm -rf .next   # also clears fetch-cache — use when testing cold-cache behavior
   npm run build
   ```
2. **Start clean**, per the port-hygiene steps above.
3. **Confirm readiness** with a cheap request before running Lighthouse —
   don't hit `/` first if you need `/` to be the very first (cache-cold)
   request Lighthouse makes:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100/robots.txt" --max-time 10
   ```
4. **Run Lighthouse.** Use `--throttling-method=devtools` for a realistic
   result (real CPU/network throttling applied to every request, including
   third-party ones) — `--throttling-method=simulate` is faster but
   mathematically estimates timing from an unthrottled trace, which can
   hide or invent LCP/FCP effects that don't reflect real conditions.
   ```bash
   npx --yes lighthouse http://localhost:3100/<path> \
     --preset=perf --form-factor=mobile --screenEmulation.mobile \
     --screenEmulation.width=412 --screenEmulation.height=823 --screenEmulation.deviceScaleFactor=2.625 \
     --throttling-method=devtools \
     --output=json --output-path=./result.json \
     --chrome-flags="--headless --no-sandbox" --quiet
   ```
5. **Extract the numbers** (the report JSON is large — pull only what you need):
   ```bash
   python3 - <<'PYEOF'
   import json
   d = json.load(open('result.json'))
   print("Performance:", d['categories']['performance']['score']*100)
   for k in ['largest-contentful-paint','first-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index']:
       print(f"  {k}: {d['audits'][k]['displayValue']}")
   print("TTFB:", d['audits']['server-response-time']['displayValue'])
   PYEOF
   ```
6. **For LCP-element diagnosis**, don't guess — read
   `d['audits']['lcp-breakdown-insight']` (TTFB vs element-render-delay
   split, plus the actual DOM node) and `d['audits']['unused-javascript']`
   / `d['audits']['network-requests']` for what's actually competing for
   bandwidth. Newer Lighthouse versions (13+) replaced the old
   `largest-contentful-paint-element` audit with `lcp-breakdown-insight`
   and `lcp-discovery-insight`.

## Proving a fix under realistic conditions, not just "it got faster"

If a slow upstream dependency (a scrape, a third-party API) is a suspected
LCP cause, don't rely on measuring against whatever latency that dependency
happens to have *right now* — it's frequently fast and hides the problem.
Prove it directly:

1. Add a temporary `await new Promise(r => setTimeout(r, 3500))` at the top
   of the suspected slow route's handler (comment it clearly as temporary).
2. `rm -rf .next/cache`, rebuild, restart, run Lighthouse (steps above) —
   this is "before."
3. Apply the real fix (e.g. Suspense streaming so the slow fetch no longer
   blocks the critical path).
4. `rm -rf .next/cache`, rebuild, restart, run Lighthouse again with the
   *same* artificial delay still in place — this is "after."
5. Revert the artificial delay before committing anything.

A fix that's real shows the "after" run essentially unaffected by the
delay (TTFB near-zero) while "before" shows TTFB ≈ the delay itself.
