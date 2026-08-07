import { create } from 'zustand';
import type { Lang } from './strings';

const initial: Lang =
  typeof localStorage !== 'undefined' && localStorage.getItem('lang') === 'fr' ? 'fr' : 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: initial,
  setLang: (lang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    set({ lang });
  },
}));
