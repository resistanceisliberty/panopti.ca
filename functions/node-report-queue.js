// Cloudflare Pages Function — admin review of anonymous node reports (KV: FLOCK_QUEUE, prefix report:).
// Auth mirrors flock-queue: caller's OSM OAuth Bearer token, verified against OSM and checked
// against ADMIN_OSM_USERS. GET lists reports; POST {id,status:'resolved'|'dismissed'} records outcome.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function adminName(request, env) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const apiBase = (env.OSM_API_BASE || 'https://api.openstreetmap.org').replace(/\/$/, '');
  let name;
  try {
    const res = await fetch(`${apiBase}/api/0.6/user/details.json`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    name = (await res.json())?.user?.display_name;
  } catch { return null; }
  if (!name) return null;
  const allow = (env.ADMIN_OSM_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(String(name).toLowerCase()) ? name : null;
}

export async function onRequestGet({ request, env }) {
  if (!env.FLOCK_QUEUE) return json({ error: 'not configured' }, 503);
  const who = await adminName(request, env);
  if (!who) return json({ error: 'forbidden' }, 403);
  const list = await env.FLOCK_QUEUE.list({ prefix: 'report:' });
  const items = (await Promise.all(
    list.keys.map((k) => env.FLOCK_QUEUE.get(k.name).then((v) => (v ? JSON.parse(v) : null)))
  )).filter(Boolean);
  items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return json({ admin: who, items });
}

export async function onRequestPost({ request, env }) {
  if (!env.FLOCK_QUEUE) return json({ error: 'not configured' }, 503);
  const who = await adminName(request, env);
  if (!who) return json({ error: 'forbidden' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
  const { id, status } = body || {};
  if (!id || !['resolved', 'dismissed'].includes(status)) return json({ error: 'bad request' }, 400);
  const key = `report:${id}`;
  const raw = await env.FLOCK_QUEUE.get(key);
  if (!raw) return json({ error: 'not found' }, 404);
  const rep = JSON.parse(raw);
  rep.status = status;
  rep.reviewedBy = who;
  rep.reviewedAt = new Date().toISOString();
  await env.FLOCK_QUEUE.put(key, JSON.stringify(rep));
  return json({ ok: true, item: rep });
}
