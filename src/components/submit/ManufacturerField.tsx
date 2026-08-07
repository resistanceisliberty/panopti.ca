import { useEffect, useState } from 'react';
import { loadVendors, type Vendor } from '../../osm/vendors';
import { useSubmitStore } from '../../store/submitStore';
import { useT } from '@/i18n';

export function ManufacturerField() {
  const t = useT();
  const draft = useSubmitStore((s) => s.draft);
  const patch = useSubmitStore((s) => s.patchDraft);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  useEffect(() => { loadVendors().then(setVendors); }, []);

  const value = draft.manufacturer.kind === 'known' ? draft.manufacturer.manufacturer
    : draft.manufacturer.kind === 'custom' ? '__custom__' : '';

  return (
    <div className="space-y-2">
      <label className="text-sm text-dark-200">{t('submit_manufacturer_label')}</label>
      <select
        className="w-full rounded bg-dark-800 p-2 text-dark-100"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') patch({ manufacturer: { kind: 'none' } });
          else if (v === '__custom__') patch({ manufacturer: { kind: 'custom', manufacturer: '' } });
          else {
            const vendor = vendors.find((x) => x.osmTags.manufacturer === v);
            patch({ manufacturer: { kind: 'known', manufacturer: v, wikidata: vendor?.osmTags['manufacturer:wikidata'] } });
          }
        }}
      >
        <option value="">{t('submit_manufacturer_none')}</option>
        {vendors.map((v) => (
          <option key={v.fullName} value={v.osmTags.manufacturer}>{v.shortName}</option>
        ))}
        <option value="__custom__">{t('submit_manufacturer_custom')}</option>
      </select>

      {draft.manufacturer.kind === 'custom' && (
        <div className="space-y-2">
          <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder={t('submit_ph_manufacturer_name')}
            value={draft.manufacturer.manufacturer}
            onChange={(e) => patch({ manufacturer: { kind: 'custom', manufacturer: e.target.value, wikidata: draft.manufacturer.kind === 'custom' ? draft.manufacturer.wikidata : undefined } })} />
          <input className="w-full rounded bg-dark-800 p-2 text-dark-100" placeholder={t('submit_ph_manufacturer_wikidata')}
            value={draft.manufacturer.kind === 'custom' ? draft.manufacturer.wikidata ?? '' : ''}
            onChange={(e) => patch({ manufacturer: { kind: 'custom', manufacturer: draft.manufacturer.kind === 'custom' ? draft.manufacturer.manufacturer : '', wikidata: e.target.value } })} />
        </div>
      )}
    </div>
  );
}
