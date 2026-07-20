import type { OsmTags } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function tagLines(tags: OsmTags): string {
  return Object.entries(tags)
    .map(([k, v]) => `<tag k="${esc(k)}" v="${esc(v)}"/>`)
    .join('');
}

export function changesetXml(tags: OsmTags): string {
  return `<osm><changeset>${tagLines(tags)}</changeset></osm>`;
}

export function nodeCreateXml(changesetId: number, lat: number, lon: number, tags: OsmTags): string {
  return `<osm><node changeset="${changesetId}" lat="${lat}" lon="${lon}">${tagLines(tags)}</node></osm>`;
}

export function nodeUpdateXml(
  node: { id: number; version: number; lat: number; lon: number },
  changesetId: number,
  tags: OsmTags,
): string {
  return `<osm><node id="${node.id}" changeset="${changesetId}" version="${node.version}" lat="${node.lat}" lon="${node.lon}">${tagLines(tags)}</node></osm>`;
}

export function nodeDeleteXml(
  node: { id: number; version: number; lat: number; lon: number },
  changesetId: number,
): string {
  return `<osm><node id="${node.id}" changeset="${changesetId}" version="${node.version}" lat="${node.lat}" lon="${node.lon}"/></osm>`;
}
