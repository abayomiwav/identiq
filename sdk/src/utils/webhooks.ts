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

export interface ParseWebhookOptions {
  /**
   * Reject payloads whose signed `createdAt` is more than this many seconds
   * away from now, so a captured delivery can't be replayed later. Defaults
   * to 300 (5 minutes); pass `false` to disable.
   */
  toleranceSeconds?: number | false;
  /** Override the clock (tests). */
  now?: Date;
}

const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Parses a webhook body **after** `verifyWebhookSignature` has passed.
 * Rejects unknown event types and stale deliveries. Freshness only stops
 * replays outside the window: also deduplicate on `payload.id`, which stays
 * the same when Identiq retries a delivery.
 */
export function parseWebhookPayload<T = Record<string, unknown>>(
  rawBody: string,
  options: ParseWebhookOptions = {},
): WebhookPayload<T> {
  const payload = JSON.parse(rawBody) as WebhookPayload<T>;
  if (!Object.values(WebhookEventType).includes(payload.event)) {
    throw new Error(`Unrecognized Identiq webhook event: ${payload.event}`);
  }

  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (tolerance !== false) {
    const createdAt = Date.parse(payload.createdAt);
    if (Number.isNaN(createdAt)) {
      throw new Error('Identiq webhook payload has no valid createdAt timestamp');
    }
    const ageSeconds = Math.abs((options.now ?? new Date()).getTime() - createdAt) / 1000;
    if (ageSeconds > tolerance) {
      throw new Error(
        `Identiq webhook is outside the ${tolerance}s tolerance (created ${payload.createdAt}) — possible replay`,
      );
    }
  }

  return payload;
}
