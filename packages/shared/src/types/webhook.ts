export enum WebhookEventType {
  CREDENTIAL_ISSUED = 'credential.issued',
  CREDENTIAL_REVOKED = 'credential.revoked',
  CREDENTIAL_EXPIRED = 'credential.expired',
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',
}

export interface WebhookPayload<T = Record<string, unknown>> {
  event: WebhookEventType;
  /** Idempotency key — the same event redelivered after a timeout carries the same id. */
  id: string;
  createdAt: string;
  data: T;
}

/** Header carrying the HMAC-SHA256 signature of the raw request body, keyed by the app's webhook secret. */
export const WEBHOOK_SIGNATURE_HEADER = 'x-identiq-signature';
