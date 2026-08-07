import { create } from 'zustand';
import type { Lang } from './strings';

function readInitial(): Lang {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('lang') === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: readInitial(),
  setLang: (lang) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lang);
    } catch {
      // storage inaccessible (e.g. blocked in embedded iframe) — continue with in-memory state
    }
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    set({ lang });
  },
}));
