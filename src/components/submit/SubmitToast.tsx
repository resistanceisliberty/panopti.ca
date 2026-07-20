import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSubmitStore } from '../../store/submitStore';

export function SubmitToast() {
  const success = useSubmitStore((s) => s.success);
  const setSuccess = useSubmitStore((s) => s.setSuccess);
  const open = !!success;

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 15000);
    return () => clearTimeout(t);
  }, [success, setSuccess]);

  return (
    <div
      ref={(el) => { if (el) el.inert = !open; }}
      className={`absolute left-1/2 top-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-dark-600 bg-dark-800 p-4 shadow-xl transition-all duration-200 ease-out ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
    >
      <div className="flex items-start gap-3">
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
        <div className="text-sm text-dark-100">
          <p className="font-medium">{success}</p>
          <p className="mt-1 text-xs text-dark-400">Thanks! The map here refreshes from OpenStreetMap periodically, so your change will show up on the next refresh (usually within a few hours).</p>
        </div>
        <button className="text-dark-400 hover:text-dark-200" onClick={() => setSuccess(null)} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}
