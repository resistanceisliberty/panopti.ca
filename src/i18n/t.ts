import { useLangStore } from './langStore';
import { STRINGS, type StringKey } from './strings';

// Non-reactive lookup for code outside React components (stores, utils).
export function t(key: StringKey): string {
  return STRINGS[useLangStore.getState().lang][key];
}
