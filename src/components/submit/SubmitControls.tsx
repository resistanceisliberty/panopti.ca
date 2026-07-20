import { OsmAuthButton } from './OsmAuthButton';
import { SubmitPanel } from './SubmitPanel';
import { useSubmitStore } from '../../store/submitStore';

export function SubmitControls() {
  const user = useSubmitStore((s) => s.user);
  const mode = useSubmitStore((s) => s.mode);
  const startAdd = useSubmitStore((s) => s.startAdd);
  return (
    <>
      <div className="absolute left-4 top-20 z-40 flex flex-col gap-2">
        <OsmAuthButton />
        {user && mode === 'idle' && (
          <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white" onClick={startAdd}>
            ＋ Add a camera
          </button>
        )}
      </div>
      <SubmitPanel />
    </>
  );
}
