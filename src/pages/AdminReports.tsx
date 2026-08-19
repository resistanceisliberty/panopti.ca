// Admin review of anonymous node reports (public "Report a problem" popups → /node-report-queue).
// OSM-login gated server-side against ADMIN_OSM_USERS. Records outcome only (resolved/dismissed);
// fixing the node itself is done in OSM. English-only internal tool.
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { getToken, beginLogin, fetchUsername } from '../osm/auth';
import { fetchReportQueue, setReportStatus, type NodeReport } from '../osm/nodeReport';

type Phase = 'loading' | 'anon' | 'forbidden' | 'ready' | 'error';

const REASON_LABEL: Record<string, string> = {
  nonexistent: "Doesn't exist / not a camera",
  location: 'Wrong location',
  type: 'Wrong type (not an ALPR)',
  brand: 'Wrong brand (e.g. not Flock)',
  duplicate: 'Duplicate of another node',
  other: 'Other',
};

export function AdminReports() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [admin, setAdmin] = useState('');
  const [items, setItems] = useState<NodeReport[]>([]);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setPhase('anon'); return; }
    try {
      const { admin: who, items } = await fetchReportQueue();
      setAdmin(who); setItems(items); setPhase('ready');
    } catch (e) {
      if (String(e).includes('forbidden')) {
        try { setAdmin(await fetchUsername()); } catch { /* ignore */ }
        setPhase('forbidden');
      } else { setErr(String(e)); setPhase('error'); }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (r: NodeReport, status: 'resolved' | 'dismissed') => {
    setBusyId(r.id); setErr('');
    try { await setReportStatus(r.id, status); await load(); }
    catch (e) { setErr(`Update failed: ${e}`); }
    finally { setBusyId(null); }
  };

  const pending = items.filter((i) => i.status === 'pending');
  const reviewed = items.filter((i) => i.status !== 'pending');

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-display font-semibold text-white">Node reports — review</h1>
          {admin && <span className="text-xs text-dark-400">signed in as {admin}</span>}
        </div>

        {err && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

        {phase === 'loading' && <p className="text-dark-400">Loading…</p>}

        {phase === 'anon' && (
          <div className="rounded-lg border border-dark-700 bg-dark-800 p-6">
            <p className="text-dark-300 mb-4">Sign in with the OpenStreetMap account that's allow-listed for review.</p>
            <button onClick={() => beginLogin()} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white">Sign in with OSM</button>
          </div>
        )}

        {phase === 'forbidden' && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-amber-200">
            The account <strong>{admin || 'you signed in with'}</strong> isn't on the admin allow-list for review.
          </div>
        )}

        {phase === 'ready' && (
          <>
            <Section title={`Pending (${pending.length})`}>
              {pending.length === 0 && <p className="text-dark-500 text-sm">Nothing waiting for review.</p>}
              {pending.map((r) => (
                <Card key={r.id} r={r}>
                  <div className="flex gap-2 mt-3">
                    <button disabled={busyId === r.id} onClick={() => act(r, 'resolved')}
                      className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white">
                      {busyId === r.id ? 'Working…' : 'Mark handled'}
                    </button>
                    <button disabled={busyId === r.id} onClick={() => act(r, 'dismissed')}
                      className="rounded bg-dark-600 hover:bg-dark-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-dark-100">
                      Dismiss
                    </button>
                  </div>
                </Card>
              ))}
            </Section>

            {reviewed.length > 0 && (
              <Section title={`Reviewed (${reviewed.length})`}>
                {reviewed.map((r) => (
                  <Card key={r.id} r={r}>
                    <p className="text-xs mt-2" style={{ color: r.status === 'resolved' ? '#6ee7b7' : '#94a3b8' }}>
                      {r.status} by {r.reviewedBy} · {r.reviewedAt?.slice(0, 16).replace('T', ' ')}
                    </p>
                  </Card>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs uppercase tracking-widest text-dark-400 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Card({ r, children }: { r: NodeReport; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{REASON_LABEL[r.reason] || r.reason}</span>
        <span className="text-[11px] text-dark-500">{r.createdAt?.slice(0, 16).replace('T', ' ')}</span>
      </div>
      {r.note && <p className="mt-1 text-xs text-dark-200 break-words">{r.note}</p>}
      <dl className="mt-2 grid grid-cols-[92px_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-dark-500">Node</dt>
        <dd><a className="text-accent hover:underline font-mono" href={`https://www.openstreetmap.org/${r.osmType}/${r.osmId}`} target="_blank" rel="noopener noreferrer">{r.osmType}/{r.osmId}</a></dd>
        <dt className="text-dark-500">Where</dt>
        <dd><a className="text-accent hover:underline font-mono" href={`https://maps.panopti.ca/?lat=${r.lat}&lng=${r.lon}&zoom=18`} target="_blank" rel="noopener noreferrer">{r.lat.toFixed(5)}, {r.lon.toFixed(5)}</a></dd>
        <dt className="text-dark-500">Tagged</dt><dd className="text-dark-200 break-words">{r.brand || '—'} / {r.operator || '—'}</dd>
      </dl>
      {children}
    </div>
  );
}
