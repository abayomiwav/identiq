"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/services/api";
import { connectWallet, signWithWallet, WalletError } from "@/services/wallet";
import { useIdentity } from "@/hooks/use-identity";
import type { CreateIdentityResponse } from "@/types/identity";

export default function DashboardOverviewPage() {
  const { identity, reputation, loading, error, refresh } = useIdentity();
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleConnect() {
    setActionError(null);
    try {
      const address = await connectWallet();
      setWallet(address);
    } catch (err) {
      setActionError(err instanceof WalletError ? err.message : "Could not connect wallet.");
    }
  }

  async function handleRegister() {
    if (!wallet) return;
    setBusy(true);
    setActionError(null);
    try {
      const { unsignedXdr } = await apiFetch<CreateIdentityResponse>("/identity", {
        method: "POST",
        body: { stellarPublicKey: wallet },
      });
      const signedXdr = await signWithWallet(unsignedXdr, wallet);
      await apiFetch("/identity/confirm", { method: "POST", body: { signedXdr } });
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof WalletError ? err.message : "Could not register your identity.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="eyebrow !text-muted">Loading your identity…</p>;
  }

  if (error) {
    return <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">Your identity, anchored on Stellar.</p>
      </div>

      {!identity || !identity.chainIdentityId ? (
        <div className="corner-ticks panel relative p-6">
          <h2 className="text-lg font-medium">Anchor your identity on-chain</h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Connect a Stellar wallet and register your identity once. Identiq never takes custody of your keys —
            you sign the registration transaction yourself.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {!wallet ? (
              <button onClick={handleConnect} className="border border-border-strong bg-foreground px-4 py-2.5 text-sm font-medium text-background">
                Connect wallet
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={busy}
                className="border border-border-strong bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
              >
                {busy ? "Registering…" : `Register identity for ${wallet.slice(0, 6)}…${wallet.slice(-4)}`}
              </button>
            )}
          </div>

          {actionError && <p className="mt-4 text-sm text-red-700">{actionError}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Wallet reputation" value={reputation ? `${reputation.score}/100` : "—"} />
          <StatCard label="Active credentials" value={String(reputation?.factors.activeCredentialCount ?? 0)} />
          <StatCard label="Active permission grants" value={String(reputation?.factors.activePermissionGrantCount ?? 0)} />
          <div className="panel p-6 sm:col-span-2 lg:col-span-3">
            <h2 className="eyebrow">Identity</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Stellar address</dt>
                <dd className="mt-1 font-mono text-xs text-foreground">{identity.stellarPublicKey}</dd>
              </div>
              <div>
                <dt className="text-muted">On-chain identity id</dt>
                <dd className="mt-1 font-mono text-xs text-foreground">{identity.chainIdentityId}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold accent-text">{value}</p>
    </div>
  );
}
