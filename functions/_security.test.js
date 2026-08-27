import { describe, it, expect } from 'vitest';
import { rateLimited } from './_ratelimit.js';
import { cleanDraft } from './flock-submit.js';

const fakeKV = () => {
  const m = new Map();
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) };
};
const req = (ip = '1.2.3.4') => ({ headers: { get: (h) => (h === 'cf-connecting-ip' ? ip : null) } });

describe('rateLimited', () => {
  it('allows up to the limit, then trips', async () => {
    const env = { FLOCK_QUEUE: fakeKV() };
    const hits = [];
    for (let i = 0; i < 4; i++) hits.push(await rateLimited(env, req(), 'flock', 3, 600));
    expect(hits).toEqual([false, false, false, true]); // 4th request exceeds limit of 3
  });
  it('counts per-IP independently', async () => {
    const env = { FLOCK_QUEUE: fakeKV() };
    for (let i = 0; i < 3; i++) await rateLimited(env, req('a'), 'flock', 3, 600);
    expect(await rateLimited(env, req('b'), 'flock', 3, 600)).toBe(false);
  });
  it('fails open when KV is unavailable', async () => {
    expect(await rateLimited({}, req(), 'flock', 1, 600)).toBe(false);
  });
});

describe('cleanDraft', () => {
  it('caps extraTags count and clips key/value length', () => {
    const extraTags = {};
    for (let i = 0; i < 100; i++) extraTags[`k${i}`] = 'v';
    extraTags['big'] = 'x'.repeat(999);
    const out = cleanDraft({ extraTags });
    expect(Object.keys(out.extraTags).length).toBeLessThanOrEqual(30);
    for (const v of Object.values(out.extraTags)) expect(v.length).toBeLessThanOrEqual(255);
  });
  it('drops non-string tag values and caps directions', () => {
    const out = cleanDraft({ extraTags: { good: 'ok', bad: { nested: 1 } }, directions: Array(50).fill('N') });
    expect(out.extraTags).toEqual({ good: 'ok' });
    expect(out.directions.length).toBeLessThanOrEqual(12);
  });
  it('returns null for a non-object draft', () => {
    expect(cleanDraft(null)).toBe(null);
    expect(cleanDraft('nope')).toBe(null);
  });
});
