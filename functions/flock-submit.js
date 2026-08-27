// Cloudflare Pages Function — receives a HELD Flock-camera add attempt (pre-moderation).
// Nothing is written to OSM here; the submission waits in KV binding FLOCK_QUEUE until an
// admin approves it in /admin/flock. Fires a best-effort notification (webhook or email).
// KV key: sub:<createdAt-ms>:<uuid>  ->  JSON submission record.
import { rateLimited } from './_ratelimit.js';
const CA_BBOX = { latMin: 41, latMax: 84, lonMin: -142, lonMax: -50 };
const TTL_SECONDS = 60 * 60 * 24 * 180; // pending submissions self-expire if never reviewed

// The draft is written to OSM verbatim on approval (buildNodeTags spreads draft.extraTags),
// so bound the free-form tag surface here — the admin's review is the semantic gate, this
// just stops an abusive payload from bloating KV or the resulting node.
export function cleanDraft(d) {
  if (!d || typeof d !== 'object') return null;
  const out = { ...d };
  if (d.extraTags && typeof d.extraTags === 'object' && !Array.isArray(d.extraTags)) {
    const clean = {}; let n = 0;
    for (const [k, v] of Object.entries(d.extraTags)) {
      if (n >= 30) break;
      if (typeof v !== 'string') continue;
      clean[String(k).slice(0, 100)] = v.slice(0, 255); n++;
    }
    out.extraTags = clean;
  }
  if (Array.isArray(d.directions)) out.directions = d.directions.slice(0, 12).map((s) => String(s).slice(0, 40));
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function notify(env, sub) {
  const text =
    `New held Flock-camera submission awaiting review\n` +
    `where: ${sub.lat}, ${sub.lon}\n` +
    `operator: ${sub.draft?.operator || '(none)'}\n` +
    `source: ${sub.source || '(none)'}\n` +
    `note: ${sub.description || '(none)'}\n` +
    `submitted by OSM user: ${sub.submitter || '(anonymous)'}\n` +
    `review: https://maps.panopti.ca/admin/flock`;
  try {
    if (env.NOTIFY_WEBHOOK_URL) {
      // Generic webhook — works for Discord ("content") or a custom tool ("submission").
      await fetch(env.NOTIFY_WEBHOOK_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text, submission: sub }),
      });
    } else if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.NOTIFY_FROM || 'panopti.ca <noreply@panopti.ca>',
          to: env.NOTIFY_EMAIL || 'contact@panopti.ca',
          subject: 'New Flock-camera submission for review',
          text,
        }),
      });
    } else {
      console.log('[flock-submit] no notifier configured; submission stored only', sub.id);
    }
  } catch (e) {
    console.error('[flock-submit] notify failed', e);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.FLOCK_QUEUE) return json({ ok: false, error: 'review queue not configured' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ ok: false, error: 'too large' }, 413);
  if (await rateLimited(env, request, 'flock', 10, 600)) return json({ ok: false, error: 'rate limited' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid JSON' }, 400); }

  const lat = Number(body.lat), lon = Number(body.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < CA_BBOX.latMin || lat > CA_BBOX.latMax || lon < CA_BBOX.lonMin || lon > CA_BBOX.lonMax) {
    return json({ ok: false, error: 'coordinates outside Canada' }, 400);
  }

  const clip = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
  const id = `${Date.now()}:${crypto.randomUUID()}`;
  const sub = {
    id, status: 'pending', createdAt: new Date().toISOString(),
    lat, lon,
    submitter: clip(body.submitter, 200),
    source: clip(body.source, 1000),
    description: clip(body.description, 2000),
    draft: cleanDraft(body.draft),
    tags: body.tags && typeof body.tags === 'object' ? body.tags : null,
    ua: clip(request.headers.get('user-agent'), 300),
  };
  await env.FLOCK_QUEUE.put(`sub:${id}`, JSON.stringify(sub), { expirationTtl: TTL_SECONDS });
  await notify(env, sub);
  return json({ ok: true, id });
}
