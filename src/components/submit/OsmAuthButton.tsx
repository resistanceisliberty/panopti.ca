import { useEffect } from 'react';
import { beginLogin, getToken, signOut, fetchUsername } from '../../osm/auth';
import { useSubmitStore } from '../../store/submitStore';

export function OsmAuthButton() {
  const user = useSubmitStore((s) => s.user);
  const setUser = useSubmitStore((s) => s.setUser);
  const cancel = useSubmitStore((s) => s.cancel);

  useEffect(() => {
    if (!user && getToken()) fetchUsername().then(setUser).catch(() => signOut());
  }, [user, setUser]);

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm text-dark-100 bg-dark-800/90 rounded-md px-3 py-1.5 border border-dark-600">
        <span>Signed in as <strong>{user}</strong></span>
        <button className="underline text-accent" onClick={() => { signOut(); setUser(null); cancel(); }}>Sign out</button>
      </div>
    );
  }
  return (
    <button
      className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white"
      onClick={() => beginLogin()}
    >
      Sign in with OSM to add or edit cameras
    </button>
  );
}
