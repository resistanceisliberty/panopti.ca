// Unified admin shell: tabs the Flock review queue and the submissions feed under one
// URL surface. /admin and /admin/submissions show the feed; /admin/flock shows review.
// The tab reflects the path so each tool stays directly linkable.
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminSubmissions } from './AdminSubmissions';
import { AdminFlock } from './AdminFlock';

const TABS = [
  { key: 'submissions', label: 'Submissions feed', path: '/admin/submissions' },
  { key: 'flock', label: 'Flock review', path: '/admin/flock' },
] as const;

export function AdminHome() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = pathname.endsWith('/flock') ? 'flock' : 'submissions';

  return (
    <div className="bg-dark-900">
      <nav className="sticky top-0 z-40 flex items-center gap-1 border-b border-dark-700 bg-dark-900 px-4 h-11">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => navigate(t.path)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              active === t.key ? 'bg-accent text-white' : 'text-dark-300 hover:bg-dark-800'}`}>
            {t.label}
          </button>
        ))}
      </nav>
      {active === 'flock' ? <AdminFlock /> : <AdminSubmissions />}
    </div>
  );
}
