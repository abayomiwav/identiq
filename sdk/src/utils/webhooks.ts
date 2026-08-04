import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebhookEventType, WebhookPayload } from '@identiq/shared';

/**
 * Verifies that a webhook body actually came from Identiq, signed with your
 * app's webhook secret. Always call this before trusting a webhook payload —
 * it's the only thing standing between your app and a spoofed event.
 */
export function verifyWebhookSignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  let actualBuf: Buffer;
  try {
    actualBuf = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export function parseWebhookPayload<T = Record<string, unknown>>(rawBody: string): WebhookPayload<T> {
  const payload = JSON.parse(rawBody) as WebhookPayload<T>;
  if (!Object.values(WebhookEventType).includes(payload.event)) {
    throw new Error(`Unrecognized Identiq webhook event: ${payload.event}`);
  }
  return payload;
}
