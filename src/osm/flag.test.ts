import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSubmitFlag, startSubmitFlagPolling } from './flag';

afterEach(() => vi.restoreAllMocks());

describe('fetchSubmitFlag', () => {
  it('returns true when the flag says enabled', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ enabled: true }), { status: 200 })));
    expect(await fetchSubmitFlag()).toBe(true);
  });
  it('returns false only when explicitly disabled', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ enabled: false }), { status: 200 })));
    expect(await fetchSubmitFlag()).toBe(false);
  });
  it('fails open on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    expect(await fetchSubmitFlag()).toBe(true);
  });
  it('fails open on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchSubmitFlag()).toBe(true);
  });
});

describe('startSubmitFlagPolling', () => {
  it('fires onChange with the flag on start and stops after cleanup', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ enabled: false }), { status: 200 })));
    const calls: boolean[] = [];
    const stop = startSubmitFlagPolling((e) => calls.push(e));
    await new Promise((r) => setTimeout(r, 20));
    stop();
    expect(calls).toContain(false);
    const countAfterStop = calls.length;
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.length).toBe(countAfterStop); // no more calls after cleanup
  });
});
