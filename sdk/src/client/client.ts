import { CredentialType } from '@identiq/shared';
import { IdentiqApiError } from '../errors/errors';

export interface IdentiqClientOptions {
  /** Your app's Identiq API key (starts with `idq_`). Keep this server-side — never ship it to a browser. */
  apiKey: string;
  /** Defaults to the production Identiq API. */
  baseUrl?: string;
  /** Abort a request that hasn't completed after this many milliseconds. Defaults to 10000. */
  timeoutMs?: number;
}

export interface CheckAccessParams {
  /** The identity id returned when the user completed the Identiq consent flow with your app. */
  identityId: string;
  credentialType: CredentialType;
}

export interface AccessCheckResult {
  /** Whether the identity currently holds a valid (unexpired, unrevoked) credential of the requested type. */
  verified: boolean;
  credential: {
    type: CredentialType;
    issuedAt: string;
    expiresAt: string | null;
  } | null;
  checkedAt: string;
}

const DEFAULT_BASE_URL = 'https://api.identiq.app';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Server-side client for apps integrating with Identiq. It never sees a
 * user's documents — only the pass/fail result of a credential check, and
 * only for identities that have granted your app permission for that
 * specific credential type.
 */
export class IdentiqClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: IdentiqClientOptions) {
    if (!options.apiKey) {
      throw new Error('IdentiqClient requires an apiKey');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Checks whether the given identity has granted your app permission for
   * `credentialType`, and if so, whether that credential currently holds.
   * Throws if there is no active grant — a missing grant is a permission
   * error, not a "false" verification result.
   */
  async checkAccess(params: CheckAccessParams): Promise<AccessCheckResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/permissions/check`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-identiq-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw new IdentiqApiError(`Identiq API request timed out after ${this.timeoutMs}ms`, 0, undefined);
      }
      throw error;
    }

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new IdentiqApiError(
        (body as { message?: string })?.message ?? `Identiq API request failed with status ${response.status}`,
        response.status,
        body,
      );
    }

    return body as AccessCheckResult;
  }
}
