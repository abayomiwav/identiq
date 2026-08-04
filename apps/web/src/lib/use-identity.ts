"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";

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

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Identity>("/identity/me");
      setIdentity(result);
      if (result.chainIdentityId) {
        const rep = await apiFetch<Reputation>("/identity/me/reputation");
        setReputation(rep);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setIdentity(null);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not load your identity.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { identity, reputation, loading, error, refresh };
}
