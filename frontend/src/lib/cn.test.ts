import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins plain class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("drops falsy values", () => {
    expect(cn("px-4", false && "hidden", null, undefined, "py-2")).toBe("px-4 py-2");
  });

  it("resolves conflicting Tailwind utilities, last one wins", () => {
    expect(cn("p-0", "p-4")).toBe("p-4");
    expect(cn("text-sm text-muted", "text-xs")).toBe("text-muted text-xs");
  });

  it("keeps non-conflicting classes from both the base variant and the caller", () => {
    expect(cn("border-0 text-muted p-0", "mt-3 text-xs")).toBe("border-0 text-muted p-0 mt-3 text-xs");
  });
});
