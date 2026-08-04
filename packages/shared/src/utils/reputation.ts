/**
 * A transparent, deterministically-computed trust signal for a wallet —
 * not a black-box score. Every factor is independently checkable by
 * calling the API endpoints that back it (credentials, permissions,
 * identity age), so an app can recompute or discount it.
 */
export interface WalletReputation {
  identityId: string;
  /** 0-100, see docs/REPUTATION.md for the exact formula. */
  score: number;
  factors: {
    accountAgeDays: number;
    activeCredentialCount: number;
    activePermissionGrantCount: number;
    revokedCredentialCount: number;
  };
  computedAt: string;
}

/**
 * The reputation formula, factored out so the API and any client that
 * wants to recompute/verify it use the exact same logic.
 *
 * - Account age contributes up to 30 points, saturating at one year.
 * - Each active credential contributes 10 points, up to 5 credentials.
 * - Each active permission grant (apps that trust this identity enough to
 *   have live access) contributes 4 points, up to 5 grants.
 * - Each revoked credential subtracts 15 points — a real negative signal,
 *   not just an absence of a positive one.
 */
export function computeReputationScore(factors: WalletReputation['factors']): number {
  const agePoints = Math.min(30, Math.floor((factors.accountAgeDays / 365) * 30));
  const credentialPoints = Math.min(50, factors.activeCredentialCount * 10);
  const grantPoints = Math.min(20, factors.activePermissionGrantCount * 4);
  const revocationPenalty = factors.revokedCredentialCount * 15;

  const raw = agePoints + credentialPoints + grantPoints - revocationPenalty;
  return Math.max(0, Math.min(100, raw));
}
