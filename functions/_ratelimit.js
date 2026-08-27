// Shared soft per-IP rate limiter for the public write endpoints (KV: FLOCK_QUEUE).
// Fixed-window counter keyed by CF-Connecting-IP. Fails OPEN if KV is unavailable so a
// storage hiccup never blocks a legitimate submission. Keys self-expire (prefix rl:), so
// they never pollute the sub:/report: listings the admin reads.
// ponytail: KV read-modify-write is racy, so the cap is soft — a parallel burst can slip a
// few requests over. That's fine for throttling flooding/notification spam; add a Cloudflare
// rate-limiting rule (edge, hard) or a Durable Object if a strict limit is ever needed.
export async function rateLimited(env, request, bucket, limit, windowSec) {
  const kv = env.FLOCK_QUEUE;
  if (!kv) return false;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${bucket}:${ip}:${window}`;
  try {
    const n = Number((await kv.get(key)) || 0) + 1;
    await kv.put(key, String(n), { expirationTtl: windowSec });
    return n > limit;
  } catch {
    return false;
  }
}
