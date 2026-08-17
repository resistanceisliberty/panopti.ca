import { useSubmitStore } from '../../store/submitStore';
import { ManufacturerField } from './ManufacturerField';
import { DirectionField } from './DirectionField';
import { SourceField } from './SourceField';
import { TagEditor } from './TagEditor';
import { submitAdd, submitEdit, submitDelete, OsmConflictError } from '../../osm/api';
import { nearestWithin } from '../../osm/nearby';
import { buildNodeTags } from '../../osm/tags';
import { cameraFromTags, type LocalOp } from '../../osm/localOverlay';
import { postFlockReview } from '../../osm/flockReview';
import { useCameraStore } from '../../store';
import { useT } from '@/i18n';

export function SubmitForm() {
  const t = useT();
  const { mode, user, draft, point, editNode, busy, error, submitEnabled } = useSubmitStore();
  const { patchDraft, cancel, setBusy, setError, setSuccess } = useSubmitStore.getState();
  if (!user) return null;

  const manufacturerName = draft.manufacturer.kind === 'none' ? '' : draft.manufacturer.manufacturer;
  // No Flock deployment is officially confirmed in Canada — warn, and require a source before a Flock-tagged add.
  const isFlock = draft.deviceType === 'alpr' && /flock/i.test(manufacturerName);
  // Flock adds must have a *typed* source (a link or free-text note) — a preset dropdown pick isn't enough.
  const hasTypedSource = (draft.source.kind === 'url' || draft.source.kind === 'other') && draft.source.value.trim().length > 0;
  const flockNeedsSource = mode === 'add' && isFlock && !hasTypedSource;
  const canSubmit = submitEnabled && !!point && Number.isFinite(point.lat) && Number.isFinite(point.lon) && draft.description.trim().length > 0 && !busy && !flockNeedsSource;

  const run = async (fn: () => Promise<unknown>, successMsg: string, buildOp: (result: unknown) => LocalOp) => {
    if (!useSubmitStore.getState().submitEnabled) { setError(t('submit_error_submissions_disabled')); return; }
    setBusy(true); setError(null);
    try {
      const result = await fn();
      // The OSM write succeeded; a failure in the local overlay must not report it as failed
      // (that could prompt a duplicate resubmit). Next refresh reflects it regardless.
      try { useCameraStore.getState().applyLocalSubmission(buildOp(result)); }
      catch (e) { console.error('[submit] local overlay update failed', e); }
      cancel(); setSuccess(successMsg);
    } catch (e) {
      setError(e instanceof OsmConflictError
        ? t('submit_error_conflict')
        : String(e));
      setBusy(false);
    }
  };

  // Flock adds are held for admin review — never written straight to OSM.
  const submitFlockForReview = async () => {
    if (!useSubmitStore.getState().submitEnabled) { setError(t('submit_error_submissions_disabled')); return; }
    if (!point) return;
    setBusy(true); setError(null);
    try {
      await postFlockReview(draft, point.lat, point.lon, user);
      cancel(); setSuccess(t('submit_success_flock_review'));
    } catch (e) {
      setError(String(e)); setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{mode === 'edit' ? t('submit_heading_edit') : t('submit_heading_add')}</h2>
        <button className="text-dark-300" onClick={cancel}>{t('submit_cancel')}</button>
      </div>

      <div className="flex gap-2">
        <button className={`flex-1 rounded p-1.5 text-sm ${draft.deviceType === 'alpr' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-200'}`}
          onClick={() => patchDraft({ deviceType: 'alpr' })}>{t('submit_type_alpr')}</button>
        <button className={`flex-1 rounded p-1.5 text-sm ${draft.deviceType === 'cctv' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-200'}`}
          onClick={() => patchDraft({ deviceType: 'cctv' })}>{t('submit_type_cctv')}</button>
      </div>

      {point ? (
        <div className="flex gap-2 text-xs text-dark-300">
          <input className="w-full rounded bg-dark-800 p-1" value={point.lat}
            onChange={(e) => useSubmitStore.getState().setPoint({ lat: Number(e.target.value), lon: point.lon })} />
          <input className="w-full rounded bg-dark-800 p-1" value={point.lon}
            onChange={(e) => useSubmitStore.getState().setPoint({ lat: point.lat, lon: Number(e.target.value) })} />
        </div>
      ) : <div className="text-xs text-amber-400">{t('submit_place_point_hint')}</div>}

      {draft.deviceType === 'alpr' && <ManufacturerField />}
      {isFlock && (
        <div className="rounded-md px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.55)' }}>
          <p className="text-[13px] font-bold leading-snug" style={{ color: '#FCA5A5' }}>{t('submit_flock_notice')}</p>
        </div>
      )}
      <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder={t('submit_ph_operator')}
        value={draft.operator} onChange={(e) => patchDraft({ operator: e.target.value })} />
      <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder={t('submit_ph_operator_wikidata')}
        value={draft.operatorWikidata} onChange={(e) => patchDraft({ operatorWikidata: e.target.value })} />
      <DirectionField />
      <SourceField />
      <textarea className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder={t('submit_ph_description')}
        value={draft.description} onChange={(e) => patchDraft({ description: e.target.value })} />

      <TagEditor />

      {error && <div className="text-sm text-red-400">{error}</div>}

      {mode === 'add' && point && nearestWithin(point, 25) && (
        <div className="text-xs text-amber-400">{t('submit_duplicate_warning')}</div>
      )}

      {flockNeedsSource && (
        <div className="text-xs font-semibold" style={{ color: '#FCA5A5' }}>{t('submit_flock_source_required')}</div>
      )}

      <div className="flex gap-2">
        {mode === 'edit' && editNode && (
          <button className="rounded bg-red-700 px-3 py-1.5 text-sm text-white"
            disabled={busy || !draft.description.trim() || !submitEnabled}
            onClick={() => { if (confirm(t('submit_confirm_delete'))) run(
              () => submitDelete(editNode, draft.description, draft.source),
              t('submit_success_delete'),
              () => ({ osmId: editNode.id, kind: 'delete', version: editNode.version + 1, ts: Date.now() })); }}>
            {t('submit_delete_button')}
          </button>
        )}
        <button className="flex-1 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          disabled={!canSubmit}
          onClick={() => (mode === 'add' && isFlock) ? submitFlockForReview() : run(
            () => mode === 'edit' && editNode
              ? submitEdit(draft, editNode, point!.lat, point!.lon)
              : submitAdd(draft, point!.lat, point!.lon),
            mode === 'edit' ? t('submit_success_edit') : t('submit_success_add'),
            (result) => mode === 'edit' && editNode
              ? { osmId: editNode.id, kind: 'edit', version: result as number, ts: Date.now(),
                  camera: cameraFromTags(editNode.id, point!.lat, point!.lon, { ...editNode.tags, ...buildNodeTags(draft) }, result as number) }
              : { osmId: result as number, kind: 'add', version: 1, ts: Date.now(),
                  camera: cameraFromTags(result as number, point!.lat, point!.lon, buildNodeTags(draft), 1) })}>
          {busy ? t('submit_submitting') : (mode === 'add' && isFlock ? t('submit_button_review') : t('submit_button'))}
        </button>
      </div>

      <p className="text-xs text-dark-400">
        {t('submit_disclaimer_pre')}<strong>{user}</strong>{t('submit_disclaimer_post')}
      </p>
    </div>
  );
}
