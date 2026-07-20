import type { OsmNode, SubmitDraft } from './types';
import { emptyDraft } from '../store/submitStore';

// Tags the structured fields own; kept out of extraTags so editing a field isn't masked.
const STRUCTURED = new Set(['operator', 'operator:wikidata', 'direction', 'manufacturer', 'manufacturer:wikidata', 'camera:mount']);

export function draftFromNode(node: OsmNode): SubmitDraft {
  const t = { ...node.tags };
  const isCctv = t['surveillance:type'] === 'camera' || t['operator:type'] === 'government';
  const d = emptyDraft(isCctv ? 'cctv' : 'alpr');
  if (t.manufacturer) d.manufacturer = { kind: 'custom', manufacturer: t.manufacturer, wikidata: t['manufacturer:wikidata'] };
  d.operator = t.operator ?? '';
  d.operatorWikidata = t['operator:wikidata'] ?? '';
  d.directions = t.direction ? t.direction.split(';') : [];
  d.cameraMount = t['camera:mount'] ?? '';
  // Only unmodeled tags stay in extraTags (view-only, preserved); the structured keys
  // are driven solely by the draft fields above so edits to them aren't masked. An
  // orphaned manufacturer:wikidata (no manufacturer tag) isn't captured by a field, so
  // keep it in extraTags rather than dropping it.
  d.extraTags = Object.fromEntries(Object.entries(t).filter(
    ([k]) => !STRUCTURED.has(k) || (k === 'manufacturer:wikidata' && !t.manufacturer)
  ));
  return d;
}
