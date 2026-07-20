import { it, expect, vi, beforeEach } from 'vitest';
import { fetchNode, submitAdd, OsmConflictError } from './api';
import type { SubmitDraft } from './types';

const draft: SubmitDraft = {
  deviceType: 'alpr', manufacturer: { kind: 'none' },
  operator: '', operatorWikidata: '', directions: [], cameraMount: '',
  source: { kind: 'none' }, description: 'add test', extraTags: {},
};

beforeEach(() => {
  sessionStorage.setItem('osm_access_token', 'tok');
  vi.restoreAllMocks();
});

it('fetchNode parses JSON element', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ elements: [{ id: 5, version: 2, lat: 1, lon: 2, tags: { a: 'b' } }] }),
    { status: 200 },
  )));
  const n = await fetchNode(5);
  expect(n).toEqual({ id: 5, version: 2, lat: 1, lon: 2, tags: { a: 'b' } });
});

it('submitAdd opens changeset, creates node, closes changeset', async () => {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? 'GET'} ${url}`);
    if (url.endsWith('/changeset/create')) return new Response('99', { status: 200 });
    if (url.endsWith('/node/create')) return new Response('12345', { status: 200 });
    return new Response('', { status: 200 });
  }));
  const id = await submitAdd(draft, 43.1, -80.2);
  expect(id).toBe(12345);
  expect(calls.some((c) => c.includes('/changeset/create'))).toBe(true);
  expect(calls.some((c) => c.includes('/node/create'))).toBe(true);
  expect(calls.some((c) => c.includes('/changeset/99/close'))).toBe(true);
});

it('throws OsmConflictError on 409', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/changeset/create')) return new Response('99', { status: 200 });
    return new Response('conflict', { status: 409 });
  }));
  await expect(submitAdd(draft, 1, 2)).rejects.toBeInstanceOf(OsmConflictError);
});
