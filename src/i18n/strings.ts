export const STRINGS = {
  en: {
    lang_switch_to_fr: 'Passer au français',
    lang_switch_to_en: 'Switch to English',
    lang_code_fr: 'FR',
    lang_code_en: 'EN',
  },
  fr: {
    lang_switch_to_fr: 'Passer au français',
    lang_switch_to_en: 'Switch to English',
    lang_code_fr: 'FR',
    lang_code_en: 'EN',
  },
} as const;

export type Lang = keyof typeof STRINGS;            // 'en' | 'fr'
export type StringKey = keyof typeof STRINGS['en'];
