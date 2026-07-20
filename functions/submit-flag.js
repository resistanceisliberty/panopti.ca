// Cloudflare Pages Function: runtime killswitch for the submission tool.
// Reads KV binding FLAGS, key "submit_disabled". Set it to "1" to disable the tool
// (instant, no redeploy); delete it or set "0" to enable. no-store so flips propagate
// in seconds. Fails open (enabled) if KV is unbound or errors, so the tool never breaks
// on an infra hiccup — the build-time flag and OSM OAuth revoke are the backstops.
export async function onRequestGet({ env }) {
  let enabled = true;
  try {
    if (env.FLAGS) enabled = (await env.FLAGS.get('submit_disabled')) !== '1';
  } catch {
    enabled = true;
  }
  return new Response(JSON.stringify({ enabled }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
