import type { OsmNode, SubmitDraft } from './types';
import { emptyDraft } from '../store/submitStore';

export function draftFromNode(node: OsmNode): SubmitDraft {
  const t = { ...node.tags };
  const isCctv = t['surveillance:type'] === 'camera' || t['operator:type'] === 'government';
  const d = emptyDraft(isCctv ? 'cctv' : 'alpr');
  if (t.manufacturer) d.manufacturer = { kind: 'custom', manufacturer: t.manufacturer, wikidata: t['manufacturer:wikidata'] };
  d.operator = t.operator ?? '';
  d.operatorWikidata = t['operator:wikidata'] ?? '';
  d.directions = t.direction ? t.direction.split(';') : [];
  d.cameraMount = t['camera:mount'] ?? '';
  // Everything stays in extraTags so nothing is lost; structured fields overlay it.
  d.extraTags = t;
  return d;
}
