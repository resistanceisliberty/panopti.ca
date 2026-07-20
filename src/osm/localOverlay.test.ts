import { describe, it, expect, beforeEach } from 'vitest';
import { addOp, loadOps, __clearOps, cameraFromTags, applyOp, applyLocalOverlay } from './localOverlay';
import type { ALPRCamera } from '../types/camera';

const cam = (osmId: number, version = 1): ALPRCamera => ({ osmId, osmType: 'node', lat: 1, lon: 2, osmVersion: version });

beforeEach(() => __clearOps());

describe('cameraFromTags', () => {
  it('maps ALPR tags to a camera', () => {
    const c = cameraFromTags(5, 43.1, -80.2, { man_made: 'surveillance', 'surveillance:type': 'ALPR', 'surveillance:zone': 'traffic', manufacturer: 'Genetec', operator: 'City', direction: '90;270' }, 1);
    expect(c).toMatchObject({ osmId: 5, osmType: 'node', lat: 43.1, lon: -80.2, brand: 'Genetec', operator: 'City', surveillanceZone: 'traffic', direction: 90, directions: [90, 270], osmVersion: 1 });
  });
  it('labels government CCTV with the CCTV brand', () => {
    expect(cameraFromTags(6, 1, 2, { 'operator:type': 'government', operator: 'City' }, 1).brand).toBe('Government CCTVs');
  });
});

describe('applyOp', () => {
  it('add appends, edit replaces, delete removes', () => {
    const base = [cam(1)];
    const added = applyOp(base, { osmId: 2, kind: 'add', version: 1, ts: 0, camera: cam(2) });
    expect(added.map((c) => c.osmId)).toEqual([1, 2]);
    const edited = applyOp(added, { osmId: 2, kind: 'edit', version: 2, ts: 0, camera: { ...cam(2, 2), operator: 'X' } });
    expect(edited.find((c) => c.osmId === 2)?.operator).toBe('X');
    const deleted = applyOp(edited, { osmId: 1, kind: 'delete', version: 2, ts: 0 });
    expect(deleted.map((c) => c.osmId)).toEqual([2]);
  });
});

describe('applyLocalOverlay reconciliation', () => {
  const fresh = (base: ALPRCamera[] = []) => applyLocalOverlay(base, 1_000_000);

  it('shows an added node not yet in the data', () => {
    addOp({ osmId: 9, kind: 'add', version: 1, ts: 1_000_000, camera: cam(9) });
    expect(fresh().map((c) => c.osmId)).toEqual([9]);
    expect(loadOps()).toHaveLength(1); // still pending
  });

  it('drops the add op once the data contains the node', () => {
    addOp({ osmId: 9, kind: 'add', version: 1, ts: 1_000_000, camera: cam(9) });
    const out = fresh([cam(9)]);
    expect(out.map((c) => c.osmId)).toEqual([9]);
    expect(loadOps()).toHaveLength(0); // reconciled
  });

  it('keeps an edit until the data version catches up, then drops it', () => {
    addOp({ osmId: 3, kind: 'edit', version: 5, ts: 1_000_000, camera: { ...cam(3, 5), operator: 'NEW' } });
    // data still at old version → overlay applies
    expect(fresh([cam(3, 4)]).find((c) => c.osmId === 3)?.operator).toBe('NEW');
    expect(loadOps()).toHaveLength(1);
    // data reaches our version → op dropped, data wins
    expect(fresh([cam(3, 5)]).find((c) => c.osmId === 3)?.operator).toBeUndefined();
    expect(loadOps()).toHaveLength(0);
  });

  it('hides a deleted node until it is gone from the data', () => {
    addOp({ osmId: 4, kind: 'delete', version: 2, ts: 1_000_000 });
    expect(fresh([cam(4)]).map((c) => c.osmId)).toEqual([]); // still present in data → keep hiding
    expect(loadOps()).toHaveLength(1);
    expect(fresh([]).map((c) => c.osmId)).toEqual([]); // gone from data → op dropped
    expect(loadOps()).toHaveLength(0);
  });

  it('expires ops older than the window', () => {
    addOp({ osmId: 9, kind: 'add', version: 1, ts: 0, camera: cam(9) });
    const out = applyLocalOverlay([], 8 * 24 * 60 * 60 * 1000); // 8 days later
    expect(out).toHaveLength(0);
    expect(loadOps()).toHaveLength(0);
  });
});
