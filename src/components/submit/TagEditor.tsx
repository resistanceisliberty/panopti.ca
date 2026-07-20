import { useSubmitStore } from '../../store/submitStore';
import { buildNodeTags } from '../../osm/tags';

export function TagEditor() {
  const draft = useSubmitStore((s) => s.draft);
  const setExtra = useSubmitStore((s) => s.setExtraTags);
  const tags = buildNodeTags(draft);

  const override = (k: string, v: string) => setExtra({ ...draft.extraTags, [k]: v });
  const remove = (k: string) => override(k, '');

  return (
    <div className="space-y-1 rounded bg-dark-900/60 p-2 font-mono text-xs">
      <div className="mb-1 text-dark-400">Tags to submit (editable):</div>
      {Object.entries(tags).map(([k, v]) => (
        <div key={k} className="flex gap-1">
          <span className="w-40 shrink-0 truncate text-dark-300">{k}</span>
          <input className="flex-1 rounded bg-dark-800 px-1 text-dark-100" value={v} onChange={(e) => override(k, e.target.value)} />
          <button className="text-dark-500" onClick={() => remove(k)}>✕</button>
        </div>
      ))}
      <AddTagRow onAdd={(k, v) => override(k, v)} />
    </div>
  );
}

function AddTagRow({ onAdd }: { onAdd: (k: string, v: string) => void }) {
  return (
    <form className="flex gap-1 pt-1" onSubmit={(e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const k = (f.elements.namedItem('k') as HTMLInputElement).value.trim();
      const v = (f.elements.namedItem('v') as HTMLInputElement).value;
      if (k) { onAdd(k, v); f.reset(); }
    }}>
      <input name="k" placeholder="key" className="w-40 rounded bg-dark-800 px-1 text-dark-100" />
      <input name="v" placeholder="value" className="flex-1 rounded bg-dark-800 px-1 text-dark-100" />
      <button className="text-accent">+</button>
    </form>
  );
}
