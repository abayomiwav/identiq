"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/services/api";
import type { Grant } from "@/types/permission";

export default function PermissionsPage() {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleRevoke(id: string) {
    setError(null);
    try {
      await apiFetch(`/permissions/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not revoke this grant.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Permissions</h1>
        <p className="mt-1 text-sm text-muted">
          Apps you&apos;ve granted access to. Revoke any of these at any time — access stops immediately.
        </p>
      </div>

      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="panel overflow-hidden">
        {grants === null ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            No apps have been granted access yet. Grants are created when you approve an app&apos;s request at{" "}
            <code className="text-xs">/authorize</code>.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="eyebrow">
              <tr className="border-b border-border-strong">
                <th className="px-6 py-3 font-medium">App</th>
                <th className="px-6 py-3 font-medium">Credential</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{grant.appId}</td>
                  <td className="px-6 py-3 font-mono text-xs">{grant.credentialType}</td>
                  <td className="px-6 py-3 text-muted">{grant.status}</td>
                  <td className="px-6 py-3 text-muted">
                    {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {grant.status === "ACTIVE" && (
                      <button onClick={() => handleRevoke(grant.id)} className="text-xs text-red-700 underline underline-offset-2 hover:no-underline">
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
