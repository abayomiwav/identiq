import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError, getToken, setToken } from "./api";

// Node's experimental built-in `localStorage` global conflicts with jsdom's
// polyfill, so `window.localStorage` isn't reliably usable as-is in this
// environment. Install a minimal in-memory replacement directly on `window`.
function installMockLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
  });
}

describe("token storage", () => {
  beforeEach(() => {
    installMockLocalStorage();
  });

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("round-trips a token through localStorage", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("clears the stored token when set to null", () => {
    setToken("abc123");
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    installMockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches a bearer token when one is stored and auth isn't disabled", async () => {
    setToken("my-token");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiFetch("/identity/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe("Bearer my-token");
  });

  it("omits the auth header when auth: false is passed", async () => {
    setToken("my-token");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiFetch("/apps/1/public", { auth: false });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBeUndefined();
  });

  it("returns the parsed JSON body on success", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "abc" }) });

    const result = await apiFetch<{ id: string }>("/identity/me");

    expect(result).toEqual({ id: "abc" });
  });

  it("throws ApiError with the response status and message on a failed request", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Forbidden" }),
    });

    await expect(apiFetch("/apps")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Forbidden",
    });
  });

  it("joins an array of validation messages into one string", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: ["email must be an email", "password too short"] }),
    });

    await expect(apiFetch("/auth/register")).rejects.toMatchObject({
      message: "email must be an email, password too short",
    });
  });

  it("throws a network-error ApiError with status 0 when fetch itself rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiFetch("/identity/me")).rejects.toMatchObject({
      status: 0,
      message: "Could not reach the Identiq API. Is it running?",
    });
  });

  it("ApiError is a real Error subclass with a stable name for narrowing", () => {
    const error = new ApiError("nope", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(404);
  });
});
