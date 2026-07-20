import { describe, it, expect } from 'vitest';
import { buildNodeTags, buildChangesetTags } from './tags';
import type { SubmitDraft } from './types';

const base: SubmitDraft = {
  deviceType: 'alpr',
  manufacturer: { kind: 'none' },
  operator: '', operatorWikidata: '',
  directions: [], cameraMount: '',
  source: { kind: 'none' }, description: 'test edit', extraTags: {},
};

describe('buildNodeTags', () => {
  it('ALPR base tags with no manufacturer', () => {
    expect(buildNodeTags(base)).toEqual({
      man_made: 'surveillance', 'surveillance:type': 'ALPR',
      surveillance: 'public', 'camera:type': 'fixed', 'surveillance:zone': 'traffic',
    });
  });

  it('known manufacturer adds manufacturer + wikidata', () => {
    const t = buildNodeTags({ ...base, manufacturer: { kind: 'known', manufacturer: 'Genetec', wikidata: 'Q30295174' } });
    expect(t.manufacturer).toBe('Genetec');
    expect(t['manufacturer:wikidata']).toBe('Q30295174');
  });

  it('custom manufacturer without wikidata omits the wikidata tag', () => {
    const t = buildNodeTags({ ...base, manufacturer: { kind: 'custom', manufacturer: 'ACME' } });
    expect(t.manufacturer).toBe('ACME');
    expect('manufacturer:wikidata' in t).toBe(false);
  });

  it('joins multiple directions with semicolons; omits when empty', () => {
    expect(buildNodeTags({ ...base, directions: ['90', '270'] }).direction).toBe('90;270');
    expect('direction' in buildNodeTags(base)).toBe(false);
  });

  it('omits blank operator and blank camera:mount', () => {
    const t = buildNodeTags({ ...base, operator: '', cameraMount: '' });
    expect('operator' in t).toBe(false);
    expect('camera:mount' in t).toBe(false);
  });

  it('CCTV government tag set', () => {
    const t = buildNodeTags({ ...base, deviceType: 'cctv', operator: 'City of Toronto' });
    expect(t).toMatchObject({
      man_made: 'surveillance', 'surveillance:type': 'camera',
      'operator:type': 'government', operator: 'City of Toronto',
    });
    expect('camera:type' in t).toBe(false);
  });

  it('merges extraTags (raw editor) over structured tags', () => {
    const t = buildNodeTags({ ...base, extraTags: { note: 'hi', operator: 'Override' } });
    expect(t.note).toBe('hi');
    expect(t.operator).toBe('Override');
  });

  it('drops a tag blanked via extraTags (the TagEditor remove affordance)', () => {
    const t = buildNodeTags({ ...base, extraTags: { man_made: '' } });
    expect('man_made' in t).toBe(false);
  });
});

describe('buildChangesetTags', () => {
  it('comment is the description verbatim; created_by is panopti.ca; no source when none', () => {
    const t = buildChangesetTags(base);
    expect(t.comment).toBe('test edit');
    expect(t.created_by).toBe('panopti.ca');
    expect('source' in t).toBe(false);
  });
  it('source written only when chosen', () => {
    expect(buildChangesetTags({ ...base, source: { kind: 'preset', value: 'local knowledge' } }).source).toBe('local knowledge');
    expect(buildChangesetTags({ ...base, source: { kind: 'url', value: 'https://x' } }).source).toBe('https://x');
  });
});
