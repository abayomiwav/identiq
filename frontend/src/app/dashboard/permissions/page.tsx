"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/services/api";
import type { Grant } from "@/types/permission";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Panel,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "@/components/ui";

const STATUS_TONE = {
  ACTIVE: "success",
  EXPIRED: "warning",
  REVOKED: "danger",
} as const;

export default function PermissionsPage() {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<Grant | null>(null);

  const refresh = useCallback(async () => {
    try {
      setGrants(await apiFetch<Grant[]>("/permissions"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load permission grants.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleRevoke() {
    if (!pendingRevoke) return;
    const grant = pendingRevoke;
    setPendingRevoke(null);
    try {
      await apiFetch(`/permissions/${grant.id}`, { method: "DELETE" });
      await refresh();
      toast.success("Access revoked");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not revoke this grant.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow !text-accent-amber">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Connected apps</h1>
        <p className="mt-1 text-sm text-muted">
          Apps you&apos;ve granted access to. Revoke any of these at any time — access stops immediately.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <Panel className="relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 z-10 h-1 bg-accent-amber" />
        {grants === null ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : grants.length === 0 ? (
          <EmptyState>
            No apps have been granted access yet. Grants are created when you approve an app&apos;s request at{" "}
            <code className="text-xs">/authorize</code>.
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeadRow>
                <TableHeadCell>App</TableHeadCell>
                <TableHeadCell>Credential</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Expires</TableHeadCell>
                <TableHeadCell />
              </TableHeadRow>
            </TableHead>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>
                    <span className="font-mono text-xs">{grant.appId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{grant.credentialType}</span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[grant.status]}>{grant.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted">
                      {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : "Never"}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {grant.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        className="text-xs underline underline-offset-2 hover:no-underline"
                        onClick={() => setPendingRevoke(grant)}
                      >
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

      <ConfirmDialog
        open={pendingRevoke !== null}
        title="Revoke this app's access?"
        description="It will immediately lose the ability to check this credential type for your identity. This can't be undone."
        confirmLabel="Revoke access"
        tone="danger"
        onConfirm={handleRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}
