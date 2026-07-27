---
name: deploy-verify
description: Efficiently verify a Vercel deploy after pushing to main on the dolarparalelohoy project — polls the specific deployment instead of listing all deployments, curls production to confirm the change is live, and checks for new runtime errors. Use this whenever you just ran `git push origin main` in this repo and need to confirm the deploy succeeded, or when the user asks "confirm it deployed", "check production", "is the site up", or similar after a push. Also applicable (with different IDs) to other Vercel-hosted Next.js projects that need the same lightweight verify loop.
---

# Deploy Verify

Confirms a Vercel deployment went out cleanly, without burning tokens on the
full deployment-history listing. The core inefficiency this avoids: calling
`list_deployments` repeatedly just to poll status — that endpoint returns
~20 deployments with large metadata blobs each time. Instead, grab the new
deployment's ID once, then poll that single deployment.

## This project's defaults

- **projectId**: `prj_GIUvs3TTBXL7AJGXYr3SdHefUjZE`
- **teamId**: `team_pF5VnwAfytjGf0dJDyeXSCdw`
- **Production URL**: `https://dolarparalelohoy.com`

(For other repos, look these up once via `list_projects` / `.vercel/project.json` and reuse them the same way.)

## Before pushing: `tsc --noEmit` is not enough

`npx tsc --noEmit` only catches type errors — it does not run ESLint.
Vercel's build (`npm run vercel-build` → `next build`) runs lint as part
of the build and fails the whole deploy on lint errors that `tsc` never
sees (e.g. `react/no-unescaped-entities` from a literal `"` in JSX text,
unused vars if the project enables that rule). Run `npx next lint` too
before pushing, not just `tsc --noEmit` — this has caused an avoidable
`ERROR` deployment before. Note `next lint` may rewrite `tsconfig.json`
(adding `.next/types` plugin config) as a side effect; `git checkout --
tsconfig.json next-env.d.ts` afterward if you don't intend to commit that.

## Procedure

1. **Push, then get the new deployment's ID — once.**
   Immediately after `git push origin main`, call `list_deployments` a
   single time (not repeatedly) to read off the `id` of the newest
   deployment (it'll be the one whose `githubCommitSha` matches your
   just-pushed commit, or simply the most recent one). Store that ID —
   every subsequent status check uses `get_deployment` with this ID, never
   `list_deployments` again for this push.

2. **Poll that one deployment until READY.**
   Call `get_deployment` with the stored ID every ~15-20s until
   `readyState` is `READY` (or `ERROR`). Don't do one long blind sleep —
   use a short poll loop (Monitor until-loop, or a few short Bash waits)
   so you notice quickly if the build fails instead of waiting the full
   window regardless.
   - If `readyState` is `ERROR`, stop here and pull `get_deployment_build_logs`
     for that ID to see why, rather than proceeding to curl checks.

3. **Curl production to confirm the change is actually live.**
   Once READY, verify with plain `curl` — no browser needed for a status
   check:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "https://dolarparalelohoy.com/"
   ```
   Then check the specific page/endpoint your change touched, grepping
   for a string that only appears if the change shipped:
   ```bash
   curl -s "https://dolarparalelohoy.com/<path>" | grep -o "<distinguishing string>"
   ```
   Example: after a copy change, grep for the new sentence; after an API
   change, curl the endpoint and check the JSON field/value.

4. **Check for new runtime errors.**
   Call `get_runtime_errors` with `projectId`/`teamId` and `since: "10m"`
   (or a window covering just this deploy). Skim for error groups whose
   `lastDeployment` matches the ID from step 1 — those are new, not
   pre-existing noise from older deploys.

5. **Report a short pass/fail summary.** Example:
   ```
   Deploy dpl_xxxx READY (built in 47s).
   curl / → 200. curl /devs → 200, found "Planes" table.
   No new runtime errors on this deployment.
   ```
   If anything failed, say exactly what (build error, wrong status code,
   missing string, or a new error group) so the next step is obvious.

## Why this order

Checking the build status before curling avoids racing a deploy that's
still building. Checking runtime errors last (not first) means you're
looking at logs from the live, current deployment rather than a stale
build in progress.
