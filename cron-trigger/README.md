# panopti cameras cron-trigger

A tiny Cloudflare Worker that reliably triggers the **"Update Canada ALPR + CCTV
data"** GitHub Actions workflow.

## Why

GitHub's own `schedule:` cron is best-effort — it routinely delays or silently
drops scheduled runs, which leaves `cameras-ca.json` (and the map) stale. The
workflow already keeps its three GitHub crons as one line of defence; this Worker
adds a second, independent, **reliable** trigger via the GitHub REST API. The
refresh is idempotent (it only commits when the data actually changes), so firing
it from multiple sources is safe.

## One-time setup

1. **Create a GitHub token.** A *fine-grained* personal access token scoped to the
   `resistanceisliberty/panopti.ca` repo with **Repository permissions → Actions:
   Read and write** (a classic token with the `workflow` scope also works).

2. **Store it as a Worker secret** (never commit it):

   ```sh
   cd cron-trigger
   wrangler secret put GH_DISPATCH_TOKEN
   # paste the PAT when prompted
   ```

   Optional manual-trigger key:

   ```sh
   wrangler secret put TRIGGER_KEY      # then GET https://<worker>/?key=<value>
   ```

3. **Deploy:**

   ```sh
   wrangler deploy
   ```

That's it. The Worker fires at 09:00 and 21:00 UTC (see `wrangler.toml`),
dispatching the workflow on `main`. Adjust the `crons` list as desired.

## Verify

- `wrangler tail` to watch invocations, or
- visit the Worker URL (returns "alive"), or
- with `TRIGGER_KEY` set: `curl "https://<worker-url>/?key=<TRIGGER_KEY>"` and watch
  a run appear under the repo's Actions tab.

## Notes

- `workflow_dispatch` is already enabled on the workflow, so no workflow change is
  needed for this to work.
- A successful dispatch returns HTTP 204 from GitHub; anything else is logged.
