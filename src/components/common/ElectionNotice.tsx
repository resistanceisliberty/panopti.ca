import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useLangStore, useT } from '@/i18n';
import municipalities from '@/data/electionMunicipalities.json';

// ponytail: equirectangular distance — fine at city scale, no haversine needed
// Both args are [lng, lat] (GeoJSON order, matches electionMunicipalities.json).
function nearKm(a: [number, number], b: [number, number]): number {
  const dx = (a[0] - b[0]) * 111.32 * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110.57;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ElectionNotice() {
  const center = useMapStore((s) => s.center); // [lat, lng] per mapStore's actual convention
  const lang = useLangStore((s) => s.lang);
  const t = useT();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const centerLngLat: [number, number] = [center[1], center[0]];
  const muni = municipalities.find(
    (m) => !dismissed.includes(m.id) && nearKm(centerLngLat, m.coords as [number, number]) <= m.radiusKm
  );
  if (!muni) return null;

  const url = `https://panopti.ca${lang === 'fr' ? '/fr' : ''}/candidates/${muni.id}`;
  const name = muni.name[lang];
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-dark-800/95 border border-dark-600 px-3 py-2 text-sm text-dark-100 shadow-lg">
      <span aria-hidden>🗳️</span>
      <a href={url} className="underline hover:text-white">
        {t('elect_notice_pre')} {name} {t('elect_notice_post')}
      </a>
      <button
        type="button"
        aria-label={t('elect_notice_dismiss')}
        onClick={() => setDismissed((d) => [...d, muni.id])}
        className="ml-1 text-dark-300 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
