import { describe, it, expect } from 'vitest';
import { STRINGS } from './strings';

describe('i18n string parity', () => {
  it('en and fr have identical key sets', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.fr).sort());
  });
});
