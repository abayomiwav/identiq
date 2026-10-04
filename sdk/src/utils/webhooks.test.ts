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
        createdAt: new Date().toISOString(),
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

  describe('replay protection', () => {
    const now = new Date('2026-10-04T12:00:00.000Z');
    const body = (createdAt: string) =>
      JSON.stringify({ event: WebhookEventType.CREDENTIAL_ISSUED, id: 'evt_1', createdAt, data: {} });

    it('accepts a delivery inside the default 5-minute window', () => {
      expect(() => parseWebhookPayload(body('2026-10-04T11:56:00.000Z'), { now })).not.toThrow();
    });

    it('rejects a delivery older than the window as a possible replay', () => {
      expect(() => parseWebhookPayload(body('2026-10-04T11:54:00.000Z'), { now })).toThrow(/possible replay/);
    });

    it('rejects a delivery dated too far in the future', () => {
      expect(() => parseWebhookPayload(body('2026-10-04T12:10:00.000Z'), { now })).toThrow(/possible replay/);
    });

    it('honours a custom tolerance', () => {
      expect(() =>
        parseWebhookPayload(body('2026-10-04T11:00:00.000Z'), { now, toleranceSeconds: 2 * 60 * 60 }),
      ).not.toThrow();
    });

    it('can be disabled explicitly', () => {
      expect(() => parseWebhookPayload(body('2020-01-01T00:00:00.000Z'), { now, toleranceSeconds: false })).not.toThrow();
    });

    it('rejects a payload without a valid createdAt', () => {
      expect(() => parseWebhookPayload(body('not-a-date'), { now })).toThrow(/createdAt/);
    });
  });
});
