"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface RemoteApp {
  id: string;
  name: string;
  redirectUris: string[];
  apiKeyPrefix: string;
  webhookUrl: string | null;
  webhookSecret: string;
  createdAt: string;
}

interface CreatedApp {
  app: RemoteApp;
  apiKey: string;
}

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<RemoteApp[] | null>(null);
  const [name, setName] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ appName: string; apiKey: string } | null>(null);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create app.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRotate(id: string, appName: string) {
    setError(null);
    try {
      const rotated = await apiFetch<CreatedApp>(`/apps/${id}/rotate-key`, { method: "POST" });
      setRevealedKey({ appName, apiKey: rotated.apiKey });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not rotate the API key.");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/apps/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete app.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Developer apps</h1>
        <p className="mt-1 text-sm text-muted">
          Register an app to receive an API key, a webhook secret, and access to the consent flow.
        </p>
      </div>

      {revealedKey && (
        <div className="corner-ticks panel relative p-6">
          <p className="text-sm font-medium text-foreground">
            API key for {revealedKey.appName} — save it now, it won&apos;t be shown again
          </p>
          <code className="mt-3 block break-all border border-border-strong bg-[#0a0a0a] px-3 py-2.5 text-xs text-emerald-400">
            {revealedKey.apiKey}
          </code>
          <button onClick={() => setRevealedKey(null)} className="mt-3 text-xs text-muted hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="panel p-6">
        <h2 className="eyebrow">Register a new app</h2>
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
        <button
          type="submit"
          disabled={busy}
          className="mt-4 border border-border-strong bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create app"}
        </button>
      </form>

      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-4">
        {apps === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : apps.length === 0 ? (
          <p className="panel p-6 text-sm text-muted">No apps yet. Register one above.</p>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-foreground">{app.name}</h3>
                  <p className="mt-1 font-mono text-xs text-muted">key {app.apiKeyPrefix}…</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRotate(app.id, app.name)}
                    className="border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-foreground hover:text-background"
                  >
                    Rotate key
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Redirect URIs</dt>
                  <dd className="mt-1 font-mono text-foreground">{app.redirectUris.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-muted">Webhook URL</dt>
                  <dd className="mt-1 font-mono text-foreground">{app.webhookUrl ?? "Not configured"}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
