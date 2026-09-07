import { describe, it, expect, beforeEach } from 'vitest';
import { pkceChallenge, randomVerifier, beginLogin, completeLogin } from './auth';

const VERIFIER = 'osm_pkce_verifier';
const STATE = 'osm_oauth_state';
const STARTED = 'osm_oauth_started';

describe('PKCE', () => {
  it('verifier is 43-128 url-safe chars', () => {
    const v = randomVerifier();
    expect(v).toMatch(/^[A-Za-z0-9\-._~]{43,128}$/);
  });

  it('challenge is deterministic base64url of SHA-256 (RFC 7636 test vector)', async () => {
    // RFC 7636 Appendix B verifier/challenge pair.
    const v = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    expect(await pkceChallenge(v)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('OAuth flow storage', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  // Regression: the verifier used to live in sessionStorage, which is per-browsing-context.
  // In-app browsers hand the redirect back in a different context, so it vanished and every
  // sign-in failed validation. It must be in localStorage (shared per-origin).
  it('beginLogin stores the verifier in localStorage, not sessionStorage', async () => {
    try { await beginLogin(); } catch { /* jsdom refuses real navigation */ }
    expect(localStorage.getItem(VERIFIER)).toBeTruthy();
    expect(localStorage.getItem(STATE)).toBeTruthy();
    expect(sessionStorage.getItem(VERIFIER)).toBeNull();
  });

  const complete = (qs: string) => completeLogin(new URLSearchParams(qs));

  it('reports the declined case distinctly', async () => {
    await expect(complete('error=access_denied')).rejects.toThrow('oauth_denied');
  });

  it('reports a lost flow when this origin has no verifier', async () => {
    await expect(complete('code=abc&state=xyz')).rejects.toThrow('oauth_lost');
  });

  it('rejects a mismatched state', async () => {
    localStorage.setItem(VERIFIER, 'v');
    localStorage.setItem(STATE, 'expected');
    localStorage.setItem(STARTED, String(Date.now()));
    await expect(complete('code=abc&state=attacker')).rejects.toThrow('oauth_state');
  });

  it('rejects an expired flow', async () => {
    localStorage.setItem(VERIFIER, 'v');
    localStorage.setItem(STATE, 'xyz');
    localStorage.setItem(STARTED, String(Date.now() - 16 * 60 * 1000));
    await expect(complete('code=abc&state=xyz')).rejects.toThrow('oauth_expired');
  });

  it('clears the flow after a failure so a stale verifier cannot linger', async () => {
    localStorage.setItem(VERIFIER, 'v');
    localStorage.setItem(STATE, 'expected');
    await expect(complete('code=abc&state=attacker')).rejects.toThrow();
    expect(localStorage.getItem(VERIFIER)).toBeNull();
  });
});
