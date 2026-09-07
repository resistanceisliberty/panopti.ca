import { OSM } from './config';

const TOKEN_KEY = 'osm_access_token';
const VERIFIER_KEY = 'osm_pkce_verifier';
const STATE_KEY = 'osm_oauth_state';
const STARTED_KEY = 'osm_oauth_started';
// A round-trip through OSM shouldn't outlive this; stops a stale verifier lingering.
const FLOW_TTL_MS = 15 * 60 * 1000;

// Storage may be unavailable (private modes, blocked cookies) — never let that throw.
const ls = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* completeLogin reports oauth_lost */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

// The in-flight PKCE verifier/state live in localStorage, NOT sessionStorage. In-app
// browsers (Chrome Custom Tabs, the webviews inside mail/social apps) routinely hand the
// OAuth redirect back in a *different* browsing context, and sessionStorage is per-context,
// so the verifier vanished and sign-in died with "OAuth callback failed validation".
// localStorage is shared per-origin. The verifier is single-use and cleared on both success
// and failure, with a TTL backstop; the access token deliberately stays in sessionStorage.
function saveFlow(verifier: string, state: string) {
  ls.set(VERIFIER_KEY, verifier);
  ls.set(STATE_KEY, state);
  ls.set(STARTED_KEY, String(Date.now()));
}
function clearFlow() {
  ls.del(VERIFIER_KEY);
  ls.del(STATE_KEY);
  ls.del(STARTED_KEY);
}

function base64url(bytes: ArrayBuffer): string {
  const b = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes.buffer);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(digest);
}

export async function beginLogin(): Promise<void> {
  const verifier = randomVerifier();
  const state = randomVerifier();
  saveFlow(verifier, state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OSM.clientId,
    redirect_uri: OSM.redirectUri,
    scope: OSM.scopes,
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
  });
  window.location.assign(`${OSM.webBase}/oauth2/authorize?${params}`);
}

// Throws an Error whose message is a stable code the callback page maps to a translated,
// actionable message — not an opaque "failed validation" for every possible cause.
export async function completeLogin(params: URLSearchParams): Promise<string> {
  const returnedError = params.get('error');
  if (returnedError) {
    clearFlow();
    throw new Error(returnedError === 'access_denied' ? 'oauth_denied' : 'oauth_response');
  }

  const code = params.get('code');
  const state = params.get('state');
  const verifier = ls.get(VERIFIER_KEY);
  const savedState = ls.get(STATE_KEY);
  const started = Number(ls.get(STARTED_KEY) || 0);

  if (!code || !state) { clearFlow(); throw new Error('oauth_response'); }
  // No verifier/state on this origin: the flow started somewhere this browser can't see.
  if (!verifier || !savedState) { clearFlow(); throw new Error('oauth_lost'); }
  if (started && Date.now() - started > FLOW_TTL_MS) { clearFlow(); throw new Error('oauth_expired'); }
  if (state !== savedState) { clearFlow(); throw new Error('oauth_state'); }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: OSM.redirectUri,
    client_id: OSM.clientId,
    code_verifier: verifier,
  });
  const res = await fetch(`${OSM.webBase}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  clearFlow();
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const json = await res.json();
  sessionStorage.setItem(TOKEN_KEY, json.access_token);
  return json.access_token;
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function signOut(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function fetchUsername(): Promise<string> {
  const res = await fetch(`${OSM.apiBase}/api/0.6/user/details.json`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`user/details failed: ${res.status}`);
  const json = await res.json();
  return json.user.display_name as string;
}
