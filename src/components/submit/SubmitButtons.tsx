import { OsmAuthButton } from './OsmAuthButton';
import { useSubmitStore } from '../../store/submitStore';
import { useT } from '@/i18n';

export function SubmitButtons() {
  const t = useT();
  const user = useSubmitStore((s) => s.user);
  const mode = useSubmitStore((s) => s.mode);
  const error = useSubmitStore((s) => s.error);
  const startAdd = useSubmitStore((s) => s.startAdd);
  const setError = useSubmitStore((s) => s.setError);
  const submitEnabled = useSubmitStore((s) => s.submitEnabled);
  const showAdd = user && mode === 'idle';

  if (!submitEnabled) return <div className="mt-3 text-xs text-dark-400">{t('submit_disabled_banner')}</div>;
  return (
    <div className="mt-3">
      <OsmAuthButton />
      {user && (
        <div ref={(el) => { if (el) el.inert = !showAdd; }} className={`overflow-hidden transition-all duration-200 ease-out ${showAdd ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
          <button className="w-full rounded bg-accent px-3 py-1.5 text-sm font-medium text-white" onClick={startAdd}>
            {t('submit_add_camera_button')}
          </button>
        </div>
      )}
      {user && mode === 'idle' && error && (
        <div className="mt-2 rounded-md bg-red-900/90 border border-red-700 px-3 py-1.5 text-xs text-red-100">
          {error} <button className="underline" onClick={() => setError(null)}>{t('submit_dismiss')}</button>
        </div>
      )}
    </div>
  );
}
