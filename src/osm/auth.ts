import { OSM } from './config';

const TOKEN_KEY = 'osm_access_token';
const VERIFIER_KEY = 'osm_pkce_verifier';
const STATE_KEY = 'osm_oauth_state';

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
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
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

export async function completeLogin(params: URLSearchParams): Promise<string> {
  const code = params.get('code');
  const state = params.get('state');
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!code || !state || state !== sessionStorage.getItem(STATE_KEY) || !verifier) {
    throw new Error('OAuth callback failed validation');
  }
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
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const json = await res.json();
  sessionStorage.setItem(TOKEN_KEY, json.access_token);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
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
