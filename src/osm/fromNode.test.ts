import { describe, it, expect } from 'vitest';
import { draftFromNode } from './fromNode';

describe('draftFromNode', () => {
  const node = {
    id: 1, version: 2, lat: 1, lon: 2,
    tags: {
      man_made: 'surveillance', 'surveillance:type': 'ALPR', 'surveillance:zone': 'traffic',
      operator: 'City X', 'operator:wikidata': 'Q1', direction: '90;270',
      manufacturer: 'Genetec', 'manufacturer:wikidata': 'Q2', 'camera:mount': 'pole',
      note: 'keep me', ref: '42',
    },
  };

  it('maps structured tags into draft fields', () => {
    const d = draftFromNode(node);
    expect(d.operator).toBe('City X');
    expect(d.operatorWikidata).toBe('Q1');
    expect(d.directions).toEqual(['90', '270']);
    expect(d.cameraMount).toBe('pole');
    expect(d.manufacturer).toMatchObject({ manufacturer: 'Genetec', wikidata: 'Q2' });
  });

  it('keeps structured keys OUT of extraTags so field edits are not masked', () => {
    const d = draftFromNode(node);
    for (const k of ['operator', 'operator:wikidata', 'direction', 'manufacturer', 'manufacturer:wikidata', 'camera:mount']) {
      expect(k in d.extraTags).toBe(false);
    }
  });

  it('preserves unmodeled tags in extraTags', () => {
    const d = draftFromNode(node);
    expect(d.extraTags.note).toBe('keep me');
    expect(d.extraTags.ref).toBe('42');
    expect(d.extraTags.man_made).toBe('surveillance');
    expect(d.extraTags['surveillance:zone']).toBe('traffic');
  });

  it('keeps an orphaned manufacturer:wikidata (no manufacturer tag) in extraTags', () => {
    const d = draftFromNode({ id: 1, version: 1, lat: 1, lon: 2, tags: { man_made: 'surveillance', 'manufacturer:wikidata': 'Q99' } });
    expect(d.extraTags['manufacturer:wikidata']).toBe('Q99');
  });
});
