export interface Identity {
  id: string;
  userId: string;
  stellarPublicKey: string | null;
  chainIdentityId: string | null;
  createdAt: string;
}

export interface Reputation {
  identityId: string;
  score: number;
  factors: {
    accountAgeDays: number;
    activeCredentialCount: number;
    activePermissionGrantCount: number;
    revokedCredentialCount: number;
  };
  computedAt: string;
}

export interface CreateIdentityResponse {
  identity: { id: string };
  unsignedXdr: string;
}
