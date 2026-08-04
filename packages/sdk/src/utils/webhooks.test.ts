import { createHmac } from 'node:crypto';
import { WebhookEventType } from '@identiq/shared';
import { describe, expect, it } from 'vitest';
import { parseWebhookPayload, verifyWebhookSignature } from './webhooks';

describe('verifyWebhookSignature', () => {
  it('accepts a signature produced with the same secret', () => {
    const secret = 'whsec_test';
    const body = JSON.stringify({ event: WebhookEventType.CREDENTIAL_ISSUED });
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    expect(verifyWebhookSignature(secret, body, signature)).toBe(true);
  });

  it('rejects a signature produced with a different secret', () => {
    const body = JSON.stringify({ event: WebhookEventType.CREDENTIAL_ISSUED });
    const signature = createHmac('sha256', 'whsec_other').update(body).digest('hex');

    expect(verifyWebhookSignature('whsec_test', body, signature)).toBe(false);
  });

  it('rejects a tampered body', () => {
    const secret = 'whsec_test';
    const signature = createHmac('sha256', secret).update('{"a":1}').digest('hex');

    expect(verifyWebhookSignature(secret, '{"a":2}', signature)).toBe(false);
  });
});

describe('parseWebhookPayload', () => {
  it('parses a well-formed payload', () => {
    const payload = parseWebhookPayload(
      JSON.stringify({
        event: WebhookEventType.CREDENTIAL_ISSUED,
        id: 'evt_1',
        createdAt: '2026-01-01T00:00:00.000Z',
        data: { credentialId: 'cred-1' },
      }),
    );

    expect(payload.event).toBe(WebhookEventType.CREDENTIAL_ISSUED);
    expect(payload.data).toEqual({ credentialId: 'cred-1' });
  });

  it('rejects a payload with an unrecognized event type', () => {
    expect(() =>
      parseWebhookPayload(JSON.stringify({ event: 'not.a.real.event', id: 'evt_1', createdAt: '', data: {} })),
    ).toThrow('Unrecognized Identiq webhook event');
  });
});
