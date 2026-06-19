// Reliable backup trigger for the "Update Canada ALPR + CCTV data" workflow.
//
// GitHub's own `schedule:` cron is best-effort and routinely delays or silently
// drops runs, which leaves the map stale. Cloudflare Cron Triggers are reliable,
// so this Worker dispatches the workflow via the GitHub REST API on a schedule.
// The workflow is idempotent (it only commits when the data changes), so firing
// it from here in addition to GitHub's own crons is harmless.
//
// One-time setup — see README.md:
//   1. Create a fine-grained GitHub PAT scoped to resistanceisliberty/panopti.ca
//      with "Actions: Read and write".
//   2. wrangler secret put GH_DISPATCH_TOKEN   (paste the PAT)
//   3. wrangler deploy

const REPO = 'resistanceisliberty/panopti.ca';
const WORKFLOW = 'update-cameras-ca.yml';
const REF = 'main';

async function dispatch(env) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'panopti-cameras-cron',
      },
      body: JSON.stringify({ ref: REF }),
    },
  );
  // A successful workflow_dispatch returns 204 No Content.
  if (res.status !== 204) {
    const body = await res.text();
    console.error(`workflow_dispatch failed: HTTP ${res.status} ${body}`);
    return false;
  }
  console.log(`Dispatched ${WORKFLOW} on ${REPO}@${REF}`);
  return true;
}

export default {
  // Cron-driven path (the reliability mechanism).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatch(env));
  },

  // Optional manual trigger for testing: GET /?key=<TRIGGER_KEY>.
  // Guarded so the endpoint can't be spammed; if TRIGGER_KEY is unset, manual
  // triggering is simply disabled and only the cron path runs.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (env.TRIGGER_KEY && url.searchParams.get('key') === env.TRIGGER_KEY) {
      const ok = await dispatch(env);
      return new Response(ok ? 'dispatched\n' : 'dispatch failed\n', {
        status: ok ? 200 : 502,
      });
    }
    return new Response('panopti cameras cron-trigger: alive\n', { status: 200 });
  },
};
