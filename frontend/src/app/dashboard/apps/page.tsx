"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/services/api";
import type { CreatedApp, RemoteApp } from "@/types/app";
import { Alert, Button, ConfirmDialog, CopyButton, EmptyState, Panel, Spinner } from "@/components/ui";

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<RemoteApp[] | null>(null);
  const [name, setName] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ appName: string; apiKey: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RemoteApp | null>(null);

  const refresh = useCallback(async () => {
    try {
      setApps(await apiFetch<RemoteApp[]>("/apps"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your apps.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<CreatedApp>("/apps", {
        method: "POST",
        body: { name, redirectUris: [redirectUri], webhookUrl: webhookUrl || undefined },
      });
      setRevealedKey({ appName: created.app.name, apiKey: created.apiKey });
      setName("");
      setRedirectUri("");
      setWebhookUrl("");
      await refresh();
      toast.success(`${created.app.name} registered`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create app.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRotate(id: string, appName: string) {
    try {
      const rotated = await apiFetch<CreatedApp>(`/apps/${id}/rotate-key`, { method: "POST" });
      setRevealedKey({ appName, apiKey: rotated.apiKey });
      await refresh();
      toast.success("API key rotated — the old key stopped working immediately");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rotate the API key.");
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const app = pendingDelete;
    setPendingDelete(null);
    try {
      await apiFetch(`/apps/${app.id}`, { method: "DELETE" });
      await refresh();
      toast.success(`${app.name} deleted`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete app.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow !text-accent-rose">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">My apps</h1>
        <p className="mt-1 text-sm text-muted">
          Register a website or app you run to receive an API key, a webhook secret, and access to the consent
          flow. This is for anyone integrating Identiq — no engineering team required.
        </p>
      </div>

      {revealedKey && (
        <Panel cornerTicks className="p-6">
          <p className="text-sm font-medium text-foreground">
            API key for {revealedKey.appName} — save it now, it won&apos;t be shown again
          </p>
          <div className="mt-3 flex items-center gap-3 border border-border-strong bg-[#0a0a0a] px-3 py-2.5">
            <code className="block flex-1 break-all text-xs text-emerald-400">{revealedKey.apiKey}</code>
            <CopyButton value={revealedKey.apiKey} className="shrink-0 !text-white/60 hover:!text-white" />
          </div>
          <Button variant="ghost" className="mt-3 text-xs" onClick={() => setRevealedKey(null)}>
            Dismiss
          </Button>
        </Panel>
      )}

      <form onSubmit={handleCreate} className="panel relative overflow-hidden p-6">
        <span className="absolute inset-x-0 top-0 h-1 bg-accent-rose" />
        <h2 className="eyebrow !text-accent-rose">Register a new app</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="App name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <input
            required
            type="url"
            placeholder="Redirect URI (https://yourapp.com/callback)"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <input
            type="url"
            placeholder="Webhook URL (optional)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none sm:col-span-2"
          />
        </div>
        <Button type="submit" disabled={busy} className="mt-4">
          {busy ? "Creating…" : "Create app"}
        </Button>
      </form>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-4">
        {apps === null ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <Panel>
            <EmptyState>No apps yet. Register one above.</EmptyState>
          </Panel>
        ) : (
          apps.map((app) => (
            <Panel key={app.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-foreground">{app.name}</h3>
                  <p className="mt-1 font-mono text-xs text-muted">key {app.apiKeyPrefix}…</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRotate(app.id, app.name)}>
                    Rotate key
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(app)}>
                    Delete
                  </Button>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-muted">Redirect URIs</dt>
                  <dd className="mt-1 break-all font-mono text-foreground">{app.redirectUris.join(", ")}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted">Webhook URL</dt>
                  <dd className="mt-1 break-all font-mono text-foreground">{app.webhookUrl ?? "Not configured"}</dd>
                </div>
              </dl>
            </Panel>
          ))
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "this app"}?`}
        description="Its API key stops working immediately and any active permission grants for it are removed. This can't be undone."
        confirmLabel="Delete app"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
