// Admin review queue for held Flock submissions. OSM-login gated (server-side check in
// /flock-queue against ADMIN_OSM_USERS). Approving writes the node to OSM under the
// admin's own OSM auth (client-side submitAdd); rejecting only records the outcome.
// Internal single-operator tool — intentionally English-only (not run through i18n).
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { getToken, beginLogin, fetchUsername } from '../osm/auth';
import { submitAdd } from '../osm/api';
import { buildNodeTags } from '../osm/tags';
import { fetchFlockQueue, setFlockStatus, type FlockSubmission } from '../osm/flockReview';

type Phase = 'loading' | 'anon' | 'forbidden' | 'ready' | 'error';

export function AdminFlock() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [admin, setAdmin] = useState('');
  const [items, setItems] = useState<FlockSubmission[]>([]);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setPhase('anon'); return; }
    try {
      const { admin: who, items } = await fetchFlockQueue();
      setAdmin(who); setItems(items); setPhase('ready');
    } catch (e) {
      if (String(e).includes('forbidden')) {
        try { setAdmin(await fetchUsername()); } catch { /* ignore */ }
        setPhase('forbidden');
      } else { setErr(String(e)); setPhase('error'); }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (s: FlockSubmission) => {
    if (!s.draft) { setErr('This submission has no draft to write.'); return; }
    setBusyId(s.id); setErr('');
    try {
      const osmNodeId = await submitAdd(s.draft, s.lat, s.lon);
      await setFlockStatus(s.id, 'approved', osmNodeId);
      await load();
    } catch (e) { setErr(`Approve failed: ${e}`); }
    finally { setBusyId(null); }
  };

  const reject = async (s: FlockSubmission) => {
    setBusyId(s.id); setErr('');
    try { await setFlockStatus(s.id, 'rejected'); await load(); }
    catch (e) { setErr(`Reject failed: ${e}`); }
    finally { setBusyId(null); }
  };

  const pending = items.filter((i) => i.status === 'pending');
  const reviewed = items.filter((i) => i.status !== 'pending');

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-display font-semibold text-white">Flock submissions — review</h1>
          {admin && <span className="text-xs text-dark-400">signed in as {admin}</span>}
        </div>

        {err && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

        {phase === 'loading' && <p className="text-dark-400">Loading…</p>}

        {phase === 'anon' && (
          <div className="rounded-lg border border-dark-700 bg-dark-800 p-6">
            <p className="text-dark-300 mb-4">Sign in with the OpenStreetMap account that's allow-listed for review.</p>
            <button onClick={() => beginLogin()} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white">Sign in with OSM</button>
            <p className="text-xs text-dark-500 mt-3">After signing in you'll land on the map — come back to this page to review.</p>
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
              {pending.map((s) => (
                <Card key={s.id} s={s}>
                  <div className="flex gap-2 mt-3">
                    <button disabled={busyId === s.id} onClick={() => approve(s)}
                      className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white">
                      {busyId === s.id ? 'Working…' : 'Approve → add to OSM'}
                    </button>
                    <button disabled={busyId === s.id} onClick={() => reject(s)}
                      className="rounded bg-red-700 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white">
                      Reject
                    </button>
                  </div>
                </Card>
              ))}
            </Section>

            {reviewed.length > 0 && (
              <Section title={`Reviewed (${reviewed.length})`}>
                {reviewed.map((s) => (
                  <Card key={s.id} s={s}>
                    <p className="text-xs mt-2" style={{ color: s.status === 'approved' ? '#6ee7b7' : '#fca5a5' }}>
                      {s.status} by {s.reviewedBy} · {s.reviewedAt?.slice(0, 16).replace('T', ' ')}
                      {s.osmNodeId ? <> · <a className="underline" href={`https://www.openstreetmap.org/node/${s.osmNodeId}`} target="_blank" rel="noopener noreferrer">node/{s.osmNodeId}</a></> : null}
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

// Exactly the tags that Approve will write to OSM (buildNodeTags spreads draft.extraTags).
// Rendered so the admin reviews the FULL tag set, not just the four summary fields above —
// nothing gets written to OSM under the admin's account that isn't shown here first.
function TagPreview({ draft }: { draft: FlockSubmission['draft'] }) {
  let tags: Record<string, string> = {};
  try { if (draft) tags = buildNodeTags(draft); } catch { /* malformed draft */ }
  const entries = Object.entries(tags);
  return (
    <div className="mt-2 border-t border-dark-700 pt-2">
      <div className="text-[10px] uppercase tracking-widest text-dark-500 mb-1">Tags written to OSM on approval</div>
      {entries.length === 0 ? (
        <p className="text-amber-300 text-xs">No writable tags — submission has no valid draft.</p>
      ) : (
        <ul className="text-xs font-mono text-dark-200 space-y-0.5">
          {entries.map(([k, v]) => (
            <li key={k}><span className="text-dark-400">{k}</span>=<span className="break-all">{v}</span></li>
          ))}
        </ul>
      )}
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

function Card({ s, children }: { s: FlockSubmission; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <a className="text-accent hover:underline text-sm font-mono"
           href={`https://maps.panopti.ca/?lat=${s.lat}&lng=${s.lon}&zoom=18`} target="_blank" rel="noopener noreferrer">
          {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
        </a>
        <span className="text-[11px] text-dark-500">{s.createdAt?.slice(0, 16).replace('T', ' ')}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-dark-500">Source</dt><dd className="text-dark-200 break-words">{s.source || '—'}</dd>
        <dt className="text-dark-500">Note</dt><dd className="text-dark-200 break-words">{s.description || '—'}</dd>
        <dt className="text-dark-500">Operator</dt><dd className="text-dark-200 break-words">{s.draft?.operator || '—'}</dd>
        <dt className="text-dark-500">Submitter</dt><dd className="text-dark-200 break-words">{s.submitter || '(anonymous)'}</dd>
      </dl>
      <TagPreview draft={s.draft} />
      {children}
    </div>
  );
}
