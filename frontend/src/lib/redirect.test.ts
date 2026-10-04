import { describe, expect, it } from "vitest";
import { resolveAllowedRedirect } from "./redirect";

const registered = ["https://acme.example/callback", "http://localhost:3000/callback"];

describe("resolveAllowedRedirect", () => {
  it("accepts an exact match of a registered URI", () => {
    expect(resolveAllowedRedirect("https://acme.example/callback", registered)?.href).toBe(
      "https://acme.example/callback",
    );
  });

  it("rejects an unregistered host", () => {
    expect(resolveAllowedRedirect("https://attacker.example/callback", registered)).toBeNull();
  });

  it("rejects near-misses of a registered URI", () => {
    expect(resolveAllowedRedirect("https://acme.example/callback/../evil", registered)).toBeNull();
    expect(resolveAllowedRedirect("https://acme.example/callback?x=1", registered)).toBeNull();
  });

  it("rejects non-http(s) schemes even if registered", () => {
    expect(resolveAllowedRedirect("javascript:alert(1)", ["javascript:alert(1)"])).toBeNull();
  });
});
