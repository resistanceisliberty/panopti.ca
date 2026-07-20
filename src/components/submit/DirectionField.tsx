import { useSubmitStore } from '../../store/submitStore';

export function DirectionField() {
  const directions = useSubmitStore((s) => s.draft.directions);
  const patch = useSubmitStore((s) => s.patchDraft);
  const set = (i: number, v: string) => { const d = [...directions]; d[i] = v; patch({ directions: d }); };

  return (
    <div className="space-y-2">
      <label className="text-sm text-dark-200">Direction(s) — optional, 0–360</label>
      {directions.map((d, i) => (
        <div key={i} className="flex gap-2">
          <input type="number" min={0} max={360} className="w-full rounded bg-dark-800 p-2 text-dark-100"
            value={d} onChange={(e) => set(i, e.target.value)} />
          <button className="px-2 text-dark-300" onClick={() => patch({ directions: directions.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button className="text-sm text-accent" onClick={() => patch({ directions: [...directions, ''] })}>+ Add another direction</button>
    </div>
  );
}
