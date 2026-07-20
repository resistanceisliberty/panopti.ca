import { useSubmitStore } from '../../store/submitStore';
import { SubmitForm } from './SubmitForm';

// Desktop: floating overlay on the right of the map. Mobile docks SubmitForm into
// the pull-up drawer instead (see MobileTabDrawer), so this isn't rendered there.
export function SubmitPanel() {
  const user = useSubmitStore((s) => s.user);
  const mode = useSubmitStore((s) => s.mode);
  if (!user) return null;
  const open = mode !== 'idle';
  return (
    <div ref={(el) => { if (el) el.inert = !open; }} className={`absolute right-4 top-20 z-40 w-[420px] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-lg bg-dark-800 p-4 shadow-xl transition-all duration-200 ease-out ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`} style={{ maxHeight: '80vh' }}>
      <SubmitForm />
    </div>
  );
}
