import { useLangStore } from './langStore';
import { STRINGS, type StringKey } from './strings';

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: StringKey) => STRINGS[lang][key];
}
