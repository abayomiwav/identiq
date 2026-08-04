/**
 * The kinds of verifiable claims Identiq can issue against an identity.
 * Each is a boolean/point-in-time claim — "this identity satisfied this
 * check as of `issuedAt`" — not a document store. Identiq never stores the
 * underlying passport scan, utility bill, etc.; only `evidenceHash`, a hash
 * of the evidence the issuer checked, so a credential can be independently
 * re-verified without Identiq (or anyone else) holding the original file.
 */
export enum CredentialType {
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  GOVERNMENT_ID = 'GOVERNMENT_ID',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  KYC_TIER1 = 'KYC_TIER1',
  KYC_TIER2 = 'KYC_TIER2',
  BUSINESS_VERIFIED = 'BUSINESS_VERIFIED',
}

export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface Credential {
  id: string;
  identityId: string;
  type: CredentialType;
  status: CredentialStatus;
  /** SHA-256 of the evidence the issuer checked — never the evidence itself. */
  evidenceHash: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  /** The `credential_id` (u64) this credential was anchored under on-chain. */
  chainCredentialId: string | null;
}

/** Default validity windows applied when an issuer doesn't specify one. */
export const DEFAULT_CREDENTIAL_TTL_DAYS: Record<CredentialType, number | null> = {
  [CredentialType.EMAIL_VERIFIED]: null,
  [CredentialType.PHONE_VERIFIED]: null,
  [CredentialType.GOVERNMENT_ID]: 365,
  [CredentialType.PROOF_OF_ADDRESS]: 180,
  [CredentialType.KYC_TIER1]: 365,
  [CredentialType.KYC_TIER2]: 365,
  [CredentialType.BUSINESS_VERIFIED]: 365,
};
