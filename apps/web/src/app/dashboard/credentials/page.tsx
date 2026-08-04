"use client";

import { useCallback, useEffect, useState } from "react";
import { CredentialType } from "@identiq/shared";
import { apiFetch, ApiError } from "@/lib/api";

interface Credential {
  id: string;
  type: CredentialType;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  evidenceHash: string;
  issuedAt: string;
  expiresAt: string | null;
  chainCredentialId: string | null;
}

const CREDENTIAL_TYPES = Object.values(CredentialType);

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [type, setType] = useState<CredentialType>(CredentialType.EMAIL_VERIFIED);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await apiFetch<Credential[]>("/credentials");
      setCredentials(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load credentials.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleIssue(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/credentials", { method: "POST", body: { type, evidence } });
      setEvidence("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not issue credential. Make sure your identity is registered on-chain first.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setError(null);
    try {
      await apiFetch(`/credentials/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not revoke credential.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Credentials</h1>
        <p className="mt-1 text-sm text-muted">
          Each credential is anchored on-chain by a hash of the evidence checked — never the evidence itself.
        </p>
      </div>

      <form onSubmit={handleIssue} className="panel p-6">
        <h2 className="eyebrow">Issue a credential</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_auto]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CredentialType)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {CREDENTIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Evidence reference (e.g. verification session id)"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="border border-border-strong bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {busy ? "Issuing…" : "Issue"}
          </button>
        </div>
      </form>

      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="panel overflow-hidden">
        {credentials === null ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : credentials.length === 0 ? (
          <p className="p-6 text-sm text-muted">No credentials yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="eyebrow">
              <tr className="border-b border-border-strong">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Issued</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{credential.type}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={credential.status} />
                  </td>
                  <td className="px-6 py-3 text-muted">{new Date(credential.issuedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-muted">
                    {credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {credential.status === "ACTIVE" && (
                      <button onClick={() => handleRevoke(credential.id)} className="text-xs text-red-700 underline underline-offset-2 hover:no-underline">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Credential["status"] }) {
  const styles: Record<Credential["status"], string> = {
    ACTIVE: "border-emerald-600 text-emerald-700",
    EXPIRED: "border-amber-600 text-amber-700",
    REVOKED: "border-red-600 text-red-700",
  };
  return <span className={`border px-2 py-0.5 font-mono text-[11px] uppercase ${styles[status]}`}>{status}</span>;
}
