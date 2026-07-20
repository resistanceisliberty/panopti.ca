import { describe, it, expect } from 'vitest';
import { pkceChallenge, randomVerifier } from './auth';

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
