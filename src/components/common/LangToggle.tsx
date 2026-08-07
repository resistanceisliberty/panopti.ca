import { useLangStore } from '../../i18n/langStore';
import { useT } from '../../i18n/useT';

export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
      aria-label={lang === 'en' ? t('lang_switch_to_fr') : t('lang_switch_to_en')}
      className={`text-sm font-medium uppercase tracking-widest text-dark-200 hover:text-white transition-colors duration-150 ${className}`}
    >
      {lang === 'en' ? t('lang_code_fr') : t('lang_code_en')}
    </button>
  );
}
