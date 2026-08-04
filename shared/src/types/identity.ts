export interface Identity {
  id: string;
  userId: string;
  /** Stellar (G...) address this identity is anchored to on-chain. Null until a wallet is connected. */
  stellarPublicKey: string | null;
  /** The `identity_id` (u64) this identity was registered under on-chain. */
  chainIdentityId: string | null;
  createdAt: string;
}
