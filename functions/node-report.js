// Cloudflare Pages Function — anonymous "report a problem" for a map node (no login).
// Anyone can flag a node they believe is wrong (doesn't exist, wrong type/brand/location…).
// Stored to KV binding FLOCK_QUEUE under key report:<createdAt-ms>:<uuid> (same namespace as
// the Flock queue, separate prefix). Reviewed by the admin in /admin/reports. Best-effort notify.
const CA_BBOX = { latMin: 41, latMax: 84, lonMin: -142, lonMax: -50 };
const REASONS = ['nonexistent', 'location', 'type', 'brand', 'duplicate', 'other'];
// ponytail: no per-IP rate limit — reports self-expire (180d TTL) and the admin dismisses spam.
// Add a KV counter or Turnstile if abuse shows up.
const TTL_SECONDS = 60 * 60 * 24 * 180;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function notify(env, rep) {
  const text =
    `New node report awaiting review\n` +
    `node: https://www.openstreetmap.org/${rep.osmType}/${rep.osmId}\n` +
    `reason: ${rep.reason}\n` +
    `note: ${rep.note || '(none)'}\n` +
    `where: ${rep.lat}, ${rep.lon}\n` +
    `brand/operator: ${rep.brand || '—'} / ${rep.operator || '—'}\n` +
    `review: https://maps.panopti.ca/admin/reports`;
  try {
    if (env.NOTIFY_WEBHOOK_URL) {
      await fetch(env.NOTIFY_WEBHOOK_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text, report: rep }),
      });
    } else if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.NOTIFY_FROM || 'panopti.ca <noreply@panopti.ca>',
          to: env.NOTIFY_EMAIL || 'contact@panopti.ca',
          subject: 'New node report for review', text,
        }),
      });
    } else {
      console.log('[node-report] no notifier configured; report stored only', rep.id);
    }
  } catch (e) {
    console.error('[node-report] notify failed', e);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.FLOCK_QUEUE) return json({ ok: false, error: 'report queue not configured' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 8000) return json({ ok: false, error: 'too large' }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid JSON' }, 400); }

  const osmId = Number(body.osmId);
  const osmType = body.osmType === 'way' ? 'way' : 'node';
  const lat = Number(body.lat), lon = Number(body.lon);
  if (!Number.isInteger(osmId) || osmId <= 0) return json({ ok: false, error: 'bad node id' }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < CA_BBOX.latMin || lat > CA_BBOX.latMax || lon < CA_BBOX.lonMin || lon > CA_BBOX.lonMax) {
    return json({ ok: false, error: 'coordinates outside Canada' }, 400);
  }

  const clip = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
  const id = `${Date.now()}:${crypto.randomUUID()}`;
  const rep = {
    id, status: 'pending', createdAt: new Date().toISOString(),
    osmType, osmId, lat, lon,
    reason: REASONS.includes(body.reason) ? body.reason : 'other',
    note: clip(body.note, 1000),
    brand: clip(body.brand, 200),
    operator: clip(body.operator, 200),
    ua: clip(request.headers.get('user-agent'), 300),
  };
  await env.FLOCK_QUEUE.put(`report:${id}`, JSON.stringify(rep), { expirationTtl: TTL_SECONDS });
  await notify(env, rep);
  return json({ ok: true, id });
}
