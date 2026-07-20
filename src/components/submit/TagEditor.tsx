import { useSubmitStore } from '../../store/submitStore';
import { buildNodeTags } from '../../osm/tags';

const EDITABLE = new Set(['operator', 'operator:wikidata', 'direction', 'manufacturer', 'manufacturer:wikidata']);

export function TagEditor() {
  const draft = useSubmitStore((s) => s.draft);
  const setExtra = useSubmitStore((s) => s.setExtraTags);
  const tags = buildNodeTags(draft);

  const override = (k: string, v: string) => setExtra({ ...draft.extraTags, [k]: v });

  return (
    <div className="space-y-1 rounded bg-dark-900/60 p-2 font-mono text-xs">
      <div className="mb-1 text-dark-400">Tags to submit (operator, manufacturer &amp; direction values are editable):</div>
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
