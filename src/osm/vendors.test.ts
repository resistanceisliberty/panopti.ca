import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadVendors, __resetVendorCache } from './vendors';

beforeEach(() => { __resetVendorCache(); vi.restoreAllMocks(); });

it('merges CMS vendors with local extras, deduped by fullName', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ data: [{ shortName: 'Genetec', fullName: 'Genetec', osmTags: { manufacturer: 'Genetec' } }] }),
    { status: 200 },
  )));
  const v = await loadVendors();
  expect(v.find((x) => x.fullName === 'Genetec')).toBeTruthy();
  expect(v.find((x) => x.fullName === 'Dahua Technology')).toBeTruthy();
  expect(v.find((x) => x.fullName === 'RTX Corporation')).toBeTruthy();
});

it('falls back to local extras when CMS fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 500 })));
  const v = await loadVendors();
  expect(v.length).toBeGreaterThanOrEqual(2);
});
