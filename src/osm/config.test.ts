import { describe, it, expect } from 'vitest';
import { OSM } from './config';

describe('OSM config', () => {
  it('exposes base urls and changeset created_by', () => {
    expect(OSM.webBase).toMatch(/^https?:\/\//);
    expect(OSM.apiBase).toMatch(/^https?:\/\//);
    expect(OSM.changesetCreatedBy).toBe('panopti.ca');
    expect(OSM.scopes).toContain('write_api');
    expect(OSM.scopes).toContain('read_prefs');
  });
});
