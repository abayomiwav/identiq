"use client";

import { useCallback, useEffect, useState } from "react";
import { CredentialType } from "@identiq/shared";
import { apiFetch, ApiError } from "@/services/api";
import type { Credential } from "@/types/credential";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Panel,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "@/components/ui";

const CREDENTIAL_TYPES = Object.values(CredentialType);

const STATUS_TONE = {
  ACTIVE: "success",
  EXPIRED: "warning",
  REVOKED: "danger",
} as const;

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
          <Select value={type} onChange={(e) => setType(e.target.value as CredentialType)}>
            {CREDENTIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <input
            required
            placeholder="Evidence reference (e.g. verification session id)"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Issuing…" : "Issue"}
          </Button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      <Panel className="overflow-hidden">
        {credentials === null ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : credentials.length === 0 ? (
          <EmptyState>No credentials yet.</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeadRow>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Issued</TableHeadCell>
                <TableHeadCell>Expires</TableHeadCell>
                <TableHeadCell />
              </TableHeadRow>
            </TableHead>
            <TableBody>
              {credentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    <span className="font-mono text-xs">{credential.type}</span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[credential.status]}>{credential.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted">{new Date(credential.issuedAt).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted">
                      {credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : "Never"}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {credential.status === "ACTIVE" && (
                      <Button variant="ghost" className="!p-0 text-xs underline underline-offset-2 hover:no-underline" onClick={() => handleRevoke(credential.id)}>
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
