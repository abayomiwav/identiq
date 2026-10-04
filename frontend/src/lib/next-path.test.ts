import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps same-origin paths, including query strings", () => {
    expect(safeNextPath("/authorize?app_id=1&state=x")).toBe("/authorize?app_id=1&state=x");
  });

  it("falls back when next is missing", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "dashboard"])(
    "rejects %s",
    (next) => {
      expect(safeNextPath(next)).toBe("/dashboard");
    },
  );
});
