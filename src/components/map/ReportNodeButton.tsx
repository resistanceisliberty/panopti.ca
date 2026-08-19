// "Report a problem" affordance inside the camera popup. Open to everyone — no OSM login —
// so any visitor can flag a node they believe is wrong. Posts to the anonymous /node-report
// Function; the admin reviews reports in /admin/reports.
import { useState } from 'react';
import { useT } from '@/i18n';
import { postNodeReport, type ReportReason } from '../../osm/nodeReport';
import type { ALPRCamera } from '../../types/camera';

const REASONS = [
  { value: 'nonexistent', key: 'report_reason_nonexistent' },
  { value: 'location', key: 'report_reason_location' },
  { value: 'type', key: 'report_reason_type' },
  { value: 'brand', key: 'report_reason_brand' },
  { value: 'duplicate', key: 'report_reason_duplicate' },
  { value: 'other', key: 'report_reason_other' },
] as const satisfies readonly { value: ReportReason; key: string }[];

export function ReportNodeButton({ camera }: { camera: ALPRCamera }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('nonexistent');
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  if (phase === 'done') {
    return <p className="mt-2 text-xs text-emerald-400">{t('report_success')}</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mt-2 w-full text-center text-xs text-dark-400 hover:text-dark-200 underline underline-offset-2">
        ⚑ {t('report_link')}
      </button>
    );
  }

  const send = async () => {
    setPhase('sending');
    try {
      await postNodeReport({
        osmType: camera.osmType, osmId: camera.osmId, lat: camera.lat, lon: camera.lon,
        reason, note: note.trim() || undefined, brand: camera.brand, operator: camera.operator,
      });
      setPhase('done');
    } catch {
      setPhase('error');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-dark-600 space-y-2">
      <p className="text-xs font-semibold text-dark-200">{t('report_heading')}</p>
      <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}
        className="w-full rounded bg-dark-800 border border-dark-600 px-2 py-1.5 text-xs text-dark-100">
        {REASONS.map((r) => <option key={r.value} value={r.value}>{t(r.key)}</option>)}
      </select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000}
        placeholder={t('report_note_placeholder')}
        className="w-full rounded bg-dark-800 border border-dark-600 px-2 py-1.5 text-xs text-dark-100" />
      {phase === 'error' && <p className="text-xs text-red-400">{t('report_error')}</p>}
      <div className="flex gap-2">
        <button onClick={send} disabled={phase === 'sending'}
          className="flex-1 rounded bg-accent hover:bg-accent/80 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white">
          {phase === 'sending' ? t('report_sending') : t('report_send')}
        </button>
        <button onClick={() => { setOpen(false); setPhase('idle'); }}
          className="rounded bg-dark-600 hover:bg-dark-500 px-3 py-1.5 text-xs text-dark-200">
          {t('report_cancel')}
        </button>
      </div>
    </div>
  );
}
