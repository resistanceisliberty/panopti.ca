// Cloudflare Pages Function — admin review of held Flock submissions (KV: FLOCK_QUEUE).
// Auth: the caller presents their OSM OAuth token (Authorization: Bearer <token>). We
// verify it against OSM and check the display_name against ADMIN_OSM_USERS (comma-sep,
// case-insensitive). GET lists submissions; POST {id,status,osmNodeId?} marks approved/rejected.
// The approved node is written to OSM client-side by the admin; this only records the outcome.
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
  const list = await env.FLOCK_QUEUE.list({ prefix: 'sub:' });
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
  const { id, status, osmNodeId } = body || {};
  if (!id || !['approved', 'rejected'].includes(status)) return json({ error: 'bad request' }, 400);
  const key = `sub:${id}`;
  const raw = await env.FLOCK_QUEUE.get(key);
  if (!raw) return json({ error: 'not found' }, 404);
  const sub = JSON.parse(raw);
  sub.status = status;
  sub.reviewedBy = who;
  sub.reviewedAt = new Date().toISOString();
  if (osmNodeId) sub.osmNodeId = Number(osmNodeId);
  await env.FLOCK_QUEUE.put(key, JSON.stringify(sub));
  return json({ ok: true, item: sub });
}
