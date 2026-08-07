import type { Lang } from '../../i18n';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Month abbreviations by language. French uses standard short forms (no capitalization). */
export const MONTH_NAMES: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
};

/** Convert day index (0-based from minDay) to YYYY-MM-DD string */
export function dayIndexToDate(index: number, minDay: string): string {
  const d = new Date(minDay + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + index);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert YYYY-MM-DD string to day index (0-based from minDay) */
export function dateToDayIndex(date: string, minDay: string): number {
  const d1 = new Date(minDay + 'T00:00:00Z').getTime();
  const d2 = new Date(date + 'T00:00:00Z').getTime();
  return Math.round((d2 - d1) / DAY_MS);
}

/** Format YYYY-MM-DD as "MMM DD, YYYY" (en) or "DD MMM YYYY" (fr) */
export function formatDate(date: string, lang: Lang = 'en'): string {
  const [year, month, day] = date.split('-').map(Number);
  const mon = MONTH_NAMES[lang][month - 1];
  return lang === 'fr' ? `${day} ${mon} ${year}` : `${mon} ${day}, ${year}`;
}

/** Format YYYY-MM-DD as "MMM DD, YYYY" (en) or "DD MMM YYYY" (fr), zero-padded day for fixed width */
export function formatDateFixed(date: string, lang: Lang = 'en'): string {
  const [year, month, day] = date.split('-').map(Number);
  const mon = MONTH_NAMES[lang][month - 1];
  const dd = String(day).padStart(2, '0');
  return lang === 'fr' ? `${dd} ${mon} ${year}` : `${mon} ${dd}, ${year}`;
}

/** Format YYYY-MM-DD as "MMM YYYY" (for range labels) */
export function formatMonthYear(date: string, lang: Lang = 'en'): string {
  const [year, month] = date.split('-').map(Number);
  return `${MONTH_NAMES[lang][month - 1]} ${year}`;
}

/** Total days between two YYYY-MM-DD dates */
export function totalDays(minDay: string, maxDay: string): number {
  return dateToDayIndex(maxDay, minDay);
}
