import { useSubmitStore } from '../../store/submitStore';
import { SOURCE_PRESETS } from '../../osm/tags';
import { useT } from '@/i18n';

export function SourceField() {
  const t = useT();
  const source = useSubmitStore((s) => s.draft.source);
  const patch = useSubmitStore((s) => s.patchDraft);
  const sel = source.kind === 'none' ? '' : source.kind === 'url' ? '__url__' : source.kind === 'other' ? '__other__' : source.value;

  return (
    <div className="space-y-2">
      <label className="text-sm text-dark-200">{t('submit_source_label')}</label>
      <select className="w-full rounded bg-dark-800 p-2 text-dark-100" value={sel}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') patch({ source: { kind: 'none' } });
          else if (v === '__url__') patch({ source: { kind: 'url', value: '' } });
          else if (v === '__other__') patch({ source: { kind: 'other', value: '' } });
          else patch({ source: { kind: 'preset', value: v } });
        }}>
        <option value="">{t('submit_source_none')}</option>
        {SOURCE_PRESETS.map((s) => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
        <option value="__url__">{t('submit_source_url_option')}</option>
        <option value="__other__">{t('submit_source_other_option')}</option>
      </select>
      {(source.kind === 'url' || source.kind === 'other') && (
        <input className="w-full rounded bg-dark-800 p-2 text-dark-100"
          placeholder={source.kind === 'url' ? t('submit_ph_source_url') : t('submit_ph_source_specify')}
          value={source.value} onChange={(e) => patch({ source: { kind: source.kind, value: e.target.value } })} />
      )}
    </div>
  );
}
