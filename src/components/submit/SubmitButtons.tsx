import { OsmAuthButton } from './OsmAuthButton';
import { useSubmitStore } from '../../store/submitStore';

export function SubmitButtons() {
  const user = useSubmitStore((s) => s.user);
  const mode = useSubmitStore((s) => s.mode);
  const error = useSubmitStore((s) => s.error);
  const startAdd = useSubmitStore((s) => s.startAdd);
  const setError = useSubmitStore((s) => s.setError);
  return (
    <div className="flex flex-col gap-2 mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <OsmAuthButton />
        {user && mode === 'idle' && (
          <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white" onClick={startAdd}>
            ＋ Add a camera
          </button>
        )}
      </div>
      {mode === 'idle' && error && (
        <div className="rounded-md bg-red-900/90 border border-red-700 px-3 py-1.5 text-xs text-red-100">
          {error} <button className="underline" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}
    </div>
  );
}
