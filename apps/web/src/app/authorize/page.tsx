"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

interface PublicApp {
  id: string;
  name: string;
  redirectUris: string[];
}

function AuthorizeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const appId = params.get("app_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const credentialTypes = (params.get("credential_types") ?? "").split(",").filter(Boolean);
  const state = params.get("state") ?? "";

  const [app, setApp] = useState<PublicApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!appId) return;
    apiFetch<PublicApp>(`/apps/${appId}/public`, { auth: false })
      .then(setApp)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load this app."));
  }, [appId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [authLoading, user, router]);

  async function handleApprove() {
    setBusy(true);
    setError(null);
    try {
      const identity = await apiFetch<{ id: string }>("/identity/me");
      for (const credentialType of credentialTypes) {
        await apiFetch("/permissions", { method: "POST", body: { appId, credentialType } });
      }
      const url = new URL(redirectUri);
      url.searchParams.set("identity_id", identity.id);
      if (state) url.searchParams.set("state", state);
      window.location.href = url.toString();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not grant access. Make sure your identity is registered on-chain first.",
      );
      setBusy(false);
    }
  }

  function handleDeny() {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  if (!appId || !redirectUri || credentialTypes.length === 0) {
    return <p className="text-sm text-red-700">This authorization link is missing required parameters.</p>;
  }

  return (
    <div className="corner-ticks panel relative w-full max-w-md p-8">
      <div className="flex justify-center">
        <LogoMark size={32} />
      </div>
      <p className="eyebrow mt-6 text-center">Access request</p>
      <h1 className="mt-2 text-center text-xl font-semibold tracking-tight">
        {app ? `${app.name} wants to verify your identity` : "Loading request…"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Approving shares only the pass/fail result below — never your underlying documents.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {credentialTypes.map((type) => (
          <li key={type} className="flex items-center gap-2 border border-border-strong px-3 py-2 text-sm">
            <span className="h-1.5 w-1.5 bg-accent" />
            {type}
          </li>
        ))}
      </ul>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleApprove}
          disabled={busy || !app}
          className="flex-1 border border-border-strong bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
        >
          {busy ? "Granting…" : "Approve"}
        </button>
        <button
          onClick={handleDeny}
          disabled={busy}
          className="flex-1 border border-border-strong px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
        >
          Deny
        </button>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <main className="hairline-grid relative flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="eyebrow !text-muted">Loading…</p>}>
        <AuthorizeContent />
      </Suspense>
    </main>
  );
}
