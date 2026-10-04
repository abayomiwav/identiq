/**
 * Validates a post-login `next` redirect. Only same-origin paths are allowed:
 * the value must start with a single "/" so it can't name another host
 * (`//evil.example`, `/\evil.example`, `https://evil.example`).
 */
export function safeNextPath(next: string | null, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
