import { CredentialType } from '@identiq/shared';

export interface BuildAuthorizeUrlOptions {
  /** Defaults to the production Identiq consent page. */
  baseUrl?: string;
  appId: string;
  /** Must exactly match one of the redirect URIs registered for this app. */
  redirectUri: string;
  credentialTypes: CredentialType[];
  /** Opaque value round-tripped back to your redirect URI — use it to prevent CSRF. */
  state?: string;
}

const DEFAULT_BASE_URL = 'https://identiq.app';

/**
 * Builds the URL to send a user to so they can review and grant your app
 * permission for the requested credential types. This is the flow that
 * replaces asking them to re-upload a passport: they consent once, here,
 * and your app calls `IdentiqClient.checkAccess` afterward.
 */
export function buildAuthorizeUrl(options: BuildAuthorizeUrlOptions): string {
  if (options.credentialTypes.length === 0) {
    throw new Error('buildAuthorizeUrl requires at least one credential type');
  }

  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = new URL(`${baseUrl}/authorize`);
  url.searchParams.set('app_id', options.appId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('credential_types', options.credentialTypes.join(','));
  if (options.state) {
    url.searchParams.set('state', options.state);
  }

  return url.toString();
}
