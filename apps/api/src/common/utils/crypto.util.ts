import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/** SHA-256 hex digest of arbitrary evidence bytes — the only trace of evidence Identiq ever stores. */
export function hashEvidence(evidence: Buffer | string): string {
  return createHash('sha256').update(evidence).digest('hex');
}

const API_KEY_PREFIX_LENGTH = 8;

export interface GeneratedApiKey {
  /** The full secret, returned to the caller exactly once and never persisted in plaintext. */
  fullKey: string;
  /** Safe to store and display — identifies the key without revealing it. */
  prefix: string;
}

export function generateApiKey(): GeneratedApiKey {
  const fullKey = `idq_${randomBytes(32).toString('hex')}`;
  return { fullKey, prefix: fullKey.slice(0, API_KEY_PREFIX_LENGTH) };
}

export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex');
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('hex')}`;
}

export function signWebhookPayload(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signature: string,
): boolean {
  const expected = signWebhookPayload(secret, rawBody);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
