import { useSubmitStore } from '../../store/submitStore';
import { buildNodeTags } from '../../osm/tags';
import { useT } from '@/i18n';

const EDITABLE = new Set(['operator', 'operator:wikidata', 'direction', 'manufacturer', 'manufacturer:wikidata']);

export function TagEditor() {
  const t = useT();
  const draft = useSubmitStore((s) => s.draft);
  const patch = useSubmitStore((s) => s.patchDraft);
  const tags = buildNodeTags(draft);

  // Editable raw values write to the structured draft fields (single source of truth),
  // so clearing then re-adding a value via the friendly fields works.
  const override = (k: string, v: string) => {
    const m = draft.manufacturer;
    switch (k) {
      case 'operator': patch({ operator: v }); break;
      case 'operator:wikidata': patch({ operatorWikidata: v }); break;
      case 'direction': patch({ directions: v ? v.split(';') : [] }); break;
      case 'manufacturer':
        patch({ manufacturer: v.trim()
          ? { kind: 'custom', manufacturer: v, wikidata: m.kind === 'none' ? undefined : m.wikidata }
          : { kind: 'none' } });
        break;
      case 'manufacturer:wikidata':
        if (m.kind !== 'none') patch({ manufacturer: { ...m, wikidata: v.trim() || undefined } });
        break;
    }
  };

  return (
    <div className="space-y-1 rounded bg-dark-900/60 p-2 font-mono text-xs">
      <div className="mb-1 text-dark-400">{t('submit_tags_label')}</div>
      {Object.entries(tags).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1">
          <span className="w-40 shrink-0 truncate text-dark-300">{k}</span>
          {EDITABLE.has(k) ? (
            <input className="flex-1 min-w-0 rounded bg-dark-800 px-1 text-dark-100" value={v} onChange={(e) => override(k, e.target.value)} />
          ) : (
            <span className="flex-1 min-w-0 truncate px-1 text-dark-200">{v}</span>
          )}
        </div>
      ))}
    </div>
  );
}
