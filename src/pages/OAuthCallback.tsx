import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeLogin, fetchUsername } from '../osm/auth';
import { useSubmitStore } from '../store/submitStore';
import { useT } from '@/i18n';

export function OAuthCallback() {
  const navigate = useNavigate();
  const setUser = useSubmitStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    completeLogin(new URLSearchParams(window.location.search))
      .then(() => fetchUsername())
      .then((name) => { setUser(name); navigate('/', { replace: true }); })
      .catch((e) => setError(String(e)));
  }, [navigate, setUser]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark-900 text-dark-100">
      {error ? `${t('load_oauth_signin_failed')} ${error}` : t('load_oauth_signing_in')}
    </div>
  );
}
