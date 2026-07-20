import { describe, it, expect } from 'vitest';
import { OSM, SUBMIT_ENABLED } from './config';

describe('OSM config', () => {
  it('exposes base urls and changeset created_by', () => {
    expect(OSM.webBase).toMatch(/^https?:\/\//);
    expect(OSM.apiBase).toMatch(/^https?:\/\//);
    expect(OSM.changesetCreatedBy).toBe('panopti.ca');
    expect(OSM.scopes).toContain('write_api');
    expect(OSM.scopes).toContain('read_prefs');
  });

  it('SUBMIT_ENABLED defaults to true when the flag is unset', () => {
    expect(SUBMIT_ENABLED).toBe(true);
  });
});
