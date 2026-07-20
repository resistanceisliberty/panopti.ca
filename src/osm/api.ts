import { OSM } from './config';
import { getToken } from './auth';
import { buildNodeTags, buildChangesetTags } from './tags';
import { changesetXml, nodeCreateXml, nodeUpdateXml, nodeDeleteXml } from './xml';
import type { OsmNode, OsmTags, SubmitDraft } from './types';

export class OsmConflictError extends Error {}

async function osmWrite(path: string, method: string, body?: string): Promise<string> {
  const res = await fetch(`${OSM.apiBase}/api/0.6${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'text/xml',
    },
    body,
  });
  if (res.status === 409) throw new OsmConflictError(await res.text());
  if (!res.ok) throw new Error(`OSM ${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.text();
}

export async function fetchNode(id: number): Promise<OsmNode> {
  const res = await fetch(`${OSM.apiBase}/api/0.6/node/${id}.json`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`fetchNode ${id} → ${res.status}`);
  const el = (await res.json()).elements[0];
  return { id: el.id, version: el.version, lat: el.lat, lon: el.lon, tags: el.tags ?? {} };
}

async function withChangeset<T>(csTags: OsmTags, fn: (id: number) => Promise<T>): Promise<T> {
  const idText = await osmWrite('/changeset/create', 'PUT', changesetXml(csTags));
  const id = Number(idText);
  try {
    return await fn(id);
  } finally {
    await osmWrite(`/changeset/${id}/close`, 'PUT').catch(() => {});
  }
}

export function submitAdd(draft: SubmitDraft, lat: number, lon: number): Promise<number> {
  return withChangeset(buildChangesetTags(draft), async (cs) => {
    const idText = await osmWrite('/node/create', 'PUT', nodeCreateXml(cs, lat, lon, buildNodeTags(draft)));
    return Number(idText);
  });
}

export function submitEdit(draft: SubmitDraft, node: OsmNode, lat: number, lon: number): Promise<number> {
  const tags = { ...node.tags, ...buildNodeTags(draft) };
  return withChangeset(buildChangesetTags(draft), async (cs) => {
    const vText = await osmWrite(`/node/${node.id}`, 'PUT',
      nodeUpdateXml({ id: node.id, version: node.version, lat, lon }, cs, tags));
    return Number(vText);
  });
}

export function submitDelete(node: OsmNode, description: string, source: SubmitDraft['source']): Promise<void> {
  const csTags: OsmTags = { comment: description, created_by: 'panopti.ca' };
  if (source.kind !== 'none') csTags.source = source.value.trim();
  return withChangeset(csTags, async (cs) => {
    await osmWrite(`/node/${node.id}`, 'DELETE',
      nodeDeleteXml({ id: node.id, version: node.version, lat: node.lat, lon: node.lon }, cs));
  });
}
