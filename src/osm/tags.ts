import type { OsmTags, SubmitDraft } from './types';
import type { StringKey } from '../i18n';

const ALPR_BASE: OsmTags = {
  man_made: 'surveillance',
  'surveillance:type': 'ALPR',
  surveillance: 'public',
  'camera:type': 'fixed',
  'surveillance:zone': 'traffic',
};

const CCTV_BASE: OsmTags = {
  man_made: 'surveillance',
  'surveillance:type': 'camera',
  'operator:type': 'government',
};

export const SOURCE_PRESETS = [
  { labelKey: 'submit_source_survey', value: 'survey' },
  { labelKey: 'submit_source_local_knowledge', value: 'local knowledge' },
  { labelKey: 'submit_source_aerial_imagery', value: 'aerial imagery' },
  { labelKey: 'submit_source_gps', value: 'GPS' },
  { labelKey: 'submit_source_street_level_photos', value: 'street-level photos' },
  { labelKey: 'submit_source_osm_notes', value: 'openstreetmap notes' },
] as const satisfies readonly { labelKey: StringKey; value: string }[];

function put(tags: OsmTags, key: string, value?: string) {
  const v = value?.trim();
  if (v) tags[key] = v;
}

export function buildNodeTags(d: SubmitDraft): OsmTags {
  const tags: OsmTags = { ...(d.deviceType === 'alpr' ? ALPR_BASE : CCTV_BASE) };

  if (d.deviceType === 'alpr' && d.manufacturer.kind !== 'none') {
    put(tags, 'manufacturer', d.manufacturer.manufacturer);
    put(tags, 'manufacturer:wikidata', d.manufacturer.wikidata);
  }
  put(tags, 'operator', d.operator);
  put(tags, 'operator:wikidata', d.operatorWikidata);
  put(tags, 'camera:mount', d.cameraMount);

  const dirs = d.directions.map((s) => s.trim()).filter(Boolean);
  if (dirs.length) tags.direction = dirs.join(';');

  const merged: OsmTags = { ...tags, ...d.extraTags };
  return Object.fromEntries(Object.entries(merged).filter(([, v]) => v.trim() !== ''));
}

export function buildChangesetTags(d: SubmitDraft): OsmTags {
  const tags: OsmTags = { comment: d.description, created_by: 'panopti.ca' };
  if (d.source.kind !== 'none') tags.source = d.source.value.trim();
  return tags;
}
