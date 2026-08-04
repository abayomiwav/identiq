import {
  generateApiKey,
  generateWebhookSecret,
  hashApiKey,
  hashEvidence,
  signWebhookPayload,
  verifyWebhookSignature,
} from './crypto.util';

describe('crypto.util', () => {
  describe('hashEvidence', () => {
    it('is deterministic for the same input', () => {
      expect(hashEvidence('passport-scan-bytes')).toBe(
        hashEvidence('passport-scan-bytes'),
      );
    });

    it('differs for different input', () => {
      expect(hashEvidence('a')).not.toBe(hashEvidence('b'));
    });

    it('produces a 64-character hex digest', () => {
      expect(hashEvidence('anything')).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateApiKey', () => {
    it('produces a key with the idq_ prefix and a matching displayed prefix', () => {
      const { fullKey, prefix } = generateApiKey();
      expect(fullKey.startsWith('idq_')).toBe(true);
      expect(fullKey.startsWith(prefix)).toBe(true);
      expect(prefix).toHaveLength(8);
    });

    it('generates unique keys on each call', () => {
      const a = generateApiKey();
      const b = generateApiKey();
      expect(a.fullKey).not.toBe(b.fullKey);
    });
  });

  describe('hashApiKey', () => {
    it('never stores the plaintext key — the hash must differ from the input', () => {
      const { fullKey } = generateApiKey();
      expect(hashApiKey(fullKey)).not.toBe(fullKey);
    });

    it('is deterministic so a presented key can be looked up by its hash', () => {
      const { fullKey } = generateApiKey();
      expect(hashApiKey(fullKey)).toBe(hashApiKey(fullKey));
    });
  });

  describe('generateWebhookSecret', () => {
    it('produces a secret with the whsec_ prefix', () => {
      expect(generateWebhookSecret().startsWith('whsec_')).toBe(true);
    });
  });

  describe('webhook signature round trip', () => {
    it('verifies a signature produced with the same secret and body', () => {
      const secret = generateWebhookSecret();
      const body = JSON.stringify({ event: 'credential.issued', id: '123' });
      const signature = signWebhookPayload(secret, body);

      expect(verifyWebhookSignature(secret, body, signature)).toBe(true);
    });

    it('rejects a signature produced with a different secret', () => {
      const body = JSON.stringify({ event: 'credential.issued', id: '123' });
      const signature = signWebhookPayload(generateWebhookSecret(), body);

      expect(
        verifyWebhookSignature(generateWebhookSecret(), body, signature),
      ).toBe(false);
    });

    it('rejects a signature when the body has been tampered with', () => {
      const secret = generateWebhookSecret();
      const signature = signWebhookPayload(
        secret,
        JSON.stringify({ id: '123' }),
      );

      expect(
        verifyWebhookSignature(
          secret,
          JSON.stringify({ id: '456' }),
          signature,
        ),
      ).toBe(false);
    });

    it('rejects a malformed signature without throwing', () => {
      const secret = generateWebhookSecret();
      expect(
        verifyWebhookSignature(secret, 'body', 'not-hex-and-wrong-length'),
      ).toBe(false);
    });
  });
});
