import type { ALPRCamera } from '../types/camera';
import type { OsmTags } from './types';

// Optimistic local overlay: a successful add/edit/delete is cached in localStorage and
// applied on top of the fetched cameras-ca.json, so the submitter sees their change
// immediately. Each refresh reconciles — an op is dropped once the fresh data reflects
// it (add present / edit version caught up / delete gone), or after a hard expiry (so a
// change rejected/reverted on OSM clears itself).

const KEY = 'panopti_local_ops';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface LocalOp {
  osmId: number;
  kind: 'add' | 'edit' | 'delete';
  version: number; // resulting node version (add=1, edit=new version, delete=next version)
  ts: number;      // submission time (ms)
  camera?: ALPRCamera; // add/edit only
}

export function loadOps(): LocalOp[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveOps(ops: LocalOp[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    /* storage disabled or over quota — overlay just won't persist */
  }
}

export function addOp(op: LocalOp): void {
  saveOps([...loadOps().filter((o) => o.osmId !== op.osmId), op]);
}

export function __clearOps(): void {
  saveOps([]);
}

export function cameraFromTags(osmId: number, lat: number, lon: number, tags: OsmTags, version: number): ALPRCamera {
  const dirs = tags.direction ? tags.direction.split(';').map((s) => s.trim()).filter(Boolean).map(Number).filter(Number.isFinite) : [];
  return {
    osmId,
    osmType: 'node',
    lat,
    lon,
    operator: tags.operator,
    brand: tags['operator:type'] === 'government' ? 'Government CCTVs' : tags.manufacturer,
    surveillanceZone: tags['surveillance:zone'] as ALPRCamera['surveillanceZone'],
    direction: dirs[0],
    directions: dirs.length > 1 ? dirs : undefined,
    ref: tags.ref,
    osmTimestamp: new Date().toISOString(),
    osmVersion: version,
  };
}

// Apply a single op to an in-memory list (used for the immediate optimistic update).
export function applyOp(cameras: ALPRCamera[], op: LocalOp): ALPRCamera[] {
  if (op.kind === 'delete') return cameras.filter((c) => c.osmId !== op.osmId);
  if (!op.camera) return cameras;
  const i = cameras.findIndex((c) => c.osmId === op.osmId);
  if (i >= 0) {
    const next = cameras.slice();
    next[i] = op.camera;
    return next;
  }
  return [...cameras, op.camera];
}

// Reconcile persisted ops against fresh data, then apply the survivors.
export function applyLocalOverlay(fetched: ALPRCamera[], now: number = Date.now()): ALPRCamera[] {
  const ops = loadOps();
  if (ops.length === 0) return fetched; // no-op for the common (non-submitting) case
  const byId = new Map(fetched.map((c) => [c.osmId, c]));
  const kept = ops.filter((op) => {
    if (now - op.ts > EXPIRY_MS) return false;
    const real = byId.get(op.osmId);
    if (op.kind === 'delete') return !!real; // keep hiding until the node is gone from the data
    return !real || (real.osmVersion ?? 0) < op.version; // keep until the data catches up
  });
  saveOps(kept);
  return kept.reduce(applyOp, fetched);
}
