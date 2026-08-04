import { CredentialType } from './credential';

export enum PermissionStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * A user-granted, per-app authorization to read the *result* of one
 * credential type (e.g. "KYC_TIER1: pass/fail + expiry") — never the
 * evidence behind it. This is the record that replaces an app asking a
 * user to re-upload a passport: the app calls the Identiq API with this
 * grant in place and gets back a verification result, not a document.
 */
export interface PermissionGrant {
  id: string;
  identityId: string;
  appId: string;
  credentialType: CredentialType;
  status: PermissionStatus;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  /** The `permission_id` (u64) this grant was anchored under on-chain. */
  chainPermissionId: string | null;
}
