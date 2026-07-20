import { describe, it, expect } from 'vitest';
import { changesetXml, nodeCreateXml, nodeUpdateXml, nodeDeleteXml } from './xml';

describe('xml builders', () => {
  it('changeset escapes special chars in values', () => {
    const xml = changesetXml({ comment: 'a & b <c> "d"', created_by: 'panopti.ca' });
    expect(xml).toContain('<tag k="comment" v="a &amp; b &lt;c&gt; &quot;d&quot;"/>');
    expect(xml).toContain('<tag k="created_by" v="panopti.ca"/>');
  });

  it('node create carries changeset, lat/lon, tags', () => {
    const xml = nodeCreateXml(42, 43.1, -80.2, { man_made: 'surveillance' });
    expect(xml).toContain('<node changeset="42" lat="43.1" lon="-80.2">');
    expect(xml).toContain('<tag k="man_made" v="surveillance"/>');
  });

  it('node update carries id + version', () => {
    const xml = nodeUpdateXml({ id: 7, version: 3, lat: 1, lon: 2 }, 42, { a: 'b' });
    expect(xml).toContain('<node id="7" changeset="42" version="3" lat="1" lon="2">');
    expect(xml).toContain('<tag k="a" v="b"/>');
  });

  it('node delete has version, no tags', () => {
    const xml = nodeDeleteXml({ id: 7, version: 3, lat: 1, lon: 2 }, 42);
    expect(xml).toContain('<node id="7" changeset="42" version="3" lat="1" lon="2"/>');
    expect(xml).not.toContain('<tag');
  });
});
