import type { OsmTags } from './types';

export interface Vendor {
  shortName: string;
  fullName: string;
  osmTags: OsmTags;
}

const LOCAL_EXTRAS: Vendor[] = [
  { shortName: 'Dahua Technology', fullName: 'Dahua Technology', osmTags: { manufacturer: 'Dahua Technology', 'manufacturer:wikidata': 'Q18111506' } },
  { shortName: 'Raytheon', fullName: 'RTX Corporation', osmTags: { manufacturer: 'RTX Corporation', 'manufacturer:wikidata': 'Q89368734' } },
];

let cache: Vendor[] | null = null;

export function __resetVendorCache() { cache = null; }

export async function loadVendors(): Promise<Vendor[]> {
  if (cache) return cache;
  let cms: Vendor[] = [];
  try {
    const res = await fetch('https://cms.deflock.me/items/lprVendors');
    if (res.ok) cms = ((await res.json()).data ?? []) as Vendor[];
  } catch { /* offline → extras only */ }
  const extras = LOCAL_EXTRAS.filter((e) => !cms.some((c) => c.fullName === e.fullName));
  cache = [...cms, ...extras];
  return cache;
}
