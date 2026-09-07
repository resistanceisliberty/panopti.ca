import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { beginLogin, completeLogin, fetchUsername } from '../osm/auth';
import { useSubmitStore } from '../store/submitStore';
import { useT } from '@/i18n';

// completeLogin throws a stable code; anything else (e.g. a token-exchange HTTP failure)
// falls back to the generic "try again" message rather than leaking a raw Error string.
const CODES = ['oauth_denied', 'oauth_lost', 'oauth_expired', 'oauth_response', 'oauth_state'] as const;

export function OAuthCallback() {
  const navigate = useNavigate();
  const setUser = useSubmitStore((s) => s.setUser);
  const [errKey, setErrKey] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    completeLogin(new URLSearchParams(window.location.search))
      .then(() => fetchUsername())
      .then((name) => { setUser(name); navigate('/', { replace: true }); })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setErrKey((CODES as readonly string[]).includes(msg) ? `oauth_err_${msg.replace('oauth_', '')}` : 'oauth_err_response');
      });
  }, [navigate, setUser]);

  if (!errKey) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-900 text-dark-100">
        {t('load_oauth_signing_in')}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark-900 text-dark-100 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold mb-2">{t('load_oauth_signin_failed')}</p>
        <p className="text-sm text-dark-300 mb-5">{t(errKey as Parameters<typeof t>[0])}</p>
        <button onClick={() => beginLogin()}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white">
          {t('oauth_retry')}
        </button>
      </div>
    </div>
  );
}
