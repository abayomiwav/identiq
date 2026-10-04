/**
 * Returns the parsed redirect URL only if it exactly matches one of the app's
 * registered redirect URIs and uses http(s). Anything else (an unregistered
 * host, `javascript:`, `data:`, a malformed string) yields null.
 */
export function resolveAllowedRedirect(redirectUri: string, registeredUris: string[]): URL | null {
  if (!registeredUris.includes(redirectUri)) return null;
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return null;
  }
  return url.protocol === "https:" || url.protocol === "http:" ? url : null;
}

