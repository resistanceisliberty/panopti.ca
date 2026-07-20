import { useSubmitStore } from '../../store/submitStore';
import { ManufacturerField } from './ManufacturerField';
import { DirectionField } from './DirectionField';
import { SourceField } from './SourceField';
import { TagEditor } from './TagEditor';
import { submitAdd, submitEdit, submitDelete, OsmConflictError } from '../../osm/api';
import { nearestWithin } from '../../osm/nearby';

export function SubmitForm() {
  const { mode, user, draft, point, editNode, busy, error } = useSubmitStore();
  const { patchDraft, cancel, setBusy, setError, setSuccess } = useSubmitStore.getState();
  if (!user) return null;

  const canSubmit = !!point && Number.isFinite(point.lat) && Number.isFinite(point.lon) && draft.description.trim().length > 0 && !busy;

  const run = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true); setError(null);
    try { await fn(); cancel(); setSuccess(successMsg); }
    catch (e) {
      setError(e instanceof OsmConflictError
        ? 'This camera changed on OSM — reload and retry.'
        : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{mode === 'edit' ? 'Edit camera' : 'Add a camera'}</h2>
        <button className="text-dark-300" onClick={cancel}>Cancel</button>
      </div>

      <div className="flex gap-2">
        <button className={`flex-1 rounded p-1.5 text-sm ${draft.deviceType === 'alpr' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-200'}`}
          onClick={() => patchDraft({ deviceType: 'alpr' })}>ALPR</button>
        <button className={`flex-1 rounded p-1.5 text-sm ${draft.deviceType === 'cctv' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-200'}`}
          onClick={() => patchDraft({ deviceType: 'cctv' })}>Gov CCTV</button>
      </div>

      {point ? (
        <div className="flex gap-2 text-xs text-dark-300">
          <input className="w-full rounded bg-dark-800 p-1" value={point.lat}
            onChange={(e) => useSubmitStore.getState().setPoint({ lat: Number(e.target.value), lon: point.lon })} />
          <input className="w-full rounded bg-dark-800 p-1" value={point.lon}
            onChange={(e) => useSubmitStore.getState().setPoint({ lat: point.lat, lon: Number(e.target.value) })} />
        </div>
      ) : <div className="text-xs text-amber-400">Tap the map to place the point, or type coordinates after placing.</div>}

      {draft.deviceType === 'alpr' && <ManufacturerField />}
      <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder="Operator (optional)"
        value={draft.operator} onChange={(e) => patchDraft({ operator: e.target.value })} />
      <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder="operator:wikidata (optional)"
        value={draft.operatorWikidata} onChange={(e) => patchDraft({ operatorWikidata: e.target.value })} />
      <DirectionField />
      <SourceField />
      <textarea className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder="Description (required — becomes the OSM changeset comment)"
        value={draft.description} onChange={(e) => patchDraft({ description: e.target.value })} />

      <TagEditor />

      {error && <div className="text-sm text-red-400">{error}</div>}

      {mode === 'add' && point && nearestWithin(point, 25) && (
        <div className="text-xs text-amber-400">A camera is already mapped within 25 m — check you're not duplicating.</div>
      )}

      <div className="flex gap-2">
        {mode === 'edit' && editNode && (
          <button className="rounded bg-red-700 px-3 py-1.5 text-sm text-white"
            disabled={busy || !draft.description.trim()}
            onClick={() => { if (confirm('Delete this camera from OSM?')) run(() => submitDelete(editNode, draft.description, draft.source), 'Deletion submitted to OpenStreetMap.'); }}>
            Delete
          </button>
        )}
        <button className="flex-1 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          disabled={!canSubmit}
          onClick={() => run(() =>
            mode === 'edit' && editNode
              ? submitEdit(draft, editNode, point!.lat, point!.lon)
              : submitAdd(draft, point!.lat, point!.lon),
            mode === 'edit' ? 'Edit submitted to OpenStreetMap.' : 'Camera submitted to OpenStreetMap.')}>
          {busy ? 'Submitting…' : 'Submit to OSM'}
        </button>
      </div>

      <p className="text-xs text-dark-400">
        The changes you upload as <strong>{user}</strong> will be visible on all maps that use OpenStreetMap data.
      </p>
    </div>
  );
}
